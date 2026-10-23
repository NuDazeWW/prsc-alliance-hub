ALTER TABLE public.portal_documents
  ADD COLUMN IF NOT EXISTS journey_stage smallint,
  ADD COLUMN IF NOT EXISTS journey_track text;
ALTER TABLE public.portal_documents DROP CONSTRAINT IF EXISTS portal_documents_journey_stage_check;
ALTER TABLE public.portal_documents ADD CONSTRAINT portal_documents_journey_stage_check CHECK (journey_stage IS NULL OR journey_stage BETWEEN 1 AND 5);
ALTER TABLE public.portal_documents DROP CONSTRAINT IF EXISTS portal_documents_journey_track_check;
ALTER TABLE public.portal_documents ADD CONSTRAINT portal_documents_journey_track_check CHECK (journey_track IS NULL OR journey_track IN ('shared','prsc','dis'));
ALTER TABLE public.portal_members
  ADD COLUMN IF NOT EXISTS prsc_activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS dis_activated_at timestamptz;