
CREATE TABLE public.certification_interest (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.certification_interest TO service_role;
ALTER TABLE public.certification_interest ENABLE ROW LEVEL SECURITY;
-- No policies: writes go through server function using service role only.
