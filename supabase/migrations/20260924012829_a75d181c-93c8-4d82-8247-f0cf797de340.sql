ALTER TABLE public.portal_email_templates ADD COLUMN IF NOT EXISTS system_key text UNIQUE;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_email_templates TO authenticated;
GRANT ALL ON public.portal_email_templates TO service_role;
INSERT INTO public.portal_email_templates (system_key, name, subject, description, eyebrow, heading, body, cta_label, cta_url, cta_subtext, signatures)
VALUES ('invite', 'Invitation (sent automatically)', 'PRSC & DIS | Board & Advisor Center',
'Sent automatically when you invite a member. Tokens: {{first_name}}, {{entity_full}}, {{entity}}, {{role}}.',
'Private invitation', 'Welcome, {{first_name}}!',
E'It''s been a while since we spoke!\n\nYou''re receiving this invitation because we aligned on your role at {{entity_full}} as a {{role}}.\n\nA great deal has happened behind the scenes. We''ve reached an important next stage—including DIS officially entering investor prospecting—and we''re excited to reconnect and bring you into what comes next.\n\nWe''ve created a private {{entity}} Board & Advisor Welcome Center where you can quickly:\n\n• Get reacquainted with {{entity}} and see where we are today\n• Review why we''re excited to have you involved\n• Provide a few details we need to prepare your individualized Board/Advisor package\n• Send us any questions before your formal materials are delivered\n\nWe''re excited to reconnect and officially welcome you into this next chapter.',
'Access Your Private Welcome Center →', NULL,
'After you click the button, you''ll create your own private password on the secure invitation page. No password will be sent by email. Once your password is set, you''ll enter the Welcome Center immediately.',
'Shirley Johnson|Founder, Partnership Readiness Standards Council / Decision Intelligence Systems')
ON CONFLICT (system_key) DO NOTHING;