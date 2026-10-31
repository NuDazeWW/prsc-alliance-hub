import { applyTokens, parseSignatures, renderBrandedEmail, renderBrandedEmailText } from "@/lib/branded-email";
import { SYSTEM_EMAIL_DEFAULTS } from "@/lib/system-email-defaults";
import { emailLogName } from "@/lib/email-log-name";

type BrandedEmail = Parameters<typeof renderBrandedEmail>[0];

/** Records a send to a member in the Sent log. Best effort: a logging problem must never change the send itself. */
async function logMemberEmail(to: string, subject: string, label: string, ok: boolean, error?: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin.from("portal_members").select("id").eq("email", to.toLowerCase()).maybeSingle();
    if (!member) return; // notices to administrators are not member emails
    await supabaseAdmin.from("portal_email_sends").insert({
      member_id: member.id, template_id: null, template_name: emailLogName(label), subject,
      recipient_email: to, status: ok ? "sent" : "failed", error: ok ? null : (error ?? "Delivery failed").slice(0, 300),
    });
  } catch (err) {
    console.error(`Could not record "${label}" in the sent log`, err);
  }
}

export async function sendPortalEmail(to: string, email: BrandedEmail, label: string, idempotencyKey?: string, opts: { log?: boolean } = {}): Promise<boolean> {
  const log = opts.log !== false;
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    if (log) await logMemberEmail(to, email.subject, label, false, "Email service is not configured");
    return false;
  }
  try {
    const { sendLovableEmail } = await import("@lovable.dev/email-js");
    await sendLovableEmail(
      {
        to,
        from: "PRSC Board & Advisor Center <no-reply@notify.readinessterminal.com>",
        sender_domain: "notify.readinessterminal.com",
        reply_to: "info@readinessterminal.com",
        subject: email.subject,
        html: renderBrandedEmail(email),
        text: renderBrandedEmailText(email),
        label,
        purpose: "transactional",
        idempotency_key: idempotencyKey ?? `${label}-${to.toLowerCase()}-${crypto.randomUUID()}`,
      },
      { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
    );
    if (log) await logMemberEmail(to, email.subject, label, true);
    return true;
  } catch (err) {
    console.error(`Portal email "${label}" failed`, err);
    if (log) await logMemberEmail(to, email.subject, label, false, err instanceof Error ? err.message : undefined);
    return false;
  }
}

export function teamSignature() {
  return [{ name: "The PRSC Leadership Team", title: "" }];
}

export function founderSignature() {
  return [{ name: "Shirley Johnson", title: "" }];
}

/** Loads the admin-edited copy of an automatic email (falling back to the original wording) and fills in tokens. */
export async function loadSystemEmail(key: string) {
  const fallback = SYSTEM_EMAIL_DEFAULTS[key];
  let row: any = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("portal_email_templates").select("*").eq("system_key", key).maybeSingle();
    row = data;
  } catch (err) {
    console.error(`Could not load template ${key}`, err);
  }
  const copy = row?.body?.trim() ? row : fallback;
  return (tokens: Record<string, string | undefined>): BrandedEmail => {
    const fill = (v?: string | null) => applyTokens(v ?? "", tokens);
    return {
      subject: fill(copy.subject),
      eyebrow: fill(copy.eyebrow),
      heading: fill(copy.heading),
      body: fill(copy.body),
      ctaLabel: fill(copy.cta_label) || null,
      ctaUrl: fill(copy.cta_url) || null,
      ctaSubtext: fill(copy.cta_subtext) || null,
      signatures: parseSignatures(copy.signatures),
    };
  };
}

/** Sends already-rendered HTML (used for administrator test sends of the invitation). Never logged as a member email. */
export async function sendRawPortalEmail(to: string, subject: string, html: string, label: string): Promise<boolean> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return false;
  try {
    const { sendLovableEmail } = await import("@lovable.dev/email-js");
    const text = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|tr|h\d)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").trim();
    await sendLovableEmail(
      {
        to,
        from: "PRSC Board & Advisor Center <no-reply@notify.readinessterminal.com>",
        sender_domain: "notify.readinessterminal.com",
        reply_to: "info@readinessterminal.com",
        subject, html, text, label, purpose: "transactional",
        idempotency_key: `${label}-${to.toLowerCase()}-${crypto.randomUUID()}`,
      },
      { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
    );
    return true;
  } catch (err) {
    console.error(`Raw portal email "${label}" failed`, err);
    return false;
  }
}
