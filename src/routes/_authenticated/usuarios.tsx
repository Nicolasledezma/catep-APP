import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserCog } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteManagedUser, updateUserRoles } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePerfil, useSessionUser } from "@/hooks/use-catep-session";
import type { AppRole } from "@/lib/catep";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios y roles | Gestión CATEP" },
      {
        name: "description",
        content: "Administración de usuarios CATEP, roles de aprendiz, almacenista y coordinador.",
      },
      { property: "og:title", content: "Usuarios y roles | Gestión CATEP" },
      {
        property: "og:description",
        content: "Coordinación puede asignar roles y retirar usuarios del sistema CATEP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsuariosPage,
});

const ROLES: { value: AppRole; label: string }[] = [
  { value: "aprendiz", label: "Aprendiz" },
  { value: "almacenista", label: "Almacenista" },
  { value: "coordinador", label: "Coordinador" },
];

function UsuariosPage() {
  const { user } = useSessionUser();
  const { data: perfil } = usePerfil(user?.id);
  const queryClient = useQueryClient();
  const updateRoles = useServerFn(updateUserRoles);
  const deleteUser = useServerFn(deleteManagedUser);
  const [seleccion, setSeleccion] = useState<Record<string, AppRole[]>>({});

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios-admin"],
    enabled: !!perfil?.esCoordinador,
    queryFn: async () => {
      const [{ data: perfiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const mapaRoles = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r) => {
        const lista = mapaRoles.get(r.user_id) ?? [];
        lista.push(r.role as AppRole);
        mapaRoles.set(r.user_id, lista);
      });
      return (perfiles ?? []).map((p) => ({ ...p, roles: mapaRoles.get(p.id) ?? ["aprendiz" as AppRole] }));
    },
  });

  if (!perfil?.esCoordinador) {
    return (
      <div className="card-elevated p-6 text-center">
        <h1 className="text-lg font-bold">Acceso restringido</h1>
        <p className="mt-2 text-sm text-muted-foreground">Solo coordinación puede gestionar usuarios.</p>
      </div>
    );
  }

  function rolesActuales(id: string, originales: AppRole[]) {
    return seleccion[id] ?? originales;
  }

  async function guardarRoles(id: string, rolesOriginales: AppRole[]) {
    const roles = rolesActuales(id, rolesOriginales);
    try {
      await updateRoles({ data: { userId: id, roles } });
      toast.success("Roles actualizados");
      queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] });
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    } catch {
      toast.error("No se pudieron actualizar los roles");
    }
  }

  async function eliminarUsuario(id: string) {
    try {
      await deleteUser({ data: { userId: id } });
      toast.success("Usuario eliminado");
      queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] });
    } catch {
      toast.error("No se pudo eliminar el usuario");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Asigna almacenista o coordinador. Todo registro nuevo inicia como aprendiz.</p>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      <section className="space-y-3">
        {usuarios.map((u) => {
          const roles = rolesActuales(u.id, u.roles);
          return (
            <article key={u.id} className="card-elevated space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{u.full_name || u.email}</h2>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant="secondary">{roles.join(" · ")}</Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLES.map((rol) => (
                  <label key={rol.value} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <Checkbox
                      checked={roles.includes(rol.value)}
                      disabled={rol.value === "aprendiz"}
                      onCheckedChange={(checked) => {
                        const base = roles.filter((r) => r !== rol.value);
                        setSeleccion({ ...seleccion, [u.id]: checked ? [...base, rol.value] : base });
                      }}
                    />
                    {rol.label}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => guardarRoles(u.id, u.roles)}>
                  <UserCog className="size-4" /> Guardar rol
                </Button>
                <Button size="sm" variant="outline" disabled={u.id === user?.id} onClick={() => eliminarUsuario(u.id)}>
                  <Trash2 className="size-4" /> Eliminar
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}