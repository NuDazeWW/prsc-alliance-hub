import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import { applyTokens, buildMemberTokens, parseSignatures, renderBrandedEmail, renderBrandedEmailText } from "@/lib/branded-email";
import { SYSTEM_EMAIL_DEFAULTS } from "@/lib/system-email-defaults";
import { withAppointmentProgress } from "@/lib/portal.functions";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  eyebrow: string;
  heading: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  cta_subtext: string | null;
  signatures: string | null;
  system_key?: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailSend = {
  id: string;
  member_id: string;
  template_id: string | null;
  template_name: string;
  subject: string;
  recipient_email: string;
  status: string;
  created_at: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

export const getEmailCenter = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    // Make sure every automatic email is listed so admins can edit it.
    const { data: existing } = await context.supabase.from("portal_email_templates").select("system_key").not("system_key", "is", null);
    const have = new Set((existing ?? []).map((r: any) => r.system_key));
    const missing = Object.entries(SYSTEM_EMAIL_DEFAULTS).filter(([k]) => !have.has(k));
    if (missing.length) {
      await context.supabase.from("portal_email_templates").upsert(
        missing.map(([system_key, c]) => ({ system_key, ...c, created_by: context.userId })),
        { onConflict: "system_key", ignoreDuplicates: true },
      );
    }
    const [{ data: templates }, { data: sends }] = await Promise.all([
      context.supabase.from("portal_email_templates").select("*").order("created_at", { ascending: true }),
      context.supabase.from("portal_email_sends").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    return {
      templates: (templates ?? []) as EmailTemplate[],
      sends: (sends ?? []) as EmailSend[],
    };
  });

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().max(300).optional().default(""),
  eyebrow: z.string().trim().max(80).optional().default("Private Communication"),
  heading: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(1).max(20000),
  cta_label: z.string().trim().max(80).optional().default(""),
  cta_url: z.string().trim().max(400).optional().default(""),
  cta_subtext: z.string().trim().max(200).optional().default(""),
  signatures: z.string().trim().max(600).optional().default(""),
});

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => templateSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const payload = {
      ...(data.id ? { id: data.id } : {}),
      name: data.name,
      subject: data.subject,
      description: data.description || null,
      eyebrow: data.eyebrow || "Private Communication",
      heading: data.heading || "",
      body: data.body,
      cta_label: data.cta_label || null,
      cta_url: data.cta_url || null,
      cta_subtext: data.cta_subtext || null,
      signatures: data.signatures || null,
      created_by: context.userId,
    };
    const { data: saved, error } = await context.supabase
      .from("portal_email_templates")
      .upsert(payload, { onConflict: "id" })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: saved.id as string };
  });

export const resetEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row } = await context.supabase.from("portal_email_templates").select("system_key").eq("id", data.id).maybeSingle();
    const original = row?.system_key ? SYSTEM_EMAIL_DEFAULTS[row.system_key] : null;
    if (!original) throw new Error("Only automatic emails can be reset");
    const { error } = await context.supabase.from("portal_email_templates").update(original).eq("id", data.id);
    if (error) throw error;
    return { ok: true, template: original };
  });

export const deleteEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("portal_email_templates").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteEmailHistory = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ send_ids: z.array(z.string().uuid()).min(1).max(500) }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("portal_email_sends").delete().in("id", data.send_ids);
    if (error) throw error;
    return { ok: true, deleted: data.send_ids.length };
  });

const sendSchema = z.object({
  template_id: z.string().uuid().nullable().optional(),
  member_ids: z.array(z.string().uuid()).min(1).max(50),
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  eyebrow: z.string().trim().max(80).optional().default("Private Communication"),
  heading: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(1).max(20000),
  cta_label: z.string().trim().max(80).optional().default(""),
  cta_url: z.string().trim().max(400).optional().default(""),
  cta_subtext: z.string().trim().max(200).optional().default(""),
  signatures: z.string().trim().max(600).optional().default(""),
  poll_id: z.string().uuid().nullable().optional(),
});

