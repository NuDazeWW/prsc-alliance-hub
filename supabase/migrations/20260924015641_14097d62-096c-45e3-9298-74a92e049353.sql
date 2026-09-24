CREATE OR REPLACE FUNCTION public.sync_portal_profile_submission_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.submitted_at IS NOT NULL
     AND (OLD.submitted_at IS NULL OR OLD.submitted_at IS DISTINCT FROM NEW.submitted_at) THEN
    UPDATE public.portal_members
    SET package_status = 'profile_received'::public.portal_package_status
    WHERE id = NEW.member_id
      AND package_status = 'awaiting_profile'::public.portal_package_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_portal_profile_submission_status_after_update
AFTER UPDATE OF submitted_at ON public.portal_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_portal_profile_submission_status();

CREATE TRIGGER sync_portal_profile_submission_status_after_insert
AFTER INSERT ON public.portal_profiles
FOR EACH ROW
WHEN (NEW.submitted_at IS NOT NULL)
EXECUTE FUNCTION public.sync_portal_profile_submission_status();

UPDATE public.portal_members AS member
SET package_status = 'profile_received'::public.portal_package_status
FROM public.portal_profiles AS profile
WHERE profile.member_id = member.id
  AND profile.submitted_at IS NOT NULL
  AND member.package_status = 'awaiting_profile'::public.portal_package_status;