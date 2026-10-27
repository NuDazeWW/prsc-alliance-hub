import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import { documentVisible } from "@/lib/governance";
import { questionAccessBlock, roundOpen, validateQuestions, shareBlock, QUESTION_CATEGORIES, ROUTES } from "@/lib/executive-questions";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

const MEMBER_COLS = "id, status, participates_in_forum, nda_verified_at, forum_clearance_status, is_candidate";

/** Server-side access check for one member and round; uses the privileged client after identity is fixed by the session. */
export async function memberRoundAccess(admin: any, member: any, round: any) {
  let hasBriefing = false;
  if (round.briefing_document_id) {
    const { data: doc } = await admin.from("portal_documents").select("id, classification, superseded_at, is_forum_prep, member_id, journey_stage").eq("id", round.briefing_document_id).maybeSingle();
    hasBriefing = Boolean(doc) && (!doc.member_id || doc.member_id === member.id) && documentVisible({ ...doc, member_specific: Boolean(doc.member_id) }, member, false);
  }
  return questionAccessBlock(member, hasBriefing);
}

// ---------------- Member ----------------

export const getMyQuestionRounds = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin.from("portal_members").select(MEMBER_COLS).eq("user_id", context.userId).maybeSingle();
    if (!member) return { rounds: [] };
    const { data: rounds } = await supabaseAdmin.from("question_rounds").select("id, forum_key, title, opens_at, deadline, status, briefing_document_id").neq("status", "draft").order("opens_at", { ascending: false });
    const out = [];
    for (const r of rounds ?? []) {
      if (await memberRoundAccess(supabaseAdmin, member, r)) continue; // never reveal rounds the member cannot use
      const [{ data: qs }, { data: resp }] = await Promise.all([
        supabaseAdmin.from("executive_questions").select("priority, question, why_it_matters, source, context, updated_at").eq("round_id", r.id).eq("member_id", member.id).order("priority"),
        supabaseAdmin.from("question_round_responses").select("status, updated_at").eq("round_id", r.id).eq("member_id", member.id).maybeSingle(),
      ]);
      out.push({ id: r.id, forum_key: r.forum_key, title: r.title, opens_at: r.opens_at, deadline: r.deadline, open: roundOpen(r), questions: qs ?? [], response: resp ?? null });
    }
    return { rounds: out };
  });

const qSchema = z.object({
  priority: z.number().int().min(1).max(3),
  question: z.string().trim().min(1).max(1000),
  why_it_matters: z.string().trim().min(1).max(1000),
  source: z.enum(["jared", "internal", "external"]),
  context: z.string().trim().max(2000).nullable().optional(),
});

export const saveMyQuestions = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({ round_id: z.string().uuid(), no_questions: z.boolean().default(false), questions: z.array(qSchema).max(3).default([]) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin.from("portal_members").select(MEMBER_COLS).eq("user_id", context.userId).maybeSingle();
    if (!member) throw new Error("Member not found");
    const { data: round } = await supabaseAdmin.from("question_rounds").select("*").eq("id", data.round_id).maybeSingle();
    if (!round) throw new Error("Question round not found");
    const block = await memberRoundAccess(supabaseAdmin, member, round);
    if (block) throw new Error(block);
    if (!roundOpen(round)) throw new Error("This question round is closed");
    const qs = data.no_questions ? [] : data.questions;
    if (!data.no_questions && qs.length === 0) throw new Error("Add at least one question or choose No additional questions");
    const invalid = validateQuestions(qs);
    if (invalid) throw new Error(invalid);
    await supabaseAdmin.from("executive_questions").delete().eq("round_id", round.id).eq("member_id", member.id).not("priority", "in", `(${qs.map((q) => q.priority).join(",") || 0})`);
    if (qs.length) {
      const { error } = await supabaseAdmin.from("executive_questions").upsert(
        qs.map((q) => ({ round_id: round.id, member_id: member.id, priority: q.priority, question: q.question, why_it_matters: q.why_it_matters, source: q.source, context: q.context || null, updated_at: new Date().toISOString() })),
        { onConflict: "round_id,member_id,priority" },
      );
      if (error) throw error;
    }
    const status = data.no_questions ? "no_questions" : "submitted";
    await supabaseAdmin.from("question_round_responses").upsert({ round_id: round.id, member_id: member.id, status, updated_at: new Date().toISOString() });
    await supabaseAdmin.from("portal_activity").insert({ member_id: member.id, actor_user_id: context.userId, event_type: "executive_questions_saved", metadata: { round_id: round.id, status, count: qs.length } });
    return { status };
  });

// ---------------- Admin register ----------------

