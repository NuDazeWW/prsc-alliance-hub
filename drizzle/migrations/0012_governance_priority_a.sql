ALTER TABLE public.portal_members
  ADD COLUMN IF NOT EXISTS nda_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS nda_verified_by uuid,
  ADD COLUMN IF NOT EXISTS nda_reference text,
  ADD COLUMN IF NOT EXISTS nda_entities public.portal_entity,
  ADD COLUMN IF NOT EXISTS nda_scope text,
  ADD COLUMN IF NOT EXISTS role_review_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS forum_clearance_status text NOT NULL DEFAULT 'not_reviewed',
  ADD COLUMN IF NOT EXISTS forum_cleared_at timestamptz,
  ADD COLUMN IF NOT EXISTS forum_cleared_by uuid,
  ADD COLUMN IF NOT EXISTS forum_restrictions text,
  ADD COLUMN IF NOT EXISTS prsc_appointment_ref text,
  ADD COLUMN IF NOT EXISTS dis_appointment_ref text;

UPDATE public.portal_members SET role_review_status = 'pending'
  WHERE entity = 'both' OR role IN ('prsc_board_dis_advisor','prsc_advisor_dis_board');

ALTER TABLE public.portal_members
  ADD CONSTRAINT portal_members_role_review_status_chk CHECK (role_review_status IN ('not_required','pending','approved','declined','prohibited')),
  ADD CONSTRAINT portal_members_forum_clearance_chk CHECK (forum_clearance_status IN ('not_reviewed','cleared','cleared_restricted','escalated','declined'));

ALTER TABLE public.portal_documents
  ADD COLUMN IF NOT EXISTS classification text NOT NULL DEFAULT 'entity_confidential',
  ADD COLUMN IF NOT EXISTS classification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS supersedes_id uuid REFERENCES public.portal_documents(id),
  ADD COLUMN IF NOT EXISTS version_label text,
  ADD COLUMN IF NOT EXISTS is_forum_prep boolean NOT NULL DEFAULT false;

UPDATE public.portal_documents SET classification = 'confidential_forum', is_forum_prep = true WHERE journey_stage = 1;

ALTER TABLE public.portal_documents
  ADD CONSTRAINT portal_documents_classification_chk CHECK (classification IN ('general_orientation','confidential_forum','restricted_opportunity','entity_confidential','secretariat_only'));

ALTER TABLE public.portal_document_acknowledgements
  ADD COLUMN IF NOT EXISTS conflict_answer text,
  ADD COLUMN IF NOT EXISTS conflict_details text;

CREATE TABLE public.governance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('nda','role_combination','forum_clearance','appointment','third_party_permission')),
  decision text NOT NULL,
  reviewer_id uuid NOT NULL,
  notes text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.governance_reviews TO authenticated;
GRANT ALL ON public.governance_reviews TO service_role;
ALTER TABLE public.governance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators manage governance reviews" ON public.governance_reviews FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Fail-closed member read rule enforced in the database, independent of app code.
DROP POLICY IF EXISTS "Members can read their released documents" ON public.portal_documents;
CREATE POLICY "Members can read their released documents" ON public.portal_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.portal_members m
  WHERE m.user_id = auth.uid() AND m.status <> 'revoked' AND m.documents_released_at IS NOT NULL
    AND (portal_documents.member_id = m.id OR portal_documents.member_id IS NULL)
    AND portal_documents.classification NOT IN ('secretariat_only','restricted_opportunity')
    AND (portal_documents.superseded_at IS NULL OR EXISTS (
      SELECT 1 FROM public.portal_document_acknowledgements a WHERE a.document_id = portal_documents.id AND a.member_id = m.id))
    AND (portal_documents.classification <> 'confidential_forum' OR (
      m.nda_verified_at IS NOT NULL AND m.forum_clearance_status <> 'declined'
      AND (portal_documents.is_forum_prep OR m.forum_clearance_status IN ('cleared','cleared_restricted'))))
));