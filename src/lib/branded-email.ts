import { memberRoleLabel, memberDesignation, FORUM_ENTITY_LABEL, FORUM_ENTITY_FULL_NAME } from "./member-role-labels";

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
  why_you?: string;
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
  "why_you",
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
  why_you?: string | null;
  is_candidate?: boolean | null;
  forum_clearance_status?: string | null;
  prsc_activated_at?: string | null;
  dis_activated_at?: string | null;
  role_review_status?: string | null;
  participates_in_forum?: boolean | null;
  acceptance_complete?: { prsc: boolean; dis: boolean };
}): EmailTokens {
  const entity = String(member.entity ?? "");
  const role = String(member.role ?? "");
  return {
    first_name: member.first_name ?? "",
    last_name: member.last_name ?? "",
    full_name: `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim(),
    organization: member.organization ?? "",
    title: member.title ?? "",
    entity: member.is_candidate ? FORUM_ENTITY_LABEL : entity.toUpperCase(),
    entity_full: member.is_candidate ? FORUM_ENTITY_FULL_NAME : ENTITY_FULL[entity] ?? entity.toUpperCase(),
    role: memberDesignation({ ...member, role, entity }),
    role_label: memberDesignation({ ...member, role, entity }),
    package_label: member.is_candidate ? "United Forum" : PACKAGE_LABEL[role] ?? "Board / Advisor",
    email: member.email ?? "",
    why_you: member.why_you?.trim() || "",
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
        `<p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:27px;color:#25303F;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

/** Hosted copies of the design-kit images (served from the site's public folder). Emails cannot load local files. */
export const EMAIL_ASSET_BASE = "https://access.prscstandards.org/email";

const GOLD = "#D4AF37";
const NAVY = "#0A1322";
const IVORY = "#F2EFE6";
const BRONZE = "#8C6E3B";
const RULE = "#D9CBA8";
/** Solid-colour images behind each coloured block. Gmail and other dark modes recolour plain background colours (turning the navy slate-grey) but leave images alone. */
export const bgAttrs = (name: "bg-navy" | "bg-outer" | "bg-cream", color: string) => `background="${EMAIL_ASSET_BASE}/${name}.png" bgcolor="${color}"`;
export const bgStyle = (name: "bg-navy" | "bg-outer" | "bg-cream", color: string) => `background-color:${color};background-image:url(${EMAIL_ASSET_BASE}/${name}.png);`;

function signatureBlock(signatures: EmailSignature[]) {
  if (!signatures.length) return "";
  const cells = signatures
    .map(
      (s) => `<td align="center" style="padding:0 10px;vertical-align:top;">
          <div style="font-family:'Snell Roundhand','Apple Chancery','Brush Script MT','Segoe Script',cursive;font-size:30px;line-height:1.2;color:${BRONZE};">${escapeHtml(
            s.name,
          )}</div>
          ${
            s.title
              ? `<div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${NAVY};margin-top:6px;">${escapeHtml(
                  s.title,
                )}</div>`
              : ""
          }
        </td>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 4px 0;">
      <tr>
        <td style="padding-top:22px;border-top:1px solid ${RULE};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>${cells}</tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/** Shared mobile rules. Clients that ignore them still get the readable 600px layout. */
export const EMAIL_RESPONSIVE_CSS = `
    body {margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table {border-collapse:collapse;}
    img {border:0;outline:none;text-decoration:none;}
    @media only screen and (max-width:620px) {
      .email-shell {width:100%!important;}
      .mobile-pad {padding-left:20px!important;padding-right:20px!important;}
      .hero-title {font-size:30px!important;line-height:38px!important;}
      .step-column {display:block!important;width:100%!important;box-sizing:border-box!important;border-right:none!important;border-bottom:1px solid ${RULE}!important;padding:16px 12px!important;}
      .step-table {width:100%!important;}
      .mobile-fluid {width:100%!important;max-width:100%!important;height:auto!important;}
      .mobile-cta {width:100%!important;}
    }`;

export function emailFooterHtml(note = "Secure access for invited participants only.") {
  return `<tr><td align="center" ${bgAttrs("bg-navy", NAVY)} style="${bgStyle("bg-navy", NAVY)}padding:25px 30px 30px;border-top:3px solid #B98925;">
          <div style="font-family:Georgia,'Times New Roman',serif;color:${GOLD};font-size:12px;line-height:18px;letter-spacing:2px;">PARTNERSHIP READINESS STANDARDS COUNCIL, LLC</div>
          <div style="font-family:Arial,Helvetica,sans-serif;color:#BAC0CA;font-size:10px;line-height:17px;letter-spacing:1px;margin-top:9px;">${escapeHtml(note)}</div>
          <div style="font-family:Arial,Helvetica,sans-serif;color:#9AA6B7;font-size:11px;line-height:17px;margin-top:12px;">Private &amp; confidential. Sent from no-reply@readinessterminal.com</div>
        </td></tr>`;
}

export function goldButtonHtml(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 8px;">
            <tr><td bgcolor="#D9AE45" align="center" style="background-color:#D9AE45;background-image:linear-gradient(180deg,#F0D27A 0%,#D9AE45 48%,#BC8B28 100%);border:1px solid #A47A22;border-radius:6px;box-shadow:0 3px 6px rgba(60,40,0,0.35);padding:17px 34px;">
              <a href="${escapeHtml(url)}" target="_blank" style="display:block;font-family:Georgia,'Times New Roman',serif;text-decoration:none;color:#0A1322;font-size:16px;line-height:24px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;padding:0;white-space:normal;text-align:center;">${escapeHtml(label)} &nbsp;&rarr;</a>
            </td></tr>
          </table>`;
}

export function renderBrandedEmail(input: BrandedEmailInput) {
  const heading = input.heading?.trim() || input.subject;
  const eyebrow = input.eyebrow?.trim() || "Private Communication";
  const ctaSubtext = input.ctaSubtext?.trim()
    ? `<p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;text-align:center;color:#4B4D4E;">${escapeHtml(
        input.ctaSubtext.trim(),
      )}</p>`
    : "";
  const cta = input.ctaLabel && input.ctaUrl ? `${goldButtonHtml(input.ctaLabel, input.ctaUrl)}${ctaSubtext}` : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(input.subject)}</title>
    <style type="text/css">${EMAIL_RESPONSIVE_CSS}</style>
  </head>
  <body ${bgAttrs("bg-outer", "#071221")} style="margin:0;padding:0;${bgStyle("bg-outer", "#071221")}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ${bgAttrs("bg-outer", "#071221")} style="width:100%;${bgStyle("bg-outer", "#071221")}">
      <tr>
        <td align="center" style="padding:24px 12px 32px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-shell" ${bgAttrs("bg-navy", NAVY)} style="width:600px;max-width:600px;${bgStyle("bg-navy", NAVY)}">
            <tr><td>
              <img class="mobile-fluid" src="${EMAIL_ASSET_BASE}/prsc-hero-compact-1200.jpg" width="600" height="220" alt="PRSC — Partnership Readiness Standards Council" style="display:block;width:600px;max-width:100%;height:auto;">
            </td></tr>
            <tr><td align="center" class="mobile-pad" ${bgAttrs("bg-navy", NAVY)} style="padding:0 34px 26px;${bgStyle("bg-navy", NAVY)}">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;line-height:18px;color:${GOLD};">PRIVATE BOARD &amp; ADVISOR CENTER</div>
            </td></tr>
            <tr><td ${bgAttrs("bg-cream", IVORY)} class="mobile-pad" style="padding:34px 30px 34px;${bgStyle("bg-cream", IVORY)}">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:4px;line-height:18px;text-transform:uppercase;color:${BRONZE};text-align:center;margin-bottom:12px;">${escapeHtml(
                eyebrow,
              )}</div>
              <h1 class="hero-title" style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:36px;color:${NAVY};font-weight:normal;text-align:center;">${escapeHtml(
                heading,
              )}</h1>
              <div style="margin:18px auto 24px;width:72px;border-top:2px solid ${GOLD};line-height:1px;font-size:1px;">&nbsp;</div>
              ${paragraphs(input.body)}
              ${cta}
              ${signatureBlock(input.signatures ?? [])}
            </td></tr>
            ${emailFooterHtml()}
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
