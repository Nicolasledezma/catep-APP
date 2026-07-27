import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
      const [{ data: perfil }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      const esCoordinador = (roles ?? []).some((r) => r.role === "coordinador");
      return {
        nombre: perfil?.full_name || perfil?.email || "Usuario",
        email: perfil?.email ?? "",
        esCoordinador,
        rol: esCoordinador ? "Coordinador" : "Aprendiz",
      };
    },
  });
}
