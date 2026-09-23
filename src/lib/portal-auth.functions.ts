import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(1000),
});

type LoginSecurityRecord = {
  failed_attempts: number;
  reset_required: boolean;
};

export const signInToPortal = createServerFn({ method: "POST" })
  .inputValidator((input) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: security } = await supabaseAdmin
      .from("portal_login_security")
      .select("failed_attempts, reset_required")
      .eq("normalized_email", normalizedEmail)
      .maybeSingle() as { data: LoginSecurityRecord | null };

    if (security?.reset_required) return { ok: false as const, resetRequired: true as const };

    const supabaseUrl = process.env['SUPABASE_URL']!;
    const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY']!;
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: data.password,
    });

    if (error || !authData.session) {
      const failedAttempts = Math.min(3, (security?.failed_attempts ?? 0) + 1);
      const resetRequired = failedAttempts >= 3;
      await supabaseAdmin.from("portal_login_security").upsert({
        normalized_email: normalizedEmail,
        failed_attempts: failedAttempts,
        reset_required: resetRequired,
        last_failed_at: new Date().toISOString(),
      }, { onConflict: "normalized_email" });
      return { ok: false as const, resetRequired };
    }

    await supabaseAdmin.from("portal_login_security").upsert({
      normalized_email: normalizedEmail,
      failed_attempts: 0,
      reset_required: false,
      last_success_at: new Date().toISOString(),
    }, { onConflict: "normalized_email" });

    return {
      ok: true as const,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    };
  });

export const clearPortalLoginFailures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims.email === "string" ? context.claims.email.trim().toLowerCase() : "";
    if (!email) throw new Error("Unable to verify this account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("portal_login_security").upsert({
      normalized_email: email,
      failed_attempts: 0,
      reset_required: false,
      last_success_at: new Date().toISOString(),
    }, { onConflict: "normalized_email" });
    if (error) throw error;
    return { ok: true };
  });