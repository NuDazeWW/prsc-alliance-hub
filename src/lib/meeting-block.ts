// Shared, browser-safe helpers for describing a meeting poll inside emails.

export const MEETING_TYPE_LABEL: Record<string, string> = {
  board: "Official Board Meeting",
  advisory: "Advisory Meeting",
  methodology: "Methodology Committee Meeting",
};

export type MeetingBlockPoll = {
  title: string;
  meeting_type: string;
  format: string;
  location?: string | null;
  duration_minutes: number;
  description?: string | null;
  respond_by?: string | null;
};

export function formatSlotET(iso: string) {
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

/** Plain-text meeting section used by invitations, Compose, and poll emails. */
export function meetingBlockText(poll: MeetingBlockPoll, slots: { starts_at: string }[]) {
  const type = MEETING_TYPE_LABEL[poll.meeting_type] ?? "Meeting";
  const where = poll.format === "in_person" ? `Format: In person${poll.location ? ` — ${poll.location}` : ""}` : "Format: Virtual — the joining link is shared once the time is confirmed";
  const header = [`Upcoming meeting: ${poll.title} (${type})`, where, `Duration: ${poll.duration_minutes} minutes`].join("\n");
  const times = [...slots]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((s) => `• ${formatSlotET(s.starts_at)}`)
    .join("\n");
  const parts = [header];
  if (poll.description?.trim()) parts.push(poll.description.trim());
  parts.push(`Proposed times (New York time — your Welcome Center shows them in your own time zone):\n${times}`);
  parts.push(
    `Please mark your availability for each option in your private Welcome Center${poll.respond_by ? ` by ${formatSlotET(poll.respond_by)}` : ""}.`,
  );
  return parts.join("\n\n");
}

const MIXED = ["prsc_board_dis_advisor", "prsc_advisor_dis_board"];

/** Whether a meeting type is meant for a member's role (committee meetings only go to committee members). */
export function pollFitsMember(meetingType: string, role: string, isCommittee = false) {
  if (meetingType === "methodology") return isCommittee || role === "methodology_committee";
  if (meetingType === "board") return role === "board_member" || MIXED.includes(role);
  if (meetingType === "advisory") return role === "advisor" || MIXED.includes(role);
  return false;
}
