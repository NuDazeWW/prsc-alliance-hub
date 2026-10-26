CREATE TABLE public.entity_onboarding_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  entity text NOT NULL CHECK (entity IN ('prsc','dis')),
  role text NOT NULL,
  released_by uuid NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  notify_status text NOT NULL DEFAULT 'pending' CHECK (notify_status IN ('pending','sent','failed')),
  notify_error text,
  notify_attempts integer NOT NULL DEFAULT 0,
  notified_at timestamptz,
  UNIQUE (member_id, entity)
);
GRANT SELECT ON public.entity_onboarding_releases TO authenticated;
GRANT ALL ON public.entity_onboarding_releases TO service_role;
ALTER TABLE public.entity_onboarding_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read releases" ON public.entity_onboarding_releases FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Members read own releases" ON public.entity_onboarding_releases FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid()));

DROP POLICY "Members can read their released documents" ON public.portal_documents;
CREATE POLICY "Members can read their released documents" ON public.portal_documents FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.portal_members m
  WHERE m.user_id = auth.uid() AND m.status <> 'revoked'::portal_member_status AND m.documents_released_at IS NOT NULL
    AND (portal_documents.member_id = m.id OR portal_documents.member_id IS NULL)
    AND portal_documents.classification <> ALL (ARRAY['secretariat_only','restricted_opportunity'])
    AND (portal_documents.superseded_at IS NULL OR EXISTS (SELECT 1 FROM public.portal_document_acknowledgements a WHERE a.document_id = portal_documents.id AND a.member_id = m.id))
    AND (portal_documents.classification <> 'confidential_forum' OR (m.nda_verified_at IS NOT NULL AND m.forum_clearance_status <> 'declined' AND (portal_documents.is_forum_prep OR m.forum_clearance_status = ANY (ARRAY['cleared','cleared_restricted']))))
    AND ((NOT m.is_candidate) OR portal_documents.member_id = m.id OR portal_documents.journey_stage IS NULL OR portal_documents.journey_stage = ANY (ARRAY[1,5]))
    AND (portal_documents.journey_stage IS NULL OR portal_documents.journey_stage NOT BETWEEN 2 AND 4
      OR EXISTS (SELECT 1 FROM public.portal_document_acknowledgements a2 WHERE a2.document_id = portal_documents.id AND a2.member_id = m.id)
      OR EXISTS (SELECT 1 FROM public.entity_onboarding_releases r WHERE r.member_id = m.id AND (
        r.entity = portal_documents.journey_track
        OR (COALESCE(portal_documents.journey_track,'shared') = 'shared' AND r.entity = CASE WHEN m.entity = 'dis' THEN 'dis' ELSE 'prsc' END))))
));