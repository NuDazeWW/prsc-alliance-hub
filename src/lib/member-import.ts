import type { z } from "zod";
import { intendedDesignationSchema, projectIntendedDesignation } from "./intended-designation";
import { importWhyYouSchema, linkedinSourceUrlSchema } from "./member-import-validation";

type IntendedDesignation = z.infer<typeof intendedDesignationSchema>;
type IntendedRole = IntendedDesignation["roles"][number];

/** Staging data only. Parsing a list never creates members, verifies an NDA, or sends mail. */
export type MemberImportRow = {
  first_name: string;
  last_name: string;
  email: string;
  organization: string;
  title: string;
  entity: "prsc" | "dis" | "both";
  role: "board_member" | "advisor" | "prsc_board_dis_advisor" | "prsc_advisor_dis_board" | "methodology_committee";
  why_you: string;
  is_methodology_committee: boolean;
  is_candidate: boolean;
  participates_in_forum?: boolean;
  linkedin_url: string;
  background: string;
  intended_designation: IntendedDesignation;
};

const LIST_HEADERS = "first_name,last_name,email,organization,title,invitation_type,entity,roles,other_role,methodology_committee,linkedin_url,background,why_you";
export const MEMBER_LIST_TEMPLATE = `${LIST_HEADERS}\nTest,One,test1@example.test,Example Group,Executive,forum_invitee,None,,,Undetermined,,"Optional administrator-supplied background. Review any AI draft before saving.",\nTest,Two,test2@example.test,Example Group,Executive,identified,Both,PRSC Board; DIS Advisor,,No,,,\n`;

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  let closed = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i += 1; }
      else if (ch === '"') { quoted = false; closed = true; }
      else value += ch;
    } else if (ch === ",") {
      fields.push(value.trim()); value = ""; closed = false;
    } else if (ch === '"' && !value.trim() && !closed) {
      quoted = true; value = "";
    } else {
      if (closed && ch.trim()) throw new Error("Unexpected text after a quoted CSV value.");
      if (ch === '"') throw new Error("Quote CSV values containing quotation marks.");
      value += ch;
    }
  }
  if (quoted) throw new Error("A quoted CSV value is not closed.");
  fields.push(value.trim());
  return fields;
}

// Keep pasted background paragraphs together, including escaped double quotes.
function splitCsvRecords(text: string): string[] {
  const records: string[] = [];
  let current = "";
  let quoted = false;
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === '"') {
      if (quoted && normalized[i + 1] === '"') { current += '""'; i += 1; continue; }
      quoted = !quoted;
    }
    if (ch === "\n" && !quoted) { records.push(current); current = ""; }
    else current += ch;
  }
  if (quoted) throw new Error("A quoted CSV value is not closed. Save the spreadsheet as CSV UTF-8 and try again.");
  records.push(current);
  return records.filter((record) => record.trim());
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const HEADER_ALIASES: Record<string, string> = {
  first: "first_name", firstname: "first_name", last: "last_name", lastname: "last_name",
  email_address: "email", company: "organization", org: "organization",
  designation: "entity", entity_designation: "entity", why: "why_you", why_they_were_chosen: "why_you",
  linkedin: "linkedin_url", linkedin_profile: "linkedin_url", bio: "background", about: "background",
  experience: "background", linkedin_bio: "background", linkedin_background: "background",
  committee: "methodology_committee", methodology: "methodology_committee",
  is_methodology_committee: "methodology_committee", methodology_commitee: "methodology_committee",
  other: "other_role", other_text: "other_role", invitation_kind: "invitation_type", intended_roles: "roles",
};

const FORUM_ALIASES = new Set(["candidate", "forum_candidate", "forum_invitee", "united_forum_invitee"]);
const IDENTIFIED_ALIASES = new Set(["identified", "identified_role", "identified_roles", "prsc_dis_role", "identified_for_a_prsc_dis_role"]);
const ROLE_ALIASES: Record<string, IntendedRole> = {
  prsc_board: "prsc_board", prsc_board_member: "prsc_board", prsc_advisor: "prsc_advisor",
  dis_board: "dis_board", dis_board_member: "dis_board", dis_advisor: "dis_advisor", other: "other",
};

function readCommittee(value: string, legacy: boolean): IntendedDesignation["committee"] {
  const normalized = normalizeKey(value);
  if (!normalized) return legacy ? "no" : "undetermined";
  if (["yes", "true", "1", "y"].includes(normalized)) return "yes";
  if (["no", "false", "0", "n"].includes(normalized)) return "no";
  if (normalized === "undetermined") return "undetermined";
  throw new Error("methodology_committee must be Yes, No, or Undetermined.");
}

