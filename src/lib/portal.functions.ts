import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { renderBrandedEmail, renderBrandedEmailText } from "@/lib/branded-email";

type PortalMember = {
  id: string; user_id: string; email: string; first_name: string; last_name: string;
  professional_name: string | null; organization: string; title: string | null;
  entity: "prsc" | "dis" | "both"; role: "board_member" | "advisor" | "prsc_board_dis_advisor" | "prsc_advisor_dis_board";
  why_you: string; status: "invited" | "active" | "revoked";
  package_status: "awaiting_profile" | "in_preparation" | "profile_received" | "package_ready";
  invited_at: string; first_access_at: string | null; last_access_at: string | null;
};

type PortalProfile = {
  id: string; member_id: string; current_stage: number; preferred_name: string | null;
  professional_role: string | null; current_organization: string | null;
  preferred_email: string | null; preferred_phone: string | null; headshot_path: string | null;
  experience_answers: Record<string, string>; visibility_instructions: Record<string, string>;
  restriction_status: string | null; restriction_details: string | null;
  final_notes: string | null; questions: string | null; contact_requested: boolean;
  submitted_at: string | null; updated_at: string;
};

const roleSchema = z.enum(["board_member", "advisor", "prsc_board_dis_advisor", "prsc_advisor_dis_board", "methodology_committee"]);
const entitySchema = z.enum(["prsc", "dis", "both"]);
const permissionSchema = z.enum(["yes", "discuss", "no"]);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

export const getPortalSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { asMemberId?: string }) => z.object({ asMemberId: z.string().uuid().optional() }).parse(input ?? {}))
  .handler(async ({ context, data: input }) => {
    if (input.asMemberId) {
      await assertAdmin(context);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: viewed } = await supabaseAdmin.from("portal_members").select("*").eq("id", input.asMemberId).maybeSingle();
      if (!viewed) throw new Error("Member not found");
      const { data: vp } = await supabaseAdmin.from("portal_profiles").select("submitted_at").eq("member_id", viewed.id).maybeSingle();
      return { member: viewed as PortalMember | null, isAdmin: true, hasProfile: Boolean(vp?.submitted_at), viewingAs: true };
    }
    const [{ data: member }, { data: roles }] = await Promise.all([
      context.supabase.from("portal_members").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    const roleNames = (roles ?? []).map((item: { role: string }) => item.role);
    if (!member && !roleNames.includes("admin")) throw new Error("Portal access has not been granted");
    if (member?.status === "revoked") throw new Error("Portal access has been revoked");
    let hasProfile = false;
    if (member) {
      const { data: profile } = await context.supabase
        .from("portal_profiles")
        .select("submitted_at")
        .eq("member_id", member.id)
        .maybeSingle();
      hasProfile = Boolean(profile?.submitted_at);
    }
    return { member: member as PortalMember | null, isAdmin: roleNames.includes("admin"), hasProfile, viewingAs: false };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: member, error: memberError } = await context.supabase.from("portal_members").select("id").eq("user_id", context.userId).single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    const { data, error } = await context.supabase.from("portal_profiles").select("*").eq("member_id", member.id).maybeSingle();
    if (error) throw error;
    return data as PortalProfile | null;
  });

