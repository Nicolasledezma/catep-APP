DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_inventario' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.tipo_inventario AS ENUM ('maquinas_herramientas', 'mesas_trabajo', 'almacen', 'papeleria');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_material' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.estado_material AS ENUM ('disponible', 'observacion', 'agotado');
  END IF;
END $$;

CREATE TABLE public.materiales_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_inventario NOT NULL,
  familia text NOT NULL DEFAULT 'General',
  nombre text NOT NULL,
  descripcion text,
  cantidad numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL DEFAULT 'unidad',
  ubicacion text,
  estado public.estado_material NOT NULL DEFAULT 'disponible',
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT materiales_inventario_nombre_len CHECK (char_length(trim(nombre)) BETWEEN 2 AND 120),
  CONSTRAINT materiales_inventario_familia_len CHECK (char_length(trim(familia)) BETWEEN 2 AND 80),
  CONSTRAINT materiales_inventario_unidad_len CHECK (char_length(trim(unidad)) BETWEEN 1 AND 30),
  CONSTRAINT materiales_inventario_cantidad_nonnegative CHECK (cantidad >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiales_inventario TO authenticated;
GRANT ALL ON public.materiales_inventario TO service_role;

ALTER TABLE public.materiales_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventario visible segun rol"
ON public.materiales_inventario
FOR SELECT
TO authenticated
USING (
  (tipo IN ('maquinas_herramientas', 'mesas_trabajo') AND activo = true)
  OR public.has_role(auth.uid(), 'coordinador'::public.app_role)
  OR (tipo = 'almacen' AND public.has_role(auth.uid(), 'almacenista'::public.app_role))
);

CREATE POLICY "Coordinador gestiona inventario"
ON public.materiales_inventario
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'coordinador'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'coordinador'::public.app_role));

CREATE POLICY "Almacenista gestiona almacen"
ON public.materiales_inventario
FOR ALL
TO authenticated
USING (tipo = 'almacen' AND public.has_role(auth.uid(), 'almacenista'::public.app_role))
WITH CHECK (tipo = 'almacen' AND public.has_role(auth.uid(), 'almacenista'::public.app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_materiales_inventario_updated_at
BEFORE UPDATE ON public.materiales_inventario
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Ver propios roles" ON public.user_roles;
DROP POLICY IF EXISTS "Ver roles propios o coordinador" ON public.user_roles;
CREATE POLICY "Ver roles propios o coordinador"
ON public.user_roles
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'coordinador'::public.app_role));

CREATE POLICY "Coordinador asigna roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'coordinador'::public.app_role));

CREATE POLICY "Coordinador elimina roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'coordinador'::public.app_role));

CREATE POLICY "Coordinador actualiza perfiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'coordinador'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'coordinador'::public.app_role));

CREATE POLICY "Coordinador elimina perfiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'coordinador'::public.app_role));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'aprendiz'::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;