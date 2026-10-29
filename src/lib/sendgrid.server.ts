const FROM = { email: "no-reply@prscstandards.com", name: "PRSC" };
const TO = "info@prscstandards.com";
const REPLY_TO_FALLBACK = "info@prscstandards.com";

const FIELD_LABELS: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  name: "Name",
  title: "Title",
  role: "Role",
  organization: "Organization",
  property: "Organization / Team / Event",
  email: "Email",
  phone: "Phone",
  linkedin_url: "LinkedIn",
  interaction: "Market interaction",
  statement: "Statement of interest",
  message: "Message",
};

const INTERACTION_LABELS: Record<string, string> = {
  property: "Organization (rights holder, team, league, event)",
  demand: "Demand (brand, agency, investor)",
  channel: "Channel (media, platform, technology)",
  ecosystem: "Ecosystem (advisor, academic, press)",
};

function labelFor(key: string) {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(key: string, value: unknown) {
  const str = String(value);
  if (key === "interaction" && INTERACTION_LABELS[str]) return INTERACTION_LABELS[str];
  return str;
}

export async function sendNotification(subject: string, fields: Record<string, unknown>) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("[sendgrid] SENDGRID_API_KEY is not configured");
    return;
  }

  const entries = Object.entries(fields).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  const text = entries.map(([k, v]) => `${labelFor(k)}: ${displayValue(k, v)}`).join("\n");

  const rows = entries
    .map(
      ([k, v]) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #E8E4DA;font-family:Georgia,serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8C6E3B;vertical-align:top;width:38%;">${escapeHtml(labelFor(k))}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #E8E4DA;font-family:Georgia,serif;font-size:15px;color:#0A1322;line-height:1.5;">${escapeHtml(displayValue(k, v))}</td>
    </tr>`,
    )
    .join("");

  const replyEmail = typeof fields.email === "string" ? fields.email : undefined;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F1EA;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E8E4DA;">
            <tr>
              <td style="background:#0A1322;padding:28px 32px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#D4AF37;">Partnership Readiness Standards Council</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;">
                <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8C6E3B;margin-bottom:8px;">New Submission</div>
                <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:24px;line-height:1.25;color:#0A1322;font-weight:normal;">${escapeHtml(subject)}</h1>
                <div style="height:1px;background:linear-gradient(90deg,transparent,#8C6E3B,transparent);margin:20px 0 8px 0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E4DA;">
                  ${rows}
                </table>
                ${replyEmail ? `<p style="margin:24px 0 0 0;font-family:Georgia,serif;font-size:13px;color:#6B6B6B;">Reply directly to this email to respond to ${escapeHtml(replyEmail)}.</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="background:#0A1322;padding:20px 32px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#D4AF37;">PRSC · prscstandards.com</div>
              </td>
            </tr>
          </table>
          <div style="font-family:Georgia,serif;font-size:11px;color:#8C8C8C;margin-top:16px;">Automated notification from the PRSC website.</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: TO }], subject }],
      from: FROM,
      reply_to: { email: replyEmail || REPLY_TO_FALLBACK },
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[sendgrid] send failed ${res.status}: ${body}`);
  }
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
