import { meetingBlockText } from "@/lib/meeting-block";

/** Loads an open poll with its time options. Returns null when it is missing or no longer open. */
export async function loadOpenPoll(pollId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: poll } = await supabaseAdmin
    .from("meeting_polls")
    .select("*")
    .eq("id", pollId)
    .maybeSingle();
  if (!poll || poll.status !== "open") return null;
  const { data: slots } = await supabaseAdmin
    .from("meeting_poll_slots")
    .select("starts_at")
    .eq("poll_id", pollId)
    .order("starts_at");
  return { poll, slots: slots ?? [], block: meetingBlockText(poll, slots ?? []) };
}

/** Adds members to a poll's invite list so the availability card appears in their Welcome Center. Caller must be a verified admin. */
export async function addMembersToPoll(pollId: string, memberIds: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: poll } = await supabaseAdmin
    .from("meeting_polls")
    .select("invited_member_ids, status")
    .eq("id", pollId)
    .maybeSingle();
  if (!poll || poll.status !== "open")
    throw new Error("That meeting is no longer open for availability");
  const merged = Array.from(new Set([...(poll.invited_member_ids as string[]), ...memberIds]));
  const { error } = await supabaseAdmin
    .from("meeting_polls")
    .update({ invited_member_ids: merged })
    .eq("id", pollId);
  if (error) throw error;
}
