import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { roleCombinationTier } from "@/lib/governance";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

const memberId = z.object({ member_id: z.string().uuid() });

export const getMemberGovernance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => memberId.extend({
    reference: z.string().trim().min(3).max(400),
    entities: z.enum(["prsc", "dis", "both"]),
    scope: z.string().trim().min(3).max(600),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const now = new Date().toISOString();
    const { error } = await context.supabase.from("portal_members").update({
      nda_verified_at: now, nda_verified_by: context.userId, nda_reference: data.reference, nda_entities: data.entities, nda_scope: data.scope,
    }).eq("id", data.member_id);
    if (error) throw error;
    await log(context, data.member_id, "nda", "verified", data.reference, { entities: data.entities, scope: data.scope });
    return { ok: true };
  });

export const recordRoleReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
    const { error } = await context.supabase.from("portal_members").update({ role_review_status: data.decision }).eq("id", data.member_id);
    if (error) throw error;
    await log(context, data.member_id, "role_combination", data.decision, data.notes, { prsc_scope: data.prsc_scope, dis_scope: data.dis_scope, conflict_controls: data.conflict_controls });
    return { ok: true };
  });

export const recordForumClearance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
    const { data: m } = await context.supabase.from("portal_members").select("nda_verified_at").eq("id", data.member_id).single();
    if ((data.decision === "cleared" || data.decision === "cleared_restricted") && !m?.nda_verified_at) throw new Error("Verify the NDA before clearing for the Forum");
    if (data.decision === "cleared_restricted" && data.restrictions.length < 3) throw new Error("List the restrictions that apply");
    const cleared = data.decision === "cleared" || data.decision === "cleared_restricted";
    const { error } = await context.supabase.from("portal_members").update({
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
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    document_id: z.string().uuid(),
    classification: z.enum(["general_orientation", "confidential_forum", "restricted_opportunity", "entity_confidential", "secretariat_only"]).optional(),
    is_forum_prep: z.boolean().optional(),
    superseded: z.boolean().optional(),
    third_party_permission: z.string().trim().max(1000).optional(),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.classification === "restricted_opportunity" && !data.third_party_permission)
      throw new Error("Record the source's permission before classifying material as Restricted Opportunity");
    const patch: Record<string, unknown> = {};
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