const profileSchema = z.object({
  current_stage: z.number().int().min(1).max(5),
  preferred_name: z.string().trim().max(120),
  professional_role: z.string().trim().max(160),
  current_organization: z.string().trim().max(180),
  preferred_email: z.string().trim().email().max(200),
  preferred_phone: z.string().trim().max(40),
  bio: z.string().trim().max(3000).optional(),
  experience_answers: z.record(z.string(), z.string().trim().max(3000)),
  visibility_instructions: z.record(z.string(), permissionSchema),
  restriction_status: z.enum(["no", "yes", "unsure"]).nullable(),
  restriction_details: z.string().trim().max(3000),
  final_notes: z.string().trim().max(3000),
  questions: z.string().trim().max(3000),
  contact_requested: z.boolean(),
  submit: z.boolean(),
});

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: member, error: memberError } = await context.supabase
      .from("portal_members")
      .select("id, email, first_name, last_name, entity, role")
      .eq("user_id", context.userId)
      .single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    const payload = {
      member_id: member.id,
      current_stage: data.current_stage,
      preferred_name: data.preferred_name,
      professional_role: data.professional_role,
      current_organization: data.current_organization,
      preferred_email: data.preferred_email,
      preferred_phone: data.preferred_phone,
      ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
      experience_answers: data.experience_answers,
      visibility_instructions: data.visibility_instructions,
      restriction_status: data.restriction_status,
      restriction_details: data.restriction_details,
      final_notes: data.final_notes,
      questions: data.questions,
      contact_requested: data.contact_requested,
      ...(data.submit ? { submitted_at: new Date().toISOString(), current_stage: 5 } : {}),
    };
    const { error } = await context.supabase.from("portal_profiles").upsert(payload, { onConflict: "member_id" });
    if (error) throw error;
    if (data.submit) {
      await context.supabase.from("portal_activity").insert({ member_id: member.id, actor_user_id: context.userId, event_type: "profile_submitted" });
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (apiKey) {
        const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || member.email;
        const roleLabel = ({ board_member: "Board Member", advisor: "Advisor", prsc_board_dis_advisor: "Board Member (PRSC) and Advisor (DIS)", prsc_advisor_dis_board: "Advisor (PRSC) and Board Member (DIS)" } as Record<string, string>)[member.role] ?? "Advisor";
        const entityLabel = member.entity === "both" ? "PRSC and DIS" : String(member.entity).toUpperCase();
        const subject = `Profile submitted — ${fullName}`;
        const email = {
          subject,
          eyebrow: "Profile received",
          heading: `${fullName} has submitted their profile`,
          body: `${fullName} (${entityLabel} · ${roleLabel}) has completed and submitted their private profile.\n\nThe profile is now marked Profile Received. Review their answers and load the next-step documents in the administrator center.\n\nPreferred email: ${data.preferred_email}\nPreferred phone: ${data.preferred_phone || "Not provided"}\nContact requested: ${data.contact_requested ? "Yes" : "No"}`,
          ctaLabel: "Review Profile & Prepare Next Step",
          ctaUrl: "https://access.prscstandards.org/admin",
          ctaSubtext: "Open the member record, review the submitted profile, then upload or release the appropriate documents.",
          signatures: [],
        };
        try {
          const { sendLovableEmail } = await import("@lovable.dev/email-js");
          await sendLovableEmail(
            {
              to: "admin@readinessterminal.com",
              from: "PRSC Board & Advisor Center <no-reply@readinessterminal.com>",
              sender_domain: "notify.readinessterminal.com",
              reply_to: "info@readinessterminal.com",
              subject,
              html: renderBrandedEmail(email),
              text: renderBrandedEmailText(email),
              label: "profile-submitted-admin-alert",
              purpose: "transactional",
              idempotency_key: `profile-submitted-admin-${member.id}-${crypto.randomUUID()}`,
            },
            { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
          );
        } catch (notificationError) {
          console.error("Profile submission admin notification failed", notificationError);
        }
        try {
          const { sendLovableEmail } = await import("@lovable.dev/email-js");
          const firstName = member.first_name?.trim() || "there";
          const confirmation = {
            subject: "We've received your profile — next steps are being prepared",
            eyebrow: "Profile received",
            heading: `Thank you, ${firstName}. Your profile has been received.`,
            body: `Your private profile has been submitted successfully, and your individualized ${entityLabel} ${roleLabel.toLowerCase()} package is now being prepared.\n\nYou will receive your next steps privately and shortly. There is nothing further you need to do at this time.\n\nIf any questions come to mind in the meantime, you can send them to us from the Welcome Center at any time — or simply reply to this email.`,
            ctaLabel: "Return to Your Welcome Center",
            ctaUrl: "https://access.prscstandards.org/portal",
            ctaSubtext: "Your Welcome Center shows your current status and any documents released to you.",
            signatures: [
              { name: "Shirley Johnson", title: `Founder, ${entityLabel === "PRSC and DIS" ? "PRSC / DIS" : entityLabel}` },
            ],
          };
          await sendLovableEmail(
            {
              to: member.email,
              from: "PRSC Board & Advisor Center <no-reply@readinessterminal.com>",
              sender_domain: "notify.readinessterminal.com",
              reply_to: "info@readinessterminal.com",
              subject: confirmation.subject,
              html: renderBrandedEmail(confirmation),
              text: renderBrandedEmailText(confirmation),
              label: "profile-submitted-member-confirmation",
              purpose: "transactional",
              idempotency_key: `profile-submitted-member-${member.id}-${crypto.randomUUID()}`,
            },
            { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
          );
        } catch (confirmationError) {
          console.error("Profile submission member confirmation failed", confirmationError);
        }
      }
    }
    return { ok: true, submitted: data.submit };
  });

const HEADSHOT_BUCKET = "member-headshots";

export const setMyHeadshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ path: z.string().trim().min(1).max(300) }).parse(input))
  .handler(async ({ context, data }) => {
    if (!data.path.startsWith(`${context.userId}/`)) throw new Error("Invalid headshot path");
    const { data: member, error: memberError } = await context.supabase.from("portal_members").select("id").eq("user_id", context.userId).single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    const { error } = await context.supabase.from("portal_profiles").upsert({ member_id: member.id, headshot_path: data.path }, { onConflict: "member_id" });
    if (error) throw error;
    return { ok: true };
  });

export const getMyHeadshotUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { asMemberId?: string }) => z.object({ asMemberId: z.string().uuid().optional() }).parse(input ?? {}))
  .handler(async ({ context: ctx, data: input }) => {
    let context: any = ctx;
    if (input.asMemberId) {
      await assertAdmin(ctx);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      context = { supabase: supabaseAdmin };
    }
    const { data: member } = input.asMemberId
      ? await context.supabase.from("portal_members").select("id").eq("id", input.asMemberId).maybeSingle()
      : await context.supabase.from("portal_members").select("id").eq("user_id", ctx.userId).maybeSingle();
    if (!member) return { url: null };
    const { data: profile } = await context.supabase.from("portal_profiles").select("headshot_path").eq("member_id", member.id).maybeSingle();
    if (!profile?.headshot_path) return { url: null };
    const { data, error } = await context.supabase.storage.from(HEADSHOT_BUCKET).createSignedUrl(profile.headshot_path, 3600);
    if (error) return { url: null };
    return { url: data.signedUrl };
  });

