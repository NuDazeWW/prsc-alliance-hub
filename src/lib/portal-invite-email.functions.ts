import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  INVITE_EMAIL_FROM,
  INVITE_EMAIL_PREVIEW_URL,
  INVITE_EMAIL_REPLY_TO,
  INVITE_EMAIL_SENDER_DOMAIN,
  INVITE_EMAIL_SUBJECT,
  INVITE_ROLE_LABELS,
} from "@/lib/invite-email-config";

const ADMIN_EMAIL = "admin@readinessterminal.com";

const testInviteSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().min(1).max(180),
  title: z.string().trim().min(1).max(160),
  entity: z.enum(["prsc", "dis", "both"]),
  role: z.enum(["board_member", "advisor", "prsc_board_dis_advisor", "prsc_advisor_dis_board"]),
  why_you: z.string().trim().min(20).max(2000),
});

export type InviteEmailReview = z.infer<typeof testInviteSchema>;

export const sendInviteEmailTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => testInviteSchema.parse(input))
  .handler(async ({ context, data }) => {
    const callerEmail = typeof context.claims.email === "string" ? context.claims.email.trim().toLowerCase() : "";
    if (callerEmail !== ADMIN_EMAIL) throw new Error("Only the portal administrator can send invitation tests.");

    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Administrator access is required.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Email sending is not configured. Publish the latest version and try again.");

    const [{ render }, React, { InviteEmail }, { sendLovableEmail }] = await Promise.all([
      import("@react-email/render"),
      import("react"),
      import("@/lib/email-templates/invite"),
      import("@lovable.dev/email-js"),
    ]);
    const { data: inviteCopy } = await context.supabase
      .from("portal_email_templates")
      .select("subject, eyebrow, heading, body, cta_label, cta_subtext, signatures")
      .eq("system_key", "invite")
      .maybeSingle();
    const element = React.createElement(InviteEmail, {
      copy: inviteCopy,
      confirmationUrl: INVITE_EMAIL_PREVIEW_URL,
      firstName: data.first_name,
      recipientEmail: data.email.toLowerCase(),
      entity: data.entity,
      roleLabel: INVITE_ROLE_LABELS[data.role],
    });
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    const result = await sendLovableEmail(
      {
        to: ADMIN_EMAIL,
        from: INVITE_EMAIL_FROM,
        sender_domain: INVITE_EMAIL_SENDER_DOMAIN,
        reply_to: INVITE_EMAIL_REPLY_TO,
        subject: inviteCopy?.subject || INVITE_EMAIL_SUBJECT,
        html,
        text,
        label: "admin-invitation-test",
        purpose: "transactional",
        idempotency_key: `admin-invitation-test-${data.email.toLowerCase()}-${crypto.randomUUID()}`,
      },
      {
        apiKey,
        sendUrl: process.env["LOVABLE_SEND_URL"],
      },
    );

    if (!result.success) throw new Error("The invitation test could not be delivered.");
    return { ok: true, sentTo: ADMIN_EMAIL };
  });
