import { createServerFn } from "@tanstack/react-start";
import { requirePortalAccess } from "@/lib/portal-access";

export const clearPortalLoginFailures = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    const email =
      typeof context.claims.email === "string" ? context.claims.email.trim().toLowerCase() : "";
    if (!email) throw new Error("Unable to verify this account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("portal_login_security").upsert(
      {
        normalized_email: email,
        failed_attempts: 0,
        reset_required: false,
        last_success_at: new Date().toISOString(),
      },
      { onConflict: "normalized_email" },
    );
    if (error) throw error;
    return { ok: true };
  });
