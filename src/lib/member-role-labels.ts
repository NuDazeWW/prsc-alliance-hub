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