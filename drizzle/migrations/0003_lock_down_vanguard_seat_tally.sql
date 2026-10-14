DROP POLICY IF EXISTS "Anyone can read Vanguard seat tally" ON public.vanguard_seat_tally;
REVOKE SELECT ON public.vanguard_seat_tally FROM anon, authenticated;
COMMENT ON TABLE public.vanguard_seat_tally IS 'Internal seat counter; not read by the app. Public read policy removed — admin/service access only.';