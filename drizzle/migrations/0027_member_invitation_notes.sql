-- Save the professional source link without assigning any role, verifying an NDA, or sending an invitation.
-- These exact constraints come from the existing portal_members definition. Keep NOT NULL and the upper limits.
ALTER TABLE public.portal_members DROP CONSTRAINT portal_members_why_you_check;
ALTER TABLE public.portal_members ADD CONSTRAINT portal_members_why_you_check CHECK (char_length(why_you) BETWEEN 0 AND 2000);
ALTER TABLE public.portal_members DROP CONSTRAINT portal_members_organization_check;
ALTER TABLE public.portal_members ADD CONSTRAINT portal_members_organization_check CHECK (char_length(organization) BETWEEN 0 AND 180);
ALTER TABLE public.portal_members ADD COLUMN linkedin_url text;
ALTER TABLE public.portal_members ADD CONSTRAINT portal_members_linkedin_profile_url CHECK (
 linkedin_url IS NULL OR (
  char_length(linkedin_url) <= 300
  AND position(chr(92) in linkedin_url) = 0
  AND linkedin_url !~ '[[:space:]]'
  AND linkedin_url ~* '^https://((www|[a-z]{2})\.)?linkedin\.com/(in/[A-Za-z0-9._%~-]+/?|pub/[A-Za-z0-9._%~-]+(/[A-Za-z0-9._%~-]+)*/?)([?#][^[:space:]]*)?$'
 )
);
COMMENT ON COLUMN public.portal_members.linkedin_url IS 'Administrator-supplied public professional LinkedIn profile source URL. Null preserves existing rows; a link is not proof of identity, NDA execution, experience, or appointment.';

-- Keep preparation independent from invitation delivery. Blank notes may be saved; invitation validation remains stricter.
CREATE OR REPLACE FUNCTION public.save_member_invitation_notes(
 p_member_id uuid,
 p_expected_updated_at timestamptz,
 p_why_you text,
 p_linkedin_url text,
 p_admin_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 current_member public.portal_members;
 saved_member public.portal_members;
 normalized_note text := btrim(coalesce(p_why_you, ''));
 normalized_linkedin text := nullif(btrim(p_linkedin_url), '');
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role = 'admin'::public.app_role) THEN
  RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
 END IF;
 IF char_length(normalized_note) > 2000 THEN
  RAISE EXCEPTION 'Keep the Why you note to 2,000 characters' USING ERRCODE = '22023';
 END IF;
 SELECT * INTO current_member FROM public.portal_members WHERE id = p_member_id FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
 END IF;
 IF current_member.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'Member details changed; reload and review again' USING ERRCODE = '40001';
 END IF;
 IF current_member.status::text = 'revoked' THEN
  RAISE EXCEPTION 'This member access has been revoked' USING ERRCODE = '42501';
 END IF;
 UPDATE public.portal_members
 SET why_you = normalized_note, linkedin_url = normalized_linkedin, updated_at = clock_timestamp()
 WHERE id = p_member_id
 RETURNING * INTO saved_member;
 INSERT INTO public.portal_activity(member_id, actor_user_id, event_type, metadata)
 VALUES(p_member_id, p_admin_id, 'invitation_notes_updated', jsonb_build_object(
  'previous', jsonb_build_object('why_you', current_member.why_you, 'linkedin_url', current_member.linkedin_url),
  'requested', jsonb_build_object('why_you', saved_member.why_you, 'linkedin_url', saved_member.linkedin_url)
 ));
 RETURN jsonb_build_object('member_id', p_member_id, 'why_you', saved_member.why_you,
  'linkedin_url', saved_member.linkedin_url, 'updated_at', saved_member.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.save_member_invitation_notes(uuid,timestamptz,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_member_invitation_notes(uuid,timestamptz,text,text,uuid) TO service_role;