const inquirySchema = z.object({ subject: z.string().trim().min(1).max(160), message: z.string().trim().min(10).max(4000) });
export const submitPortalInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inquirySchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: member, error: memberError } = await context.supabase.from("portal_members").select("id, email, first_name").eq("user_id", context.userId).single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    const { error } = await context.supabase.from("portal_inquiries").insert({ member_id: member.id, subject: data.subject, message: data.message });
    if (error) throw error;
    await context.supabase.from("portal_activity").insert({ member_id: member.id, actor_user_id: context.userId, event_type: "inquiry_submitted" });
    const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");
    const firstName = member.first_name?.trim() || "there";
    await sendPortalEmail(
      member.email,
      {
        subject: "We've received your question",
        eyebrow: "Message received",
        heading: `Thank you, ${firstName}. Your question has been received.`,
        body: `We've received your message "${data.subject}" and will respond to you privately and personally.\n\nYour message:\n${data.message}\n\nIf you'd like to add anything, simply reply to this email.`,
        ctaLabel: "Return to Your Welcome Center",
        ctaUrl: "https://access.prscstandards.org/portal",
        ctaSubtext: "Your Welcome Center shows your current status and any documents released to you.",
        signatures: founderSignature(),
      },
      "inquiry-member-autoreply",
    );
    return { ok: true };
  });

const inviteSchema = z.object({
  email: z.string().trim().email().max(200), first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80), organization: z.string().trim().min(1).max(180),
  title: z.string().trim().max(160), entity: entitySchema, role: roleSchema,
  why_you: z.string().trim().min(20).max(2000),
  is_methodology_committee: z.boolean().optional(),
});
function portalInviteRedirect(member: { first_name: string; entity: string; role: string }) {
  const url = new URL("https://access.prscstandards.org/accept-invitation");
  url.searchParams.set("first_name", member.first_name);
  url.searchParams.set("entity", member.entity);
  url.searchParams.set("role", member.role);
  return url.toString();
}
export const invitePortalMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inviteSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invitation, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: portalInviteRedirect(data),
      data: { first_name: data.first_name, last_name: data.last_name, entity: data.entity, role: data.role },
    });
    if (inviteError || !invitation.user) throw inviteError ?? new Error("Invitation could not be created");
    const { error: memberError } = await supabaseAdmin.from("portal_members").upsert({
      user_id: invitation.user.id, email: data.email.toLowerCase(), first_name: data.first_name,
      last_name: data.last_name, organization: data.organization, title: data.title || null,
      entity: data.entity, role: data.role, why_you: data.why_you, status: "invited",
      is_methodology_committee: data.is_methodology_committee ?? false,
    }, { onConflict: "email" });
    if (memberError) throw memberError;
    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({ user_id: invitation.user.id, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;
    return { ok: true };
  });

const importSchema = z.object({
  send_invitations: z.boolean(),
  rows: z.array(inviteSchema).min(1).max(200),
});
export const importPortalMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => importSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results: { email: string; ok: boolean; message: string }[] = [];

    for (const row of data.rows) {
      const email = row.email.toLowerCase();
      try {
        let userId: string | null = null;

        const { data: existingMember } = await supabaseAdmin
          .from("portal_members").select("user_id").eq("email", email).maybeSingle();
        if (existingMember?.user_id) userId = existingMember.user_id as string;

        if (!userId && data.send_invitations) {
          const { data: invitation, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: portalInviteRedirect(row),
            data: { first_name: row.first_name, last_name: row.last_name, entity: row.entity, role: row.role },
          });
          if (error || !invitation.user) throw error ?? new Error("Invitation could not be created");
          userId = invitation.user.id;
        }

        if (!userId) {
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email, email_confirm: false,
            user_metadata: { first_name: row.first_name, last_name: row.last_name },
          });
          if (error || !created.user) throw error ?? new Error("Member could not be staged");
          userId = created.user.id;
        }

        const { error: memberError } = await supabaseAdmin.from("portal_members").upsert({
          user_id: userId, email, first_name: row.first_name, last_name: row.last_name,
          organization: row.organization, title: row.title || null, entity: row.entity,
          role: row.role, why_you: row.why_you, status: "invited",
          is_methodology_committee: row.is_methodology_committee ?? false,
        }, { onConflict: "email" });
        if (memberError) throw memberError;

        const { error: roleError } = await supabaseAdmin
          .from("user_roles").upsert({ user_id: userId, role: row.role }, { onConflict: "user_id,role" });
        if (roleError) throw roleError;

        results.push({
          email,
          ok: true,
          message: data.send_invitations ? "Invitation sent" : "Added — invitation not sent yet",
        });
      } catch (error) {
        results.push({ email, ok: false, message: error instanceof Error ? error.message : "Could not be added" });
      }
    }

    return { results, added: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ data: members }, { data: inquiries }, { data: activity }, { data: profiles }, { data: acks }] = await Promise.all([
      context.supabase.from("portal_members").select("*").order("invited_at", { ascending: false }),
      context.supabase.from("portal_inquiries").select("*").order("created_at", { ascending: false }),
      context.supabase.from("portal_activity").select("*").order("created_at", { ascending: false }).limit(200),
      context.supabase.from("portal_profiles").select("member_id, current_stage, submitted_at, updated_at, preferred_name, professional_role, current_organization, preferred_email, preferred_phone, experience_answers, visibility_instructions, restriction_status, restriction_details, final_notes, questions"),
      context.supabase.from("portal_document_acknowledgements").select("member_id, document_id"),
    ]);
    const list = (members ?? []) as (PortalMember & { documents_released_at?: string | null; documents_completed_at?: string | null })[];
    const docProgress: Record<string, { total: number; done: number }> = {};
    await Promise.all(list.map(async (m) => {
      if (!m.documents_released_at) return;
      const docs = await applicableDocuments(context.supabase, m as unknown as DocMember);
      const done = new Set((acks ?? []).filter((a: any) => a.member_id === m.id).map((a: any) => a.document_id));
      docProgress[m.id] = { total: docs.length, done: docs.filter((d) => done.has(d.id)).length };
    }));
    return { members: list, inquiries: inquiries ?? [], activity: activity ?? [], profiles: profiles ?? [], docProgress };
  });

