import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PortalMember = {
  id: string; user_id: string; email: string; first_name: string; last_name: string;
  professional_name: string | null; organization: string; title: string | null;
  entity: "prsc" | "dis" | "both"; role: "board_member" | "advisor";
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

const roleSchema = z.enum(["board_member", "advisor"]);
const entitySchema = z.enum(["prsc", "dis", "both"]);
const permissionSchema = z.enum(["yes", "discuss", "no"]);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

export const getPortalSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
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
        .select("id")
        .eq("member_id", member.id)
        .maybeSingle();
      hasProfile = Boolean(profile);
    }
    return { member: member as PortalMember | null, isAdmin: roleNames.includes("admin"), hasProfile };
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
    const { data: member, error: memberError } = await context.supabase.from("portal_members").select("id").eq("user_id", context.userId).single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    const payload = {
      member_id: member.id,
      current_stage: data.current_stage,
      preferred_name: data.preferred_name,
      professional_role: data.professional_role,
      current_organization: data.current_organization,
      preferred_email: data.preferred_email,
      preferred_phone: data.preferred_phone,
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
  .handler(async ({ context }) => {
    const { data: member } = await context.supabase.from("portal_members").select("id").eq("user_id", context.userId).maybeSingle();
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
    const { data: member, error: memberError } = await context.supabase.from("portal_members").select("id").eq("user_id", context.userId).single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    const { error } = await context.supabase.from("portal_inquiries").insert({ member_id: member.id, subject: data.subject, message: data.message });
    if (error) throw error;
    await context.supabase.from("portal_activity").insert({ member_id: member.id, actor_user_id: context.userId, event_type: "inquiry_submitted" });
    return { ok: true };
  });

const inviteSchema = z.object({
  email: z.string().trim().email().max(200), first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80), organization: z.string().trim().min(1).max(180),
  title: z.string().trim().max(160), entity: entitySchema, role: roleSchema,
  why_you: z.string().trim().min(20).max(2000),
});
export const invitePortalMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inviteSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invitation, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: "https://access.prscstandards.org/auth?mode=setup",
      data: { first_name: data.first_name, last_name: data.last_name },
    });
    if (inviteError || !invitation.user) throw inviteError ?? new Error("Invitation could not be created");
    const { error: memberError } = await supabaseAdmin.from("portal_members").upsert({
      user_id: invitation.user.id, email: data.email.toLowerCase(), first_name: data.first_name,
      last_name: data.last_name, organization: data.organization, title: data.title || null,
      entity: data.entity, role: data.role, why_you: data.why_you, status: "invited",
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
            redirectTo: "https://access.prscstandards.org/auth?mode=setup",
            data: { first_name: row.first_name, last_name: row.last_name },
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
    const [{ data: members }, { data: inquiries }, { data: activity }] = await Promise.all([
      context.supabase.from("portal_members").select("*").order("invited_at", { ascending: false }),
      context.supabase.from("portal_inquiries").select("*").order("created_at", { ascending: false }),
      context.supabase.from("portal_activity").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    return { members: (members ?? []) as PortalMember[], inquiries: inquiries ?? [], activity: activity ?? [] };
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
    const { data: profile } = await context.supabase
      .from("portal_profiles")
      .select("*")
      .eq("member_id", data.member_id)
      .maybeSingle();
    let headshotUrl: string | null = null;
    if (profile?.headshot_path) {
      const { data: signed } = await context.supabase.storage
        .from(HEADSHOT_BUCKET)
        .createSignedUrl(profile.headshot_path, 3600);
      headshotUrl = signed?.signedUrl ?? null;
    }
    return { member: member as PortalMember, profile: (profile ?? null) as PortalProfile | null, headshotUrl };
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

export type PortalDocumentRecord = {
  id: string;
  member_id: string | null;
  category: "sign" | "read";
  action: "docusign" | "download" | "acknowledge";
  title: string;
  description: string;
  external_url: string | null;
  file_path: string | null;
  sort_order: number;
  created_at: string;
};

async function signDocumentUrls(documents: PortalDocumentRecord[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(
    documents.map(async (doc) => {
      if (!doc.file_path) return { ...doc, url: doc.external_url };
      const { data } = await supabaseAdmin.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.file_path, 3600);
      return { ...doc, url: data?.signedUrl ?? null };
    }),
  );
}

export const getMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: member } = await context.supabase
      .from("portal_members").select("id").eq("user_id", context.userId).maybeSingle();
    if (!member) return { memberId: null, documents: [], acknowledged: [] as string[] };
    const { data: documents } = await context.supabase
      .from("portal_documents")
      .select("*")
      .or(`member_id.is.null,member_id.eq.${member.id}`)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    const { data: acks } = await context.supabase
      .from("portal_document_acknowledgements").select("document_id").eq("member_id", member.id);
    return {
      memberId: member.id as string,
      documents: await signDocumentUrls((documents ?? []) as PortalDocumentRecord[]),
      acknowledged: (acks ?? []).map((a: { document_id: string }) => a.document_id),
    };
  });

export const acknowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ document_id: z.string().uuid(), initials: z.string().trim().min(1).max(8) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: member, error: memberError } = await context.supabase
      .from("portal_members").select("id").eq("user_id", context.userId).single();
    if (memberError || !member) throw new Error("Member profile unavailable");
    const { error } = await context.supabase
      .from("portal_document_acknowledgements")
      .upsert(
        { document_id: data.document_id, member_id: member.id, initials: data.initials.toUpperCase() },
        { onConflict: "document_id,member_id" },
      );
    if (error) throw error;
    await context.supabase.from("portal_activity").insert({
      member_id: member.id, actor_user_id: context.userId,
      event_type: "document_acknowledged", metadata: { document_id: data.document_id },
    });
    return { ok: true };
  });

export const listDocumentsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid().nullable().optional() }).parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let query = context.supabase.from("portal_documents").select("*").order("created_at", { ascending: false });
    if (data.member_id) query = query.or(`member_id.is.null,member_id.eq.${data.member_id}`);
    const { data: documents, error } = await query;
    if (error) throw error;
    const { data: acks } = await context.supabase
      .from("portal_document_acknowledgements").select("document_id, member_id, initials, acknowledged_at");
    return { documents: (documents ?? []) as PortalDocumentRecord[], acknowledgements: acks ?? [] };
  });

export const createMemberDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        member_id: z.string().uuid().nullable(),
        category: z.enum(["sign", "read"]),
        action: z.enum(["docusign", "download", "acknowledge"]),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(600).default(""),
        external_url: z.string().trim().url().max(600).nullable().optional(),
        file_path: z.string().trim().max(400).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (!data.external_url && !data.file_path) throw new Error("Provide a signing link or upload a file");
    const { error } = await context.supabase.from("portal_documents").insert({
      member_id: data.member_id,
      category: data.category,
      action: data.action,
      title: data.title,
      description: data.description,
      external_url: data.external_url || null,
      file_path: data.file_path || null,
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
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

const PORTAL_HOSTS = new Set(["access.prscstandards.org", "access.prscstandards.com"]);

export const getRequestHost = createServerFn({ method: "GET" })
  .handler(async () => {
    const request = getRequest();
    const host = request?.headers.get("host") ?? "";
    return { host, isPortalDomain: PORTAL_HOSTS.has(host.split(":")[0]) };
  });
