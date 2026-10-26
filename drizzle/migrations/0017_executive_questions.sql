ALTER TABLE public.entity_onboarding_releases ADD COLUMN source text NOT NULL DEFAULT 'admin_release' CHECK (source IN ('admin_release','reconciled')), ADD COLUMN reason text;

CREATE TABLE public.question_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_key text NOT NULL,
  title text NOT NULL,
  opens_at timestamptz NOT NULL,
  deadline timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (deadline > opens_at)
);
CREATE TABLE public.question_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.question_rounds(id) ON DELETE CASCADE,
  consolidated_text text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  source text NOT NULL DEFAULT 'internal' CHECK (source IN ('jared','internal','external')),
  route text CHECK (route IN ('C','P','D','X')),
  priority smallint CHECK (priority BETWEEN 1 AND 3),
  review_status text NOT NULL DEFAULT 'new' CHECK (review_status IN ('new','in_review','approved_external','internal_only','verify','closed')),
  list_target text NOT NULL DEFAULT 'none' CHECK (list_target IN ('none','jared','internal')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.executive_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.question_rounds(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  priority smallint NOT NULL CHECK (priority BETWEEN 1 AND 3),
  question text NOT NULL,
  why_it_matters text NOT NULL,
  source text NOT NULL CHECK (source IN ('jared','internal','external')),
  context text,
  group_id uuid REFERENCES public.question_groups(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, member_id, priority)
);
CREATE TABLE public.question_round_responses (
  round_id uuid NOT NULL REFERENCES public.question_rounds(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('submitted','no_questions')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, member_id)
);
CREATE TABLE public.question_outbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.question_rounds(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  questions jsonb NOT NULL,
  prepared_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  shared_at timestamptz,
  responses text,
  unresolved text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (shared_at IS NULL OR approved_at IS NOT NULL)
);
CREATE TABLE public.question_notification_sends (
  round_id uuid NOT NULL REFERENCES public.question_rounds(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('input_requested','input_reminder')),
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, member_id, kind)
);

GRANT SELECT ON public.question_rounds, public.executive_questions, public.question_round_responses TO authenticated;
GRANT SELECT ON public.question_groups, public.question_outbound, public.question_notification_sends TO authenticated;
GRANT ALL ON public.question_rounds, public.question_groups, public.executive_questions, public.question_round_responses, public.question_outbound, public.question_notification_sends TO service_role;

ALTER TABLE public.question_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_round_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_outbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_notification_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read rounds" ON public.question_rounds FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Cleared members read open rounds" ON public.question_rounds FOR SELECT TO authenticated USING (status <> 'draft' AND EXISTS (SELECT 1 FROM public.portal_members m WHERE m.user_id = auth.uid() AND m.status <> 'revoked' AND m.participates_in_forum AND m.nda_verified_at IS NOT NULL AND m.forum_clearance_status IN ('cleared','cleared_restricted')));
CREATE POLICY "Admins read groups" ON public.question_groups FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read questions" ON public.executive_questions FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Members read own questions" ON public.executive_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid()));
CREATE POLICY "Admins read responses" ON public.question_round_responses FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Members read own responses" ON public.question_round_responses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid()));
CREATE POLICY "Admins read outbound" ON public.question_outbound FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read question sends" ON public.question_notification_sends FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));