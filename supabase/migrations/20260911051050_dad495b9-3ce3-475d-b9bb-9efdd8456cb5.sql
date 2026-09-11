CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
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
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

ALTER POLICY "Administrators can read all roles" ON public.user_roles
USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Administrators can manage portal members" ON public.portal_members
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Administrators can manage private profiles" ON public.portal_profiles
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Administrators can manage inquiries" ON public.portal_inquiries
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Administrators can manage portal activity" ON public.portal_activity
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

REVOKE UPDATE ON public.portal_members FROM authenticated;
DROP POLICY "Members can update their own access timestamps" ON public.portal_members;
DROP FUNCTION public.has_role(uuid, public.app_role);

CREATE POLICY "Members upload their own headshot"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'member-headshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members view their own headshot"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'member-headshots' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin')));
CREATE POLICY "Members replace their own headshot"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'member-headshots' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'member-headshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members remove their own headshot"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'member-headshots' AND (storage.foldername(name))[1] = auth.uid()::text);