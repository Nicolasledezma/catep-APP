import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CATEGORIAS,
  CONDICION_LABEL,
  SEDE_CATEP,
  condicionClase,
  formatoFecha,
  type Condicion,
} from "@/lib/catep";

export const Route = createFileRoute("/_authenticated/historial")({
  head: () => ({
    meta: [
      { title: "Historial y reportes | Gestión CATEP" },
      {
        name: "description",
        content: "Visualiza inspecciones CATEP y descarga reportes semanales de actividades.",
      },
      { property: "og:title", content: "Historial y reportes | Gestión CATEP" },
      {
        property: "og:description",
        content: "Trazabilidad y descarga semanal de actividades realizadas por aprendices CATEP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Historial,
});

function Historial() {
  const [filtro, setFiltro] = useState<string>("todas");
  const [abierta, setAbierta] = useState<string | null>(null);

  const encabezado = [
    "Fecha",
    "Aprendiz",
    "Categoría",
    "Espacio",
    "Ítem",
    "Condición",
    "Cantidad",
    "Nota",
    "Observaciones",
  ];

  function filasSemana() {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 7);
    return inspecciones
      .filter((i) => new Date(i.created_at) >= inicio)
      .flatMap((i) =>
        i.inspeccion_items.map((item) => ({
          fecha: formatoFecha(i.created_at),
          aprendiz: i.autor,
          categoria: i.categoria,
          espacio: i.espacios?.nombre ?? "Sin espacio",
          item: item.nombre,
          condicion: CONDICION_LABEL[item.condicion as Condicion],
          cantidad: String(item.cantidad),
          nota: item.nota ?? "",
          observaciones: i.observaciones ?? "",
        })),
      );
  }

  async function descargarPDF() {
    const filas = filasSemana();
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Reporte semanal de actividades · Gestión CATEP", 40, 40);
    doc.setFontSize(9);
    doc.text(SEDE_CATEP, 40, 56);
    doc.text(`Generado: ${formatoFecha(new Date().toISOString())}`, 40, 70);
    autoTable(doc, {
      head: [encabezado],
      body: filas.map((f) => Object.values(f)),
      startY: 84,
      styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [11, 61, 145], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 245, 250] },
    });
    doc.save("reporte-semanal-catep.pdf");
  }

  function descargarReporte() {
    const filas = filasSemana();
    const csv = [
      encabezado.join(","),
      ...filas.map((fila) =>
        Object.values(fila)
          .map((valor) => `"${valor.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-semanal-catep.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const { data: inspecciones = [], isLoading } = useQuery({
    queryKey: ["historial", filtro],
    queryFn: async () => {
      let q = supabase
        .from("inspecciones")
        .select(
          "id, categoria, created_at, eventualidad, observaciones, user_id, espacios(nombre), inspeccion_items(id, nombre, condicion, cantidad, nota)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (filtro !== "todas") q = q.eq("categoria", filtro as never);
      const { data } = await q;
      const filas = data ?? [];
      const ids = [...new Set(filas.map((f) => f.user_id))];
      const { data: perfiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
        : { data: [] };
      const mapa = new Map((perfiles ?? []).map((p) => [p.id, p.full_name || p.email]));
      return filas.map((f) => ({ ...f, autor: mapa.get(f.user_id) || "Usuario" }));
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Historial</h1>
        <p className="text-sm text-muted-foreground">
          Trazabilidad de todas las inspecciones realizadas.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={descargarPDF} disabled={inspecciones.length === 0}>
            <FileText className="size-4" /> Reporte semanal PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={descargarReporte}
            disabled={inspecciones.length === 0}
          >
            <Download className="size-4" /> Descargar CSV
          </Button>
        </div>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ slug: "todas", titulo: "Todas" }, ...CATEGORIAS].map((c) => (
          <button
            key={c.slug}
            onClick={() => setFiltro(c.slug)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtro === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {c.titulo}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!isLoading && inspecciones.length === 0 && (
        <p className="card-elevated p-4 text-sm text-muted-foreground">
          No hay inspecciones para este filtro.
        </p>
      )}

      <div className="space-y-2">
        {inspecciones.map((i) => {
          const expandida = abierta === i.id;
          return (
            <article key={i.id} className="card-elevated overflow-hidden">
              <button
                onClick={() => setAbierta(expandida ? null : i.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  className={`size-2.5 shrink-0 rounded-full ${i.eventualidad ? "bg-primary" : "bg-success"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold capitalize">
                    {i.categoria} · {i.espacios?.nombre ?? "Sin espacio"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatoFecha(i.created_at)} · {i.autor}
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${expandida ? "rotate-180" : ""}`}
                />
              </button>

              {expandida && (
                <div className="space-y-2 border-t border-border bg-muted/40 p-4">
                  {i.inspeccion_items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{item.nombre}</span>
                        {item.nota && (
                          <span className="block text-xs text-muted-foreground">{item.nota}</span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${condicionClase(item.condicion as Condicion)}`}
                      >
                        {CONDICION_LABEL[item.condicion as Condicion]}
                      </span>
                    </div>
                  ))}
                  {i.observaciones && (
                    <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Observaciones: </span>
                      {i.observaciones}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