export const nudgeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");
    const { data: m } = await supabaseAdmin.from("portal_members")
      .select("id, email, first_name, entity, role, status, first_access_at, documents_released_at, documents_completed_at")
      .eq("id", data.member_id).single();
    if (!m) throw new Error("Member not found");
    if (m.status === "revoked") throw new Error("This member's access is revoked");
    const first = m.first_name?.trim() || "there";
    let kind: string;
    if (!m.first_access_at) {
      const redirectTo = new URL("https://access.prscstandards.org/accept-invitation");
      redirectTo.searchParams.set("first_name", m.first_name ?? "");
      redirectTo.searchParams.set("entity", m.entity);
      redirectTo.searchParams.set("role", m.role);
      const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: m.email, options: { redirectTo: redirectTo.toString() } });
      if (error || !link?.properties?.action_link) throw new Error("Could not create a fresh invitation link");
      await sendPortalEmail(m.email, {
        subject: "A reminder: your private Welcome Center is waiting", eyebrow: "Gentle reminder",
        heading: `${first}, your Welcome Center is ready for you.`,
        body: "We invited you into the private Board & Advisor Welcome Center and wanted to make sure the note reached you.\n\nIt only takes a few minutes: create your password, get reacquainted with where we are today, and share the few details we need to prepare your individualized package.",
        ctaLabel: "Access Your Private Welcome Center →", ctaUrl: link.properties.action_link,
        ctaSubtext: "This secure link lets you create your own password. No password is emailed.",
        signatures: founderSignature(),
      }, "nudge-invite");
      kind = "invitation";
    } else if (m.documents_released_at && !m.documents_completed_at) {
      await sendPortalEmail(m.email, {
        subject: "A reminder: your documents are waiting", eyebrow: "Gentle reminder",
        heading: `${first}, a few documents are still open.`,
        body: "Your individualized documents are ready in your private Welcome Center.\n\nSign in, open Your Documents, and read, initial, or sign each one right in the portal.",
        ctaLabel: "Review & Sign Your Documents", ctaUrl: "https://access.prscstandards.org/portal",
        signatures: founderSignature(),
      }, "nudge-documents");
      kind = "documents";
    } else {
      const { data: p } = await supabaseAdmin.from("portal_profiles").select("submitted_at").eq("member_id", m.id).maybeSingle();
      if (p?.submitted_at) throw new Error("Nothing is waiting on this member right now");
      await sendPortalEmail(m.email, {
        subject: "A reminder: your private profile", eyebrow: "Gentle reminder",
        heading: `${first}, your profile is almost there.`,
        body: "Your progress is saved. When you have a few minutes, sign in and finish your private profile so we can prepare your individualized package.",
        ctaLabel: "Complete Your Profile", ctaUrl: "https://access.prscstandards.org/portal/profile",
        signatures: founderSignature(),
      }, "nudge-profile");
      kind = "profile";
    }
    await supabaseAdmin.from("portal_activity").insert({ member_id: m.id, actor_user_id: context.userId, event_type: "nudge_sent", metadata: { kind } });
    return { ok: true, kind };
  });

export const getMemberDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: member, error } = await context.supabase
      .from("portal_members")
      .select("*")
      .eq("id", data.member_id)
      .single();
    if (error) throw error;
    const [{ data: profile }, { data: activity }, { data: inquiries }, { data: documents }, { data: acknowledgements }] = await Promise.all([
      context.supabase.from("portal_profiles").select("*").eq("member_id", data.member_id).maybeSingle(),
      context.supabase.from("portal_activity").select("id, event_type, metadata, created_at").eq("member_id", data.member_id).order("created_at", { ascending: false }).limit(25),
      context.supabase.from("portal_inquiries").select("id, subject, status, created_at").eq("member_id", data.member_id).order("created_at", { ascending: false }),
      context.supabase.from("portal_documents").select("id, member_id").or(`member_id.is.null,member_id.eq.${data.member_id}`),
      context.supabase.from("portal_document_acknowledgements").select("document_id, acknowledged_at").eq("member_id", data.member_id),
    ]);
    let headshotUrl: string | null = null;
    if (profile?.headshot_path) {
      const { data: signed } = await context.supabase.storage
        .from(HEADSHOT_BUCKET)
        .createSignedUrl(profile.headshot_path, 3600);
      headshotUrl = signed?.signedUrl ?? null;
    }
    return {
      member: member as PortalMember,
      profile: (profile ?? null) as PortalProfile | null,
      headshotUrl,
      journey: {
        activity: activity ?? [],
        inquiries: inquiries ?? [],
        documentCount: documents?.length ?? 0,
        acknowledgedDocumentCount: acknowledgements?.length ?? 0,
      },
    };
  });

export const setMemberAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ member_id: z.string().uuid(), status: z.enum(["invited", "active", "revoked"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("portal_members")
      .update({ status: data.status })
      .eq("id", data.member_id);
    if (error) throw error;
    await context.supabase.from("portal_activity").insert({
      member_id: data.member_id,
      actor_user_id: context.userId,
      event_type: data.status === "revoked" ? "access_revoked" : "access_restored",
      metadata: { status: data.status },
    });
    return { ok: true };
  });

