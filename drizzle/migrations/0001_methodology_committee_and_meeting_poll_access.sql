ALTER TABLE public.portal_members ADD COLUMN IF NOT EXISTS is_methodology_committee boolean NOT NULL DEFAULT false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_polls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_poll_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_poll_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_poll_notes TO authenticated;
GRANT ALL ON public.meeting_polls TO service_role;
GRANT ALL ON public.meeting_poll_slots TO service_role;
GRANT ALL ON public.meeting_poll_responses TO service_role;
GRANT ALL ON public.meeting_poll_notes TO service_role;

ALTER TABLE public.meeting_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_poll_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_poll_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read polls they are invited to"
ON public.meeting_polls FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.portal_members pm
    WHERE pm.user_id = auth.uid() AND pm.id = ANY (meeting_polls.invited_member_ids)
  )
);

CREATE POLICY "Admins manage polls"
ON public.meeting_polls FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Invited members read slots"
ON public.meeting_poll_slots FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.meeting_polls p
    JOIN public.portal_members pm ON pm.user_id = auth.uid() AND pm.id = ANY (p.invited_member_ids)
    WHERE p.id = meeting_poll_slots.poll_id
  )
);

CREATE POLICY "Admins manage slots"
ON public.meeting_poll_slots FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Members read responses on their polls"
ON public.meeting_poll_responses FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.meeting_polls p
    JOIN public.portal_members pm ON pm.user_id = auth.uid() AND pm.id = ANY (p.invited_member_ids)
    WHERE p.id = meeting_poll_responses.poll_id
  )
);

CREATE POLICY "Members submit own responses"
ON public.meeting_poll_responses FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.portal_members pm WHERE pm.user_id = auth.uid() AND pm.id = meeting_poll_responses.member_id)
);

CREATE POLICY "Members update own responses"
ON public.meeting_poll_responses FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.portal_members pm WHERE pm.user_id = auth.uid() AND pm.id = meeting_poll_responses.member_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.portal_members pm WHERE pm.user_id = auth.uid() AND pm.id = meeting_poll_responses.member_id)
);

CREATE POLICY "Admins delete responses"
ON public.meeting_poll_responses FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Members read notes on their polls"
ON public.meeting_poll_notes FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.meeting_polls p
    JOIN public.portal_members pm ON pm.user_id = auth.uid() AND pm.id = ANY (p.invited_member_ids)
    WHERE p.id = meeting_poll_notes.poll_id
  )
);

CREATE POLICY "Members add own note"
ON public.meeting_poll_notes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.portal_members pm WHERE pm.user_id = auth.uid() AND pm.id = meeting_poll_notes.member_id)
);

CREATE POLICY "Members update own note"
ON public.meeting_poll_notes FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.portal_members pm WHERE pm.user_id = auth.uid() AND pm.id = meeting_poll_notes.member_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.portal_members pm WHERE pm.user_id = auth.uid() AND pm.id = meeting_poll_notes.member_id)
);