// Shared, browser-safe helpers for describing a meeting poll inside emails.

export const MEETING_TYPE_LABEL: Record<string, string> = {
  board: "Official Board Meeting",
  advisory: "Advisory Meeting",
  methodology: "Methodology Committee Meeting",
  forum: "The Forum",
};

/** Display name for a meeting type; custom admin-entered types are stored as their own name. */
export function meetingTypeLabel(type: string | null | undefined) {
  if (!type) return "Meeting";
  return MEETING_TYPE_LABEL[type] ?? type;
}

export type MeetingBlockPoll = {
  title: string;
  meeting_type: string;
  format: string;
  location?: string | null;
  duration_minutes: number;
  description?: string | null;
  respond_by?: string | null;
  timezone?: string | null;
};

export const DEFAULT_MEETING_TZ = "America/New_York";

export const MEETING_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Toronto", label: "Eastern Canada (Toronto)" },
  { value: "America/Sao_Paulo", label: "Brazil (São Paulo)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Europe/Berlin", label: "Central Europe (Berlin)" },
  { value: "Europe/Athens", label: "Eastern Europe (Athens)" },
  { value: "Asia/Dubai", label: "Gulf (Dubai)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
];

export function timezoneLabel(tz?: string | null) {
  const zone = tz || DEFAULT_MEETING_TZ;
  return MEETING_TIMEZONES.find((z) => z.value === zone)?.label ?? zone;
}

/** Formats a stored UTC time in the meeting's time zone (Eastern when none was saved). */
export function formatSlot(iso: string, tz?: string | null) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz || DEFAULT_MEETING_TZ,
    timeZoneName: "short",
  });
}

/** @deprecated use formatSlot(iso, tz) */
export const formatSlotET = (iso: string) => formatSlot(iso);

function zoneOffsetMs(ts: number, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const g = (k: string) => Number(parts.find((p) => p.type === k)!.value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - ts;
}

/** Converts a wall-clock time "YYYY-MM-DDTHH:mm" in a time zone to a UTC ISO string. Values that already carry an offset pass through. */
export function zonedToUtc(local: string, tz?: string | null) {
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(local)) return new Date(local).toISOString();
  const [d, t = "00:00"] = local.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  const zone = tz || DEFAULT_MEETING_TZ;
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  let ts = guess - zoneOffsetMs(guess, zone);
  ts = guess - zoneOffsetMs(ts, zone);
  return new Date(ts).toISOString();
}

/** Plain-text meeting section used by invitations, Compose, and poll emails. */
export function meetingBlockText(poll: MeetingBlockPoll, slots: { starts_at: string }[]) {
  const type = meetingTypeLabel(poll.meeting_type);
  const where =
    poll.format === "in_person"
      ? `Format: In person${poll.location ? ` — ${poll.location}` : ""}`
      : "Format: Virtual — the joining link is shared once the time is confirmed";
  const header = [
    `Upcoming meeting: ${poll.title} (${type})`,
    where,
    `Duration: ${poll.duration_minutes} minutes`,
  ].join("\n");
  const times = [...slots]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((s) => `• ${formatSlot(s.starts_at, poll.timezone)}`)
    .join("\n");
  const parts = [header];
  if (poll.description?.trim()) parts.push(poll.description.trim());
  parts.push(
    `Proposed times (${timezoneLabel(poll.timezone)} time — please confirm each time in your local time zone):\n${times}`,
  );
  parts.push(
    `Please mark your availability for each option in your private Welcome Center${poll.respond_by ? ` by ${formatSlot(poll.respond_by, poll.timezone)}` : ""}.`,
  );
  return parts.join("\n\n");
}

const MIXED = ["prsc_board_dis_advisor", "prsc_advisor_dis_board"];

/** Whether a meeting type is meant for a member's role (committee meetings only go to committee members). */
export function pollFitsMember(meetingType: string, role: string, isCommittee = false) {
  if (meetingType === "methodology") return isCommittee || role === "methodology_committee";
  if (meetingType === "board") return role === "board_member" || MIXED.includes(role);
  if (meetingType === "advisory") return role === "advisor" || MIXED.includes(role);
  // The Forum and admin-named custom meetings are open to any member; the admin picks invitees.
  return true;
}
