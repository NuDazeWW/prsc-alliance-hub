import { renderBrandedEmail, renderBrandedEmailText } from "@/lib/branded-email";

type BrandedEmail = Parameters<typeof renderBrandedEmail>[0];

export async function sendPortalEmail(to: string, email: BrandedEmail, label: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return;
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
        idempotency_key: `${label}-${to.toLowerCase()}-${crypto.randomUUID()}`,
      },
      { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
    );
  } catch (err) {
    console.error(`Portal email "${label}" failed`, err);
  }
}

export function founderSignature() {
  return [{ name: "Shirley Johnson", title: "Founder, PRSC / DIS" }];
}
