import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import { roundOpen, needsReminder } from "@/lib/executive-questions";
import {
  FORUM_EMAILS,
  confirmedThroughPoll,
  forumEmailBlock,
  forumIdempotencyKey,
  type ForumEmailKey,
} from "@/lib/forum-communications";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

const KEYS = FORUM_EMAILS.map((d) => d.key) as [ForumEmailKey, ...ForumEmailKey[]];
const input = z.object({
  email_key: z.enum(KEYS),
  forum_key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/i),
  version: z.number().int().min(1).max(99),
  document_id: z.string().uuid().nullable().optional(),
  round_id: z.string().uuid().nullable().optional(),
  tokens: z.record(z.string().max(60), z.string().trim().max(300)).default({}),
});

async function evaluate(context: any, data: z.infer<typeof input>) {
  const [{ data: members }, docRes, { data: sent }] = await Promise.all([
    context.supabase
      .from("portal_members")
      .select(
        "id, first_name, last_name, email, status, participates_in_forum, nda_verified_at, forum_clearance_status",
      )
      .order("last_name"),
    data.document_id
      ? context.supabase
          .from("portal_documents")
          .select("id, title, classification, superseded_at, is_forum_prep, member_id")
          .eq("id", data.document_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    context.supabase
      .from("forum_communication_sends")
      .select("member_id, created_at")
      .eq("forum_key", data.forum_key)
      .eq("email_key", data.email_key)
      .eq("version", data.version),
  ]);
  const doc = docRes.data;
  // Question emails are tied to one open round: access, deadline and reminder rules come from it.
  const isQuestion = data.email_key === "input_requested" || data.email_key === "input_reminder";
  let round: any = null,
    responded = new Set<string>();
  if (isQuestion) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.round_id)
      round = (
        await supabaseAdmin
          .from("question_rounds")
          .select("*")
          .eq("id", data.round_id)
          .maybeSingle()
      ).data;
    const { data: resp } = round
      ? await supabaseAdmin
          .from("question_round_responses")
          .select("member_id")
          .eq("round_id", round.id)
      : { data: [] };
    responded = new Set((resp ?? []).map((r: any) => r.member_id));
  }
  const sentMap = new Map((sent ?? []).map((r: any) => [r.member_id, r.created_at]));
  // A confirmed Meetings poll already emailed its confirmation: the manual
  // Forum confirmation must not duplicate it for the same members.
  let confirmedPolls: { invited_member_ids: unknown }[] = [];
  if (data.email_key === "forum_confirmed") {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    confirmedPolls =
      (
        await supabaseAdmin
          .from("meeting_polls")
          .select("invited_member_ids")
          .eq("status", "confirmed")
      ).data ?? [];
  }
  const { memberVisibilityFlags } = await import("@/lib/portal.functions");
  const flagsById = new Map(
    await Promise.all(
      (members ?? []).map(async (m: any) => [m.id, await memberVisibilityFlags(m.id)] as const),
    ),
  );
  const rows = (members ?? []).map((m: any) => {
    let reason = forumEmailBlock(
      data.email_key,
      { ...m, ...(flagsById.get(m.id) ?? {}) },
      doc,
      false,
    );
    if (
      !reason &&
      data.email_key === "forum_confirmed" &&
      confirmedThroughPoll(m.id, confirmedPolls)
    )
      reason = "Meeting confirmation already sent from Meetings";
    if (!reason && doc?.member_id && doc.member_id !== m.id) reason = "No access to briefing";
    if (!reason && isQuestion) {
      if (!round) reason = "Choose the question round";
      else if (round.forum_key !== data.forum_key) reason = "Round belongs to another Forum";
      else if (!roundOpen(round)) reason = "Question round is not open";
      else if (
        data.email_key === "input_reminder" &&
        !needsReminder(responded.has(m.id) ? "done" : null)
      )
        reason = "Already responded";
    }
    return {
      id: m.id,
      member: m,
      name: `${m.first_name} ${m.last_name}`.trim(),
      email: m.email,
      reason,
      sent_at: sentMap.get(m.id) ?? null,
    };
  });
  if (isQuestion && round) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { memberRoundAccess } = await import("@/lib/executive-questions.functions");
    for (const r of rows)
      if (!r.reason) r.reason = (await memberRoundAccess(supabaseAdmin, r.member, round)) ?? null;
  }
  return rows.map(({ member: _m, ...r }: any) => r);
}

export const getForumRecipients = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => input.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: docs } = await context.supabase
      .from("portal_documents")
      .select("id, title, classification")
      .is("superseded_at", null)
      .order("created_at", { ascending: false });
    const { data: rounds } = await context.supabase
      .from("question_rounds")
      .select("id, title, forum_key, status, deadline")
      .order("created_at", { ascending: false });
    return {
      recipients: await evaluate(context, data),
      documents: docs ?? [],
      rounds: rounds ?? [],
    };
  });

export const sendForumEmail = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) =>
    input.extend({ member_ids: z.array(z.string().uuid()).min(1).max(200) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const def = FORUM_EMAILS.find((d) => d.key === data.email_key);
    if (!def) throw new Error("Email unavailable");
    if (!def.enabled) throw new Error(def.disabledReason ?? "This email is not yet available");
    const rows = await evaluate(context, data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPortalEmail, loadSystemEmail } = await import("@/lib/portal-notify.server");
    const build = await loadSystemEmail(data.email_key);
    let sent = 0,
      skipped = 0;
    for (const id of data.member_ids) {
      const r = rows.find((x: { id: string }) => x.id === id) as
        | { id: string; name: string; email: string; reason: string | null; sent_at: string | null }
        | undefined;
      if (!r || r.reason || r.sent_at) {
        skipped++;
        continue;
      }
      // Reserve the send first so a retry can never email the same person twice.
      const { error } = await supabaseAdmin.from("forum_communication_sends").insert({
        forum_key: data.forum_key,
        email_key: data.email_key,
        version: data.version,
        member_id: id,
        recipient_email: r.email,
        sent_by: context.userId,
      });
      if (error) {
        skipped++;
        continue;
      }
      const first = r.name.split(" ")[0] || "there";
      const ok = await sendPortalEmail(
        r.email,
        build({ ...data.tokens, first_name: first }),
        `forum-${data.email_key}`,
        forumIdempotencyKey(data.forum_key, data.email_key, data.version, id),
      );
      if (!ok) {
        await supabaseAdmin
          .from("forum_communication_sends")
          .update({ status: "failed" })
          .eq("forum_key", data.forum_key)
          .eq("email_key", data.email_key)
          .eq("version", data.version)
          .eq("member_id", id);
        skipped++;
        continue;
      }
      await supabaseAdmin.from("portal_activity").insert({
        member_id: id,
        actor_user_id: context.userId,
        event_type: "forum_email_sent",
        metadata: { email_key: data.email_key, forum_key: data.forum_key, version: data.version },
      });
      sent++;
    }
    return { sent, skipped };
  });

/** Member records their own non-legal orientation review. The time is set by the server. */
export const acknowledgeOrientation = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin
      .from("portal_members")
      .select("id, orientation_acknowledged_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!m) throw new Error("Member not found");
    if (m.orientation_acknowledged_at) return { acknowledged_at: m.orientation_acknowledged_at };
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("portal_members")
      .update({ orientation_acknowledged_at: now })
      .eq("id", m.id)
      .is("orientation_acknowledged_at", null);
    if (error) throw error;
    await supabaseAdmin.from("portal_activity").insert({
      member_id: m.id,
      actor_user_id: context.userId,
      event_type: "orientation_reviewed",
      metadata: {},
    });
    return { acknowledged_at: now };
  });
