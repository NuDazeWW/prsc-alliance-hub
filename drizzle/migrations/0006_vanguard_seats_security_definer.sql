ALTER FUNCTION public.get_vanguard_seats() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.get_vanguard_seats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vanguard_seats() TO anon, authenticated, service_role;