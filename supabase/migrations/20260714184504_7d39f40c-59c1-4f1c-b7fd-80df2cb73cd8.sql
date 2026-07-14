
-- Briefing requests
CREATE TABLE public.briefing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  organization TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  interaction TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.briefing_requests TO anon, authenticated;
GRANT ALL ON public.briefing_requests TO service_role;
ALTER TABLE public.briefing_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit briefing" ON public.briefing_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Board interest
CREATE TABLE public.board_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  linkedin_url TEXT,
  email TEXT NOT NULL,
  statement TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.board_interest TO anon, authenticated;
GRANT ALL ON public.board_interest TO service_role;
ALTER TABLE public.board_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit board interest" ON public.board_interest FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Vanguard interest
CREATE TABLE public.vanguard_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  property TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.vanguard_interest TO anon, authenticated;
GRANT ALL ON public.vanguard_interest TO service_role;
ALTER TABLE public.vanguard_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit vanguard interest" ON public.vanguard_interest FOR INSERT TO anon, authenticated WITH CHECK (true);
