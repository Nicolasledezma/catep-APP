-- Roles
CREATE TYPE public.app_role AS ENUM ('coordinador', 'aprendiz');
CREATE TYPE public.categoria_inspeccion AS ENUM ('almacen', 'papeleria', 'limpieza', 'equipos');
CREATE TYPE public.condicion_item AS ENUM ('operativo', 'observacion', 'averiado', 'faltante');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Ver propio perfil" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'coordinador'));
CREATE POLICY "Actualizar propio perfil" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Insertar propio perfil" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Ver propios roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'coordinador'));

-- Espacios
CREATE TABLE public.espacios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'aula',
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.espacios TO authenticated;
GRANT ALL ON public.espacios TO service_role;
ALTER TABLE public.espacios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos ven espacios" ON public.espacios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinador gestiona espacios" ON public.espacios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coordinador'))
  WITH CHECK (public.has_role(auth.uid(), 'coordinador'));

INSERT INTO public.espacios (nombre, tipo, descripcion) VALUES
  ('Aula 1', 'aula', 'Aula teórica planta baja'),
  ('Aula 2', 'aula', 'Aula teórica planta baja'),
  ('Aula 3', 'aula', 'Aula teórica planta alta'),
  ('Laboratorio de Informática', 'aula', 'Equipos de computación'),
  ('Almacén General', 'almacen', 'Activos y herramientas de aprendices'),
  ('Coordinación', 'oficina', 'Materiales de papelería'),
  ('Comedor', 'area_comun', 'Área común de alimentación'),
  ('Baños Generales', 'area_comun', 'Sanitarios del centro');

-- Inspecciones
CREATE TABLE public.inspecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria public.categoria_inspeccion NOT NULL,
  espacio_id UUID REFERENCES public.espacios(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  observaciones TEXT,
  eventualidad BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspecciones TO authenticated;
GRANT ALL ON public.inspecciones TO service_role;
ALTER TABLE public.inspecciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver inspecciones propias o coordinador" ON public.inspecciones FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'coordinador'));
CREATE POLICY "Crear inspeccion propia" ON public.inspecciones FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Editar inspeccion propia" ON public.inspecciones FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.inspeccion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspeccion_id UUID NOT NULL REFERENCES public.inspecciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  condicion public.condicion_item NOT NULL DEFAULT 'operativo',
  cantidad INTEGER NOT NULL DEFAULT 1,
  nota TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspeccion_items TO authenticated;
GRANT ALL ON public.inspeccion_items TO service_role;
ALTER TABLE public.inspeccion_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver items de inspecciones visibles" ON public.inspeccion_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inspecciones i WHERE i.id = inspeccion_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'coordinador'))));
CREATE POLICY "Crear items en inspeccion propia" ON public.inspeccion_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.inspecciones i WHERE i.id = inspeccion_id AND i.user_id = auth.uid()));

-- Notificaciones
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inspeccion_id UUID REFERENCES public.inspecciones(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificaciones TO authenticated;
GRANT ALL ON public.notificaciones TO service_role;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver notificaciones propias" ON public.notificaciones FOR SELECT TO authenticated
  USING (auth.uid() = destinatario_id);
CREATE POLICY "Marcar notificaciones propias" ON public.notificaciones FOR UPDATE TO authenticated
  USING (auth.uid() = destinatario_id) WITH CHECK (auth.uid() = destinatario_id);

-- Trigger: notificar a coordinadores ante eventualidad
CREATE OR REPLACE FUNCTION public.notificar_eventualidad()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  nombre_espacio TEXT;
BEGIN
  IF NEW.eventualidad THEN
    SELECT nombre INTO nombre_espacio FROM public.espacios WHERE id = NEW.espacio_id;
    INSERT INTO public.notificaciones (destinatario_id, inspeccion_id, titulo, mensaje)
    SELECT ur.user_id, NEW.id,
      'Eventualidad en ' || COALESCE(nombre_espacio, 'espacio sin asignar'),
      'Se reportó una eventualidad en la inspección de ' || NEW.categoria::text ||
        COALESCE('. Observaciones: ' || NEW.observaciones, '')
    FROM public.user_roles ur WHERE ur.role = 'coordinador';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notificar_eventualidad
AFTER INSERT ON public.inspecciones
FOR EACH ROW EXECUTE FUNCTION public.notificar_eventualidad();

-- Trigger: perfil + rol por defecto al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN NEW.raw_user_meta_data->>'role' = 'coordinador'
    THEN 'coordinador'::public.app_role ELSE 'aprendiz'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();