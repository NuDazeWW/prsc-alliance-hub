import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export function portalAccessAllowed(member: { status: string } | null, admin: boolean) {
  return member?.status === "revoked" ? false : admin || member?.status === "invited" || member?.status === "active";
}

/** Recheck durable authorization on every RPC, including already-issued sessions. */
export const requirePortalAccess = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    const [{ data: member, error }, { data: role, error: roleError }] = await Promise.all([
      context.supabase.from("portal_members").select("status").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle(),
    ]);
    if (error || roleError || !portalAccessAllowed(member, Boolean(role))) throw new Error("Portal access unavailable");
    return next();
  });

/** Raw HTTP invitation jobs require an actual verified administrator, never a public API key. */
export async function authorizeInvitationRequest(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: user, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user.user) return false;
  const [{ data: role, error: roleError }, { data: member, error: memberError }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", user.user.id).eq("role", "admin").maybeSingle(),
    supabaseAdmin.from("portal_members").select("status").eq("user_id", user.user.id).maybeSingle(),
  ]);
  return !roleError && !memberError && Boolean(role) && portalAccessAllowed(member, true);
}