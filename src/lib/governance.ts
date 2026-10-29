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
export type ForumClearance =
  "not_reviewed" | "cleared" | "cleared_restricted" | "escalated" | "declined";

/**
 * Hard prohibitions apply only where an operative governance document prohibits the
 * combination. Each entry must cite its clause. Empty until the source documents are confirmed.
 */
export const HARD_PROHIBITED: {
  entity: string;
  role: string;
  committee?: boolean;
  clause: string;
}[] = [];

export type CombinationTier = "none" | "review" | "prohibited";

/** Cross-entity combinations are blocked pending a formal governance/legal review. */
export function roleCombinationTier(
  entity: string,
  role: string,
  isCommittee = false,
): { tier: CombinationTier; clause?: string } {
  const hit = HARD_PROHIBITED.find(
    (r) =>
      r.entity === entity &&
      r.role === role &&
      (r.committee == null || r.committee === isCommittee),
  );
  if (hit) return { tier: "prohibited", clause: hit.clause };
  const mixed = role === "prsc_board_dis_advisor" || role === "prsc_advisor_dis_board";
  if (entity === "both" || mixed || (isCommittee && entity !== "prsc")) return { tier: "review" };
  return { tier: "none" };
}

export function initialRoleReviewStatus(
  entity: string,
  role: string,
  isCommittee = false,
): RoleReviewStatus {
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

export type NdaRecord = {
  verified_at: string | null;
  verified_by: string | null;
  reference: string | null;
  entities: string | null;
  scope: string | null;
};

export function ndaProblem(nda: NdaRecord, memberEntity: string): string | null {
  if (!nda.verified_at || !nda.verified_by)
    return "Record the NDA verification date and verifying administrator first";
  if (!nda.reference?.trim()) return "Record the NDA document reference or storage location first";
  if (!nda.scope?.trim()) return "Record the information-sharing scope the NDA covers first";
  if (!ndaCovers(nda.entities, memberEntity))
    return "The recorded NDA does not cover every entity this member is being considered for";
  return null;
}

export function forumCleared(status: string | null | undefined) {
  return status === "cleared" || status === "cleared_restricted";
}

export type AppointmentStatus = "candidate" | "pending_appointment" | "appointed";

/** Read-only designation. Activation is the existing administratively verified appointment record. */
export function entityAppointmentStatus(input: {
  activatedAt?: string | null;
  acceptanceComplete: boolean;
  roleReviewStatus?: string | null;
  participatesInForum?: boolean | null;
  forumClearanceStatus?: string | null;
}): AppointmentStatus {
  if (input.activatedAt) return "appointed";
  const reviewsClear =
    !roleReviewBlocks(input.roleReviewStatus) &&
    (input.participatesInForum === false || forumCleared(input.forumClearanceStatus));
  return input.acceptanceComplete && reviewsClear ? "pending_appointment" : "candidate";
}

export type VisibilityDoc = {
  id?: string;
  classification: string;
  superseded_at: string | null;
  is_forum_prep: boolean;
  journey_stage?: number | null;
  member_specific?: boolean;
  forum_role?: string | null;
  version_label?: string | null;
};
export type VisibilityMember = {
  nda_verified_at: string | null;
  forum_clearance_status: string;
  is_candidate?: boolean;
  participates_in_forum?: boolean | null;
  /** Verified BoldSign execution of the assigned, approved Addendum version. */
  addendum_complete?: boolean;
  /** Active, version-bound restricted grants for this member. */
  grants?: RestrictedGrant[];
  has_entity_release?: boolean;
};

export const ADMIN_ONLY_FORUM_ROLES = ["secretariat_controls", "facilitator_run_of_show"];
export const PROTECTED_CLASSIFICATIONS = ["confidential_forum", "restricted_opportunity"];

export type RestrictedGrant = {
  document_id: string;
  version_label: string | null;
  revoked_at: string | null;
};

/** A grant covers exactly one document version and ends on revocation or supersession. */
export function grantCovers(
  grants: RestrictedGrant[] | undefined,
  doc: { id?: string; version_label?: string | null; superseded_at: string | null },
) {
  if (!doc.id || doc.superseded_at) return false;
  return (grants ?? []).some(
    (g) =>
      !g.revoked_at &&
      g.document_id === doc.id &&
      (g.version_label ?? null) === (doc.version_label ?? null),
  );
}

export type AddendumDoc = {
  id: string;
  forum_role?: string | null;
  superseded_at: string | null;
  signing_approved?: boolean;
  version_label?: string | null;
  countersignature_required?: boolean;
  member_id?: string | null;
};
export type SigningRecord = {
  document_id: string;
  status: string;
  version_label: string;
  countersigned_at?: string | null;
};

/** Only a verified BoldSign execution counts; portal acknowledgments never satisfy the Addendum. */
export function addendumSatisfied(
  docs: AddendumDoc[],
  assignments: SigningRecord[],
  memberId?: string,
) {
  return docs.some(
    (d) =>
      d.forum_role === "addendum" &&
      !d.superseded_at &&
      d.signing_approved &&
      (!d.member_id || !memberId || d.member_id === memberId) &&
      assignments.some(
        (a) =>
          a.document_id === d.id &&
          a.status === "completed" &&
          a.version_label === d.version_label &&
          (!d.countersignature_required || !!a.countersigned_at),
      ),
  );
}

/** Mirrors the database read policy. hasCompletion keeps a member's own signed historical copies visible. */
export function documentVisible(doc: VisibilityDoc, m: VisibilityMember, hasCompletion: boolean) {
  if (
    doc.classification === "secretariat_only" ||
    ADMIN_ONLY_FORUM_ROLES.includes(doc.forum_role ?? "")
  )
    return false;
  if (doc.superseded_at && !hasCompletion) return false;
  if (doc.classification === "confidential_forum") {
    if (!m.nda_verified_at || m.forum_clearance_status === "declined") return false;
    if (!doc.is_forum_prep && !forumCleared(m.forum_clearance_status)) return false;
  }
  if (doc.classification === "restricted_opportunity") {
    if (
      m.participates_in_forum === false ||
      !m.nda_verified_at ||
      !forumCleared(m.forum_clearance_status) ||
      !grantCovers(m.grants, doc)
    )
      return false;
  }
  if (
    PROTECTED_CLASSIFICATIONS.includes(doc.classification) &&
    doc.forum_role !== "addendum" &&
    !m.addendum_complete
  )
    return false;
  // Forum opt-outs receive nothing further until an explicit PRSC/DIS release.
  if (m.participates_in_forum === false && !hasCompletion) {
    if (
      doc.journey_stage === 1 ||
      PROTECTED_CLASSIFICATIONS.includes(doc.classification) ||
      !m.has_entity_release
    )
      return false;
  }
  // Forum candidates hold no PRSC/DIS seat: appointment-track stages (2–4) stay hidden.
  if (
    m.is_candidate &&
    !doc.member_specific &&
    doc.journey_stage != null &&
    doc.journey_stage >= 2 &&
    doc.journey_stage <= 4
  )
    return false;
  return true;
}

export type ClearanceCheck = {
  ndaVerified: boolean;
  addendumComplete: boolean;
  /** Applicable active Stage 1 action items not yet completed (titles). */
  incompleteStage1: string[];
  conflictSigned: boolean;
  conflictReviewDecision: string | null;
};

/** Ordinary Forum clearance requires completed prerequisites and a separate conflict-review decision. */
export function stage1ClearanceProblems(c: ClearanceCheck): string[] {
  const p: string[] = [];
  if (!c.ndaVerified) p.push("NDA verification incomplete");
  if (!c.addendumComplete) p.push("Confidentiality Addendum not executed through BoldSign");
  if (c.incompleteStage1.length)
    p.push(`Stage 1 items incomplete: ${c.incompleteStage1.join(", ")}`);
  if (!c.conflictSigned) p.push("Conflict / Recusal Confirmation not signed");
  if (c.conflictReviewDecision !== "approved")
    p.push("Administrative conflict review not approved");
  return p;
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
  if (!c.trackDocsComplete)
    p.push("Entity agreements and disclosures (Stages 2–3) not all complete");
  if (!c.countersigned) p.push("Authorized countersignature not confirmed");
  if (!c.appointmentRef?.trim()) p.push("Appointment action record reference missing");
  return p;
}

/** Candidate-facing status label. Never says "Member" before appointment. */
export function governanceStatusLabel(s: {
  status: string;
  forumCleared: boolean;
  stage3Done: boolean;
  appointed: { prsc: boolean; dis: boolean };
  tracks: ("prsc" | "dis")[];
}) {
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

export type Stage2ReleaseCheck = {
  target: "prsc" | "dis";
  memberEntity: string;
  role: string | null | undefined;
  isCandidate: boolean;
  isCommittee?: boolean;
  nda: NdaRecord;
  roleReviewStatus: string | null | undefined;
  stage2DocCount: number;
  alreadyReleased: boolean;
};

/** Explicit Stage 2 release gate. Forum participation or clearance never factors in. */
export function stage2ReleaseProblems(c: Stage2ReleaseCheck): string[] {
  const p: string[] = [];
  if (c.alreadyReleased) p.push(`${c.target.toUpperCase()} onboarding has already been started`);
  if (c.isCandidate || !c.role)
    p.push("Record an intended PRSC/DIS role in Edit member details first");
  if (!memberTracksFor(c.memberEntity).includes(c.target))
    p.push(`The member's intended role does not include ${c.target.toUpperCase()}`);
  if (roleCombinationTier(c.memberEntity, c.role ?? "", c.isCommittee).tier === "prohibited")
    p.push("This role combination is prohibited and cannot be released");
  const nda = ndaProblem(c.nda, c.target);
  if (nda) p.push(nda);
  if (roleReviewBlocks(c.roleReviewStatus))
    p.push("The role-combination review must be approved first");
  if (c.stage2DocCount === 0)
    p.push(`No approved ${c.target.toUpperCase()} Stage 2 documents are assigned to this role yet`);
  return p;
}

export type LegacyReleaseInput = {
  hasRelease: boolean;
  activatedAt: string | null;
  signedEntityDocs: number;
  unsignedEntityDocs: number;
};
/**
 * Existing members whose unsigned Stage 2–4 documents are now gated. "authorized" only when the
 * records themselves show prior entity onboarding (activation or a signed Stage 2–4 document for
 * that entity); anything else stays restricted until an admin reviews it.
 */
export function legacyReleaseCase(c: LegacyReleaseInput): "authorized" | "needs_review" | null {
  if (c.hasRelease || c.unsignedEntityDocs === 0) return null;
  return c.activatedAt || c.signedEntityDocs > 0 ? "authorized" : "needs_review";
}
