
CREATE POLICY "Ops manage driver docs"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'driver-docs' AND public.has_role(auth.uid(), 'ops'))
WITH CHECK (bucket_id = 'driver-docs' AND public.has_role(auth.uid(), 'ops'));

CREATE POLICY "Driver reads own docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
