ALTER TABLE public.portal_members DROP CONSTRAINT portal_members_role_check;
ALTER TABLE public.portal_members ADD CONSTRAINT portal_members_role_check CHECK ((role)::text = ANY (ARRAY['board_member','advisor','prsc_board_dis_advisor','prsc_advisor_dis_board','methodology_committee']));
CREATE POLICY "Members delete own responses on open polls" ON public.meeting_poll_responses FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.portal_members pm WHERE pm.user_id = auth.uid() AND pm.id = meeting_poll_responses.member_id)
  AND EXISTS (SELECT 1 FROM public.meeting_polls p WHERE p.id = meeting_poll_responses.poll_id AND p.status = 'open')
);