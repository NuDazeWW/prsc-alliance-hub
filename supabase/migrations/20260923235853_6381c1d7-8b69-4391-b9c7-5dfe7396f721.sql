CREATE POLICY "No direct access to portal login security"
ON public.portal_login_security
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);