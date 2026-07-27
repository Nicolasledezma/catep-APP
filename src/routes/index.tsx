import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Brush, Monitor, NotebookPen, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestión CATEP | Auditoría digital de espacios y equipos" },
      {
        name: "description",
        content:
          "App de auditoría y control diario del Centro de Adiestramiento Técnico Empresas Polar, Turmero: activos, papelería, limpieza y equipos con trazabilidad en tiempo real.",
      },
      { property: "og:title", content: "Gestión CATEP | Auditoría digital de espacios y equipos" },
      {
        property: "og:description",
        content:
          "Digitaliza el control diario de activos, limpieza y operatividad de equipos del CATEP Turmero.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const MODULOS = [
  { icon: Boxes, titulo: "Activos de almacén", texto: "Control de activos usados por aprendices." },
  { icon: NotebookPen, titulo: "Papelería", texto: "Materiales de coordinación bajo seguimiento." },
  { icon: Brush, titulo: "Limpieza", texto: "Actividades de limpieza por espacio." },
  { icon: Monitor, titulo: "Equipos", texto: "Inventario y operatividad en aulas." },
];

function Inicio() {
  return (
    <div className="min-h-screen bg-background">
      <section className="surface-brand px-5 pt-14 pb-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-5 inline-flex items-center justify-center rounded-xl bg-card px-3 py-2">
            <img src={logo} alt="Logo CATEP" className="h-12 w-auto" />
          </span>

          <h1 className="font-display text-3xl leading-tight font-bold sm:text-4xl">
            Gestión CATEP
          </h1>
          <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base">
            Auditoría y control diario de espacios y equipos del Centro de Adiestramiento Técnico
            Empresas Polar — Turmero. Sin papel, con trazabilidad en tiempo real.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-[var(--shadow-raised)]"
            >
              Ingresar al sistema
            </Link>
            <Link
              to="/panel"
              className="rounded-lg border border-sidebar-border px-5 py-2.5 text-sm font-semibold"
            >
              Ir al panel
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-3xl px-4 pb-16">
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULOS.map((m) => (
            <article key={m.titulo} className="card-elevated flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <m.icon className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-sm font-bold">{m.titulo}</h2>
                <p className="text-xs text-muted-foreground">{m.texto}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="card-elevated mt-6 p-5">
          <h2 className="font-display text-base font-bold">Trazabilidad y alertas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada inspección queda registrada con su autor, espacio, ítems revisados y condición.
            Cuando se detecta una eventualidad, el coordinador recibe una alerta inmediata.
          </p>
        </div>
      </section>
    </div>
  );
}
