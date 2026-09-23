CREATE TABLE public.portal_login_security (
  normalized_email text PRIMARY KEY,
  failed_attempts smallint NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0 AND failed_attempts <= 3),
  reset_required boolean NOT NULL DEFAULT false,
  last_failed_at timestamp with time zone,
  last_success_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.portal_login_security TO service_role;

ALTER TABLE public.portal_login_security ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_portal_login_security_updated_at
BEFORE UPDATE ON public.portal_login_security
FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();