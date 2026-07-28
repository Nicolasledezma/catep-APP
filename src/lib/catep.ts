import type { LucideIcon } from "lucide-react";
import { Boxes, Brush, Hammer, Monitor, NotebookPen, TableProperties, Wrench } from "lucide-react";

export type Categoria =
  | "almacen"
  | "papeleria"
  | "limpieza"
  | "equipos"
  | "mesas_trabajo"
  | "maquinas_herramientas"
  | "laboratorio";
export type Condicion = "operativo" | "observacion" | "averiado" | "faltante";
export type AppRole = "coordinador" | "aprendiz" | "almacenista";
export type TipoInventario = "maquinas_herramientas" | "mesas_trabajo" | "almacen" | "papeleria";
export type EstadoMaterial = "disponible" | "observacion" | "agotado";

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
    slug: "limpieza",
    titulo: "Control de aulas",
    descripcion: "Revisión por área de limpieza, mobiliario y equipos.",
    icon: Brush,
    etiquetaItem: "Punto",
    usaCantidad: false,
    items: [
      "Mobiliario (sillas y mesas)",
      "Computadoras (monitor, CPU, mouse, teclado, cables)",
      "Control de TV",
      "Observaciones del espacio",
    ],
  },
  {
    slug: "mesas_trabajo",
    titulo: "Mesas de trabajo",
    descripcion: "Inventario de mesas, gavetas y limpieza superficial.",
    icon: TableProperties,
    etiquetaItem: "Mesa",
    usaCantidad: false,
    items: Array.from({ length: 15 }, (_, i) => `Mesa ${i + 1}`),
  },
  {
    slug: "maquinas_herramientas",
    titulo: "Máquinas y herramientas",
    descripcion: "Revisión de cepillo, torno, fresadora y monotorno.",
    icon: Wrench,
    etiquetaItem: "Equipo",
    usaCantidad: false,
    items: ["Cepillo", "Torno", "Fresadora", "Monotorno"],
  },
  {
    slug: "laboratorio",
    titulo: "Laboratorio",
    descripcion: "Pantalla de control para mobiliario, computadoras y TV.",
    icon: Monitor,
    etiquetaItem: "Punto",
    usaCantidad: false,
    items: [
      "Mobiliario (sillas y mesas)",
      "Computadoras (monitor, CPU, mouse, teclado, cables)",
      "Control de TV",
    ],
  },
  {
    slug: "almacen",
    titulo: "Activos de almacén",
    descripcion: "Materiales eléctricos, neumáticos, EPP y herramientas.",
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
    slug: "equipos",
    titulo: "Computación",
    descripcion: "Control de 18 computadoras, sin control de TV.",
    icon: Hammer,
    etiquetaItem: "Equipo",
    usaCantidad: true,
    items: [
      "18 monitores",
      "18 CPU",
      "18 mouse",
      "18 teclados",
      "Cables de conexión",
    ],
  },
];

export const SEDE_CATEP = "CATEP Gunther Faulhaber - Planta Turmero";

export const INVENTARIOS: {
  tipo: TipoInventario;
  titulo: string;
  descripcion: string;
  icon: LucideIcon;
  familias: string[];
}[] = [
  {
    tipo: "maquinas_herramientas",
    titulo: "Máquinas y herramientas",
    descripcion: "Torno, fresadora, cepillo y equipos del taller.",
    icon: Wrench,
    familias: ["Máquina y herramienta"],
  },
  {
    tipo: "mesas_trabajo",
    titulo: "Mesas de trabajo",
    descripcion: "Herramientas declaradas por mesa y gaveta.",
    icon: TableProperties,
    familias: ["Mesas de trabajo"],
  },
  {
    tipo: "almacen",
    titulo: "Almacén",
    descripcion: "Materiales eléctricos, neumáticos, equipos, consumibles, EPP y herramientas.",
    icon: Boxes,
    familias: [
      "Materiales eléctricos",
      "Materiales neumáticos",
      "Equipos e instrumentos",
      "Consumibles",
      "EPP",
      "Herramientas",
    ],
  },
  {
    tipo: "papeleria",
    titulo: "Papelería",
    descripcion: "Productos de coordinación conectados con la base de datos.",
    icon: NotebookPen,
    familias: ["Papelería"],
  },
];

export function getCategoria(slug: string): CategoriaDef | undefined {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export function getInventario(tipo: string) {
  return INVENTARIOS.find((i) => i.tipo === tipo);
}

export function itemsPorEspacio(categoria: Categoria, espacioNombre?: string) {
  const nombre = (espacioNombre ?? "").toLowerCase();
  if (categoria === "limpieza") {
    if (nombre.includes("biblioteca")) return ["Limpieza general de biblioteca"];
    if (nombre.includes("computación")) {
      return [
        "Mobiliario (sillas y mesas)",
        "18 computadoras (monitor, CPU, mouse, teclado, cables)",
      ];
    }
    if (nombre.includes("mesas de trabajo")) {
      return ["Inventario de mesas", "Limpieza superficial", "Herramientas en gavetas"];
    }
    if (nombre.includes("máquinas") || nombre.includes("maquinas")) {
      return ["Cepillo", "Torno", "Fresadora"];
    }
  }
  return getCategoria(categoria)?.items ?? [];
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
      return "bg-primary/10 text-primary border-primary/30";
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
