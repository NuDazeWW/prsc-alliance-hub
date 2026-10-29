// Safe, specific reasons a Forum document is not yet available to a member.
// Pure and shared by the server (which builds the notices) and tests.
//
// Disclosure rules: a notice carries only a reason and a generic label. It never carries a document
// id, title, description or file. Secretariat-only items, administrator-only roles and restricted
// opportunity documents are never mentioned at all, so their existence is not disclosed.

export type UnavailableReason = "awaiting_approved" | "not_released" | "confidentiality_signature" | "prior_action" | "admin_clearance";

export const UNAVAILABLE_LABEL: Record<UnavailableReason, string> = {
  awaiting_approved: "Awaiting approved document",
  not_released: "Not yet assigned or released",
  confidentiality_signature: "Confidentiality signature required",
  prior_action: "Prior required action incomplete",
  admin_clearance: "Administrative clearance required",
};

export const UNAVAILABLE_HELP: Record<UnavailableReason, string> = {
  awaiting_approved: "The approved version has not been loaded yet. We will email you when it is available.",
  not_released: "This has not been assigned or released to you yet. We will email you when it is.",
  confidentiality_signature: "Complete the confidentiality steps in your journey first. This opens after they are verified.",
  prior_action: "Finish the document before it in your journey. This opens automatically afterward.",
  admin_clearance: "The Secretariat reviews clearance before this opens. We will email you when it does.",
};

export type AvailabilityDoc = {
  id: string;
  /** Whether this member can already open it (the server's own visibility rule). */
  visible: boolean;
  classification?: string | null;
  forum_role?: string | null;
  is_forum_prep?: boolean | null;
  signing_approved?: boolean | null;
  superseded_at?: string | null;
};

export type AvailabilityMember = {
  participates_in_forum: boolean;
  nda_verified: boolean;
  forum_clearance_status: string;
  addendum_complete: boolean;
};

export type UnavailableNotice = { key: string; label: string; reason: UnavailableReason };

/** Forum items every participant is expected to receive once approved. Names are generic categories, not titles. */
export const EXPECTED_FORUM_ROLES = ["addendum", "protocol", "pre_read"] as const;

const GENERIC_ROLE_LABEL: Record<string, string> = {
  addendum: "Confidentiality Addendum",
  protocol: "Forum Protocol",
  pre_read: "Pre-Read",
  conflict: "Conflict / Recusal Confirmation",
};
const GENERIC_CONFIDENTIAL_LABEL = "Confidential Forum document";

/** Roles and classifications that must never produce any notice. */
const NEVER_DISCLOSE_ROLES = ["secretariat_controls", "facilitator_run_of_show", "agenda", "restricted_brief"];
const NEVER_DISCLOSE_CLASSES = ["secretariat_only", "restricted_opportunity"];

function cleared(status: string) {
  return status === "cleared" || status === "cleared_restricted";
}

/** The reason one hidden confidential Forum document is hidden, or null when nothing safe can be said. */
function hiddenReason(d: AvailabilityDoc, m: AvailabilityMember, addendumApproved: boolean): UnavailableReason | null {
  if (m.forum_clearance_status === "declined") return null;
  if (!m.nda_verified) return "confidentiality_signature";
  const protectedDoc = d.classification === "confidential_forum";
  if (protectedDoc && d.forum_role !== "addendum" && !m.addendum_complete) return addendumApproved ? "confidentiality_signature" : "awaiting_approved";
  if (!d.is_forum_prep && !cleared(m.forum_clearance_status)) return "admin_clearance";
  return null;
}

export function unavailableNotices(docs: AvailabilityDoc[], m: AvailabilityMember): UnavailableNotice[] {
  if (!m.participates_in_forum) return [];
  const active = docs.filter(
    (d) => !d.superseded_at && !NEVER_DISCLOSE_CLASSES.includes(d.classification ?? "") && !NEVER_DISCLOSE_ROLES.includes(d.forum_role ?? ""),
  );
  const addendumApproved = docs.some((d) => d.forum_role === "addendum" && !d.superseded_at && !!d.signing_approved);
  const notices: UnavailableNotice[] = [];
  const seen = new Set<string>();
  const add = (key: string, label: string, reason: UnavailableReason) => {
    const id = `${key}:${reason}`;
    if (seen.has(id)) return;
    seen.add(id);
    notices.push({ key: id, label, reason });
  };

  for (const role of EXPECTED_FORUM_ROLES) {
    const ofRole = active.filter((d) => d.forum_role === role);
    if (ofRole.length === 0) {
      add(role, GENERIC_ROLE_LABEL[role], "awaiting_approved");
      continue;
    }
    if (ofRole.some((d) => d.visible)) continue;
    const reason = hiddenReason(ofRole[0], m, addendumApproved);
    if (reason) add(role, GENERIC_ROLE_LABEL[role], reason);
  }

  for (const d of active) {
    if (d.visible || d.classification !== "confidential_forum") continue;
    if ((EXPECTED_FORUM_ROLES as readonly string[]).includes(d.forum_role ?? "")) continue;
    const reason = hiddenReason(d, m, addendumApproved);
    if (reason) add(d.forum_role ?? "other", GENERIC_ROLE_LABEL[d.forum_role ?? ""] ?? GENERIC_CONFIDENTIAL_LABEL, reason);
  }
  return notices;
}
