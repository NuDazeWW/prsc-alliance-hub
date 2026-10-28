import { z } from "zod";
import { FORUM_INVITEE_LABEL } from "./member-role-labels";

export const INTENDED_ROLE_LABELS = {
  prsc_board: "PRSC Board", prsc_advisor: "PRSC Advisor",
  dis_board: "DIS Board", dis_advisor: "DIS Advisor", other: "Other",
} as const;
const namedRoles = ["prsc_board", "prsc_advisor", "dis_board", "dis_advisor"] as const;
export const intendedDesignationSchema = z.object({
  version: z.literal(1),
  kind: z.enum(["forum_invitee", "identified"]),
  entity: z.enum(["none", "prsc", "dis", "both"]),
  roles: z.array(z.enum(["prsc_board", "prsc_advisor", "dis_board", "dis_advisor", "other"])).max(5),
  other_text: z.string().trim().max(400, "Please keep the other intended designation to 400 characters."),
  committee: z.enum(["yes", "no", "undetermined"]),
}).strict().superRefine((value, context) => {
  const issue = (path: string, message: string) => context.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  if (new Set(value.roles).size !== value.roles.length) issue("roles", "Select each intended role only once.");
  if (value.roles.includes("other") && !value.other_text) issue("other_text", "Describe the other intended designation.");
  if (!value.roles.includes("other") && value.other_text) issue("other_text", "Select Other before entering an additional intended designation.");
  if (value.kind === "forum_invitee") {
    if (value.entity !== "none" || value.roles.length || value.other_text || value.committee === "yes") issue("kind", "A Forum invitee has no intended entity role or confirmed committee designation.");
    return;
  }
  if (!value.roles.length && !(value.committee === "yes" && value.entity !== "none")) issue("roles", "Choose an intended role or identify a committee designation.");
  if (value.entity === "none" && (value.roles.length !== 1 || value.roles[0] !== "other" || value.committee === "yes")) issue("entity", "An identified designation without an entity requires only Other and its description.");
  for (const role of namedRoles) {
    if (!value.roles.includes(role)) continue;
    const entity = role.startsWith("prsc_") ? "prsc" : "dis";
    if (value.entity !== entity && value.entity !== "both") issue("roles", "The intended roles must belong to the selected entity.");
  }
});
export type IntendedDesignation = z.infer<typeof intendedDesignationSchema>;
export type LegacyIntendedDesignationMember = {
  intended_designation?: unknown; role?: string | null; entity?: string | null;
  is_candidate?: boolean | null; is_methodology_committee?: boolean | null;
};

/** Future plans cannot narrow the NDA coverage required by an existing entity onboarding track. */
export function requiredInvitationNdaEntity(member: LegacyIntendedDesignationMember): "prsc" | "dis" | "both" {
  const covered = new Set<string>();
  const add = (entity: string | null | undefined) => {
    if (entity === "prsc" || entity === "both") covered.add("prsc");
    if (entity === "dis" || entity === "both") covered.add("dis");
  };
  if (!member.is_candidate) add(member.entity);
  const intent = intendedDesignationSchema.safeParse(member.intended_designation);
  if (intent.success) add(intent.data.entity);
  if (!covered.size) add(member.entity);
  return covered.size === 2 ? "both" : covered.has("dis") ? "dis" : covered.has("prsc") ? "prsc" : "both";
}
const forumIntent = (): IntendedDesignation => ({ version: 1, kind: "forum_invitee", entity: "none", roles: [], other_text: "", committee: "undetermined" });

