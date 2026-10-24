import { memberRoleLabel } from "./member-role-labels";

export type EmailSignature = { name: string; title: string };

export type BrandedEmailInput = {
  subject: string;
  eyebrow?: string;
  heading?: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  ctaSubtext?: string | null;
  signatures?: EmailSignature[];
};

export type EmailTokens = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  organization?: string;
  title?: string;
  entity?: string;
  entity_full?: string;
  role?: string;
  role_label?: string;
  package_label?: string;
  email?: string;
};

export const EMAIL_TOKENS = [
  "first_name",
  "last_name",
  "full_name",
  "organization",
  "title",
  "entity",
  "entity_full",
  "role",
  "role_label",
  "package_label",
  "email",
] as const;

const ENTITY_FULL: Record<string, string> = {
  prsc: "Partnership Readiness Standards Council, LLC (PRSC)",
  dis: "Decision Intelligence Systems, Inc. (DIS)",
  both: "Partnership Readiness Standards Council, LLC (PRSC) and Decision Intelligence Systems, Inc. (DIS)",
};

const PACKAGE_LABEL: Record<string, string> = {
  board_member: "Board",
  advisor: "Advisor",
  prsc_board_dis_advisor: "Board & Advisor",
  prsc_advisor_dis_board: "Board & Advisor",
  methodology_committee: "Methodology Committee",
};

export function buildMemberTokens(member: {
  first_name?: string | null;
  last_name?: string | null;
  organization?: string | null;
  title?: string | null;
  entity?: string | null;
  role?: string | null;
  email?: string | null;
}): EmailTokens {
  const entity = String(member.entity ?? "");
  const role = String(member.role ?? "");
  return {
    first_name: member.first_name ?? "",
    last_name: member.last_name ?? "",
    full_name: `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim(),
    organization: member.organization ?? "",
    title: member.title ?? "",
    entity: entity.toUpperCase(),
    entity_full: ENTITY_FULL[entity] ?? entity.toUpperCase(),
    role: memberRoleLabel(role, entity),
    role_label: memberRoleLabel(role, entity),
    package_label: PACKAGE_LABEL[role] ?? "Board / Advisor",
    email: member.email ?? "",
  };
}

export function applyTokens(text: string, tokens: EmailTokens | Record<string, string | undefined>) {
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

/**
 * Signature lines are stored one per line as "Name, Title".
 */
export function parseSignatures(text: string | null | undefined): EmailSignature[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(",");
      if (idx === -1) return { name: line, title: "" };
      return { name: line.slice(0, idx).trim(), title: line.slice(idx + 1).trim() };
    })
    .filter((s) => s.name);
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

function signatureBlock(signatures: EmailSignature[]) {
  if (!signatures.length) return "";
  const cells = signatures
    .map(
      (s) => `<td align="center" style="padding:0 10px;vertical-align:top;">
          <div style="font-family:'Snell Roundhand','Apple Chancery','Brush Script MT','Segoe Script',cursive;font-size:30px;line-height:1.2;color:#8C6E3B;">${escapeHtml(
            s.name,
          )}</div>
          ${
            s.title
              ? `<div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#25303F;margin-top:6px;">${escapeHtml(
                  s.title,
                )}</div>`
              : ""
          }
        </td>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 4px 0;">
      <tr>
        <td style="padding-top:22px;border-top:1px solid #E8E4DA;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>${cells}</tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function renderBrandedEmail(input: BrandedEmailInput) {
  const heading = input.heading?.trim() || input.subject;
  const eyebrow = input.eyebrow?.trim() || "Private Communication";
  const ctaSubtext = input.ctaSubtext?.trim()
    ? `<p style="margin:14px 0 0 0;font-family:Georgia,serif;font-size:12px;font-style:italic;line-height:1.6;color:#8C9BB0;">${escapeHtml(
        input.ctaSubtext.trim(),
      )}</p>`
    : "";
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
          </table>${ctaSubtext}`
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
                ${signatureBlock(input.signatures ?? [])}
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
  const subtext = input.ctaSubtext?.trim() ? `\n${input.ctaSubtext.trim()}` : "";
  const signatures = (input.signatures ?? [])
    .map((s) => (s.title ? `${s.name}, ${s.title}` : s.name))
    .join("\n");
  const signatureText = signatures ? `\n\n${signatures}` : "";
  return `${input.heading?.trim() || input.subject}\n\n${input.body.trim()}${cta}${subtext}${signatureText}\n\nPrivate & confidential — Partnership Readiness Standards Council, LLC`;
}
