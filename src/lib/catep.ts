import type { LucideIcon } from "lucide-react";
import { Boxes, Brush, Monitor, NotebookPen } from "lucide-react";

export type Categoria = "almacen" | "papeleria" | "limpieza" | "equipos";
export type Condicion = "operativo" | "observacion" | "averiado" | "faltante";

export interface CategoriaDef {
  slug: Categoria;
  titulo: string;
  descripcion: string;
  icon: LucideIcon;
  etiquetaItem: string;
  usaCantidad: boolean;
  items: string[];
}

export const CATEGORIAS: CategoriaDef[] = [
  {
    slug: "almacen",
    titulo: "Activos de almacén",
    descripcion: "Control de los activos utilizados por los aprendices.",
    icon: Boxes,
    etiquetaItem: "Activo",
    usaCantidad: true,
    items: [
      "Herramientas manuales",
      "Equipos de medición",
      "Implementos de seguridad",
      "Extensiones eléctricas",
      "Escaleras y andamios",
    ],
  },
  {
    slug: "papeleria",
    titulo: "Activos de papelería",
    descripcion: "Gestión de materiales en coordinación.",
    icon: NotebookPen,
    etiquetaItem: "Material",
    usaCantidad: true,
    items: [
      "Resmas de papel",
      "Marcadores de pizarra",
      "Carpetas y formatos",
      "Bolígrafos",
      "Tóner de impresora",
    ],
  },
  {
    slug: "limpieza",
    titulo: "Control de limpieza",
    descripcion: "Seguimiento de las actividades de limpieza de espacios.",
    icon: Brush,
    etiquetaItem: "Actividad",
    usaCantidad: false,
    items: [
      "Barrido y trapeado de piso",
      "Limpieza de pupitres y mesas",
      "Papeleras vaciadas",
      "Pizarra limpia",
      "Ventanas y ventilación",
    ],
  },
  {
    slug: "equipos",
    titulo: "Inventario y operatividad",
    descripcion: "Estado y funcionamiento de los equipos en las aulas.",
    icon: Monitor,
    etiquetaItem: "Equipo",
    usaCantidad: true,
    items: [
      "Videobeam",
      "Computadora del instructor",
      "Aire acondicionado",
      "Iluminación",
      "Tomacorrientes",
      "Mobiliario",
    ],
  },
];

export function getCategoria(slug: string): CategoriaDef | undefined {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export const CONDICIONES: { value: Condicion; label: string }[] = [
  { value: "operativo", label: "Operativo" },
  { value: "observacion", label: "Con observación" },
  { value: "averiado", label: "Averiado" },
  { value: "faltante", label: "Faltante" },
];

export const CONDICION_LABEL: Record<Condicion, string> = {
  operativo: "Operativo",
  observacion: "Con observación",
  averiado: "Averiado",
  faltante: "Faltante",
};

export function condicionClase(condicion: Condicion) {
  switch (condicion) {
    case "operativo":
      return "bg-success/12 text-success border-success/30";
    case "observacion":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "averiado":
      return "bg-destructive/12 text-destructive border-destructive/30";
    case "faltante":
      return "bg-muted text-muted-foreground border-border";
  }
}

export function esCondicionCritica(condicion: Condicion) {
  return condicion === "averiado" || condicion === "faltante" || condicion === "observacion";
}

export function formatoFecha(iso: string) {
  return new Date(iso).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
