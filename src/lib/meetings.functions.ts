import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";

import { formatSlot, zonedToUtc } from "@/lib/meeting-block";

const PORTAL_URL = "https://access.prscstandards.org/portal";

const MEETING_TYPE_LABEL: Record<string, string> = {
  board: "Official Board Meeting",
  advisory: "Advisory Meeting",
  methodology: "Methodology Committee Meeting",
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

async function getMyMember(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("portal_members")
    .select("*")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!data) throw new Error("Portal access has not been granted");
  return data as any;
}

const slotSchema = z.object({
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Invalid date"),
});

const createPollSchema = z.object({
  meeting_type: z.enum(["board", "advisory", "methodology"]),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  format: z.enum(["virtual", "in_person"]),
  location: z.string().trim().max(300).optional(),
  virtual_link: z.string().trim().max(500).optional(),
  duration_minutes: z.number().int().min(15).max(480),
  respond_by: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Invalid date").optional(),
  timezone: z.string().trim().max(64).refine((tz) => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } }, "Unknown time zone").optional(),
  slots: z.array(slotSchema).min(1).max(12),
  invited_member_ids: z.array(z.string().uuid()),
});

export const createMeetingPoll = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => createPollSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");
    const tz = data.timezone || "America/New_York";
    const slotIsos = data.slots.map((s) => zonedToUtc(s.starts_at, tz));
    const respondBy = data.respond_by ? zonedToUtc(data.respond_by, tz) : null;

    const { data: poll, error } = await supabaseAdmin
      .from("meeting_polls")
      .insert({
        meeting_type: data.meeting_type,
        title: data.title,
        description: data.description || null,
        format: data.format,
        location: data.format === "in_person" ? data.location || null : null,
        virtual_link: data.format === "virtual" ? data.virtual_link || null : null,
        duration_minutes: data.duration_minutes,
        respond_by: respondBy,
        timezone: tz,
        status: "open",
        invited_member_ids: data.invited_member_ids,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: slotsError } = await supabaseAdmin.from("meeting_poll_slots").insert(
      slotIsos.map((starts_at) => ({ poll_id: poll.id, starts_at })),
    );
    if (slotsError) throw slotsError;
    const { safeReconcile } = await import("@/lib/outlook-calendar.server");
    await safeReconcile(poll.id);

    const { data: members } = data.invited_member_ids.length
      ? await supabaseAdmin.from("portal_members").select("id, email, first_name").in("id", data.invited_member_ids)
      : { data: [] as { id: string; email: string; first_name: string | null }[] };

    const typeLabel = MEETING_TYPE_LABEL[data.meeting_type];
    const { loadSystemEmail } = await import("@/lib/portal-notify.server");
    const { meetingBlockText } = await import("@/lib/meeting-block");
    const block = meetingBlockText(
      { ...data, respond_by: respondBy, timezone: tz },
      slotIsos.map((starts_at) => ({ starts_at })),
    );
    const build = await loadSystemEmail("meeting_poll");
    void founderSignature;

    for (const m of members ?? []) {
      await sendPortalEmail(
        m.email,
        build({ first_name: m.first_name?.trim() || "Hello", meeting_title: data.title, meeting_type: typeLabel, meeting_block: block }),
        "meeting-poll-invite",
      );
    }

    await supabaseAdmin.from("portal_activity").insert({
      actor_user_id: context.userId,
      event_type: "meeting_poll_created",
      metadata: { poll_id: poll.id, title: data.title, invited: data.invited_member_ids.length },
    });

    return { ok: true, id: poll.id };
  });

export const listAdminPolls = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: polls, error } = await supabaseAdmin
      .from("meeting_polls")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!polls?.length) return { polls: [] };

    const pollIds = polls.map((p: any) => p.id);
    const [{ data: slots }, { data: responses }, { data: notes }, { data: members }] = await Promise.all([
      supabaseAdmin.from("meeting_poll_slots").select("*").in("poll_id", pollIds).order("starts_at"),
      supabaseAdmin.from("meeting_poll_responses").select("*").in("poll_id", pollIds),
      supabaseAdmin.from("meeting_poll_notes").select("*").in("poll_id", pollIds),
      supabaseAdmin
        .from("portal_members")
        .select("id, first_name, last_name, email, organization, entity, role, is_methodology_committee"),
    ]);

    return {
      polls: polls.map((p: any) => ({
        ...p,
        slots: (slots ?? []).filter((s: any) => s.poll_id === p.id),
        responses: (responses ?? []).filter((r: any) => r.poll_id === p.id),
        notes: (notes ?? []).filter((n: any) => n.poll_id === p.id),
        invited: (members ?? []).filter((m: any) => (p.invited_member_ids as string[]).includes(m.id)),
      })),
    };
  });