export const getQuestionRegister = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({ round_id: z.string().uuid().nullable().optional() }).parse(i ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [{ data: rounds }, { data: docs }] = await Promise.all([
      sb.from("question_rounds").select("*").order("created_at", { ascending: false }),
      sb.from("portal_documents").select("id, title, classification").is("superseded_at", null).order("created_at", { ascending: false }),
    ]);
    const roundId = data.round_id ?? rounds?.[0]?.id ?? null;
    if (!roundId) return { rounds: rounds ?? [], documents: docs ?? [], roundId, questions: [], groups: [], responses: [], outbound: [] };
    const [q, g, r, o] = await Promise.all([
      sb.from("executive_questions").select("*, portal_members(first_name, last_name)").eq("round_id", roundId).order("created_at"),
      sb.from("question_groups").select("*").eq("round_id", roundId).order("created_at"),
      sb.from("question_round_responses").select("member_id, status, updated_at, portal_members(first_name, last_name)").eq("round_id", roundId),
      sb.from("question_outbound").select("*").eq("round_id", roundId).order("created_at", { ascending: false }),
    ]);
    return { rounds: rounds ?? [], documents: docs ?? [], roundId, questions: q.data ?? [], groups: g.data ?? [], responses: r.data ?? [], outbound: o.data ?? [] };
  });

export const saveQuestionRound = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({
    id: z.string().uuid().nullable().optional(),
    forum_key: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/i),
    title: z.string().trim().min(1).max(200),
    opens_at: z.string().datetime(),
    deadline: z.string().datetime(),
    status: z.enum(["draft", "open", "closed"]),
    briefing_document_id: z.string().uuid().nullable().optional(),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (new Date(data.deadline) <= new Date(data.opens_at)) throw new Error("The deadline must be after the opening date");
    if (data.status === "open" && !data.briefing_document_id) throw new Error("Choose the approved strategic briefing before opening the round");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { forum_key: data.forum_key, title: data.title, opens_at: data.opens_at, deadline: data.deadline, status: data.status, briefing_document_id: data.briefing_document_id ?? null };
    const res = data.id
      ? await supabaseAdmin.from("question_rounds").update(row).eq("id", data.id).select("id").single()
      : await supabaseAdmin.from("question_rounds").insert({ ...row, created_by: context.userId }).select("id").single();
    if (res.error) throw res.error;
    return { id: res.data.id };
  });

export const saveQuestionGroup = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({
    id: z.string().uuid().nullable().optional(),
    round_id: z.string().uuid(),
    consolidated_text: z.string().trim().min(1).max(2000),
    category: z.enum(QUESTION_CATEGORIES),
    source: z.enum(["jared", "internal", "external"]),
    route: z.enum(ROUTES).nullable().optional(),
    priority: z.number().int().min(1).max(3).nullable().optional(),
    review_status: z.enum(["new", "in_review", "approved_external", "internal_only", "verify", "closed"]),
    list_target: z.enum(["none", "jared", "internal"]),
    question_ids: z.array(z.string().uuid()).default([]),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, question_ids, ...row } = data;
    const res = id
      ? await supabaseAdmin.from("question_groups").update(row).eq("id", id).select("id").single()
      : await supabaseAdmin.from("question_groups").insert(row).select("id").single();
    if (res.error) throw res.error;
    // Original questions and contributors are kept; only their group link changes.
    if (question_ids.length) await supabaseAdmin.from("executive_questions").update({ group_id: res.data.id }).in("id", question_ids).eq("round_id", data.round_id);
    return { id: res.data.id };
  });

export const prepareOutbound = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({ round_id: z.string().uuid(), recipient: z.string().trim().min(1).max(200) }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: groups } = await supabaseAdmin.from("question_groups").select("id, consolidated_text, category, priority").eq("round_id", data.round_id).eq("list_target", "jared").order("priority");
    if (!groups?.length) throw new Error("No questions are marked for the Jared list yet");
    const { data: row, error } = await supabaseAdmin.from("question_outbound").insert({ round_id: data.round_id, recipient: data.recipient, questions: groups, prepared_by: context.userId }).select("id").single();
    if (error) throw error;
    return { id: row.id };
  });

export const updateOutbound = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({ id: z.string().uuid(), action: z.enum(["approve", "mark_shared", "record"]), responses: z.string().max(10000).optional(), unresolved: z.string().max(5000).optional() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin.from("question_outbound").select("*").eq("id", data.id).maybeSingle();
    if (!o) throw new Error("Not found");
    const now = new Date().toISOString();
    let patch: any = {};
    if (data.action === "approve") patch = { approved_by: context.userId, approved_at: now };
    if (data.action === "mark_shared") { const b = shareBlock(o); if (b) throw new Error(b); patch = { shared_at: now }; }
    if (data.action === "record") patch = { responses: data.responses ?? o.responses, unresolved: data.unresolved ?? o.unresolved };
    const { error } = await supabaseAdmin.from("question_outbound").update(patch).eq("id", data.id);
    if (error) throw error;
    await supabaseAdmin.from("portal_activity").insert({ member_id: null, actor_user_id: context.userId, event_type: `question_outbound_${data.action}`, metadata: { outbound_id: data.id } });
    return { ok: true };
  });
