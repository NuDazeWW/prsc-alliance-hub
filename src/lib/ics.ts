function pad(n: number) {
  return String(n).padStart(2, "0");
}

function icsDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildMeetingIcs(input: {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  durationMinutes: number;
}) {
  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PRSC//Board & Advisor Center//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${icsDateTime(new Date().toISOString())}`,
    `DTSTART:${icsDateTime(start.toISOString())}`,
    `DTEND:${icsDateTime(end.toISOString())}`,
    `SUMMARY:${escapeIcs(input.title)}`,
  ];
  if (input.description) lines.push(`DESCRIPTION:${escapeIcs(input.description)}`);
  if (input.location) lines.push(`LOCATION:${escapeIcs(input.location)}`);
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Optional tentative hold an executive can import. Best effort: removal is not guaranteed. */
export function buildSlotHoldIcs(input: { slotId: string; title: string; startsAt: string; durationMinutes: number }) {
  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PRSC//Board & Advisor Center//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.slotId}-hold@prscstandards.org`,
    `DTSTAMP:${icsDateTime(new Date().toISOString())}`,
    `DTSTART:${icsDateTime(start.toISOString())}`,
    `DTEND:${icsDateTime(end.toISOString())}`,
    `SUMMARY:${escapeIcs(`HOLD (tentative): ${input.title} — may be released`)}`,
    `DESCRIPTION:${escapeIcs("Proposed time from the PRSC Board & Advisor Center. If another time is confirmed, the portal will list this hold as released so you can delete it.")}`,
    "STATUS:TENTATIVE", "TRANSP:OPAQUE",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export async function meetingIcsToken(pollId: string) {
  const secret = process.env["SETUP_SECRET"] ?? "prsc-meetings";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${pollId}:${secret}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