export const listInvitableMembers = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("portal_members")
      .select("id, first_name, last_name, email, organization, entity, role, status, is_methodology_committee")
      .neq("status", "revoked")
      .order("last_name");
    if (error) throw error;
    return { members: data ?? [] };
  });

export const confirmPollSlot = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ poll_id: z.string().uuid(), slot_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");

    const { data: poll, error } = await supabaseAdmin
      .from("meeting_polls")
      .select("*")
      .eq("id", data.poll_id)
      .single();
    if (error || !poll) throw error ?? new Error("Meeting not found");
    const slot = await supabaseAdmin
      .from("meeting_poll_slots")
      .select("*")
      .eq("id", data.slot_id)
      .eq("poll_id", data.poll_id)
      .single();
    if (slot.error || !slot.data) throw new Error("Time option not found");

    await supabaseAdmin
      .from("meeting_polls")
      .update({ status: "confirmed", confirmed_slot_id: data.slot_id })
      .eq("id", data.poll_id);
    const { safeReconcile } = await import("@/lib/outlook-calendar.server");
    await safeReconcile(data.poll_id);

    const icsUrl = "https://access.prscstandards.org/portal#meetings";
    const typeLabel = MEETING_TYPE_LABEL[poll.meeting_type] ?? "Meeting";
    const where =
      poll.format === "virtual"
        ? `Format: Virtual${poll.virtual_link ? `\nJoining link: ${poll.virtual_link}` : "\nThe joining link will follow."}`
        : `Format: In person${poll.location ? `\nLocation: ${poll.location}` : ""}`;

    const { data: members } = await supabaseAdmin
      .from("portal_members")
      .select("id, email, first_name")
      .in("id", poll.invited_member_ids as string[]).neq("status", "revoked");

    const { loadSystemEmail } = await import("@/lib/portal-notify.server");
    const build = await loadSystemEmail("meeting_confirmed");
    void founderSignature;
    // One confirmation per poll, confirmed slot and recipient; retries reuse the same delivery key.
    const { confirmationKey, recipientsToConfirm } = await import("@/lib/meeting-confirmations");
    const { data: existing } = await supabaseAdmin.from("meeting_confirmation_sends").select("member_id, status, attempts").eq("poll_id", poll.id).eq("slot_id", data.slot_id);
    const owed = new Set(recipientsToConfirm((members ?? []).map((m) => m.id), (existing ?? []) as any));
    for (const m of members ?? []) {
      if (!owed.has(m.id)) continue;
      const prior = (existing ?? []).find((r: any) => r.member_id === m.id) as any;
      await supabaseAdmin.from("meeting_confirmation_sends").upsert({ poll_id: poll.id, slot_id: data.slot_id, member_id: m.id, status: "sending", attempts: (prior?.attempts ?? 0) + 1, updated_at: new Date().toISOString() }, { onConflict: "poll_id,slot_id,member_id" });
      const ok = await sendPortalEmail(
        m.email,
        build({
          first_name: m.first_name?.trim() || "Hello",
          meeting_title: poll.title,
          meeting_type: typeLabel,
          confirmed_time: `${formatSlot(slot.data.starts_at, poll.timezone)} (please confirm in your local time zone)`,
          meeting_duration: String(poll.duration_minutes),
          meeting_where: `${where}${poll.description ? `\n\n${poll.description}` : ""}`,
          calendar_url: icsUrl,
        }),
        "meeting-confirmed",
        confirmationKey(poll.id, data.slot_id, m.id),
      );
      await supabaseAdmin.from("meeting_confirmation_sends").update({ status: ok ? "sent" : "failed", last_error: ok ? null : "Delivery not accepted; retry reuses the same key", updated_at: new Date().toISOString() }).eq("poll_id", poll.id).eq("slot_id", data.slot_id).eq("member_id", m.id);
    }

    await supabaseAdmin.from("portal_activity").insert({
      actor_user_id: context.userId,
      event_type: "meeting_confirmed",
      metadata: { poll_id: data.poll_id, title: poll.title, starts_at: slot.data.starts_at },
    });

    return { ok: true };
  });

