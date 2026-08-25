ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE POLICY "Avatares visibles" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Subir avatar propio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Actualizar avatar propio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Eliminar avatar propio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);