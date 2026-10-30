import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import { forumReviewChecklist, POST_CLEARANCE_FORUM_ROLES, roleCombinationTier, stage1ClearanceProblems } from "@/lib/governance";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

const memberId = z.object({ member_id: z.string().uuid() });

export const getMemberGovernance = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: m, error } = await context.supabase
      .from("portal_members")
      .select("id, entity, role, is_methodology_committee, participates_in_forum, nda_verified_at, nda_verified_by, nda_reference, nda_entities, nda_scope, role_review_status, forum_clearance_status, forum_cleared_at, forum_restrictions, prsc_activated_at, dis_activated_at, prsc_appointment_ref, dis_appointment_ref")
      .eq("id", data.member_id).single();
    if (error) throw error;
    const [{ data: reviews }, { data: conflicts }] = await Promise.all([
      context.supabase.from("governance_reviews").select("*").eq("member_id", data.member_id).order("created_at", { ascending: false }),
      context.supabase.from("portal_document_acknowledgements").select("document_id, conflict_answer, conflict_details, acknowledged_at").eq("member_id", data.member_id).not("conflict_answer", "is", null),
    ]);
    const combo = roleCombinationTier(m.entity, m.role, m.is_methodology_committee);
    return { member: m, reviews: reviews ?? [], conflicts: conflicts ?? [], combination: combo };
  });

async function log(context: any, member_id: string, kind: string, decision: string, notes: string | null, details: Record<string, unknown>) {
  const { error } = await context.supabase.from("governance_reviews").insert({ member_id, kind, decision, reviewer_id: context.userId, notes, details });
  if (error) throw error;
  await context.supabase.from("portal_activity").insert({ member_id, actor_user_id: context.userId, event_type: `governance_${kind}`, metadata: { decision, ...details } });
}

export const recordNdaVerification = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.extend({
    reference: z.string().trim().min(3).max(400),
    entities: z.enum(["prsc", "dis", "both"]),
    scope: z.string().trim().min(3).max(600),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const now = new Date().toISOString();
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await sbAdmin.from("portal_members").update({
      nda_verified_at: now, nda_verified_by: context.userId, nda_reference: data.reference, nda_entities: data.entities, nda_scope: data.scope,
    }).eq("id", data.member_id);
    if (error) throw error;
    await log(context, data.member_id, "nda", "verified", data.reference, { entities: data.entities, scope: data.scope });
    return { ok: true };
  });

export const recordRoleReview = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.extend({
    decision: z.enum(["approved", "declined"]),
    notes: z.string().trim().min(5).max(2000),
    prsc_scope: z.string().trim().max(1000).default(""),
    dis_scope: z.string().trim().max(1000).default(""),
    conflict_controls: z.string().trim().max(1000).default(""),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: m } = await context.supabase.from("portal_members").select("entity, role, is_methodology_committee").eq("id", data.member_id).single();
    if (!m) throw new Error("Member not found");
    const combo = roleCombinationTier(m.entity, m.role, m.is_methodology_committee);
    if (combo.tier === "prohibited") throw new Error(`This combination is prohibited (${combo.clause}). It cannot be approved by an administrator.`);
    if (combo.tier === "none") throw new Error("This member's role needs no combination review");
    if (data.decision === "approved" && (data.prsc_scope.length < 3 || data.dis_scope.length < 3 || data.conflict_controls.length < 3))
      throw new Error("Approval needs a separate engagement scope for each entity and the conflict controls applied");
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await sbAdmin.from("portal_members").update({ role_review_status: data.decision }).eq("id", data.member_id);
    if (error) throw error;
    await log(context, data.member_id, "role_combination", data.decision, data.notes, { prsc_scope: data.prsc_scope, dis_scope: data.dis_scope, conflict_controls: data.conflict_controls });
    return { ok: true };
  });

export const recordForumClearance = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.extend({
    decision: z.enum(["cleared", "cleared_restricted", "escalated", "declined"]),
    disclosures_reviewed: z.literal(true),
    restrictions_reviewed: z.literal(true),
    meeting_eligibility: z.string().trim().min(3).max(400),
    restrictions: z.string().trim().max(2000).default(""),
    notes: z.string().trim().max(2000).default(""),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin: sbRead } = await import("@/integrations/supabase/client.server");
    const { data: m } = await sbRead.from("portal_members").select("nda_verified_at").eq("id", data.member_id).single();
    if ((data.decision === "cleared" || data.decision === "cleared_restricted") && !m?.nda_verified_at) throw new Error("Verify the NDA before clearing for the Forum");
    if (data.decision === "cleared" || data.decision === "cleared_restricted") {
      const problems = await clearanceProblemsFor(data.member_id);
      if (problems.length) throw new Error(`Clearance prerequisites incomplete: ${problems.join("; ")}`);
    }
    if (data.decision === "cleared_restricted" && data.restrictions.length < 3) throw new Error("List the restrictions that apply");
    const cleared = data.decision === "cleared" || data.decision === "cleared_restricted";
    // The clearance columns are not writable by a signed-in browser session (column permissions), so the write goes through the
    // server after assertAdmin has verified the caller is an administrator.
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await sbAdmin.from("portal_members").update({
      forum_clearance_status: data.decision,
      forum_cleared_at: cleared ? new Date().toISOString() : null,
      forum_cleared_by: cleared ? context.userId : null,
      forum_restrictions: data.restrictions || null,
    }).eq("id", data.member_id);
    if (error) throw error;
    await log(context, data.member_id, "forum_clearance", data.decision, data.notes || null, { meeting_eligibility: data.meeting_eligibility, restrictions: data.restrictions, nda_verified: true, disclosures_reviewed: true });
    return { ok: true };
  });

