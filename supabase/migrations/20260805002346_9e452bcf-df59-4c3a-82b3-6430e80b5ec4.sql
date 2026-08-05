CREATE OR REPLACE FUNCTION public.get_vanguard_seats()
 RETURNS TABLE(total integer, filled integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 25 AS total,
         LEAST(25, GREATEST(0, (SELECT count(*)::int FROM public.vanguard_interest) + 7)) AS filled;
$function$;