// Presentation only: stored roles and their permissions are unchanged.
export function memberRoleLabels(role: string | null | undefined, entity: string | null | undefined): string[] {
  if (role === "prsc_board_dis_advisor") return ["PRSC Board", "DIS Advisor"];
  if (role === "prsc_advisor_dis_board") return ["PRSC Advisor", "DIS Board"];
  const capacity = role === "advisor" ? "Advisor" : role === "board_member" ? "Board" : role === "methodology_committee" ? "Methodology Committee" : null;
  if (!capacity) return [];
  const entities = entity === "both" ? ["PRSC", "DIS"] : entity === "prsc" ? ["PRSC"] : entity === "dis" ? ["DIS"] : [];
  return entities.map((name) => `${name} ${capacity}`);
}

export function memberRoleLabel(role: string | null | undefined, entity: string | null | undefined): string {
  return memberRoleLabels(role, entity).join(" / ");
}
const ENTITY_FULL: Record<string, string> = { PRSC: "Partnership Readiness Standards Council, LLC", DIS: "Decision Intelligence Systems, Inc." };

/** Pre-appointment wording, e.g. "PRSC Board Candidate / DIS Advisor Candidate". */
export function memberCandidateLabel(role: string | null | undefined, entity: string | null | undefined): string {
  const labels = memberRoleLabels(role, entity);
  return labels.length ? labels.map((l) => `${l} Candidate`).join(" / ") : "Board or Advisor Candidate";
}

/** One chip per role/entity pair, e.g. "Advisor · Partnership Readiness Standards Council". */
export function memberRoleChips(role: string | null | undefined, entity: string | null | undefined): string[] {
  return memberRoleLabels(role, entity).map((label) => {
    const [org, ...rest] = label.split(" ");
    return `${rest.join(" ")} · ${ENTITY_FULL[org] ?? org}`;
  });
}

export type RoleKind = "board" | "advisor" | "committee";

/** Which role-orientation sections apply to a member. Committee comes from the role or the committee flag. */
export function memberRoleKinds(role: string | null | undefined, isCommittee = false): RoleKind[] {
  const kinds = new Set<RoleKind>();
  if (role === "board_member" || role === "prsc_board_dis_advisor" || role === "prsc_advisor_dis_board") kinds.add("board");
  if (role === "advisor" || role === "prsc_board_dis_advisor" || role === "prsc_advisor_dis_board") kinds.add("advisor");
  if (role === "methodology_committee" || isCommittee) kinds.add("committee");
  return (["board", "advisor", "committee"] as RoleKind[]).filter((k) => kinds.has(k));
}