export const updateDocumentGovernance = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({
    document_id: z.string().uuid(),
    classification: z.enum(["general_orientation", "confidential_forum", "restricted_opportunity", "entity_confidential", "secretariat_only"]).optional(),
    is_forum_prep: z.boolean().optional(),
    superseded: z.boolean().optional(),
    third_party_permission: z.string().trim().max(1000).optional(),
    forum_role: z.enum(["addendum", "protocol", "pre_read", "conflict", "agenda", "restricted_brief", "secretariat_controls", "facilitator_run_of_show"]).nullable().optional(),
    signing_approved: z.boolean().optional(),
    boldsign_template_id: z.string().trim().max(200).nullable().optional(),
    countersignature_required: z.boolean().optional(),
    title: z.string().trim().min(3).max(200).optional(),
    sort_order: z.number().int().min(0).max(999).optional(),
    version_label: z.string().trim().max(60).nullable().optional(),
    file_path: z.string().trim().min(5).max(400).regex(/^[A-Za-z0-9/_.\-]+\.pdf$/i).refine(v => !v.includes(".."), "Invalid file path").optional(),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.classification === "restricted_opportunity" && !data.third_party_permission)
      throw new Error("Record the source's permission before classifying material as Restricted Opportunity");
    const patch: { classification?: string; classification_reviewed_at?: string; is_forum_prep?: boolean; superseded_at?: string | null; forum_role?: string | null; signing_approved?: boolean; boldsign_template_id?: string | null; countersignature_required?: boolean; title?: string; sort_order?: number; version_label?: string | null; file_path?: string } = {};
    if (data.file_path !== undefined) patch.file_path = data.file_path;
    if (data.title !== undefined) patch.title = data.title;
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
    if (data.version_label !== undefined) patch.version_label = data.version_label;
    if (data.forum_role !== undefined) patch.forum_role = data.forum_role;
    if (data.forum_role === "secretariat_controls" || data.forum_role === "facilitator_run_of_show") { patch.classification = "secretariat_only"; patch.classification_reviewed_at = new Date().toISOString(); }
    if (data.signing_approved != null) patch.signing_approved = data.signing_approved;
    if (data.boldsign_template_id !== undefined) patch.boldsign_template_id = data.boldsign_template_id;
    if (data.countersignature_required != null) patch.countersignature_required = data.countersignature_required;
    if (data.classification) { patch.classification = data.classification; patch.classification_reviewed_at = new Date().toISOString(); }
    if (data.is_forum_prep != null) patch.is_forum_prep = data.is_forum_prep;
    if (data.superseded != null) patch.superseded_at = data.superseded ? new Date().toISOString() : null;
    const { data: doc, error } = await context.supabase.from("portal_documents").update(patch).eq("id", data.document_id).select("member_id, title").single();
    if (error) throw error;
    if (doc?.member_id) {
      await context.supabase.from("portal_activity").insert({ member_id: doc.member_id, actor_user_id: context.userId, event_type: "document_governance_updated", metadata: { document_id: data.document_id, ...patch, permission: data.third_party_permission ?? null } });
      if (data.third_party_permission) await context.supabase.from("governance_reviews").insert({ member_id: doc.member_id, kind: "third_party_permission", decision: "confirmed", reviewer_id: context.userId, notes: data.third_party_permission, details: { document_id: data.document_id, title: doc.title } });
    }
    return { ok: true };
  });

