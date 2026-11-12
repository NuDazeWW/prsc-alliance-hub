import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MEMBER_COLS = "id, email, first_name, entity, role, is_candidate, status, first_access_at";

/** Public: the recipient pressed the button in their emailed link. Mints a fresh sign-in link on the spot. */
export const startInvitationFromLink = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ token: z.string().min(20).max(1000) }).parse(i))
  .handler(async ({ data }) => {
    const { verifyRenewableToken, mintFreshSignInLink } = await import("@/lib/renewable-link.server");
    const email = verifyRenewableToken(data.token);
    if (!email) return { ok: false as const, reason: "invalid" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("portal_members").select(MEMBER_COLS).eq("email", email).maybeSingle();
    if (!m || m.status === "revoked") return { ok: false as const, reason: "invalid" as const };
    // Already created a password: send them to the normal sign-in page.
    if (m.first_access_at) return { ok: true as const, kind: "signin" as const, email: m.email };
    return { ok: true as const, kind: "link" as const, url: await mintFreshSignInLink(m) };
  });

/**
 * Public: someone reached a dead link and asked for a new one. The answer never reveals whether the address
 * is known, and a member is emailed at most once every 10 minutes.
 */
export const requestFreshInvitation = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ email: z.string().trim().email().max(254) }).parse(i))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: m } = await supabaseAdmin.from("portal_members").select(MEMBER_COLS).eq("email", email).maybeSingle();
      if (!m || m.status === "revoked" || m.first_access_at) return { ok: true as const };
      const since = new Date(Date.now() - 10 * 60_000).toISOString();
      const { data: recent } = await supabaseAdmin.from("portal_activity").select("id").eq("member_id", m.id).eq("event_type", "fresh_link_requested").gte("created_at", since).limit(1);
      if (recent && recent.length > 0) return { ok: true as const };
      await supabaseAdmin.from("portal_activity").insert({ member_id: m.id, event_type: "fresh_link_requested", metadata: {} });
      const { sendFreshInvitationEmail } = await import("@/lib/renewable-link.server");
      await sendFreshInvitationEmail(m, "fresh-invite-link");
    } catch { /* never reveal anything to an anonymous caller */ }
    return { ok: true as const };
  });
