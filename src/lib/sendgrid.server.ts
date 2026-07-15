const FROM = { email: "vanguard@prscstandards.com", name: "PRSC" };
const TO = "info@prscstandards.com";

export async function sendNotification(subject: string, fields: Record<string, unknown>) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("[sendgrid] SENDGRID_API_KEY is not configured");
    return;
  }

  const lines = Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  const text = lines.join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6"><h2 style="margin:0 0 12px">${escapeHtml(subject)}</h2><pre style="white-space:pre-wrap;font-family:inherit;margin:0">${escapeHtml(text)}</pre></div>`;

  const replyEmail = typeof fields.email === "string" ? fields.email : undefined;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: TO }], subject }],
      from: FROM,
      ...(replyEmail ? { reply_to: { email: replyEmail } } : {}),
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
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
