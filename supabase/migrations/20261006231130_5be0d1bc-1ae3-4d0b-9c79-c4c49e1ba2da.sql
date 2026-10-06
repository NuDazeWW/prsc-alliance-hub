ALTER TABLE public.portal_documents DROP CONSTRAINT IF EXISTS portal_documents_action_check;
ALTER TABLE public.portal_documents ADD CONSTRAINT portal_documents_action_check
  CHECK (action IN ('docusign','download','acknowledge','esign','boldsign'));
ALTER TABLE public.portal_documents
  ADD COLUMN IF NOT EXISTS audience_entity text CHECK (audience_entity IN ('prsc','dis','both')),
  ADD COLUMN IF NOT EXISTS audience_role text CHECK (audience_role IN ('board_member','advisor'));

ALTER TABLE public.portal_members
  ADD COLUMN IF NOT EXISTS documents_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS documents_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS documents_completed_at timestamptz;

ALTER TABLE public.portal_document_acknowledgements
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'acknowledged' CHECK (kind IN ('acknowledged','signed')),
  ADD COLUMN IF NOT EXISTS signed_name text,
  ADD COLUMN IF NOT EXISTS signature_data text,
  ADD COLUMN IF NOT EXISTS consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

DROP POLICY IF EXISTS "Members can read their documents" ON public.portal_documents;
CREATE POLICY "Members can read their released documents" ON public.portal_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.portal_members m
    WHERE m.user_id = auth.uid()
      AND m.status <> 'revoked'::portal_member_status
      AND m.documents_released_at IS NOT NULL
      AND (portal_documents.member_id = m.id OR portal_documents.member_id IS NULL)
  ));