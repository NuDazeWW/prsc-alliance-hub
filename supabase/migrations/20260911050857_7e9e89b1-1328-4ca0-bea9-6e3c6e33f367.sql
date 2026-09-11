CREATE TYPE public.app_role AS ENUM ('admin', 'board_member', 'advisor');
CREATE TYPE public.portal_entity AS ENUM ('prsc', 'dis', 'both');
CREATE TYPE public.portal_member_status AS ENUM ('invited', 'active', 'revoked');
CREATE TYPE public.portal_package_status AS ENUM ('awaiting_profile', 'in_preparation', 'profile_received', 'package_ready');
CREATE TYPE public.portal_inquiry_status AS ENUM ('open', 'resolved');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Administrators can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.portal_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 80),
  last_name text NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 80),
  professional_name text,
  organization text NOT NULL CHECK (char_length(organization) BETWEEN 1 AND 180),
  title text,
  entity public.portal_entity NOT NULL,
  role public.app_role NOT NULL CHECK (role IN ('board_member', 'advisor')),
  why_you text NOT NULL CHECK (char_length(why_you) BETWEEN 1 AND 2000),
  status public.portal_member_status NOT NULL DEFAULT 'invited',
  package_status public.portal_package_status NOT NULL DEFAULT 'awaiting_profile',
  invited_at timestamptz NOT NULL DEFAULT now(),
  first_access_at timestamptz,
  last_access_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.portal_members TO authenticated;
GRANT ALL ON public.portal_members TO service_role;
ALTER TABLE public.portal_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read their own portal record"
ON public.portal_members FOR SELECT TO authenticated
USING (user_id = auth.uid() AND status <> 'revoked');
CREATE POLICY "Members can update their own access timestamps"
ON public.portal_members FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status <> 'revoked')
WITH CHECK (user_id = auth.uid() AND status <> 'revoked');
CREATE POLICY "Administrators can manage portal members"
ON public.portal_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.portal_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL UNIQUE REFERENCES public.portal_members(id) ON DELETE CASCADE,
  current_stage smallint NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 5),
  preferred_name text,
  professional_role text,
  current_organization text,
  preferred_email text,
  preferred_phone text,
  headshot_path text,
  experience_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility_instructions jsonb NOT NULL DEFAULT '{}'::jsonb,
  restriction_status text CHECK (restriction_status IS NULL OR restriction_status IN ('no', 'yes', 'unsure')),
  restriction_details text,
  final_notes text,
  questions text,
  contact_requested boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  reopened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.portal_profiles TO authenticated;
GRANT ALL ON public.portal_profiles TO service_role;
ALTER TABLE public.portal_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read their own private profile"
ON public.portal_profiles FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE POLICY "Members can create their own private profile"
ON public.portal_profiles FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE POLICY "Members can update an open private profile"
ON public.portal_profiles FOR UPDATE TO authenticated
USING (submitted_at IS NULL AND EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'))
WITH CHECK (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE POLICY "Administrators can manage private profiles"
ON public.portal_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.portal_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 160),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  status public.portal_inquiry_status NOT NULL DEFAULT 'open',
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.portal_inquiries TO authenticated;
GRANT ALL ON public.portal_inquiries TO service_role;
ALTER TABLE public.portal_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read their own inquiries"
ON public.portal_inquiries FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE POLICY "Members can submit their own inquiries"
ON public.portal_inquiries FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE POLICY "Administrators can manage inquiries"
ON public.portal_inquiries FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.portal_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.portal_members(id) ON DELETE SET NULL,
  actor_user_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('invited', 'invite_resent', 'accessed', 'profile_started', 'profile_saved', 'profile_submitted', 'profile_reopened', 'inquiry_submitted', 'inquiry_resolved', 'access_revoked', 'access_reactivated')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.portal_activity TO authenticated;
GRANT ALL ON public.portal_activity TO service_role;
ALTER TABLE public.portal_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read their own activity"
ON public.portal_activity FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE POLICY "Members can record their own activity"
ON public.portal_activity FOR INSERT TO authenticated
WITH CHECK (actor_user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id = member_id AND m.user_id = auth.uid() AND m.status <> 'revoked'));
CREATE POLICY "Administrators can manage portal activity"
ON public.portal_activity FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_portal_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_portal_members_updated_at BEFORE UPDATE ON public.portal_members FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();
CREATE TRIGGER set_portal_profiles_updated_at BEFORE UPDATE ON public.portal_profiles FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();
CREATE TRIGGER set_portal_inquiries_updated_at BEFORE UPDATE ON public.portal_inquiries FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();

CREATE INDEX portal_members_status_idx ON public.portal_members(status, package_status);
CREATE INDEX portal_inquiries_member_idx ON public.portal_inquiries(member_id, created_at DESC);
CREATE INDEX portal_activity_member_idx ON public.portal_activity(member_id, created_at DESC);