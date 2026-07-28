ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'almacenista';

ALTER TYPE public.categoria_inspeccion ADD VALUE IF NOT EXISTS 'mesas_trabajo';
ALTER TYPE public.categoria_inspeccion ADD VALUE IF NOT EXISTS 'maquinas_herramientas';
ALTER TYPE public.categoria_inspeccion ADD VALUE IF NOT EXISTS 'laboratorio';