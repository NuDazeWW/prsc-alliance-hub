CREATE TABLE public.vanguard_seat_tally (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  application_count integer NOT NULL DEFAULT 0 CHECK (application_count >= 0),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vanguard_seat_tally TO anon, authenticated;
GRANT ALL ON public.vanguard_seat_tally TO service_role;

ALTER TABLE public.vanguard_seat_tally ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read Vanguard seat tally"
ON public.vanguard_seat_tally
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.vanguard_seat_tally (singleton, application_count)
SELECT true, count(*)::integer FROM public.vanguard_interest;

CREATE OR REPLACE FUNCTION public.sync_vanguard_seat_tally()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vanguard_seat_tally
    SET application_count = application_count + 1, updated_at = now()
    WHERE singleton = true;
    RETURN NEW;
  END IF;
  UPDATE public.vanguard_seat_tally
  SET application_count = GREATEST(0, application_count - 1), updated_at = now()
  WHERE singleton = true;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_vanguard_seat_tally() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_vanguard_seat_tally() TO service_role;

CREATE TRIGGER sync_vanguard_seat_tally_after_change
AFTER INSERT OR DELETE ON public.vanguard_interest
FOR EACH ROW EXECUTE FUNCTION public.sync_vanguard_seat_tally();

CREATE OR REPLACE FUNCTION public.get_vanguard_seats()
RETURNS TABLE(total integer, filled integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 25 AS total,
         LEAST(25, GREATEST(0, application_count + 7)) AS filled
  FROM public.vanguard_seat_tally
  WHERE singleton = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_vanguard_seats() TO anon, authenticated, service_role;