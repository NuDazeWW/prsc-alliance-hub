CREATE TABLE public.portal_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  description text,
  eyebrow text NOT NULL DEFAULT 'Private Communication',
  heading text NOT NULL DEFAULT '',
  body text NOT NULL,
  cta_label text,
  cta_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_email_templates TO authenticated;
GRANT ALL ON public.portal_email_templates TO service_role;

ALTER TABLE public.portal_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrators can manage email templates"
ON public.portal_email_templates FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_portal_email_templates_updated_at
BEFORE UPDATE ON public.portal_email_templates
FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();

CREATE TABLE public.portal_email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.portal_email_templates(id) ON DELETE SET NULL,
  template_name text NOT NULL,
  subject text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_email_sends TO authenticated;
GRANT ALL ON public.portal_email_sends TO service_role;

ALTER TABLE public.portal_email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrators can manage email sends"
ON public.portal_email_sends FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX portal_email_sends_member_idx ON public.portal_email_sends (member_id, created_at DESC);