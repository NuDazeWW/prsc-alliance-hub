CREATE TABLE public.test_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  member_id uuid,
  row_data jsonb NOT NULL,
  reason text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.test_archive TO service_role;
ALTER TABLE public.test_archive ENABLE ROW LEVEL SECURITY;