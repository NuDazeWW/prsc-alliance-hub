ALTER TABLE public.portal_members ADD COLUMN IF NOT EXISTS orientation_acknowledged_at timestamptz;
COMMENT ON COLUMN public.portal_members.orientation_acknowledged_at IS 'Non-legal 5-minute orientation refresher review time. Server-set only. Not a Stage 2 or document acknowledgment.';

CREATE OR REPLACE FUNCTION public.guard_orientation_ack()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.orientation_acknowledged_at IS DISTINCT FROM OLD.orientation_acknowledged_at
     AND coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.orientation_acknowledged_at := OLD.orientation_acknowledged_at;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_orientation_ack ON public.portal_members;
CREATE TRIGGER guard_orientation_ack BEFORE UPDATE ON public.portal_members FOR EACH ROW EXECUTE FUNCTION public.guard_orientation_ack();

CREATE TABLE public.forum_communication_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_key text NOT NULL,
  email_key text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  member_id uuid NOT NULL,
  recipient_email text NOT NULL,
  sent_by uuid,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (forum_key, email_key, version, member_id)
);
GRANT SELECT ON public.forum_communication_sends TO authenticated;
GRANT ALL ON public.forum_communication_sends TO service_role;
ALTER TABLE public.forum_communication_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read forum sends" ON public.forum_communication_sends FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));