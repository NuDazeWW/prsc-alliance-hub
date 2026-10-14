ALTER TABLE public.portal_members ADD COLUMN IF NOT EXISTS is_methodology_committee boolean NOT NULL DEFAULT false;

CREATE TABLE public.meeting_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type text NOT NULL CHECK (meeting_type IN ('board','advisory','methodology')),
  title text NOT NULL,
  description text,
  format text NOT NULL DEFAULT 'virtual' CHECK (format IN ('virtual','in_person','hybrid')),
  location text,
  virtual_link text,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','confirmed','cancelled')),
  confirmed_slot_id uuid,
  invited_member_ids uuid[] NOT NULL DEFAULT '{}',
  auto_nudge_sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.meeting_poll_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.meeting_polls(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.meeting_poll_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.meeting_polls(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES public.meeting_poll_slots(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  availability text NOT NULL CHECK (availability IN ('available','if_needed','unavailable')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_id, member_id)
);
CREATE TABLE public.meeting_poll_notes (
  poll_id uuid NOT NULL REFERENCES public.meeting_polls(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  note text,
  responded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, member_id)
);
GRANT ALL ON public.meeting_polls, public.meeting_poll_slots, public.meeting_poll_responses, public.meeting_poll_notes TO service_role;
ALTER TABLE public.meeting_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_poll_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_poll_notes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_meeting_polls_updated_at BEFORE UPDATE ON public.meeting_polls FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();