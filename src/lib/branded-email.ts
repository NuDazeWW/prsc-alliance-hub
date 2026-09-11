export type BrandedEmailInput = {
  subject: string;
  eyebrow?: string;
  heading?: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export type EmailTokens = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  organization?: string;
  title?: string;
  entity?: string;
  role?: string;
  email?: string;
};

export const EMAIL_TOKENS = [
  "first_name",
  "last_name",
  "full_name",
  "organization",
  "title",
  "entity",
  "role",
  "email",
] as const;

export function applyTokens(text: string, tokens: EmailTokens) {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const value = (tokens as Record<string, string | undefined>)[key.toLowerCase()];
    return value ?? match;
  });
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 18px 0;font-family:Georgia,serif;font-size:16px;line-height:1.7;color:#25303F;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

export function renderBrandedEmail(input: BrandedEmailInput) {
  const heading = input.heading?.trim() || input.subject;
  const eyebrow = input.eyebrow?.trim() || "Private Communication";
  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px 0;">
            <tr>
              <td style="background:#0A1322;border:1px solid #D4AF37;">
                <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:14px 30px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#D4AF37;text-decoration:none;">${escapeHtml(
                  input.ctaLabel,
                )}</a>
              </td>
            </tr>
          </table>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F1EA;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E8E4DA;">
            <tr>
              <td style="background:#0A1322;padding:30px 32px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#D4AF37;">Partnership Readiness Standards Council</div>
                <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8C9BB0;margin-top:8px;">Private Board &amp; Advisor Center</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 34px 10px 34px;">
                <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8C6E3B;margin-bottom:10px;">${escapeHtml(
                  eyebrow,
                )}</div>
                <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;line-height:1.28;color:#0A1322;font-weight:normal;">${escapeHtml(
                  heading,
                )}</h1>
                <div style="height:1px;background:linear-gradient(90deg,#8C6E3B,transparent);margin:22px 0 4px 0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 34px 34px 34px;">
                ${paragraphs(input.body)}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="background:#0A1322;padding:22px 32px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#D4AF37;">Private &amp; Confidential</div>
                <div style="font-family:Georgia,serif;font-size:11px;color:#8C9BB0;margin-top:8px;">Sent from no-reply@readinessterminal.com</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderBrandedEmailText(input: BrandedEmailInput) {
  const cta = input.ctaLabel && input.ctaUrl ? `\n\n${input.ctaLabel}: ${input.ctaUrl}` : "";
  return `${input.heading?.trim() || input.subject}\n\n${input.body.trim()}${cta}\n\nPrivate & confidential — Partnership Readiness Standards Council`;
}
