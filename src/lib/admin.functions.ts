import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const updateUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        roles: z.array(z.enum(["aprendiz", "almacenista", "coordinador"])).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: ownRole, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "coordinador")
      .maybeSingle();

    if (roleError || !ownRole) throw new Error("No autorizado");

    const finalRoles: Database["public"]["Enums"]["app_role"][] = Array.from(
      new Set<Database["public"]["Enums"]["app_role"]>(["aprendiz", ...data.roles]),
    );
    if (data.userId === context.userId && !finalRoles.includes("coordinador")) {
      finalRoles.push("coordinador");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabaseAdmin.from("user_roles").insert(
      finalRoles.map((role) => ({ user_id: data.userId, role })),
    );
    if (insertError) throw insertError;

    return { ok: true };
  });

export const deleteManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("No puedes eliminar tu propia cuenta");

    const { data: ownRole, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "coordinador")
      .maybeSingle();

    if (roleError || !ownRole) throw new Error("No autorizado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;

    return { ok: true };
  });