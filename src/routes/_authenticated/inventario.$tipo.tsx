import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit3, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
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
import { getInventario, INVENTARIOS, type EstadoMaterial, type TipoInventario } from "@/lib/catep";
import { usePerfil, useSessionUser } from "@/hooks/use-catep-session";

export const Route = createFileRoute("/_authenticated/inventario/$tipo")({
  head: () => ({
    meta: [
      { title: "Inventario CATEP | Gestión de materiales" },
      {
        name: "description",
        content: "Inventario digital de máquinas, mesas de trabajo, almacén y papelería CATEP.",
      },
      { property: "og:title", content: "Inventario CATEP | Gestión de materiales" },
      {
        property: "og:description",
        content: "CRUD de materiales y herramientas con permisos por rol para CATEP Turmero.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventarioPage,
});

const materialSchema = z.object({
  nombre: z.string().trim().min(2, "Indica el nombre").max(120),
  familia: z.string().trim().min(2, "Selecciona una familia").max(80),
  cantidad: z.coerce.number().int().min(0).max(99999),
  unidad: z.string().trim().min(1).max(30),
  ubicacion: z.string().trim().max(120).optional(),
  estado: z.enum(["disponible", "observacion", "agotado"]),
  descripcion: z.string().trim().max(500).optional(),
});

function InventarioPage() {
  const { tipo } = useParams({ from: "/_authenticated/inventario/$tipo" });
  const { user } = useSessionUser();
  const { data: perfil } = usePerfil(user?.id);
  const queryClient = useQueryClient();
  const inventario = getInventario(tipo);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    familia: inventario?.familias[0] ?? "",
    cantidad: 1,
    unidad: "und",
    ubicacion: "",
    estado: "disponible" as EstadoMaterial,
    descripcion: "",
  });

  const permitido = inventario
    ? inventario.tipo === "papeleria"
      ? !!perfil?.esCoordinador
      : inventario.tipo === "almacen"
        ? !!perfil?.esCoordinador || !!perfil?.esAlmacenista
        : true
    : false;
  const puedeEditar = inventario?.tipo === "papeleria" ? !!perfil?.esCoordinador : permitido;

  const { data: materiales = [], isLoading } = useQuery({
    queryKey: ["materiales", tipo],
    enabled: !!inventario && permitido,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiales_inventario")
        .select("id, nombre, familia, cantidad, unidad, ubicacion, estado, descripcion, activo, updated_at")
        .eq("tipo", tipo as TipoInventario)
        .eq("activo", true)
        .order("familia")
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!inventario) {
    return (
      <div className="card-elevated p-6 text-center">
        <p className="text-sm text-muted-foreground">Inventario no encontrado.</p>
        <Button asChild className="mt-4">
          <Link to="/panel">Volver</Link>
        </Button>
      </div>
    );
  }

  if (!permitido) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/panel"><ArrowLeft className="size-4" /> Panel</Link>
        </Button>
        <div className="card-elevated p-6 text-center">
          <h1 className="text-lg font-bold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este módulo requiere el rol asignado por coordinación.
          </p>
        </div>
      </div>
    );
  }

  function limpiar() {
    setEditando(null);
    setForm({
      nombre: "",
      familia: inventario?.familias[0] ?? "",
      cantidad: 1,
      unidad: "und",
      ubicacion: "",
      estado: "disponible",
      descripcion: "",
    });
  }

  async function guardar() {
    if (!user || !inventario || !puedeEditar) return;
    const parsed = materialSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const payload = {
      ...parsed.data,
      tipo: inventario.tipo,
      ubicacion: parsed.data.ubicacion || null,
      descripcion: parsed.data.descripcion || null,
      created_by: user.id,
    };
    const { error } = editando
      ? await supabase.from("materiales_inventario").update(payload).eq("id", editando)
      : await supabase.from("materiales_inventario").insert(payload);
    if (error) return toast.error("No se pudo guardar el producto");
    toast.success(editando ? "Producto actualizado" : "Producto agregado");
    limpiar();
    queryClient.invalidateQueries({ queryKey: ["materiales", tipo] });
  }

  async function eliminar(id: string) {
    if (!puedeEditar) return;
    const { error } = await supabase.from("materiales_inventario").update({ activo: false }).eq("id", id);
    if (error) return toast.error("No se pudo eliminar");
    toast.success("Producto eliminado");
    queryClient.invalidateQueries({ queryKey: ["materiales", tipo] });
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link to="/panel"><ArrowLeft className="size-4" /> Panel</Link>
      </Button>

      <header className="card-elevated flex items-start gap-3 p-4">
        <span className="surface-brand flex size-11 items-center justify-center rounded-lg">
          <inventario.icon className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-lg font-bold">{inventario.titulo}</h1>
          <p className="text-xs text-muted-foreground">{inventario.descripcion}</p>
        </div>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {INVENTARIOS.filter((inv) => {
          if (inv.tipo === "papeleria") return perfil?.esCoordinador;
          if (inv.tipo === "almacen") return perfil?.esCoordinador || perfil?.esAlmacenista;
          return true;
        }).map((inv) => (
          <Button key={inv.tipo} asChild variant={inv.tipo === tipo ? "default" : "outline"} size="sm">
            <Link to="/inventario/$tipo" params={{ tipo: inv.tipo }}>{inv.titulo}</Link>
          </Button>
        ))}
      </div>

      {puedeEditar && (
        <section className="card-elevated space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.nombre} maxLength={120} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Familia</Label>
              <Select value={form.familia} onValueChange={(familia) => setForm({ ...form, familia })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {inventario.familias.map((familia) => <SelectItem key={familia} value={familia}>{familia}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input type="number" min={0} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Unidad</Label>
              <Input value={form.unidad} maxLength={30} onChange={(e) => setForm({ ...form, unidad: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input value={form.ubicacion} maxLength={120} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(estado: EstadoMaterial) => setForm({ ...form, estado })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="observacion">Observación</SelectItem>
                  <SelectItem value="agotado">Agotado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Detalle</Label>
            <Textarea rows={2} maxLength={500} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={guardar}><Save className="size-4" /> {editando ? "Actualizar" : "Agregar"}</Button>
            {editando && <Button variant="outline" onClick={limpiar}>Cancelar</Button>}
          </div>
        </section>
      )}

      <section className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!isLoading && materiales.length === 0 && (
          <p className="card-elevated p-4 text-sm text-muted-foreground">No hay productos registrados.</p>
        )}
        {materiales.map((m) => (
          <article key={m.id} className="card-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">{m.nombre}</h2>
                <p className="text-xs text-muted-foreground">{m.familia} · {m.ubicacion ?? "Sin ubicación"}</p>
              </div>
              <Badge variant={m.estado === "disponible" ? "secondary" : "default"}>{m.estado}</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold">{m.cantidad} {m.unidad}</p>
            {m.descripcion && <p className="mt-1 text-xs text-muted-foreground">{m.descripcion}</p>}
            {puedeEditar && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditando(m.id);
                    setForm({
                      nombre: m.nombre,
                      familia: m.familia,
                      cantidad: m.cantidad,
                      unidad: m.unidad,
                      ubicacion: m.ubicacion ?? "",
                      estado: m.estado as EstadoMaterial,
                      descripcion: m.descripcion ?? "",
                    });
                  }}
                >
                  <Edit3 className="size-4" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => eliminar(m.id)}>
                  <Trash2 className="size-4" /> Eliminar
                </Button>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}