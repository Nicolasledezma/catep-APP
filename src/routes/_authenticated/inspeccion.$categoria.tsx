import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONDICIONES,
  condicionClase,
  esCondicionCritica,
  getCategoria,
  itemsPorEspacio,
  type Condicion,
  type Categoria,
} from "@/lib/catep";
import { useSessionUser } from "@/hooks/use-catep-session";

export const Route = createFileRoute("/_authenticated/inspeccion/$categoria")({
  head: () => ({
    meta: [
      { title: "Nueva inspección | Gestión CATEP" },
      {
        name: "description",
        content: "Registro móvil de control diario de aulas, laboratorio, almacén y equipos CATEP.",
      },
      { property: "og:title", content: "Nueva inspección | Gestión CATEP" },
      {
        property: "og:description",
        content: "Formulario de auditoría diaria para espacios y equipos del CATEP Turmero.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NuevaInspeccion,
});

interface ItemForm {
  key: string;
  nombre: string;
  condicion: Condicion;
  cantidad: number;
  nota: string;
}

function NuevaInspeccion() {
  const { categoria } = useParams({ from: "/_authenticated/inspeccion/$categoria" });
  const navigate = useNavigate();
  const { user } = useSessionUser();
  const def = getCategoria(categoria);

  const [espacioId, setEspacioId] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [items, setItems] = useState<ItemForm[]>(
    () =>
      def?.items.map((nombre, i) => ({
        key: `base-${i}`,
        nombre,
        condicion: "operativo" as Condicion,
        cantidad: 1,
        nota: "",
      })) ?? [],
  );

  const { data: espacios = [] } = useQuery({
    queryKey: ["espacios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("espacios")
        .select("id, nombre, tipo")
        .eq("activo", true)
        .order("nombre");
      return data ?? [];
    },
  });

  const espacioSeleccionado = espacios.find((e) => e.id === espacioId);

  const hayEventualidad = useMemo(
    () => items.some((i) => esCondicionCritica(i.condicion)),
    [items],
  );

  if (!def) {
    return (
      <div className="card-elevated p-6 text-center">
        <p className="text-sm text-muted-foreground">Categoría de inspección no encontrada.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/panel" })}>
          Volver al panel
        </Button>
      </div>
    );
  }

  const categoriaDef = def;

  function actualizar(key: string, cambios: Partial<ItemForm>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...cambios } : i)));
  }

  function cambiarEspacio(valor: string) {
    setEspacioId(valor);
    const espacio = espacios.find((e) => e.id === valor);
    const nuevos = itemsPorEspacio(categoriaDef.slug as Categoria, espacio?.nombre);
    if (nuevos.length > 0) {
      setItems(
        nuevos.map((nombre, i) => ({
          key: `${valor}-${i}`,
          nombre,
          condicion: "operativo" as Condicion,
          cantidad: categoriaDef.usaCantidad ? 1 : 1,
          nota: "",
        })),
      );
    }
  }

  async function guardar() {
    if (!user) return;
    if (!espacioId) return toast.error("Selecciona el espacio inspeccionado");
    const limpios = items.filter((i) => i.nombre.trim().length > 0);
    if (limpios.length === 0) return toast.error("Agrega al menos un ítem a revisar");
    if (observaciones.length > 1000) return toast.error("Observaciones demasiado largas");

    setGuardando(true);
    const { data: inspeccion, error } = await supabase
      .from("inspecciones")
      .insert({
        categoria: categoriaDef.slug,
        espacio_id: espacioId,
        user_id: user.id,
        observaciones: observaciones.trim() || null,
        eventualidad: hayEventualidad,
      })
      .select("id")
      .single();

    if (error || !inspeccion) {
      setGuardando(false);
      return toast.error("No se pudo registrar la inspección");
    }

    const { error: itemsError } = await supabase.from("inspeccion_items").insert(
      limpios.map((i) => ({
        inspeccion_id: inspeccion.id,
        nombre: i.nombre.trim().slice(0, 120),
        condicion: i.condicion,
        cantidad: categoriaDef.usaCantidad ? Math.max(0, Math.min(9999, i.cantidad)) : 1,
        nota: i.nota.trim().slice(0, 300) || null,
      })),
    );
    setGuardando(false);

    if (itemsError) return toast.error("La inspección se creó, pero fallaron algunos ítems");

    toast.success(
      hayEventualidad
        ? "Inspección registrada. Se notificó al coordinador."
        : "Inspección registrada correctamente.",
    );
    navigate({ to: "/historial" });
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate({ to: "/panel" })}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Panel
      </button>

      <header className="card-elevated flex items-start gap-3 p-4">
        <span className="surface-brand flex size-11 items-center justify-center rounded-lg">
          <def.icon className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-lg font-bold">{def.titulo}</h1>
          <p className="text-xs text-muted-foreground">{def.descripcion}</p>
        </div>
      </header>

      <section className="card-elevated space-y-4 p-4">
        <div className="space-y-1.5">
          <Label>Espacio inspeccionado</Label>
          <Select value={espacioId} onValueChange={cambiarEspacio}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un espacio" />
            </SelectTrigger>
            <SelectContent>
              {espacios.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {espacioSeleccionado && (
          <p className="text-xs font-semibold text-primary">{espacioSeleccionado.nombre}</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
            {def.etiquetaItem}s revisados
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  key: `extra-${Date.now()}`,
                  nombre: "",
                  condicion: "operativo",
                  cantidad: 1,
                  nota: "",
                },
              ])
            }
          >
            <Plus className="size-4" /> Agregar
          </Button>
        </div>

        {items.map((item) => (
          <article key={item.key} className="card-elevated space-y-3 p-3">
            <div className="flex items-center gap-2">
              <Input
                value={item.nombre}
                maxLength={120}
                placeholder={`Nombre del ${def.etiquetaItem.toLowerCase()}`}
                onChange={(e) => actualizar(item.key, { nombre: e.target.value })}
              />
              <button
                aria-label="Eliminar ítem"
                onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {CONDICIONES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => actualizar(item.key, { condicion: c.value })}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    item.condicion === c.value
                      ? condicionClase(c.value)
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {def.usaCantidad && (
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  className="w-24"
                  value={item.cantidad}
                  onChange={(e) =>
                    actualizar(item.key, { cantidad: Number(e.target.value) || 0 })
                  }
                />
              )}
              <Input
                value={item.nota}
                maxLength={300}
                placeholder="Lápiz: escribe qué hay, qué falta o qué hay en gavetas"
                onChange={(e) => actualizar(item.key, { nota: e.target.value })}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="card-elevated space-y-2 p-4">
        <Label htmlFor="obs">Observaciones generales</Label>
        <Textarea
          id="obs"
          rows={3}
          maxLength={1000}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Detalla cualquier eventualidad detectada…"
        />
        {hayEventualidad && (
          <p className="text-xs font-semibold text-destructive">
            Se detectaron eventualidades: al guardar se notificará al coordinador.
          </p>
        )}
      </section>

      <Button className="w-full" size="lg" disabled={guardando} onClick={guardar}>
        {guardando ? "Registrando…" : "Registrar inspección"}
      </Button>
    </div>
  );
}
