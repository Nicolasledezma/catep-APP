import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, KeyRound, LogOut, Save, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePerfil, useSessionUser } from "@/hooks/use-catep-session";
import { SEDE_CATEP } from "@/lib/catep";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil | Gestión CATEP" },
      {
        name: "description",
        content: "Consulta y actualiza tus datos, rol y acceso dentro del sistema Gestión CATEP.",
      },
      { property: "og:title", content: "Mi perfil | Gestión CATEP" },
      {
        property: "og:description",
        content: "Datos personales, rol asignado y accesos del usuario en Gestión CATEP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

const nombreSchema = z.string().trim().min(3, "Indica tu nombre completo").max(80);

function PerfilPage() {
  const { user } = useSessionUser();
  const { data: perfil } = usePerfil(user?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (perfil?.nombre) setNombre(perfil.nombre);
  }, [perfil?.nombre]);

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecciona una imagen válida");
    if (file.size > 5 * 1024 * 1024) return toast.error("La imagen no debe superar 5 MB");

    setSubiendo(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: subidaError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (subidaError) {
      setSubiendo(false);
      return toast.error("No se pudo subir la foto");
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    setSubiendo(false);
    if (error) return toast.error("No se pudo guardar la foto en tu perfil");
    toast.success("Foto de perfil actualizada");
    queryClient.invalidateQueries({ queryKey: ["perfil"] });
  }


  async function guardarNombre() {
    if (!user) return;
    const parsed = nombreSchema.safeParse(nombre);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setGuardando(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data })
      .eq("id", user.id);
    setGuardando(false);
    if (error) return toast.error("No se pudo guardar el nombre");
    toast.success("Perfil actualizado");
    queryClient.invalidateQueries({ queryKey: ["perfil"] });
  }

  async function enviarReset() {
    if (!perfil?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(perfil.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error("No se pudo enviar el correo");
    toast.success("Te enviamos un correo para cambiar la contraseña");
  }

  async function cerrarSesion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">{SEDE_CATEP}</p>
      </header>

      <section className="card-elevated space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{perfil?.nombre ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{perfil?.email}</p>
          </div>
          <Badge variant="secondary">{perfil?.rol ?? "—"}</Badge>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input id="nombre" value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <Button onClick={guardarNombre} disabled={guardando}>
          <Save className="size-4" /> {guardando ? "Guardando…" : "Guardar nombre"}
        </Button>
      </section>

      <section className="card-elevated space-y-3 p-4">
        <h2 className="text-sm font-bold">Accesos según tu rol</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>· Inspecciones e historial: todos los usuarios</li>
          <li>· Inventario de máquinas y mesas de trabajo: todos los usuarios</li>
          <li>· Almacén: almacenista y coordinación</li>
          <li>· Papelería y gestión de usuarios: solo coordinación</li>
        </ul>
        {perfil?.esCoordinador && (
          <Button asChild variant="outline" size="sm">
            <Link to="/usuarios">
              <Users className="size-4" /> Gestionar usuarios y roles
            </Link>
          </Button>
        )}
      </section>

      <section className="card-elevated space-y-3 p-4">
        <h2 className="text-sm font-bold">Seguridad</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={enviarReset}>
            <KeyRound className="size-4" /> Cambiar contraseña
          </Button>
          <Button variant="outline" size="sm" onClick={cerrarSesion}>
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </div>
      </section>
    </div>
  );
}
