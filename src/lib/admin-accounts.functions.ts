import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import type { DbClient } from "@/lib/db-types";

async function assertAdmin(context: { supabase: DbClient; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

export type AdminAccount = { user_id: string; email: string; name: string | null; is_you: boolean };

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (error) throw error;
    const admins: AdminAccount[] = [];
    for (const r of roles ?? []) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      const meta = (data.user?.user_metadata ?? {}) as Record<string, string>;
      const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || null;
      admins.push({
        user_id: r.user_id,
        email: data.user?.email ?? "(unknown)",
        name,
        is_you: r.user_id === context.userId,
      });
    }
    return { admins };
  });

export const addAdmin = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(200),
        first_name: z.string().trim().max(80).optional(),
        last_name: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const origin = new URL(getRequest().url).origin;
    let userId: string | null = null;
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth?mode=setup`,
      data: { first_name: data.first_name ?? "", last_name: data.last_name ?? "" },
    });
    if (invited?.user) userId = invited.user.id;
    if (!userId) {
      // Already has an account: look it up and grant the role.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (!userId) throw error ?? new Error("The administrator could not be invited.");
    }
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;
    return { ok: true, invited: !!invited?.user };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId)
      throw new Error("You can't remove your own administrator access.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) throw new Error("At least one administrator must remain.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", "admin");
    if (error) throw error;
    return { ok: true };
  });