export const cancelPoll = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ poll_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("meeting_polls")
      .update({ status: "cancelled" })
      .eq("id", data.poll_id);
    if (error) throw error;
    const { safeReconcile } = await import("@/lib/outlook-calendar.server");
    await safeReconcile(data.poll_id);
    return { ok: true };
  });

export const resyncPollCalendar = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ poll_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { safeReconcile } = await import("@/lib/outlook-calendar.server");
    return await safeReconcile(data.poll_id);
  });

export const getCalendarConnection = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getConnectedCalendar } = await import("@/lib/outlook-calendar.server");
    return await getConnectedCalendar();
  });

export const getMyMeetings = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .inputValidator((input?: { asMemberId?: string }) => z.object({ asMemberId: z.string().uuid().optional() }).parse(input ?? {}))
  .handler(async ({ context: ctx, data: input }) => {
    let context: any = ctx;
    let member: any;
    if (input.asMemberId) {
      const { data: isAdmin } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
      if (!isAdmin) throw new Error("Unauthorized");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      context = { supabase: supabaseAdmin };
      const { data } = await supabaseAdmin.from("portal_members").select("*").eq("id", input.asMemberId).maybeSingle();
      if (!data) throw new Error("Member not found");
      member = data;
    } else {
      member = await getMyMember(ctx);
    }
    const { data: polls, error } = await context.supabase
      .from("meeting_polls")
      .select("*")
      .contains("invited_member_ids", [member.id])
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!polls?.length) return { polls: [], member_id: member.id };

    const pollIds = polls.map((p: any) => p.id);
    const [{ data: slots }, { data: responses }, { data: notes }] = await Promise.all([
      context.supabase.from("meeting_poll_slots").select("*").in("poll_id", pollIds).order("starts_at"),
      context.supabase.from("meeting_poll_responses").select("*").eq("member_id", member.id).in("poll_id", pollIds),
      context.supabase.from("meeting_poll_notes").select("*").eq("member_id", member.id).in("poll_id", pollIds),
    ]);

    const withTokens = await Promise.all(
      polls.map(async (p: any) => ({
        ...p,
        ics_token: p.status === "confirmed" ? "authenticated" : null,
        invited_member_ids: undefined,
        slots: (slots ?? []).filter((s: any) => s.poll_id === p.id),
        my_responses: (responses ?? []).filter((r: any) => r.poll_id === p.id),
        my_note: (notes ?? []).find((n: any) => n.poll_id === p.id)?.note ?? "",
        my_responded_at: (notes ?? []).find((n: any) => n.poll_id === p.id)?.responded_at ?? null,
      })),
    );
    return { polls: withTokens, member_id: member.id };
  });

const availabilitySchema = z.object({
  poll_id: z.string().uuid(),
  responses: z.array(
    z.object({
      slot_id: z.string().uuid(),
      availability: z.enum(["available", "if_needed", "unavailable"]),
    }),
  ),
  note: z.string().trim().max(1000).optional(),
});

export const submitMyAvailability = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => availabilitySchema.parse(input))
  .handler(async ({ context, data }) => {
    const member = await getMyMember(context);
    const { data: poll } = await context.supabase
      .from("meeting_polls")
      .select("id, status, invited_member_ids")
      .eq("id", data.poll_id)
      .single();
    if (!poll || !(poll.invited_member_ids as string[]).includes(member.id)) throw new Error("Meeting not found");
    if (poll.status !== "open") throw new Error("This meeting time has already been confirmed");

    const { error: delError } = await context.supabase
      .from("meeting_poll_responses")
      .delete()
      .eq("poll_id", data.poll_id)
      .eq("member_id", member.id);
    if (delError) throw delError;

    if (data.responses.length) {
      const { error } = await context.supabase.from("meeting_poll_responses").insert(
        data.responses.map((r) => ({
          poll_id: data.poll_id,
          slot_id: r.slot_id,
          member_id: member.id,
          availability: r.availability,
        })),
      );
      if (error) throw error;
    }

    const { error: noteError } = await context.supabase.from("meeting_poll_notes").upsert(
      { poll_id: data.poll_id, member_id: member.id, note: data.note || null, responded_at: new Date().toISOString() },
      { onConflict: "poll_id,member_id" },
    );
    if (noteError) throw noteError;
    return { ok: true };
  });