/** Records an administrator reviews before Forum clearance, read once and shared by the checks below. */
async function clearanceRecords(memberId: string) {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { memberVisibilityFlags, appliesTo } = await import("@/lib/portal.functions");
  const [{ data: m }, { data: docs }, { data: acks }, { data: assignments }, { data: reviews }] = await Promise.all([
    sb.from("portal_members").select("*").eq("id", memberId).single(),
    sb.from("portal_documents").select("*").eq("journey_stage", 1).is("superseded_at", null),
    sb.from("portal_document_acknowledgements").select("document_id").eq("member_id", memberId),
    sb.from("boldsign_assignments").select("document_id, status").eq("member_id", memberId),
    sb.from("governance_reviews").select("decision, created_at").eq("member_id", memberId).eq("kind", "conflict_review").order("created_at", { ascending: false }).limit(1),
  ]);
  if (!m) throw new Error("Member not found");
  const flags = await memberVisibilityFlags(memberId);
  const done = new Set((acks ?? []).map((a) => a.document_id));
  const applicable = (docs ?? []).filter((d: any) => appliesTo(d, m as any) && !POST_CLEARANCE_FORUM_ROLES.includes(d.forum_role ?? ""));
  const conflictDocs = applicable.filter((d: any) => d.forum_role === "conflict");
  const conflictSigned = conflictDocs.length > 0 && conflictDocs.every((d) => (assignments ?? []).some((a) => a.document_id === d.id && a.status === "completed"));
  return { m, flags, done, applicable, conflictDocs, conflictSigned, conflictReviewDecision: reviews?.[0]?.decision ?? null };
}

/** Prerequisites for ordinary Forum clearance, computed from records only. */
export async function clearanceProblemsFor(memberId: string) {
  const r = await clearanceRecords(memberId);
  return stage1ClearanceProblems({
    ndaVerified: !!r.m.nda_verified_at,
    addendumComplete: r.flags.addendum_complete,
    incompleteStage1: r.applicable.filter((d) => !r.done.has(d.id)).map((d) => d.title),
    conflictSigned: r.conflictSigned,
    conflictReviewDecision: r.conflictReviewDecision,
  });
}

/** One consolidated, read-only review of the recorded prerequisites. It never records or implies a decision. */
export async function clearanceChecklistFor(memberId: string) {
  const r = await clearanceRecords(memberId);
  const count = (role: string) => {
    const ds = r.applicable.filter((d: any) => d.forum_role === role);
    return { assigned: ds.length, done: ds.filter((d) => r.done.has(d.id)).length };
  };
  return forumReviewChecklist({
    ndaVerified: !!r.m.nda_verified_at,
    addendum: { approved: r.applicable.filter((d: any) => d.forum_role === "addendum" && d.signing_approved).length, complete: r.flags.addendum_complete },
    protocol: count("protocol"),
    preRead: count("pre_read"),
    conflict: { assigned: r.conflictDocs.length, signed: r.conflictSigned },
    conflictReviewDecision: r.conflictReviewDecision,
    clearanceStatus: (r.m as any).forum_clearance_status,
    restrictions: (r.m as any).forum_restrictions,
  });
}

export const getClearancePrerequisites = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return { problems: await clearanceProblemsFor(data.member_id), review: await clearanceChecklistFor(data.member_id) };
  });

/** Independent administrative conflict-review decision. It never grants clearance by itself. */
export const recordConflictReview = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.extend({ decision: z.enum(["approved", "declined", "hold"]), notes: z.string().trim().max(2000).default("") }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await log(context, data.member_id, "conflict_review", data.decision, data.notes || null, {});
    return { ok: true };
  });

export const grantRestrictedDocument = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.extend({ document_id: z.string().uuid(), reason: z.string().trim().min(5).max(1000) }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await sb.from("portal_documents").select("id, classification, superseded_at, version_label, title").eq("id", data.document_id).single();
    if (!doc || doc.classification !== "restricted_opportunity") throw new Error("Only Restricted Opportunity documents use individual grants");
    if (doc.superseded_at) throw new Error("This version has been superseded");
    const { error } = await sb.from("restricted_document_grants").insert({ document_id: doc.id, member_id: data.member_id, version_label: doc.version_label, granted_by: context.userId, reason: data.reason });
    if (error?.code === "23505") throw new Error("This member already has an active grant for this document");
    if (error) throw error;
    await log(context, data.member_id, "restricted_grant", "granted", data.reason, { document_id: doc.id, title: doc.title, version: doc.version_label });
    return { ok: true };
  });

export const revokeRestrictedDocument = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.extend({ document_id: z.string().uuid(), reason: z.string().trim().min(5).max(1000) }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { error } = await sb.from("restricted_document_grants").update({ revoked_at: new Date().toISOString(), revoked_by: context.userId }).eq("document_id", data.document_id).eq("member_id", data.member_id).is("revoked_at", null);
    if (error) throw error;
    await log(context, data.member_id, "restricted_grant", "revoked", data.reason, { document_id: data.document_id });
    return { ok: true };
  });

export const listRestrictedGrants = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => memberId.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: rows } = await context.supabase.from("restricted_document_grants").select("document_id, version_label, granted_at, revoked_at").eq("member_id", data.member_id).is("revoked_at", null);
    return { grants: rows ?? [] };
  });

export const listRestrictedDocuments = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("portal_documents").select("id, title, version_label").eq("classification", "restricted_opportunity").is("superseded_at", null);
    return { documents: data ?? [] };
  });
