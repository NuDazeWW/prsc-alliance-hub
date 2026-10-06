ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'prsc_board_dis_advisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'prsc_advisor_dis_board';
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
  WHERE conrelid = 'public.portal_members'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%role%board_member%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE public.portal_members DROP CONSTRAINT %I', c); END IF;
END $$;
ALTER TABLE public.portal_members ADD CONSTRAINT portal_members_role_check
  CHECK (role::text IN ('board_member','advisor','prsc_board_dis_advisor','prsc_advisor_dis_board'));