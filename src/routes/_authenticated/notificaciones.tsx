import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatoFecha } from "@/lib/catep";
import { usePerfil, useSessionUser } from "@/hooks/use-catep-session";

export const Route = createFileRoute("/_authenticated/notificaciones")({
  component: Notificaciones,
});

function Notificaciones() {
  const queryClient = useQueryClient();
  const { user } = useSessionUser();
  const { data: perfil } = usePerfil(user?.id);

  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ["notificaciones", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notificaciones")
        .select("id, titulo, mensaje, leida, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const marcar = useMutation({
    mutationFn: async (id?: string) => {
      const q = supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
      const { error } = id ? await q.eq("id", id) : await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      queryClient.invalidateQueries({ queryKey: ["notificaciones-no-leidas"] });
    },
  });

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            Alertas en tiempo real ante eventualidades reportadas.
          </p>
        </div>
        {notificaciones.some((n) => !n.leida) && (
          <Button variant="secondary" size="sm" onClick={() => marcar.mutate(undefined)}>
            <CheckCheck className="size-4" /> Leídas
          </Button>
        )}
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!isLoading && notificaciones.length === 0 && (
        <div className="card-elevated flex flex-col items-center gap-2 p-8 text-center">
          <BellOff className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {perfil?.esCoordinador
              ? "No hay eventualidades reportadas."
              : "Las alertas de eventualidad se envían al coordinador del centro."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {notificaciones.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.leida && marcar.mutate(n.id)}
            className={`card-elevated block w-full p-4 text-left ${n.leida ? "opacity-70" : "border-l-4 border-l-accent"}`}
          >
            <span className="block text-sm font-bold">{n.titulo}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{n.mensaje}</span>
            <span className="mt-1.5 block text-[11px] text-muted-foreground">
              {formatoFecha(n.created_at)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
