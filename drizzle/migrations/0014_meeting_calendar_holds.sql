CREATE TABLE public.meeting_calendar_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  slot_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'hold' CHECK (kind IN ('hold','final')),
  outlook_event_id text,
  transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_id)
);
GRANT SELECT ON public.meeting_calendar_holds TO authenticated;
GRANT ALL ON public.meeting_calendar_holds TO service_role;
ALTER TABLE public.meeting_calendar_holds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read calendar holds" ON public.meeting_calendar_holds FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
ALTER TABLE public.meeting_polls ADD COLUMN IF NOT EXISTS calendar_sync_error text;
ALTER TABLE public.meeting_polls ADD COLUMN IF NOT EXISTS calendar_synced_at timestamptz;