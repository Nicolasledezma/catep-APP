import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/catep-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Restablecer contraseña | Gestión CATEP" },
      {
        name: "description",
        content: "Crea una nueva contraseña para tu cuenta del sistema de auditoría CATEP Turmero.",
      },
      { property: "og:title", content: "Restablecer contraseña | Gestión CATEP" },
      {
        property: "og:description",
        content: "Recupera el acceso a tu cuenta de Gestión CATEP con una nueva contraseña.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres").max(72),
    confirmar: z.string().min(6, "Confirma la contraseña").max(72),
  })
  .refine((v) => v.password === v.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setListo(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setListo(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      password: form.get("password"),
      confirmar: form.get("confirmar"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setCargando(false);
    if (error) return toast.error("No se pudo actualizar la contraseña. Solicita un nuevo enlace.");
    toast.success("Contraseña actualizada");
    navigate({ to: "/panel" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Logo CATEP" className="mb-4 h-16 w-auto" />
          <h1 className="font-display text-xl font-bold">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escribe la contraseña con la que ingresarás a Gestión CATEP.
          </p>
        </div>

        <div className="card-elevated p-5">
          {!listo && (
            <p className="mb-3 rounded-md bg-secondary p-3 text-xs text-secondary-foreground">
              Abre esta página desde el enlace que recibiste por correo. Si el enlace expiró, solicita
              uno nuevo desde el inicio de sesión.
            </p>
          )}
          <form onSubmit={guardar} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required maxLength={72} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <Input id="confirmar" name="confirmar" type="password" required maxLength={72} />
            </div>
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