export const deletePortalMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member, error: memberError } = await supabaseAdmin
      .from("portal_members")
      .select("user_id")
      .eq("id", data.member_id)
      .single();
    if (memberError || !member) throw memberError ?? new Error("Member not found");
    if (member.user_id === context.userId) throw new Error("The signed-in administrator cannot be deleted.");

    const [{ data: profile }, { data: documents }] = await Promise.all([
      supabaseAdmin.from("portal_profiles").select("headshot_path").eq("member_id", data.member_id).maybeSingle(),
      supabaseAdmin.from("portal_documents").select("file_path").eq("member_id", data.member_id),
    ]);
    if (profile?.headshot_path) {
      await supabaseAdmin.storage.from(HEADSHOT_BUCKET).remove([profile.headshot_path]);
    }
    const documentPaths = (documents ?? [])
      .map((document: { file_path: string | null }) => document.file_path)
      .filter((path: string | null): path is string => Boolean(path));
    if (documentPaths.length) {
      await supabaseAdmin.storage.from("member-documents").remove(documentPaths);
    }

    await supabaseAdmin.from("portal_activity").delete().eq("member_id", data.member_id);
    const { error: deleteError } = await supabaseAdmin.from("portal_members").delete().eq("id", data.member_id);
    if (deleteError) throw deleteError;
    await supabaseAdmin.from("user_roles").delete().eq("user_id", member.user_id);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(member.user_id);
    if (authError) throw authError;
    return { ok: true };
  });

export const setMemberPackageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        member_id: z.string().uuid(),
        package_status: z.enum(["awaiting_profile", "in_preparation", "profile_received", "package_ready"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("portal_members")
      .update({ package_status: data.package_status })
      .eq("id", data.member_id);
    if (error) throw error;
    await context.supabase.from("portal_activity").insert({
      member_id: data.member_id,
      actor_user_id: context.userId,
      event_type: "package_status_changed",
      metadata: { package_status: data.package_status },
    });
    return { ok: true };
  });

export const updateInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "resolved"]),
        admin_notes: z.string().trim().max(4000).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("portal_inquiries")
      .update({
        status: data.status,
        admin_notes: data.admin_notes || null,
        resolved_at: data.status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ---------------- Member documents ---------------- */

const DOCUMENT_BUCKET = "member-documents";
const ADMIN_EMAIL = "admin@readinessterminal.com";

export type PortalDocumentRecord = {
  id: string;
  member_id: string | null;
  category: "sign" | "read";
  action: "docusign" | "download" | "acknowledge" | "esign" | "boldsign";
  title: string;
  description: string;
  external_url: string | null;
  file_path: string | null;
  sort_order: number;
  created_at: string;
  audience_entity: "prsc" | "dis" | "both" | null;
  audience_role: "board_member" | "advisor" | null;
};

export type PortalCompletion = {
  document_id: string;
  kind: "acknowledged" | "signed";
  initials: string;
  signed_name: string | null;
  acknowledged_at: string;
};

type DocMember = { id: string; entity: string; role: string };

function appliesTo(doc: PortalDocumentRecord, m: DocMember) {
  if (doc.member_id) return doc.member_id === m.id;
  if (doc.audience_entity && doc.audience_entity !== "both" && m.entity !== "both" && doc.audience_entity !== m.entity) return false;
  if (doc.audience_entity === "both" && m.entity !== "both") return false;
  if (doc.audience_role) {
    const mixed = m.role === "prsc_board_dis_advisor" || m.role === "prsc_advisor_dis_board";
    if (!mixed && doc.audience_role !== m.role) return false;
  }
  return true;
}

async function applicableDocuments(supabase: any, member: DocMember) {
  const { data } = await supabase
    .from("portal_documents")
    .select("*")
    .or(`member_id.is.null,member_id.eq.${member.id}`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return ((data ?? []) as PortalDocumentRecord[]).filter((d) => appliesTo(d, member));
}

async function signDocumentUrls(documents: PortalDocumentRecord[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(
    documents.map(async (doc) => {
      if (!doc.file_path) return { ...doc, url: doc.external_url };
      const { data } = await supabaseAdmin.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.file_path, 900);
      return { ...doc, url: data?.signedUrl ?? null };
    }),
  );
}

export const getMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { asMemberId?: string }) => z.object({ asMemberId: z.string().uuid().optional() }).parse(input ?? {}))
  .handler(async ({ context: ctx, data: input }) => {
    let context: any = ctx;
    if (input.asMemberId) {
      await assertAdmin(ctx);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      context = { supabase: supabaseAdmin };
    }
    const { data: member } = await context.supabase
      .from("portal_members").select("id, entity, role, documents_released_at").eq(input.asMemberId ? "id" : "user_id", input.asMemberId ?? ctx.userId).maybeSingle();
    if (!member) return { memberId: null, released: false, documents: [], acknowledged: [] as string[], completions: [] as PortalCompletion[] };
    if (!member.documents_released_at) {
      return { memberId: member.id as string, released: false, documents: [], acknowledged: [] as string[], completions: [] as PortalCompletion[] };
    }
    const docs = await applicableDocuments(context.supabase, member as DocMember);
    const { data: acks } = await context.supabase
      .from("portal_document_acknowledgements")
      .select("document_id, kind, initials, signed_name, acknowledged_at")
      .eq("member_id", member.id);
    const completions = (acks ?? []) as PortalCompletion[];
    return {
      memberId: member.id as string,
      released: true,
      documents: await signDocumentUrls(docs),
      acknowledged: completions.map((a) => a.document_id),
      completions,
    };
  });

export async function maybeCompletePackage(member: { id: string; email: string; first_name: string | null; last_name: string | null; entity: string; role: string; documents_completed_at: string | null }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (member.documents_completed_at) return;
  const docs = await applicableDocuments(supabaseAdmin, member);
  if (!docs.length) return;
  const { data: acks } = await supabaseAdmin.from("portal_document_acknowledgements").select("document_id").eq("member_id", member.id);
  const done = new Set((acks ?? []).map((a: { document_id: string }) => a.document_id));
  // BoldSign/DocuSign documents count once the admin manually confirms them.
  const required = docs;
  if (!required.every((d) => done.has(d.id))) return;
  await supabaseAdmin
    .from("portal_members")
    .update({ documents_completed_at: new Date().toISOString(), package_status: "package_ready" })
    .eq("id", member.id);
  const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");
  const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || member.email;
  const list = required.map((d) => `• ${d.title} — ${d.category === "sign" ? "signed" : "acknowledged"}`).join("\n");
  await sendPortalEmail(
    ADMIN_EMAIL,
    {
      subject: `Documents complete: ${fullName}`,
      eyebrow: "Package complete",
      heading: `${fullName} has completed every document.`,
      body: `All released documents are now complete:\n\n${list}\n\nOpen the member record to review signatures and initials.`,
      ctaLabel: "Open Administrator Center",
      ctaUrl: "https://access.prscstandards.org/admin",
    },
    "documents-complete-admin",
  );
  await sendPortalEmail(
    member.email,
    {
      subject: "Thank you — your documents are complete",
      eyebrow: "Package complete",
      heading: `Thank you, ${member.first_name?.trim() || "there"}.`,
      body: "We've received every document in your package. There's nothing more you need to do right now.\n\nYour signed and acknowledged documents remain available inside your private Welcome Center. If you'd like a hard copy, use the Request a hard copy button on any document.",
      ctaLabel: "Return to Your Welcome Center",
      ctaUrl: "https://access.prscstandards.org/portal",
      signatures: founderSignature(),
    },
    "documents-complete-member",
  );
}

export const acknowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        document_id: z.string().uuid(),
        initials: z.string().trim().min(1).max(8),
        kind: z.enum(["acknowledged", "signed"]).default("acknowledged"),
        signed_name: z.string().trim().max(160).optional(),
        signature_data: z.string().max(200000).optional(),
        consent: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: member, error: memberError } = await context.supabase
      .from("portal_members")
      .select("id, email, first_name, last_name, entity, role, documents_released_at, documents_completed_at")
      .eq("user_id", context.userId)
      .single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    if (!member.documents_released_at) throw new Error("Documents have not been released yet");
    const docs = await applicableDocuments(context.supabase, member as DocMember);
    const doc = docs.find((d) => d.id === data.document_id);
    if (!doc) throw new Error("Document unavailable");
    if (data.kind === "signed") {
      if (!data.signed_name || data.signed_name.length < 2) throw new Error("Type your full legal name to sign");
      if (!data.signature_data?.startsWith("data:image/png;base64,")) throw new Error("Add your signature");
      if (!data.consent) throw new Error("Please agree to sign electronically");
    }
    const request = getRequest();
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const { error } = await context.supabase.from("portal_document_acknowledgements").insert({
      document_id: data.document_id,
      member_id: member.id,
      initials: data.initials.toUpperCase(),
      kind: data.kind,
      signed_name: data.kind === "signed" ? data.signed_name : null,
      signature_data: data.kind === "signed" ? data.signature_data : null,
      consent: data.consent,
      ip_address: ip,
      user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
    });
    if (error && error.code !== "23505") throw error;
    await context.supabase.from("portal_activity").insert({
      member_id: member.id, actor_user_id: context.userId,
      event_type: data.kind === "signed" ? "document_signed" : "document_acknowledged",
      metadata: { document_id: data.document_id, title: doc.title },
    });
    await maybeCompletePackage(member as any);
    return { ok: true };
  });