function parseDesignation(record: Record<string, string>, legacy: boolean): IntendedDesignation {
  const singleRole = record.role ?? "";
  const rolesText = record.roles || singleRole;
  if (record.roles && singleRole && normalizeKey(record.roles) !== normalizeKey(singleRole)) {
    throw new Error("use either role or roles, rather than conflicting values in both columns.");
  }
  const rawRoles = rolesText.split(/[;,|]+/).map(normalizeKey).filter(Boolean);
  const forumRole = rawRoles.some((role) => FORUM_ALIASES.has(role));
  const rawKind = normalizeKey(record.invitation_type ?? "");
  if (rawKind && !FORUM_ALIASES.has(rawKind) && !IDENTIFIED_ALIASES.has(rawKind)) {
    throw new Error("invitation_type must be forum_invitee or identified.");
  }
  const kind = rawKind ? (FORUM_ALIASES.has(rawKind) ? "forum_invitee" : "identified") : forumRole ? "forum_invitee" : "identified";
  if (forumRole && (rawRoles.length !== 1 || kind !== "forum_invitee")) {
    throw new Error("United Forum invitee cannot be combined with intended PRSC/DIS roles.");
  }
  let entity = normalizeKey(record.entity ?? "");
  if (!entity && kind === "forum_invitee") entity = "none";
  if (!["none", "prsc", "dis", "both"].includes(entity)) {
    throw new Error("entity must be None, PRSC, DIS, or Both.");
  }
  // The old Forum CSV represented the neutral role using an entity placeholder.
  if (legacy && kind === "forum_invitee") entity = "none";
  let committee = readCommittee(record.methodology_committee ?? "", legacy);
  const roles: IntendedRole[] = [];
  for (const role of rawRoles) {
    if (FORUM_ALIASES.has(role)) continue;
    if (ROLE_ALIASES[role]) { roles.push(ROLE_ALIASES[role]); continue; }
    if (["methodology_committee", "committee", "methodology_committee_member"].includes(role)) { committee = "yes"; continue; }
    if (["prsc_board_dis_advisor", "prsc_board_member_dis_advisor"].includes(role)) {
      roles.push("prsc_board", "dis_advisor"); continue;
    }
    if (["prsc_advisor_dis_board", "prsc_advisor_dis_board_member"].includes(role)) {
      roles.push("prsc_advisor", "dis_board"); continue;
    }
    if (["board_member", "board", "advisor"].includes(role)) {
      if (entity === "none") throw new Error("an entity is required for a board or advisor role.");
      const suffix = role === "advisor" ? "advisor" : "board";
      if (entity === "prsc" || entity === "both") roles.push(`prsc_${suffix}` as IntendedRole);
      if (entity === "dis" || entity === "both") roles.push(`dis_${suffix}` as IntendedRole);
      continue;
    }
    throw new Error(`unknown role “${role}”. Use PRSC Board, PRSC Advisor, DIS Board, DIS Advisor, Other, or United Forum invitee.`);
  }
  const parsed = intendedDesignationSchema.safeParse({
    version: 1, kind, entity, roles: [...new Set(roles)], other_text: record.other_role ?? "", committee,
  });
  if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
  return parsed.data;
}

/** Accepts the original member CSV and the explicit intended-designation format. */
export function parseMemberList(text: string): { rows: MemberImportRow[]; errors: string[] } {
  let records: string[];
  let keys: string[];
  try {
    records = splitCsvRecords(text);
    if (records.length < 2) return { rows: [], errors: ["The file needs a header row and at least one member."] };
    keys = splitCsvLine(records[0]).map(normalizeKey).map((key) => HEADER_ALIASES[key] ?? key);
  } catch (error) {
    return { rows: [], errors: [(error as Error).message] };
  }
  const required = ["first_name", "last_name", "email"];
  const missing = required.filter((key) => !keys.includes(key));
  if (!keys.includes("role") && !keys.includes("roles") && !keys.includes("invitation_type")) missing.push("roles or invitation_type");
  if (missing.length) return { rows: [], errors: [`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`] };
  const repeated = keys.filter((key, i) => key && keys.indexOf(key) !== i);
  if (repeated.length) return { rows: [], errors: [`Duplicate columns: ${[...new Set(repeated)].join(", ")}.`] };
  const legacy = !keys.includes("roles") && !keys.includes("invitation_type");
  const errors: string[] = [];
  const rows: MemberImportRow[] = [];
  const emailRows = new Map<string, number>();
  let duplicateEmail = false;
  records.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const label = `Row ${rowNumber}`;
    try {
      const cells = splitCsvLine(line);
      if (cells.length > keys.length) throw new Error("more values than header columns. Quote values containing commas.");
      const record = Object.fromEntries(keys.map((key, i) => [key, cells[i] ?? ""]));
      const email = (record.email ?? "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("a valid email is required.");
      const normalizedEmail = email.toLowerCase();
      const originalRow = emailRows.get(normalizedEmail);
      if (originalRow) { duplicateEmail = true; throw new Error(`duplicate email also appears in row ${originalRow}. Remove duplicates before importing.`); }
      emailRows.set(normalizedEmail, rowNumber);
      if (!record.first_name || !record.last_name) throw new Error("first and last name are required.");
      const intended = parseDesignation(record, legacy);
      const projected = projectIntendedDesignation(intended);
      const whyYou = importWhyYouSchema.parse(record.why_you);
      const linkedinUrl = linkedinSourceUrlSchema.parse(record.linkedin_url);
      rows.push({
        first_name: record.first_name, last_name: record.last_name, email,
        organization: record.organization ?? "", title: record.title ?? "", entity: projected.entity, role: projected.role,
        why_you: whyYou, is_methodology_committee: projected.is_methodology_committee,
        is_candidate: projected.is_candidate, linkedin_url: linkedinUrl ?? "",
        background: (record.background ?? "").slice(0, 8000), intended_designation: intended,
      });
    } catch (error) { errors.push(`${label}: ${(error as Error).message}`); }
  });
  // A duplicate source list must be corrected before any part of it can be submitted.
  return { rows: duplicateEmail ? [] : rows, errors };
}