export const sendMemberEmail = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => sendSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: members, error } = await context.supabase
      .from("portal_members")
      .select("*")
      .in("id", data.member_ids).neq("status", "revoked");
    if (error) throw error;
    if (!members?.length) throw new Error("No recipients found");
    if (data.poll_id) {
      const { addMembersToPoll } = await import("@/lib/meeting-poll.server");
      await addMembersToPoll(data.poll_id, (members as any[]).map((m) => m.id));
    }

    const results: { member_id: string; status: string; error?: string }[] = [];

    const signatures = parseSignatures(data.signatures);

    for (const member of members as any[]) {
      const tokens = buildMemberTokens(await withAppointmentProgress(context.supabase, member));
      const subject = applyTokens(data.subject, tokens);
      const composed = {
        subject,
        eyebrow: applyTokens(data.eyebrow || "", tokens),
        heading: applyTokens(data.heading || "", tokens),
        body: applyTokens(data.body, tokens),
        ctaLabel: data.cta_label || null,
        ctaUrl: data.cta_url || null,
        ctaSubtext: applyTokens(data.cta_subtext || "", tokens) || null,
        signatures,
      };

      // Same delivery service as every automatic portal email (the one already proven to reach inboxes).
      const { sendPortalEmail } = await import("@/lib/portal-notify.server");
      const delivered = await sendPortalEmail(member.email, composed, "compose-send", undefined, { log: false });
      const status = delivered ? "sent" : "failed";
      const errorText: string | null = delivered ? null : "Delivery failed. See the server logs.";

      await context.supabase.from("portal_email_sends").insert({
        member_id: member.id,
        template_id: data.template_id ?? null,
        template_name: data.name,
        subject,
        recipient_email: member.email,
        status,
        error: errorText,
        sent_by: context.userId,
      });

      results.push({ member_id: member.id, status, ...(errorText ? { error: errorText } : {}) });
    }

    return { ok: true, results };
  });


const testSchema = z.object({
  to: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(200),
  eyebrow: z.string().trim().max(80).optional().default("Private Communication"),
  heading: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(1).max(20000),
  cta_label: z.string().trim().max(80).optional().default(""),
  cta_url: z.string().trim().max(400).optional().default(""),
  cta_subtext: z.string().trim().max(200).optional().default(""),
  signatures: z.string().trim().max(600).optional().default(""),
});

/** Admin only: send the current draft to one address the administrator types, to see the real layout in a real inbox. */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => testSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    // Sample values so merge fields are visibly filled instead of showing raw {{tokens}}.
    const tokens = buildMemberTokens({ first_name: "Alex", last_name: "Morgan", organization: "Sample Organization", title: "Sample Title", entity: "prsc", role: "advisor", email: data.to, why_you: "Your experience and perspective will help us challenge assumptions and shape our next steps. (Sample personal note.)" });
    const subject = `[TEST] ${applyTokens(data.subject, tokens)}`;
    const composed = {
      subject,
      eyebrow: applyTokens(data.eyebrow || "", tokens),
      heading: applyTokens(data.heading || "", tokens),
      body: applyTokens(data.body, tokens),
      ctaLabel: data.cta_label || null,
      ctaUrl: data.cta_url || null,
      ctaSubtext: applyTokens(data.cta_subtext || "", tokens) || null,
      signatures: parseSignatures(data.signatures),
    };
    const { sendPortalEmail } = await import("@/lib/portal-notify.server");
    const ok = await sendPortalEmail(data.to, composed, "admin-test-email", undefined, { log: false });
    if (!ok) throw new Error("The email service did not accept the test. Check the server logs for the delivery error.");
    return { ok: true };
  });

/** Admin only: send an already-rendered invitation preview to one typed address. The link in it is the inactive preview link. */
export const sendTestInvitation = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ to: z.string().trim().email().max(254), subject: z.string().trim().min(1).max(200), html: z.string().min(200).max(400000) }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { sendRawPortalEmail } = await import("@/lib/portal-notify.server");
    const ok = await sendRawPortalEmail(data.to, `[TEST] ${data.subject}`, data.html, "admin-test-invitation");
    if (!ok) throw new Error("The email service did not accept the test.");
    return { ok: true };
  });
