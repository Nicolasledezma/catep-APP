CREATE POLICY "Usuario crea su rol aprendiz"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'aprendiz'::public.app_role);