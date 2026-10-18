CREATE POLICY "Admins manage leadership photos" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'leadership-photos' AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (bucket_id = 'leadership-photos' AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));