export const requestHardCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ document_id: z.string().uuid(), note: z.string().trim().max(600).default("") }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: member } = await context.supabase
      .from("portal_members").select("id, email, first_name, last_name, entity, role, documents_released_at").eq("user_id", context.userId).single();
    if (!member?.documents_released_at) throw new Error("Documents unavailable");
    const doc = (await applicableDocuments(context.supabase, member as DocMember)).find((d) => d.id === data.document_id);
    if (!doc) throw new Error("Document unavailable");
    const { data: profile } = await context.supabase
      .from("portal_profiles").select("preferred_email, preferred_phone").eq("member_id", member.id).maybeSingle();
    const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || member.email;
    const { sendPortalEmail } = await import("@/lib/portal-notify.server");
    await sendPortalEmail(
      ADMIN_EMAIL,
      {
        subject: `Hard copy requested: ${doc.title}`,
        eyebrow: "Hard copy request",
        heading: `${fullName} requested a hard copy.`,
        body: `Document: ${doc.title}\nMember: ${fullName} (${member.email})\nPreferred email: ${profile?.preferred_email || member.email}\nPreferred phone: ${profile?.preferred_phone || "Not provided"}${data.note ? `\n\nNote from the member:\n${data.note}` : ""}\n\nPlease send a hard copy of this document to the member.`,
        ctaLabel: "Open Administrator Center",
        ctaUrl: "https://access.prscstandards.org/admin",
      },
      "hard-copy-request-admin",
    );
    await context.supabase.from("portal_activity").insert({
      member_id: member.id, actor_user_id: context.userId,
      event_type: "hard_copy_requested", metadata: { document_id: doc.id, title: doc.title },
    });
    return { ok: true };
  });

