// Governance controls (Priority A): pure rules shared by portal, admin, and server.
// The database read policy on portal_documents mirrors documentVisible() so access
// stays fail-closed even if application code is rolled back.

export const LEGAL_NAMES = {
  prsc: "Partnership Readiness Standards Council, LLC",
  dis: "Decision Intelligence Systems, Inc.",
} as const;

export type Classification =
  | "general_orientation"
  | "confidential_forum"
  | "restricted_opportunity"
  | "entity_confidential"
  | "secretariat_only";

export const CLASSIFICATIONS: { value: Classification; label: string }[] = [
  { value: "general_orientation", label: "General Orientation" },
  { value: "confidential_forum", label: "Confidential Forum" },
  { value: "restricted_opportunity", label: "Restricted Opportunity" },
  { value: "entity_confidential", label: "Entity-Specific Confidential" },
  { value: "secretariat_only", label: "Secretariat Only" },
];

export type RoleReviewStatus = "not_required" | "pending" | "approved" | "declined" | "prohibited";
export type ForumClearance = "not_reviewed" | "cleared" | "cleared_restricted" | "escalated" | "declined";

/**
 * Hard prohibitions apply only where an operative governance document prohibits the
 * combination. Each entry must cite its clause. Empty until the source documents are confirmed.
 */
export const HARD_PROHIBITED: { entity: string; role: string; committee?: boolean; clause: string }[] = [];

export type CombinationTier = "none" | "review" | "prohibited";

/** Cross-entity combinations are blocked pending a formal governance/legal review. */
export function roleCombinationTier(entity: string, role: string, isCommittee = false): { tier: CombinationTier; clause?: string } {
  const hit = HARD_PROHIBITED.find((r) => r.entity === entity && r.role === role && (r.committee == null || r.committee === isCommittee));
  if (hit) return { tier: "prohibited", clause: hit.clause };
  const mixed = role === "prsc_board_dis_advisor" || role === "prsc_advisor_dis_board";
  if (entity === "both" || mixed || (isCommittee && entity !== "prsc")) return { tier: "review" };
  return { tier: "none" };
}

export function initialRoleReviewStatus(entity: string, role: string, isCommittee = false): RoleReviewStatus {
  const { tier } = roleCombinationTier(entity, role, isCommittee);
  return tier === "prohibited" ? "prohibited" : tier === "review" ? "pending" : "not_required";
}

/** Role holds invitations, document release and activation unless clear or approved. */
export function roleReviewBlocks(status: string | null | undefined) {
  return !(status === "not_required" || status === "approved");
}

/** The NDA must cover every entity the member is being considered for. */
export function ndaCovers(ndaEntities: string | null | undefined, memberEntity: string) {
  if (!ndaEntities) return false;
  return ndaEntities === "both" || ndaEntities === memberEntity;
}

export type NdaRecord = { verified_at: string | null; verified_by: string | null; reference: string | null; entities: string | null; scope: string | null };

export function ndaProblem(nda: NdaRecord, memberEntity: string): string | null {
  if (!nda.verified_at || !nda.verified_by) return "Record the NDA verification date and verifying administrator first";
  if (!nda.reference?.trim()) return "Record the NDA document reference or storage location first";
  if (!nda.scope?.trim()) return "Record the information-sharing scope the NDA covers first";
  if (!ndaCovers(nda.entities, memberEntity)) return "The recorded NDA does not cover every entity this member is being considered for";
  return null;
}

export function forumCleared(status: string | null | undefined) {
  return status === "cleared" || status === "cleared_restricted";
}

export type VisibilityDoc = { classification: string; superseded_at: string | null; is_forum_prep: boolean; journey_stage?: number | null; member_specific?: boolean };
export type VisibilityMember = { nda_verified_at: string | null; forum_clearance_status: string; is_candidate?: boolean };

/** Mirrors the database read policy. hasCompletion keeps a member's own signed historical copies visible. */
export function documentVisible(doc: VisibilityDoc, m: VisibilityMember, hasCompletion: boolean) {
  if (doc.classification === "secretariat_only" || doc.classification === "restricted_opportunity") return false;
  if (doc.superseded_at && !hasCompletion) return false;
  if (doc.classification === "confidential_forum") {
    if (!m.nda_verified_at || m.forum_clearance_status === "declined") return false;
    if (!doc.is_forum_prep && !forumCleared(m.forum_clearance_status)) return false;
  }
  // Forum candidates hold no PRSC/DIS seat: appointment-track stages (2–4) stay hidden.
  if (m.is_candidate && !doc.member_specific && doc.journey_stage != null && doc.journey_stage >= 2 && doc.journey_stage <= 4) return false;
  return true;
}

/** Superseded documents never sit in active onboarding or acknowledgement queues. */
export function isActive(doc: { superseded_at?: string | null }) {
  return !doc.superseded_at;
}

export type ConflictAnswer = "none" | "changed" | "unsure";

export type AppointmentCheck = {
  ndaOk: boolean;
  roleReviewOk: boolean;
  forumOk: boolean;
  trackDocsComplete: boolean;
  countersigned: boolean;
  appointmentRef: string | null | undefined;
};

/** "Appointed" requires every verified element; a status change alone confers nothing. */
export function appointmentProblems(c: AppointmentCheck): string[] {
  const p: string[] = [];
  if (!c.ndaOk) p.push("NDA verification incomplete");
  if (!c.roleReviewOk) p.push("Role-combination review not approved");
  if (!c.forumOk) p.push("Forum clearance not recorded");
  if (!c.trackDocsComplete) p.push("Entity agreements and disclosures (Stages 2–3) not all complete");
  if (!c.countersigned) p.push("Authorized countersignature not confirmed");
  if (!c.appointmentRef?.trim()) p.push("Appointment action record reference missing");
  return p;
}

/** Candidate-facing status label. Never says "Member" before appointment. */
export function governanceStatusLabel(s: { status: string; forumCleared: boolean; stage3Done: boolean; appointed: { prsc: boolean; dis: boolean }; tracks: ("prsc" | "dis")[] }) {
  const appointed = s.tracks.filter((t) => s.appointed[t]);
  if (appointed.length === s.tracks.length) return "Appointed";
  if (appointed.length) return `Appointed (${appointed.map((t) => t.toUpperCase()).join(", ")})`;
  if (s.stage3Done) return "Pending Appointment";
  if (s.forumCleared) return "Forum Participant";
  return "Invited Candidate";
}

export function memberTracksFor(entity: string): ("prsc" | "dis")[] {
  return entity === "both" ? ["prsc", "dis"] : entity === "dis" ? ["dis"] : ["prsc"];
}
