import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, ClipboardList, Clock, PackageSearch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS, INVENTARIOS, SEDE_CATEP, formatoFecha } from "@/lib/catep";
import { usePerfil, useSessionUser } from "@/hooks/use-catep-session";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Panel CATEP | Gestión de inspecciones" },
      {
        name: "description",
        content: "Panel móvil para inspecciones, inventario, reportes y alertas del CATEP Turmero.",
      },
      { property: "og:title", content: "Panel CATEP | Gestión de inspecciones" },
      {
        property: "og:description",
        content: "Control diario de espacios, equipos, inventario y reportes semanales CATEP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Panel,
});

function Panel() {
  const { user } = useSessionUser();
  const { data: perfil } = usePerfil(user?.id);

  const { data: resumen } = useQuery({
    queryKey: ["resumen", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const [{ count: total }, { count: hoyCount }, { count: alertas }, { data: recientes }] =
        await Promise.all([
          supabase.from("inspecciones").select("id", { count: "exact", head: true }),
          supabase
            .from("inspecciones")
            .select("id", { count: "exact", head: true })
            .gte("created_at", hoy.toISOString()),
          supabase
            .from("inspecciones")
            .select("id", { count: "exact", head: true })
            .eq("eventualidad", true),
          supabase
            .from("inspecciones")
            .select("id, categoria, created_at, eventualidad, espacios(nombre)")
            .order("created_at", { ascending: false })
            .limit(4),
        ]);

      return {
        total: total ?? 0,
        hoy: hoyCount ?? 0,
        alertas: alertas ?? 0,
        recientes: recientes ?? [],
      };
    },
  });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Bienvenido,</p>
        <h1 className="text-2xl font-bold">{perfil?.nombre ?? "…"}</h1>
        <p className="text-sm text-muted-foreground">
          Rol: <span className="font-semibold text-foreground">{perfil?.rol ?? "—"}</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-primary">{SEDE_CATEP}</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Metrica icono={Clock} valor={resumen?.hoy ?? 0} etiqueta="Hoy" />
        <Metrica icono={ClipboardList} valor={resumen?.total ?? 0} etiqueta="Inspecciones" />
        <Metrica
          icono={AlertTriangle}
          valor={resumen?.alertas ?? 0}
          etiqueta="Eventualidades"
          destacar
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Nueva inspección
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIAS.map((cat) => (
            <Link
              key={cat.slug}
              to="/inspeccion/$categoria"
              params={{ categoria: cat.slug }}
              className="card-elevated group flex items-start gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-raised)]"
            >
              <span className="surface-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
                <cat.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold">{cat.titulo}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {cat.descripcion}
                </span>
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Inventario
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {INVENTARIOS.filter((inv) => {
            if (inv.tipo === "papeleria") return perfil?.esCoordinador;
            if (inv.tipo === "almacen") return perfil?.esCoordinador || perfil?.esAlmacenista;
            return true;
          }).map((inv) => (
            <Link
              key={inv.tipo}
              to="/inventario/$tipo"
              params={{ tipo: inv.tipo }}
              className="card-elevated group flex items-start gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-raised)]"
            >
              <span className="surface-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
                <inv.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold">{inv.titulo}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{inv.descripcion}</span>
              </span>
              <PackageSearch className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Actividad reciente
          </h2>
          <Link to="/historial" className="text-xs font-semibold text-primary">
            Ver todo
          </Link>
        </div>
        <div className="space-y-2">
          {(resumen?.recientes ?? []).length === 0 && (
            <p className="card-elevated p-4 text-sm text-muted-foreground">
              Aún no hay inspecciones registradas.
            </p>
          )}
          {(resumen?.recientes ?? []).map((r) => (
            <div key={r.id} className="card-elevated flex items-center gap-3 p-3">
              <span
                  className={`size-2.5 shrink-0 rounded-full ${r.eventualidad ? "bg-primary" : "bg-success"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold capitalize">
                  {r.categoria} · {r.espacios?.nombre ?? "Sin espacio"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatoFecha(r.created_at)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metrica({
  icono: Icono,
  valor,
  etiqueta,
  destacar,
}: {
  icono: typeof Clock;
  valor: number;
  etiqueta: string;
  destacar?: boolean;
}) {
  return (
    <div className="card-elevated flex flex-col gap-1 p-3">
      <Icono className={`size-4 ${destacar ? "text-primary" : "text-primary"}`} />
      <span className="font-display text-2xl font-bold">{valor}</span>
      <span className="text-[11px] text-muted-foreground">{etiqueta}</span>
    </div>
  );
}
