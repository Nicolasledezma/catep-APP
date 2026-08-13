import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/catep-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña | Gestión CATEP" },
      {
        name: "description",
        content:
          "Solicita un correo de recuperación para restablecer la contraseña de tu cuenta en Gestión CATEP Turmero.",
      },
      { property: "og:title", content: "Recuperar contraseña | Gestión CATEP" },
      {
        property: "og:description",
        content: "Envía un enlace seguro a tu correo y vuelve a acceder a Gestión CATEP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecuperarPage,
});

const emailSchema = z.string().trim().email("Correo inválido").max(255);

function RecuperarPage() {
  const [cargando, setCargando] = useState(false);
  const [enviadoA, setEnviadoA] = useState<string | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = emailSchema.safeParse(form.get("email"));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setCargando(false);
    if (error) return toast.error("No se pudo enviar el correo de recuperación. Intenta más tarde.");
    setEnviadoA(parsed.data);
    toast.success("Correo de recuperación enviado");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Logo CATEP" className="mb-4 h-16 w-auto" />
          <h1 className="font-display text-xl font-bold">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Te enviaremos un enlace a tu correo para crear una nueva contraseña.
          </p>
        </div>

        <div className="card-elevated p-5">
          {enviadoA ? (
            <div className="space-y-3 text-center">
              <MailCheck className="mx-auto size-9 text-primary" />
              <p className="text-sm font-semibold">Revisa tu correo</p>
              <p className="text-xs text-muted-foreground">
                Enviamos un enlace a <span className="font-semibold">{enviadoA}</span>. Ábrelo desde
                este mismo dispositivo. Si no aparece, revisa la carpeta de spam o correo no deseado.
              </p>
              <Button variant="outline" size="sm" onClick={() => setEnviadoA(null)}>
                Enviar a otro correo
              </Button>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rec-email">Correo registrado</Label>
                <Input
                  id="rec-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={255}
                  placeholder="nombre@correo.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={cargando}>
                {cargando ? "Enviando…" : "Enviar enlace de recuperación"}
              </Button>
            </form>
          )}

          <Link
            to="/auth"
            className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