/** Read metadata only. Existing roles, appointment records, and permissions are never modified. */
export function readIntendedDesignation(member: LegacyIntendedDesignationMember | null | undefined): IntendedDesignation {
  const stored = intendedDesignationSchema.safeParse(member?.intended_designation);
  if (stored.success) return stored.data;
  if (!member || member.is_candidate) return forumIntent();
  const entity = member.entity === "prsc" || member.entity === "dis" || member.entity === "both" ? member.entity : null;
  const committee = member.role === "methodology_committee" || member.is_methodology_committee === true ? "yes" : member.is_methodology_committee === false ? "no" : "undetermined";
  if (member.role === "prsc_board_dis_advisor") return { version: 1, kind: "identified", entity: "both", roles: ["prsc_board", "dis_advisor"], other_text: "", committee };
  if (member.role === "prsc_advisor_dis_board") return { version: 1, kind: "identified", entity: "both", roles: ["prsc_advisor", "dis_board"], other_text: "", committee };
  if (!entity) return forumIntent();
  const roles: IntendedDesignation["roles"] = [];
  if (member.role === "board_member" || member.role === "advisor") {
    const capacity = member.role === "board_member" ? "board" : "advisor";
    if (entity === "prsc" || entity === "both") roles.push(`prsc_${capacity}`);
    if (entity === "dis" || entity === "both") roles.push(`dis_${capacity}`);
  }
  if (!roles.length && committee !== "yes") return forumIntent();
  return { version: 1, kind: "identified", entity, roles, other_text: "", committee };
}

/** This label describes intention; appointment presentation remains in member-role-labels.ts. */
export function intendedDesignationLabel(value: IntendedDesignation | LegacyIntendedDesignationMember | null | undefined): string {
  const direct = intendedDesignationSchema.safeParse(value);
  const intent = direct.success ? direct.data : readIntendedDesignation(value as LegacyIntendedDesignationMember | null | undefined);
  if (intent.kind === "forum_invitee") return `${FORUM_INVITEE_LABEL} (no entity role identified)`;
  const labels = intent.roles.map((role) => role === "other" ? `Other: ${intent.other_text}` : INTENDED_ROLE_LABELS[role]);
  if (intent.committee === "yes") labels.push(`${intent.entity === "both" ? "PRSC / DIS" : intent.entity.toUpperCase()} Methodology Committee`);
  return `Intended: ${labels.join(" / ")}`;
}

export type IntendedDesignationProjection = {
  entity: "prsc" | "dis" | "both";
  role: "board_member" | "advisor" | "prsc_board_dis_advisor" | "prsc_advisor_dis_board" | "methodology_committee";
  is_candidate: boolean; is_methodology_committee: boolean; requiresAssignmentReview: boolean;
};
/** New-record compatibility only. Unsupported intent stays neutral until an explicit assignment review. */
export function projectIntendedDesignation(value: IntendedDesignation): IntendedDesignationProjection {
  const intent = intendedDesignationSchema.parse(value);
  const entity = intent.entity === "none" ? "prsc" : intent.entity;
  const neutral = (requiresAssignmentReview: boolean): IntendedDesignationProjection => ({ entity, role: "advisor", is_candidate: true, is_methodology_committee: false, requiresAssignmentReview });
  if (intent.kind === "forum_invitee") return neutral(false);
  if (intent.roles.includes("other")) return neutral(true);
  const roles = new Set(intent.roles);
  let role: IntendedDesignationProjection["role"] | null = null;
  if (roles.size === 0 && intent.committee === "yes" && intent.entity !== "none") role = "methodology_committee";
  if (roles.size === 1) {
    if ((intent.entity === "prsc" && roles.has("prsc_board")) || (intent.entity === "dis" && roles.has("dis_board"))) role = "board_member";
    if ((intent.entity === "prsc" && roles.has("prsc_advisor")) || (intent.entity === "dis" && roles.has("dis_advisor"))) role = "advisor";
  }
  if (roles.size === 2 && intent.entity === "both") {
    if (roles.has("prsc_board") && roles.has("dis_board")) role = "board_member";
    else if (roles.has("prsc_advisor") && roles.has("dis_advisor")) role = "advisor";
    else if (roles.has("prsc_board") && roles.has("dis_advisor")) role = "prsc_board_dis_advisor";
    else if (roles.has("prsc_advisor") && roles.has("dis_board")) role = "prsc_advisor_dis_board";
  }
  return role ? { entity, role, is_candidate: false, is_methodology_committee: intent.committee === "yes", requiresAssignmentReview: false } : neutral(true);
}
