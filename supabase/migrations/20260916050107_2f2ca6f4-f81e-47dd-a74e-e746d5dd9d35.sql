CREATE POLICY "Administrators manage member documents" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'member-documents' AND private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'member-documents' AND private.has_role(auth.uid(), 'admin'::app_role));