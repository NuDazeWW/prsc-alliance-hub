ALTER TABLE public.portal_members ADD COLUMN IF NOT EXISTS is_candidate boolean NOT NULL DEFAULT false;
ALTER TABLE public.leadership_team ADD COLUMN IF NOT EXISTS affiliation text;

DROP POLICY IF EXISTS "Members can read their released documents" ON public.portal_documents;
CREATE POLICY "Members can read their released documents" ON public.portal_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.portal_members m
    WHERE m.user_id = auth.uid()
      AND m.status <> 'revoked'::portal_member_status
      AND m.documents_released_at IS NOT NULL
      AND (portal_documents.member_id = m.id OR portal_documents.member_id IS NULL)
      AND portal_documents.classification <> ALL (ARRAY['secretariat_only','restricted_opportunity'])
      AND (portal_documents.superseded_at IS NULL OR EXISTS (
        SELECT 1 FROM public.portal_document_acknowledgements a
        WHERE a.document_id = portal_documents.id AND a.member_id = m.id))
      AND (portal_documents.classification <> 'confidential_forum' OR (
        m.nda_verified_at IS NOT NULL AND m.forum_clearance_status <> 'declined'
        AND (portal_documents.is_forum_prep OR m.forum_clearance_status = ANY (ARRAY['cleared','cleared_restricted']))))
      AND (NOT m.is_candidate OR portal_documents.member_id = m.id OR portal_documents.journey_stage IS NULL OR portal_documents.journey_stage IN (1, 5))
  ));