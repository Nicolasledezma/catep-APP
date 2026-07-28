import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/catep";

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!activo) return;
      setUser(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data }) => {
      if (!activo) return;
      setUser(data.user ?? null);
      setCargando(false);
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, cargando };
}

export function usePerfil(userId?: string) {
  return useQuery({
    queryKey: ["perfil", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Usuario no disponible");
      const [{ data: perfil }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      const rolesUsuario = (roles ?? []).map((r) => r.role as AppRole);
      const esCoordinador = rolesUsuario.includes("coordinador");
      const esAlmacenista = rolesUsuario.includes("almacenista");
      return {
        nombre: perfil?.full_name || perfil?.email || "Usuario",
        email: perfil?.email ?? "",
        roles: rolesUsuario,
        esCoordinador,
        esAlmacenista,
        rol: esCoordinador ? "Coordinador" : esAlmacenista ? "Almacenista" : "Aprendiz",
      };
    },
  });
}
