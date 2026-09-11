ALTER TABLE public.portal_email_templates
  ADD COLUMN IF NOT EXISTS cta_subtext text,
  ADD COLUMN IF NOT EXISTS signatures text;

INSERT INTO public.portal_email_templates (name, subject, description, eyebrow, heading, body, cta_label, cta_url, cta_subtext, signatures)
SELECT
  'Welcome & Access',
  'Welcome to the future of Partnership Readiness, {{first_name}}',
  'Sent with the first invitation to the Private Board & Advisor Center',
  'Welcome & Access',
  'Welcome, {{first_name}}.',
  E'Welcome to the future of Partnership Readiness.\n\nWe’re building something special at {{entity_full}}, and we’re thrilled to have you as part of what comes next.\n\nWe’re pleased to share an important milestone: DIS has officially moved into investor prospecting.\n\nAs a {{role_label}}, your experience, perspective, and guidance will play an important role in our future success. Within the next 8–10 business days, you’ll receive your {{package_label}} package outlining your role, commitment, opportunity, and other key details for your review and alignment.\n\nWe know—it’s been a while since we’ve connected! Click below for a quick update on where we are, why we’re excited to partner with you, and to submit a few pre-package details or any questions you may have.\n\nIt’s been an exciting—and at times challenging—journey to get here. We’re looking forward to this next chapter and to disrupting the brand partnership industry together.',
  'Welcome aboard',
  'https://access.prscstandards.org/portal',
  'Your password will be sent to this same email upon entry.',
  E'Shirley Johnson, Founder & CEO\nBobbie Laurel, Co-Founder & Chief Operations Officer\nDave Nussbaum, Chief Information Officer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.portal_email_templates WHERE name = 'Welcome & Access'
);