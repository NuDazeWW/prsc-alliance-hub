CREATE OR REPLACE FUNCTION public.get_vanguard_seats()
RETURNS TABLE(total int, filled int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 25 AS total,
         GREATEST(0, (SELECT count(*)::int FROM public.vanguard_interest) - 2) AS filled;
$$;

GRANT EXECUTE ON FUNCTION public.get_vanguard_seats() TO anon, authenticated;