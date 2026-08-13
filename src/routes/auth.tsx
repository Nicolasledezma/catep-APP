import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/catep-logo.png";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEDE_CATEP } from "@/lib/catep";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso | Gestión CATEP" },
      {
        name: "description",
        content:
          "Inicia sesión o regístrate para auditar espacios, activos y equipos del centro CATEP Turmero.",
      },
      { property: "og:title", content: "Acceso | Gestión CATEP" },
      {
        property: "og:description",
        content: "Acceso seguro al sistema de auditoría y control diario del CATEP Turmero.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const registroSchema = z.object({
  nombre: z.string().trim().min(3, "Indica tu nombre completo").max(80),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(1, "Indica tu contraseña").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setCargando(false);
    if (error) return toast.error("No se pudo iniciar sesión: credenciales inválidas");
    navigate({ to: "/panel" });
  }


  async function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = registroSchema.safeParse({
      nombre: form.get("nombre"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setCargando(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${window.location.origin}/panel`, data: { full_name: parsed.data.nombre } },
    });
    setCargando(false);
    if (error) return toast.error(mensajeAuth(error.message));
    toast.success("Cuenta creada. Ya puedes ingresar.");
    navigate({ to: "/panel" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Logo CATEP" className="mb-4 h-20 w-auto" />
          <h1 className="font-display text-2xl font-bold">Gestión CATEP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auditoría y control diario de espacios y equipos
          </p>
          <p className="mt-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {SEDE_CATEP}
          </p>
        </div>


        <div className="card-elevated p-5">
          <Tabs defaultValue="login">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="login">Ingresar</TabsTrigger>
              <TabsTrigger value="registro">Registrarme</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={iniciarSesion} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Correo</Label>
                  <Input id="login-email" name="email" type="email" required maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    maxLength={72}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={cargando}>
                  {cargando ? "Verificando…" : "Ingresar"}
                </Button>
                <Link
                  to="/recuperar"
                  className="block w-full text-center text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </form>
            </TabsContent>

            <TabsContent value="registro">
              <form onSubmit={registrar} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nombre">Nombre completo</Label>
                  <Input id="reg-nombre" name="nombre" required maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Correo</Label>
                  <Input id="reg-email" name="email" type="email" required maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <Input id="reg-password" name="password" type="password" required maxLength={72} />
                </div>
                <Button type="submit" className="w-full" disabled={cargando}>
                  {cargando ? "Creando cuenta…" : "Crear cuenta"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Las cuentas nuevas se crean con rol de aprendiz.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
