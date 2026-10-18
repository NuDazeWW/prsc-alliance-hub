ALTER TABLE public.portal_profiles ADD COLUMN IF NOT EXISTS bio text;

CREATE TABLE public.leadership_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  bio text,
  photo_path text,
  member_id uuid REFERENCES public.portal_members(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  is_placeholder boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership_team TO authenticated;
GRANT ALL ON public.leadership_team TO service_role;
ALTER TABLE public.leadership_team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leadership" ON public.leadership_team FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
CREATE POLICY "Members read visible leadership" ON public.leadership_team FOR SELECT TO authenticated
  USING (visible AND EXISTS (SELECT 1 FROM public.portal_members m WHERE m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE TRIGGER set_leadership_team_updated_at BEFORE UPDATE ON public.leadership_team FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();

CREATE TABLE public.leadership_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  eyebrow text NOT NULL DEFAULT 'Our Leadership Team',
  heading text NOT NULL DEFAULT 'Our Leadership Team',
  subtext text NOT NULL DEFAULT 'A distinguished group of advisors and executives guiding PRSC''s mission and industry impact.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.leadership_settings TO authenticated;
GRANT ALL ON public.leadership_settings TO service_role;
ALTER TABLE public.leadership_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leadership settings" ON public.leadership_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
CREATE POLICY "Signed in read leadership settings" ON public.leadership_settings FOR SELECT TO authenticated USING (true);
INSERT INTO public.leadership_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;

INSERT INTO public.leadership_team (name, title, sort_order, is_placeholder) VALUES
 ('Jonathan Reeves','Chairman',1,true),('Dr. Elena Park','Board Member',2,true),('Marcus Ellison','Board Member',3,true),
 ('Victoria Chen','Board Member',4,true),('Daniel Brooks','Board Member',5,true),('Angela Kim','Board Member',6,true);