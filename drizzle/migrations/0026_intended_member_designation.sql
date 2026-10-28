-- Informational intention only. Existing role, access, reviews, and appointment records remain authoritative.
ALTER TABLE public.portal_members ADD COLUMN intended_designation jsonb;
ALTER TABLE public.portal_members ADD CONSTRAINT portal_members_intended_designation_shape CHECK (
 intended_designation IS NULL OR (
  jsonb_typeof(intended_designation) = 'object'
  AND intended_designation ?& ARRAY['version','kind','entity','roles','other_text','committee']
  AND intended_designation - ARRAY['version','kind','entity','roles','other_text','committee'] = '{}'::jsonb
  AND intended_designation->'version' = '1'::jsonb
  AND jsonb_typeof(intended_designation->'kind') = 'string'
  AND intended_designation->>'kind' IN ('forum_invitee','identified')
  AND jsonb_typeof(intended_designation->'entity') = 'string'
  AND intended_designation->>'entity' IN ('none','prsc','dis','both')
  AND jsonb_typeof(intended_designation->'roles') = 'array'
  AND intended_designation->'roles' <@ '["prsc_board","prsc_advisor","dis_board","dis_advisor","other"]'::jsonb
  AND jsonb_array_length(intended_designation->'roles') = (
   ((intended_designation->'roles') ? 'prsc_board')::integer + ((intended_designation->'roles') ? 'prsc_advisor')::integer +
   ((intended_designation->'roles') ? 'dis_board')::integer + ((intended_designation->'roles') ? 'dis_advisor')::integer +
   ((intended_designation->'roles') ? 'other')::integer
  )
  AND jsonb_typeof(intended_designation->'other_text') = 'string'
  AND char_length(intended_designation->>'other_text') <= 400
  AND (CASE WHEN (intended_designation->'roles') ? 'other' THEN length(trim(intended_designation->>'other_text')) > 0 ELSE length(trim(intended_designation->>'other_text')) = 0 END)
  AND jsonb_typeof(intended_designation->'committee') = 'string'
  AND intended_designation->>'committee' IN ('yes','no','undetermined')
  AND (NOT ((intended_designation->'roles') ?| ARRAY['prsc_board','prsc_advisor']) OR intended_designation->>'entity' IN ('prsc','both'))
  AND (NOT ((intended_designation->'roles') ?| ARRAY['dis_board','dis_advisor']) OR intended_designation->>'entity' IN ('dis','both'))
  AND (
   (intended_designation->>'kind' = 'forum_invitee' AND intended_designation->>'entity' = 'none' AND jsonb_array_length(intended_designation->'roles') = 0 AND intended_designation->>'committee' <> 'yes')
   OR
   (intended_designation->>'kind' = 'identified'
    AND (jsonb_array_length(intended_designation->'roles') > 0 OR (intended_designation->>'committee' = 'yes' AND intended_designation->>'entity' <> 'none'))
    AND (intended_designation->>'entity' <> 'none' OR (intended_designation->'roles' = '["other"]'::jsonb AND intended_designation->>'committee' <> 'yes'))
   )
  )
 )
);
COMMENT ON COLUMN public.portal_members.intended_designation IS 'Versioned informational intended entity/roles/committee. Does not assign authority, activate appointments, release onboarding, grant access, or change existing role fields. Null preserves legacy rows without backfill.';

-- Service-only, atomic metadata edit. The audit insert and member update succeed or roll back together.
CREATE OR REPLACE FUNCTION public.save_member_intended_designation(
 p_member_id uuid,
 p_expected_updated_at timestamptz,
 p_designation jsonb,
 p_admin_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 current_member public.portal_members;
 saved_designation jsonb;
 saved_updated_at timestamptz;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role = 'admin'::public.app_role) THEN
  RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
 END IF;
 IF p_designation IS NULL THEN
  RAISE EXCEPTION 'An intended designation is required' USING ERRCODE = '22023';
 END IF;
 SELECT * INTO current_member FROM public.portal_members WHERE id = p_member_id FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
 END IF;
 IF current_member.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'Member details changed; reload and review again' USING ERRCODE = '40001';
 END IF;
 UPDATE public.portal_members
 SET intended_designation = p_designation, updated_at = clock_timestamp()
 WHERE id = p_member_id
 RETURNING intended_designation, updated_at INTO saved_designation, saved_updated_at;
 INSERT INTO public.portal_activity(member_id, actor_user_id, event_type, metadata)
 VALUES(p_member_id, p_admin_id, 'intended_designation_updated',
  jsonb_build_object('previous', current_member.intended_designation, 'requested', p_designation));
 RETURN jsonb_build_object('member_id', p_member_id, 'intended_designation', saved_designation, 'updated_at', saved_updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.save_member_intended_designation(uuid,timestamptz,jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_member_intended_designation(uuid,timestamptz,jsonb,uuid) TO service_role;
