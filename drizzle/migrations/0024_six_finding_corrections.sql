-- Fix 1/5/8: document signing metadata
ALTER TABLE public.portal_documents
  ADD COLUMN IF NOT EXISTS forum_role text,
  ADD COLUMN IF NOT EXISTS countersignature_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signing_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boldsign_template_id text;
ALTER TABLE public.portal_documents ADD CONSTRAINT portal_documents_forum_role_check
  CHECK (forum_role IS NULL OR forum_role IN ('addendum','protocol','pre_read','conflict','agenda','restricted_brief','secretariat_controls','facilitator_run_of_show'));

ALTER TABLE public.boldsign_assignments
  ADD COLUMN IF NOT EXISTS countersigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS disclosure_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS disclosure_hash text,
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz;
ALTER TABLE public.boldsign_assignments DROP CONSTRAINT IF EXISTS boldsign_assignments_status_check;
ALTER TABLE public.boldsign_assignments ADD CONSTRAINT boldsign_assignments_status_check CHECK (status IN ('preparing','pending','signed','completed'));

-- Disclosure snapshot is immutable once recorded
CREATE OR REPLACE FUNCTION public.guard_disclosure_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF OLD.disclosure_hash IS NOT NULL AND (NEW.disclosure_hash IS DISTINCT FROM OLD.disclosure_hash OR NEW.disclosure_snapshot IS DISTINCT FROM OLD.disclosure_snapshot) THEN
    RAISE EXCEPTION 'Signed disclosure responses cannot be altered';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER boldsign_disclosure_immutable BEFORE UPDATE ON public.boldsign_assignments FOR EACH ROW EXECUTE FUNCTION public.guard_disclosure_snapshot();

-- Fix 2: per-member, per-version restricted grants
CREATE TABLE public.restricted_document_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.portal_documents(id),
  member_id uuid NOT NULL REFERENCES public.portal_members(id),
  version_label text,
  granted_by uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid,
  reason text NOT NULL
);
CREATE UNIQUE INDEX restricted_document_grants_active ON public.restricted_document_grants(document_id, member_id) WHERE revoked_at IS NULL;
GRANT SELECT ON public.restricted_document_grants TO authenticated;
GRANT ALL ON public.restricted_document_grants TO service_role;
ALTER TABLE public.restricted_document_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read restricted grants" ON public.restricted_document_grants FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Fix 6: per-meeting, per-recipient confirmation tracking
CREATE TABLE public.meeting_confirmation_sends (
  poll_id uuid NOT NULL REFERENCES public.meeting_polls(id),
  slot_id uuid NOT NULL REFERENCES public.meeting_poll_slots(id),
  member_id uuid NOT NULL REFERENCES public.portal_members(id),
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, slot_id, member_id)
);
GRANT SELECT ON public.meeting_confirmation_sends TO authenticated;
GRANT ALL ON public.meeting_confirmation_sends TO service_role;
ALTER TABLE public.meeting_confirmation_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read confirmation sends" ON public.meeting_confirmation_sends FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Fix 1 helper: verified BoldSign execution of the approved, assigned Addendum version (caller only)
CREATE OR REPLACE FUNCTION public.member_addendum_complete() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portal_members m
    JOIN public.boldsign_assignments a ON a.member_id = m.id
    JOIN public.portal_documents d ON d.id = a.document_id
    WHERE m.user_id = auth.uid() AND m.status <> 'revoked'
      AND d.forum_role = 'addendum' AND d.superseded_at IS NULL AND d.signing_approved
      AND (d.member_id IS NULL OR d.member_id = m.id)
      AND a.status = 'completed' AND a.version_label = d.version_label
      AND (NOT d.countersignature_required OR a.countersigned_at IS NOT NULL))
$$;
REVOKE ALL ON FUNCTION public.member_addendum_complete() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.member_addendum_complete() TO authenticated, service_role;

-- Fix 2 helper: active grant for this caller, document and exact version
CREATE OR REPLACE FUNCTION public.member_restricted_grant(p_document uuid, p_version text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restricted_document_grants g
    JOIN public.portal_members m ON m.id = g.member_id
    WHERE m.user_id = auth.uid() AND m.status <> 'revoked'
      AND g.document_id = p_document AND g.revoked_at IS NULL
      AND g.version_label IS NOT DISTINCT FROM p_version)
$$;
REVOKE ALL ON FUNCTION public.member_restricted_grant(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.member_restricted_grant(uuid, text) TO authenticated, service_role;

-- Member read policy: adds Addendum gate, restricted grants, and Forum opt-out isolation
DROP POLICY "Members can read their released documents" ON public.portal_documents;
CREATE POLICY "Members can read their released documents" ON public.portal_documents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portal_members m
  WHERE m.user_id = auth.uid() AND m.status <> 'revoked' AND m.documents_released_at IS NOT NULL
    AND (portal_documents.member_id = m.id OR portal_documents.member_id IS NULL)
    AND portal_documents.classification <> 'secretariat_only'
    AND COALESCE(portal_documents.forum_role, '') NOT IN ('secretariat_controls','facilitator_run_of_show')
    AND (portal_documents.superseded_at IS NULL OR EXISTS (SELECT 1 FROM public.portal_document_acknowledgements a WHERE a.document_id = portal_documents.id AND a.member_id = m.id))
    AND (portal_documents.classification <> 'confidential_forum' OR (m.nda_verified_at IS NOT NULL AND m.forum_clearance_status <> 'declined' AND (portal_documents.is_forum_prep OR m.forum_clearance_status IN ('cleared','cleared_restricted'))))
    AND (portal_documents.classification <> 'restricted_opportunity' OR (portal_documents.superseded_at IS NULL AND m.participates_in_forum AND m.nda_verified_at IS NOT NULL AND m.forum_clearance_status IN ('cleared','cleared_restricted') AND public.member_restricted_grant(portal_documents.id, portal_documents.version_label)))
    AND (portal_documents.classification NOT IN ('confidential_forum','restricted_opportunity') OR portal_documents.forum_role = 'addendum' OR public.member_addendum_complete())
    AND (m.participates_in_forum
      OR EXISTS (SELECT 1 FROM public.portal_document_acknowledgements a3 WHERE a3.document_id = portal_documents.id AND a3.member_id = m.id)
      OR (COALESCE(portal_documents.journey_stage, 0) <> 1 AND portal_documents.classification NOT IN ('confidential_forum','restricted_opportunity')
          AND EXISTS (SELECT 1 FROM public.entity_onboarding_releases r0 WHERE r0.member_id = m.id)))
    AND ((NOT m.is_candidate) OR portal_documents.member_id = m.id OR portal_documents.journey_stage IS NULL OR portal_documents.journey_stage IN (1, 5))
    AND (portal_documents.journey_stage IS NULL OR portal_documents.journey_stage < 2 OR portal_documents.journey_stage > 4
      OR EXISTS (SELECT 1 FROM public.portal_document_acknowledgements a2 WHERE a2.document_id = portal_documents.id AND a2.member_id = m.id)
      OR EXISTS (SELECT 1 FROM public.entity_onboarding_releases r WHERE r.member_id = m.id AND (r.entity = portal_documents.journey_track OR (COALESCE(portal_documents.journey_track, 'shared') = 'shared' AND r.entity = CASE WHEN m.entity = 'dis' THEN 'dis' ELSE 'prsc' END))))
  ));