export const listDocumentsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid().nullable().optional() }).parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let member: (DocMember & { documents_released_at: string | null; documents_completed_at: string | null }) | null = null;
    let documents: PortalDocumentRecord[];
    if (data.member_id) {
      const { data: m } = await context.supabase
        .from("portal_members").select("id, entity, role, documents_released_at, documents_completed_at").eq("id", data.member_id).maybeSingle();
      member = m;
      documents = m ? await applicableDocuments(context.supabase, m) : [];
    } else {
      const { data: all, error } = await context.supabase.from("portal_documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      documents = (all ?? []) as PortalDocumentRecord[];
    }
    let ackQuery = context.supabase
      .from("portal_document_acknowledgements")
      .select("id, document_id, member_id, initials, kind, signed_name, signature_data, ip_address, acknowledged_at, signed_copy_path, signed_copy_sent_at");
    if (data.member_id) ackQuery = ackQuery.eq("member_id", data.member_id);
    const { data: acks } = await ackQuery;
    let hardCopyRequests: string[] = [];
    if (data.member_id) {
      const { data: reqs } = await context.supabase
        .from("portal_activity").select("metadata").eq("member_id", data.member_id).eq("event_type", "hard_copy_requested");
      hardCopyRequests = (reqs ?? []).map((r: any) => r.metadata?.document_id).filter(Boolean);
    }
    let contact = { email: "", firstName: "" };
    if (data.member_id) {
      const { data: m } = await context.supabase.from("portal_members").select("email, first_name").eq("id", data.member_id).maybeSingle();
      const { data: pr } = await context.supabase.from("portal_profiles").select("preferred_email").eq("member_id", data.member_id).maybeSingle();
      contact = { email: pr?.preferred_email || m?.email || "", firstName: m?.first_name?.trim() || "" };
    }
    return {
      hardCopyRequests,
      contact,
      documents,
      acknowledgements: acks ?? [],
      releasedAt: member?.documents_released_at ?? null,
      completedAt: member?.documents_completed_at ?? null,
    };
  });

export const createMemberDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        member_id: z.string().uuid().nullable(),
        category: z.enum(["sign", "read"]),
        action: z.enum(["docusign", "download", "acknowledge", "esign", "boldsign"]),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(600).default(""),
        external_url: z.string().trim().url().max(600).nullable().optional(),
        file_path: z.string().trim().max(400).nullable().optional(),
        audience_entity: entitySchema.nullable().optional(),
        audience_role: z.enum(["board_member", "advisor"]).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (!data.external_url && !data.file_path) throw new Error("Upload a file or add a BoldSign link");
    if ((data.action === "esign" || data.action === "acknowledge") && !data.file_path) throw new Error("Upload the file so members can read it in the portal");
    const { error } = await context.supabase.from("portal_documents").insert({
      member_id: data.member_id,
      category: data.category,
      action: data.action,
      title: data.title,
      description: data.description,
      external_url: data.external_url || null,
      file_path: data.file_path || null,
      audience_entity: data.member_id ? null : data.audience_entity ?? null,
      audience_role: data.member_id ? null : data.audience_role ?? null,
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const releaseMemberDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: member } = await context.supabase
      .from("portal_members").select("id, email, first_name, entity, role, package_status").eq("id", data.member_id).single();
    if (!member) throw new Error("Member not found");
    const docs = await applicableDocuments(context.supabase, member as DocMember);
    if (!docs.length) throw new Error("Add at least one document before releasing");
    const { error } = await context.supabase
      .from("portal_members")
      .update({
        documents_released_at: new Date().toISOString(),
        documents_reminder_sent_at: null,
        documents_completed_at: null,
        package_status: "in_preparation",
      })
      .eq("id", member.id);
    if (error) throw error;
    const toSign = docs.filter((d) => d.category === "sign").length;
    const toRead = docs.length - toSign;
    const parts = [toSign ? `${toSign} to review and sign` : "", toRead ? `${toRead} to read and acknowledge` : ""].filter(Boolean).join(" and ");
    const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");
    await sendPortalEmail(
      member.email,
      {
        subject: "Action needed: your documents are ready",
        eyebrow: "Documents ready",
        heading: `${member.first_name?.trim() || "There"}, your documents are ready.`,
        body: `Your individualized package is now available in your private Welcome Center: ${docs.length} document${docs.length === 1 ? "" : "s"} — ${parts}.\n\nEverything is completed inside the portal. Open each document, read it, then initial or sign right there. It only takes a few minutes.`,
        ctaLabel: "Review & Sign Your Documents",
        ctaUrl: "https://access.prscstandards.org/portal",
        ctaSubtext: "Sign in with your email and the password you created.",
        signatures: founderSignature(),
      },
      "documents-ready-member",
    );
    await context.supabase.from("portal_activity").insert({ member_id: member.id, actor_user_id: context.userId, event_type: "documents_released", metadata: { count: docs.length } });
    return { ok: true, count: docs.length };
  });

