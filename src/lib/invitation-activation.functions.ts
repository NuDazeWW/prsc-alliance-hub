import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { activationProblem, activationRecord } from "@/lib/invitation-activation";

async function check(context: { userId: string; claims: Record<string, unknown> }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: member } = await supabaseAdmin.from("portal_members").select("user_id, email, status, first_access_at").eq("user_id", context.userId).maybeSingle();
  const problem = activationProblem({
    userId: context.userId,
    sessionEmail: typeof context.claims.email === "string" ? context.claims.email : null,
    amr: context.claims.amr,
    nowSeconds: Math.floor(Date.now() / 1000),
    member: member ?? null,
  });
  return { problem, email: member?.email ?? null };
}

/** Confirms the current session belongs to this invitation before any password form is shown. */
export const verifyInvitationSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { problem, email } = await check(context as any);
    return problem ? { ok: false as const, reason: problem } : { ok: true as const, email };
  });

/** Sets the password only after the server re-verifies the invitation binding. */
export const activateInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ password: z.string().min(12).max(200) }).parse(i))
  .handler(async ({ context, data }) => {
    const { problem } = await check(context as any);
    if (problem) throw new Error(problem);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.password });
    if (error) throw error;
    const email = typeof context.claims.email === "string" ? context.claims.email.trim().toLowerCase() : "";
    if (email) await supabaseAdmin.from("portal_login_security").upsert({ normalized_email: email, failed_attempts: 0, reset_required: false, last_success_at: new Date().toISOString() }, { onConflict: "normalized_email" });
    // Forward-only and bound to this member's own invitation: only an unused invitation (status invited, never accessed) changes.
    const { error: recordError } = await supabaseAdmin.from("portal_members").update(activationRecord(new Date().toISOString()))
      .eq("user_id", context.userId).eq("status", "invited").is("first_access_at", null);
    if (recordError) throw recordError;
    await supabaseAdmin.from("portal_activity").insert({ actor_user_id: context.userId, event_type: "invitation_activated", metadata: {} });
    return { ok: true };
  });
