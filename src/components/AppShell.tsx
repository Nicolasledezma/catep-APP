import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ClipboardList, LayoutGrid, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePerfil, useSessionUser } from "@/hooks/use-catep-session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/panel", label: "Panel", icon: LayoutGrid },
  { to: "/historial", label: "Historial", icon: ClipboardList },
  { to: "/notificaciones", label: "Alertas", icon: Bell },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSessionUser();
  const { data: perfil } = usePerfil(user?.id);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: noLeidas = 0 } = useQuery({
    queryKey: ["notificaciones-no-leidas", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notificaciones")
        .select("id", { count: "exact", head: true })
        .eq("leida", false);
      return count ?? 0;
    },
  });

  async function cerrarSesion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="surface-brand sticky top-0 z-30 shadow-[var(--shadow-raised)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/panel" className="flex items-center gap-2.5">
            <span className="surface-accent flex size-9 items-center justify-center rounded-lg">
              <ShieldCheck className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold">Gestión CATEP</span>
              <span className="block text-[11px] opacity-80">Turmero · Empresas Polar</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-right text-xs leading-tight opacity-90 sm:block">
              <span className="block font-semibold">{perfil?.nombre}</span>
              <span className="block opacity-75">{perfil?.rol}</span>
            </span>
            <button
              onClick={cerrarSesion}
              aria-label="Cerrar sesión"
              className="rounded-lg p-2 transition-colors hover:bg-sidebar-accent"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          {NAV.map((item) => {
            const activo = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors",
                  activo ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
                {item.to === "/notificaciones" && noLeidas > 0 && (
                  <span className="surface-accent absolute top-1.5 right-[28%] flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                    {noLeidas}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
