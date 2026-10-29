import {
  applyTokens,
  parseSignatures,
  renderBrandedEmail,
  renderBrandedEmailText,
} from "@/lib/branded-email";
import { SYSTEM_EMAIL_DEFAULTS } from "@/lib/system-email-defaults";
import type { Tables } from "@/integrations/supabase/types";

type BrandedEmail = Parameters<typeof renderBrandedEmail>[0];

export async function sendPortalEmail(
  to: string,
  email: BrandedEmail,
  label: string,
  idempotencyKey?: string,
): Promise<boolean> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return false;
  try {
    const { sendLovableEmail } = await import("@lovable.dev/email-js");
    await sendLovableEmail(
      {
        to,
        from: "PRSC Board & Advisor Center <no-reply@readinessterminal.com>",
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
    return true;
  } catch (err) {
    console.error(`Portal email "${label}" failed`, err);
    return false;
  }
}

export function founderSignature() {
  return [{ name: "Shirley Johnson", title: "Founder, PRSC / DIS" }];
}

/** Loads the admin-edited copy of an automatic email (falling back to the original wording) and fills in tokens. */
export async function loadSystemEmail(key: string) {
  const fallback = SYSTEM_EMAIL_DEFAULTS[key];
  let row: Tables<"portal_email_templates"> | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("portal_email_templates")
      .select("*")
      .eq("system_key", key)
      .maybeSingle();
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
