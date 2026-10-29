// Forum email series: which members may receive each notification. Shared by the
// admin screen and the server send function so both apply the same rules.
import { documentVisible, forumCleared, type VisibilityDoc } from "@/lib/governance";

export type ForumEmailKey =
  | "forum_confirmed"
  | "briefing_released"
  | "input_requested"
  | "input_reminder"
  | "final_agenda"
  | "coordination_summary"
  | "followup_assigned";

export type ForumEmailDef = {
  key: ForumEmailKey;
  number: number;
  label: string;
  /** Disabled until its Priority B destination exists and is tested. */
  enabled: boolean;
  disabledReason?: string;
  /** "invite" = may be invited to the Forum; "cleared" = Forum clearance completed. */
  gate: "invite" | "cleared";
  needsDocument?: boolean;
  fields: { token: string; label: string }[];
};

const PRIORITY_B = "Available once the Strategic Forum workspace is live and tested";

export const FORUM_EMAILS: ForumEmailDef[] = [
  {
    key: "forum_confirmed",
    number: 2,
    label: "Forum confirmed",
    enabled: true,
    gate: "invite",
    fields: [
      { token: "forum_date", label: "Forum date" },
      { token: "forum_time", label: "Time and time zone" },
      { token: "forum_location", label: "Location or virtual meeting" },
    ],
  },
  {
    key: "briefing_released",
    number: 3,
    label: "Strategic briefing released",
    enabled: true,
    gate: "cleared",
    needsDocument: true,
    fields: [],
  },
  {
    key: "input_requested",
    number: 4,
    label: "Executive questions requested",
    enabled: true,
    gate: "cleared",
    fields: [{ token: "deadline", label: "Submission deadline" }],
  },
  {
    key: "input_reminder",
    number: 5,
    label: "Executive questions reminder",
    enabled: true,
    gate: "cleared",
    fields: [{ token: "deadline", label: "Deadline" }],
  },
  {
    key: "final_agenda",
    number: 6,
    label: "Final Forum agenda",
    enabled: true,
    gate: "cleared",
    fields: [{ token: "forum_when", label: "Forum date and time" }],
  },
  {
    key: "coordination_summary",
    number: 7,
    label: "Forum coordination summary",
    enabled: true,
    gate: "cleared",
    fields: [],
  },
  {
    key: "followup_assigned",
    number: 8,
    label: "Follow-up assignment",
    enabled: false,
    disabledReason: PRIORITY_B,
    gate: "cleared",
    fields: [
      { token: "action_title", label: "Action" },
      { token: "target_date", label: "Target date" },
      { token: "coordinating_entity", label: "Coordinating entity" },
    ],
  },
];

export type ForumRecipient = {
  status: string;
  participates_in_forum: boolean | null;
  nda_verified_at: string | null;
  forum_clearance_status: string;
  addendum_complete?: boolean;
  grants?: import("@/lib/governance").RestrictedGrant[];
  has_entity_release?: boolean;
};

/** May be invited to the Forum: participating, NDA verified, not declined. Not the same as cleared. */
export function forumInviteEligible(m: ForumRecipient) {
  return (
    m.participates_in_forum !== false &&
    Boolean(m.nda_verified_at) &&
    m.forum_clearance_status !== "declined"
  );
}

/** Returns null when the member may receive the email, or the reason they may not. */
export function forumEmailBlock(
  key: ForumEmailKey,
  m: ForumRecipient,
  doc?: VisibilityDoc | null,
  hasCompletion = false,
): string | null {
  const def = FORUM_EMAILS.find((d) => d.key === key);
  if (!def) return "Unknown email";
  if (!def.enabled) return def.disabledReason ?? "Not yet available";
  if (m.status !== "active" && m.status !== "invited") return "Member is not active";
  if (m.participates_in_forum === false) return "Opted out of Forum";
  if (!m.nda_verified_at) return "NDA not verified";
  if (m.forum_clearance_status === "declined") return "Forum participation declined";
  if (def.gate === "cleared" && !forumCleared(m.forum_clearance_status)) return "Not Forum-cleared";
  if (def.needsDocument) {
    if (!doc) return "Choose the briefing document";
    if (!documentVisible(doc, m, hasCompletion)) return "No access to briefing";
  }
  return null;
}

/** One send per forum, email, version and recipient. */
export function forumIdempotencyKey(
  forumKey: string,
  emailKey: string,
  version: number,
  memberId: string,
) {
  return `forum:${forumKey}:${emailKey}:v${version}:${memberId}`;
}

/**
 * A member already received a meeting confirmation through the Meetings poll
 * flow, so the manual Forum confirmation must not duplicate it.
 */
export function confirmedThroughPoll(
  memberId: string,
  confirmedPolls: { invited_member_ids: unknown }[],
): boolean {
  return confirmedPolls.some(
    (p) =>
      Array.isArray(p.invited_member_ids) && (p.invited_member_ids as string[]).includes(memberId),
  );
}
