import * as React from "react";
import { render } from "@react-email/render";
import { InviteEmail } from "@/lib/email-templates/invite";
import { memberCandidateLabel } from "@/lib/member-role-labels";
import { INVITE_EMAIL_SUBJECT } from "@/lib/invite-email-config";
import { SYSTEM_EMAIL_DEFAULTS, isOutdatedSavedInvite } from "@/lib/system-email-defaults";
import { sendRawPortalEmail } from "@/lib/portal-notify.server";

const ADMIN_COPY_TO = "admin@readinessterminal.com";

/**
 * Sends the administrator a copy of an invitation that was just sent. The real invitation holds the member's private
 * one-time sign-in link, so the copy replaces that button with a link to the Sent log. Never throws.
 */
export async function sendInvitationAdminCopy(admin: any, memberId: string) {
  try {
    const { data: m } = await admin.from("portal_members")
      .select("first_name, last_name, email, entity, role, why_you, is_candidate").eq("id", memberId).maybeSingle();
    if (!m) return;
    const { data: saved } = await admin.from("portal_email_templates")
      .select("eyebrow, heading, body, cta_label, cta_subtext, signatures").eq("system_key", "invite").maybeSingle();
    const copy = isOutdatedSavedInvite("invite", saved?.body) ? SYSTEM_EMAIL_DEFAULTS.invite : saved;
    const entity = (["prsc", "dis", "both"] as const).find((v) => v === m.entity) ?? "both";
    const html = await render(React.createElement(InviteEmail, {
      confirmationUrl: "https://access.prscstandards.org/admin/send#sent-log",
      recipientEmail: m.email,
      firstName: m.first_name ?? "there",
      entity,
      roleLabel: memberCandidateLabel(m.role, entity, Boolean(m.is_candidate)),
      copy,
      meetingBlock: null,
      whyYou: m.why_you ?? null,
    } as any));
    const banner = `<div style="font:14px/1.5 Arial,sans-serif;background:#fff7dc;color:#4a3b00;border:1px solid #d9b44a;padding:12px 16px;margin:0 0 12px 0">Administrator copy. This invitation was sent to <strong>${m.first_name} ${m.last_name}</strong> (${m.email}). Their private sign-in button is replaced here with a link to the Sent log.</div>`;
    const withBanner = /<body[^>]*>/i.test(html) ? html.replace(/(<body[^>]*>)/i, `$1${banner}`) : banner + html;
    await sendRawPortalEmail(ADMIN_COPY_TO, `Copy: invitation sent to ${m.first_name} ${m.last_name} | ${INVITE_EMAIL_SUBJECT}`, withBanner, "invitation-admin-copy");
  } catch (error) {
    console.error("Invitation admin copy failed", error);
  }
}
