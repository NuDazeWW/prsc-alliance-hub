import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { applyTokens, buildMemberTokens, parseSignatures, renderBrandedEmail, renderBrandedEmailText } from "@/lib/branded-email";

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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
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
  .middleware([requireSupabaseAuth])
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

export const deleteEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("portal_email_templates").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteEmailHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let query = context.supabase.from("portal_email_sends").delete();
    query = data.member_id ? query.eq("member_id", data.member_id) : query.not("id", "is", null);
    const { error } = await query;
    if (error) throw error;
    return { ok: true };
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
});

export const sendMemberEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => sendSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: members, error } = await context.supabase
      .from("portal_members")
      .select("id, email, first_name, last_name, organization, title, entity, role")
      .in("id", data.member_ids);
    if (error) throw error;
    if (!members?.length) throw new Error("No recipients found");

    const apiKey = process.env["SENDGRID_API_KEY"];
    const results: { member_id: string; status: string; error?: string }[] = [];

    const signatures = parseSignatures(data.signatures);

    for (const member of members as any[]) {
      const tokens = buildMemberTokens(member);
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

      let status = "sent";
      let errorText: string | null = null;

      if (!apiKey) {
        status = "failed";
        errorText = "Email sending is not configured";
      } else {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: member.email }], subject }],
            from: { email: "no-reply@readinessterminal.com", name: "PRSC Private Center" },
            reply_to: { email: "info@readinessterminal.com" },
            content: [
              { type: "text/plain", value: renderBrandedEmailText(composed) },
              { type: "text/html", value: renderBrandedEmail(composed) },
            ],
          }),
        });
        if (!res.ok) {
          status = "failed";
          errorText = `Delivery failed (${res.status})`;
        }
      }

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
