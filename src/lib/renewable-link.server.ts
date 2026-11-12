import { createHmac, timingSafeEqual } from "node:crypto";

// A renewable invitation link. The email carries a signed, long-lived token for the recipient's address
// instead of a one-time sign-in token. When the person presses the button on our page, the server mints a
// fresh one-time sign-in link at that moment and uses it immediately, so the 24-hour limit on sign-in
// tokens never reaches the recipient.
const SITE = "https://access.prscstandards.org";
export const RENEWABLE_LINK_DAYS = 30;

function secret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Server secret is not configured");
  return `renewable-link:${key}`;
}
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function renewableInvitationUrl(email: string, days = RENEWABLE_LINK_DAYS) {
  const payload = Buffer.from(JSON.stringify({ e: email.trim().toLowerCase(), x: Math.floor(Date.now() / 1000) + days * 86400 })).toString("base64url");
  return `${SITE}/accept-invitation?r=${payload}.${sign(payload)}`;
}

export function verifyRenewableToken(token: string): string | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    const { e, x } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { e?: string; x?: number };
    if (typeof e !== "string" || typeof x !== "number" || x < Math.floor(Date.now() / 1000)) return null;
    return e;
  } catch {
    return null;
  }
}

type MemberRow = { id: string; email: string; first_name: string | null; entity: string; role: string; is_candidate?: boolean | null; status: string; first_access_at: string | null };

/** Mints a fresh one-time sign-in link for an invited member who has not yet created a password. */
export async function mintFreshSignInLink(m: MemberRow): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const redirectTo = new URL(`${SITE}/accept-invitation`);
  redirectTo.searchParams.set("first_name", m.first_name ?? "");
  redirectTo.searchParams.set("entity", m.entity);
  redirectTo.searchParams.set("role", m.role);
  if (m.is_candidate) redirectTo.searchParams.set("candidate", "1");
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: m.email, options: { redirectTo: redirectTo.toString() } });
  if (error || !data?.properties?.action_link) throw new Error("Could not create a fresh invitation link");
  return data.properties.action_link;
}

/** Emails a fresh renewable link. Used when someone reports or hits a dead link. */
export async function sendFreshInvitationEmail(m: MemberRow, label: string) {
  const { sendPortalEmail, teamSignature } = await import("@/lib/portal-notify.server");
  const first = m.first_name?.trim() || "there";
  return sendPortalEmail(m.email, {
    subject: "Your private Welcome Center link", eyebrow: "A fresh link",
    heading: `${first}, here is a fresh link to your Welcome Center.`,
    body: "Your earlier link was no longer active, so we have sent a new one right away.\n\nIt only takes a few minutes: create your password, get reacquainted with where we are today, and share the few details we need to prepare your individualized package.",
    ctaLabel: "Access Your Private Welcome Center →", ctaUrl: renewableInvitationUrl(m.email),
    ctaSubtext: "This link is personal to you and stays valid for 30 days. No password is emailed.",
    signatures: teamSignature(),
  }, label);
}
