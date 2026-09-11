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
    return { member: member as PortalMember | null, isAdmin: roleNames.includes("admin") };
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
  why_you: z.string().trim().min(1).max(2000),
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

const PORTAL_HOSTS = new Set(["access.prscstandards.org", "access.prscstandards.com"]);

export const getRequestHost = createServerFn({ method: "GET" })
  .handler(async () => {
    const request = getRequest();
    const host = request?.headers.get("host") ?? "";
    return { host, isPortalDomain: PORTAL_HOSTS.has(host.split(":")[0]) };
  });