export const deleteMemberDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("portal_documents").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const confirmExternalSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid(), document_id: z.string().uuid(), confirmed: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.confirmed) {
      await supabaseAdmin.from("portal_document_acknowledgements").delete()
        .eq("member_id", data.member_id).eq("document_id", data.document_id).eq("kind", "external_confirmed");
      await supabaseAdmin.from("portal_members").update({ documents_completed_at: null }).eq("id", data.member_id);
      await supabaseAdmin.from("portal_activity").insert({ member_id: data.member_id, actor_user_id: context.userId, event_type: "boldsign_unconfirmed", metadata: { document_id: data.document_id } });
      return { ok: true };
    }
    const { error } = await supabaseAdmin.from("portal_document_acknowledgements").insert({
      document_id: data.document_id, member_id: data.member_id, initials: "ADMIN",
      kind: "external_confirmed", consent: true, confirmed_by: context.userId,
    });
    if (error && error.code !== "23505") throw error;
    await supabaseAdmin.from("portal_activity").insert({
      member_id: data.member_id, actor_user_id: context.userId,
      event_type: "boldsign_confirmed", metadata: { document_id: data.document_id },
    });
    const { data: member } = await supabaseAdmin.from("portal_members")
      .select("id, email, first_name, last_name, entity, role, documents_completed_at").eq("id", data.member_id).single();
    if (member) await maybeCompletePackage(member as any);
    return { ok: true };
  });

export const prepareSignedCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ack_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ack } = await supabaseAdmin.from("portal_document_acknowledgements").select("*").eq("id", data.ack_id).single();
    if (!ack) throw new Error("Completion record not found");
    const { data: doc } = await supabaseAdmin.from("portal_documents").select("*").eq("id", ack.document_id).single();
    if (!doc?.file_path) throw new Error("This document has no portal PDF to copy");
    const { data: member } = await supabaseAdmin.from("portal_members").select("email, first_name, last_name").eq("id", ack.member_id).single();
    const { data: file, error: dlErr } = await supabaseAdmin.storage.from(DOCUMENT_BUCKET).download(doc.file_path);
    if (dlErr || !file) throw new Error("Could not load the original PDF");
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([612, 792]);
    const navy = rgb(0.06, 0.1, 0.2);
    const clean = (t: string) => t.replace(/[^\x20-\x7E]/g, "-");
    let y = 720;
    const line = (t: string, f = font, size = 11) => { page.drawText(clean(t), { x: 60, y, size, font: f, color: navy }); y -= size + 10; };
    line("Signature Certificate", bold, 20); y -= 6;
    line("Partnership Readiness Standards Council / Decision Intelligence Systems", font, 10); y -= 14;
    const fullName = `${member?.first_name ?? ""} ${member?.last_name ?? ""}`.trim();
    line(`Document: ${doc.title}`);
    line(`Member: ${fullName} (${member?.email ?? ""})`);
    line(`Action: ${ack.kind === "signed" ? "Signed electronically in the portal" : "Read and acknowledged in the portal"}`);
    if (ack.signed_name) line(`Signed name: ${ack.signed_name}`);
    line(`Initials: ${ack.initials}`);
    line(`Date and time (UTC): ${new Date(ack.acknowledged_at).toISOString().replace("T", " ").slice(0, 19)}`);
    if (ack.ip_address) line(`IP address: ${ack.ip_address}`);
    if (ack.consent) line("Consent to sign electronically: Yes");
    if (ack.signature_data?.startsWith("data:image/png;base64,")) {
      const png = await pdf.embedPng(ack.signature_data.split(",")[1]);
      const scale = Math.min(240 / png.width, 90 / png.height);
      y -= 100;
      page.drawText("Signature:", { x: 60, y: y + 100, size: 11, font: bold, color: navy });
      page.drawImage(png, { x: 60, y, width: png.width * scale, height: png.height * scale });
    }
    const bytes = await pdf.save();
    const path = `${ack.member_id}/signed/${ack.id}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage.from(DOCUMENT_BUCKET)
      .upload(path, new Blob([bytes as BlobPart], { type: "application/pdf" }), { upsert: true, contentType: "application/pdf" });
    if (upErr) throw upErr;
    await supabaseAdmin.from("portal_document_acknowledgements").update({ signed_copy_path: path }).eq("id", ack.id);
    const { data: signed } = await supabaseAdmin.storage.from(DOCUMENT_BUCKET).createSignedUrl(path, 900);
    return { ok: true, previewUrl: signed?.signedUrl ?? null };
  });

export const sendSignedCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    ack_id: z.string().uuid(),
    to: z.string().trim().email(),
    subject: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(4000),
  }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ack } = await supabaseAdmin.from("portal_document_acknowledgements").select("id, member_id, signed_copy_path").eq("id", data.ack_id).single();
    if (!ack?.signed_copy_path) throw new Error("Prepare the signed copy first");
    const { data: signed } = await supabaseAdmin.storage.from(DOCUMENT_BUCKET).createSignedUrl(ack.signed_copy_path, 60 * 60 * 24 * 7, { download: true });
    if (!signed?.signedUrl) throw new Error("Could not create the download link");
    const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");
    await sendPortalEmail(data.to, {
      subject: data.subject, eyebrow: "Your signed copy", heading: data.subject, body: data.body,
      ctaLabel: "Download Your Signed Copy", ctaUrl: signed.signedUrl,
      ctaSubtext: "This secure link expires in 7 days.", signatures: founderSignature(),
    }, "signed-copy-member");
    await supabaseAdmin.from("portal_document_acknowledgements").update({ signed_copy_sent_at: new Date().toISOString() }).eq("id", ack.id);
    await supabaseAdmin.from("portal_activity").insert({ member_id: ack.member_id, actor_user_id: context.userId, event_type: "signed_copy_sent", metadata: { ack_id: ack.id } });
    return { ok: true };
  });

const PORTAL_HOSTS = new Set(["access.prscstandards.org", "access.prscstandards.com"]);

export const getRequestHost = createServerFn({ method: "GET" })
  .handler(async () => {
    const request = getRequest();
    const host = request?.headers.get("host") ?? "";
    return { host, isPortalDomain: PORTAL_HOSTS.has(host.split(":")[0]) };
  });
