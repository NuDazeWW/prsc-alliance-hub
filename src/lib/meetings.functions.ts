import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { meetingIcsToken } from "@/lib/ics";

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

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

const slotSchema = z.object({
  starts_at: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
});

const createPollSchema = z.object({
  meeting_type: z.enum(["board", "advisory", "methodology"]),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  format: z.enum(["virtual", "in_person"]),
  location: z.string().trim().max(300).optional(),
  virtual_link: z.string().trim().max(500).optional(),
  duration_minutes: z.number().int().min(15).max(480),
  respond_by: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date").optional(),
  slots: z.array(slotSchema).min(1).max(12),
  invited_member_ids: z.array(z.string().uuid()).min(1),
});

export const createMeetingPoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createPollSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");

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
        respond_by: data.respond_by ?? null,
        status: "open",
        invited_member_ids: data.invited_member_ids,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: slotsError } = await supabaseAdmin.from("meeting_poll_slots").insert(
      data.slots.map((s) => ({ poll_id: poll.id, starts_at: new Date(s.starts_at).toISOString() })),
    );
    if (slotsError) throw slotsError;

    const { data: members } = await supabaseAdmin
      .from("portal_members")
      .select("id, email, first_name")
      .in("id", data.invited_member_ids);

    const typeLabel = MEETING_TYPE_LABEL[data.meeting_type];
    const where =
      data.format === "virtual"
        ? `Format: Virtual${data.virtual_link ? ` — the joining link will be shared once the time is confirmed.` : ""}`
        : `Format: In person${data.location ? ` — ${data.location}` : ""}`;
    const slotLines = data.slots
      .map((s) => `• ${formatSlot(new Date(s.starts_at).toISOString())} (${data.duration_minutes} minutes)`)
      .join("\n");

    for (const m of members ?? []) {
      await sendPortalEmail(
        m.email,
        {
          subject: `Please share your availability: ${data.title}`,
          eyebrow: typeLabel,
          heading: `${m.first_name?.trim() || "Hello"}, we are scheduling the next ${typeLabel.toLowerCase()}.`,
          body: `Because everyone carries a full corporate calendar, we are proposing a few time options and asking each member to mark what works.\n\n${data.description ? `${data.description}\n\n` : ""}${where}\nDuration: ${data.duration_minutes} minutes\n\nProposed times (shown here in New York time — your Welcome Center shows them in your own time zone):\n${slotLines}\n\n${data.respond_by ? `Please respond by ${formatSlot(data.respond_by)}.\n\n` : ""}Open your private Welcome Center to mark each option Available, If needed, or Unavailable — it takes under a minute.`,
          ctaLabel: "Share Your Availability",
          ctaUrl: PORTAL_URL,
          signatures: founderSignature(),
        },
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
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
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

    const token = await meetingIcsToken(data.poll_id);
    const icsUrl = `https://access.prscstandards.org/api/public/meeting-ics?poll=${data.poll_id}&token=${token}`;
    const typeLabel = MEETING_TYPE_LABEL[poll.meeting_type] ?? "Meeting";
    const where =
      poll.format === "virtual"
        ? `Format: Virtual${poll.virtual_link ? `\nJoining link: ${poll.virtual_link}` : "\nThe joining link will follow."}`
        : `Format: In person${poll.location ? `\nLocation: ${poll.location}` : ""}`;

    const { data: members } = await supabaseAdmin
      .from("portal_members")
      .select("id, email, first_name")
      .in("id", poll.invited_member_ids as string[]);

    for (const m of members ?? []) {
      await sendPortalEmail(
        m.email,
        {
          subject: `Confirmed: ${poll.title} — ${formatSlot(slot.data.starts_at)}`,
          eyebrow: typeLabel,
          heading: `${m.first_name?.trim() || "Hello"}, the ${typeLabel.toLowerCase()} is confirmed.`,
          body: `Thank you for sharing your availability. The time that aligned best for the group is:\n\n${formatSlot(slot.data.starts_at)} (${poll.duration_minutes} minutes)\n\n${where}${poll.description ? `\n\n${poll.description}` : ""}\n\nUse the button below to add it directly to your Outlook, Apple, or Google calendar.`,
          ctaLabel: "Add to My Calendar",
          ctaUrl: icsUrl,
          ctaSubtext: "Downloads a calendar file you can open with one click.",
          signatures: founderSignature(),
        },
        "meeting-confirmed",
      );
    }

    await supabaseAdmin.from("portal_activity").insert({
      actor_user_id: context.userId,
      event_type: "meeting_confirmed",
      metadata: { poll_id: data.poll_id, title: poll.title, starts_at: slot.data.starts_at },
    });

    return { ok: true };
  });

export const cancelPoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ poll_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("meeting_polls")
      .update({ status: "cancelled" })
      .eq("id", data.poll_id);
    if (error) throw error;
    return { ok: true };
  });

export const getMyMeetings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const member = await getMyMember(context);
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
        ics_token: p.status === "confirmed" ? await meetingIcsToken(p.id) : null,
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
  .middleware([requireSupabaseAuth])
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
