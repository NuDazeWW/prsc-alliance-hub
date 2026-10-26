// Presentation only: stored roles and their permissions are unchanged.
export const FORUM_INVITEE_LABEL = "United Forum Invitee";
export const FORUM_PARTICIPANT_LABEL = "Forum Participant";
/** Forum-only members: "United Forum Invitee" before clearance, "Forum Participant" after. */
export function forumMemberLabel(forumClearance?: string | null) {
  return forumClearance === "cleared" || forumClearance === "cleared_restricted" ? FORUM_PARTICIPANT_LABEL : FORUM_INVITEE_LABEL;
}
const FORUM_CANDIDATE_LABEL = FORUM_INVITEE_LABEL;

export function memberRoleLabels(role: string | null | undefined, entity: string | null | undefined, isCandidate = false): string[] {
  if (isCandidate) return [FORUM_CANDIDATE_LABEL];
  if (role === "prsc_board_dis_advisor") return ["PRSC Board", "DIS Advisor"];
  if (role === "prsc_advisor_dis_board") return ["PRSC Advisor", "DIS Board"];
  const capacity = role === "advisor" ? "Advisor" : role === "board_member" ? "Board" : role === "methodology_committee" ? "Methodology Committee" : null;
  if (!capacity) return [];
  const entities = entity === "both" ? ["PRSC", "DIS"] : entity === "prsc" ? ["PRSC"] : entity === "dis" ? ["DIS"] : [];
  return entities.map((name) => `${name} ${capacity}`);
}

export function memberRoleLabel(role: string | null | undefined, entity: string | null | undefined, isCandidate = false): string {
  return memberRoleLabels(role, entity, isCandidate).join(" / ");
}
const ENTITY_FULL: Record<string, string> = { PRSC: "Partnership Readiness Standards Council, LLC", DIS: "Decision Intelligence Systems, Inc." };

/** Pre-appointment wording, e.g. "PRSC Board Candidate / DIS Advisor Candidate". */
export function memberCandidateLabel(role: string | null | undefined, entity: string | null | undefined, isCandidate = false): string {
  if (isCandidate) return FORUM_CANDIDATE_LABEL;
  const labels = memberRoleLabels(role, entity);
  return labels.length ? labels.map((l) => `${l} Candidate`).join(" / ") : "Board or Advisor Candidate";
}

/** One chip per role/entity pair, e.g. "Advisor · Partnership Readiness Standards Council". */
export function memberRoleChips(role: string | null | undefined, entity: string | null | undefined, isCandidate = false): string[] {
  if (isCandidate) return [FORUM_CANDIDATE_LABEL];
  return memberRoleLabels(role, entity).map((label) => {
    const [org, ...rest] = label.split(" ");
    return `${rest.join(" ")} · ${ENTITY_FULL[org] ?? org}`;
  });
}

export type RoleKind = "board" | "advisor" | "committee";

/** Which role-orientation sections apply to a member. Committee comes from the role or the committee flag. */
export function memberRoleKinds(role: string | null | undefined, isCommittee = false, isCandidate = false): RoleKind[] {
  if (isCandidate) return [];
  const kinds = new Set<RoleKind>();
  if (role === "board_member" || role === "prsc_board_dis_advisor" || role === "prsc_advisor_dis_board") kinds.add("board");
  if (role === "advisor" || role === "prsc_board_dis_advisor" || role === "prsc_advisor_dis_board") kinds.add("advisor");
  if (role === "methodology_committee" || isCommittee) kinds.add("committee");
  return (["board", "advisor", "committee"] as RoleKind[]).filter((k) => kinds.has(k));
}

export type DesignationMember = {
  role: string | null | undefined; entity: string | null | undefined; is_candidate?: boolean | null;
  forum_clearance_status?: string | null; prsc_activated_at?: string | null; dis_activated_at?: string | null;
};

/** What a member may be called: a PRSC/DIS title only once that entity's activation is recorded; otherwise "… Candidate". */
export function memberDesignationLabels(m: DesignationMember): string[] {
  if (m.is_candidate) return [forumMemberLabel(m.forum_clearance_status)];
  return memberRoleLabels(m.role, m.entity).map((label) => {
    const activated = label.startsWith("PRSC ") ? m.prsc_activated_at : label.startsWith("DIS ") ? m.dis_activated_at : null;
    return activated ? label : `${label} Candidate`;
  });
}
export function memberDesignation(m: DesignationMember): string {
  return memberDesignationLabels(m).join(" / ");
}
