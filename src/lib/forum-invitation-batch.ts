import { readIntendedDesignation } from "./intended-designation";
import { invitationNoteReady, linkedinSourceUrlSchema } from "./member-import-validation";
import { sameInvitationNdaProof, type InvitationNdaMember } from "./invitation-nda";

export type ForumInviteMember = InvitationNdaMember & {
  organization: string; title: string | null; role: "board_member" | "advisor" | "prsc_board_dis_advisor" | "prsc_advisor_dis_board" | "methodology_committee";
  is_methodology_committee: boolean; participates_in_forum?: boolean; why_you: string; linkedin_url?: string | null;
};
export type ForumBatchRow = {
  member: ForumInviteMember; selected: boolean; epoch: number; revision: number; loading: boolean; loaded: boolean;
  why_you: string; linkedin_url: string; background: string; source: string;
  nda_reference: string; nda_entities: "" | "prsc" | "dis" | "both"; nda_scope: string; nda_confirmed: boolean;
  ndaReviewId: string | null; eligibilityProblem: string | null; error: string; message: string;
  deliveryAttempted: boolean; sent: boolean; needsReload: boolean;
};

export function eligibleForumInvitee(member: ForumInviteMember): boolean {
  return member.is_candidate === true && member.status !== "revoked" && readIntendedDesignation(member).kind === "forum_invitee";
}

export function forumBatchRow(member: ForumInviteMember, epoch: number): ForumBatchRow {
  return { member, selected: true, epoch, revision: 0, loading: true, loaded: false,
    why_you: member.why_you ?? "", linkedin_url: member.linkedin_url ?? "", background: "", source: "",
    nda_reference: "", nda_entities: "", nda_scope: "", nda_confirmed: false, ndaReviewId: null,
    eligibilityProblem: null, error: "", message: "", deliveryAttempted: false, sent: false, needsReload: false };
}

export function forumBatchAsyncToken(row: ForumBatchRow): string {
  return JSON.stringify([row.member.id, row.member.email, row.epoch, row.revision, row.member.updated_at,
    row.why_you, row.linkedin_url, row.background]);
}

export function forumBatchNotesSaved(row: ForumBatchRow): boolean {
  const link = linkedinSourceUrlSchema.safeParse(row.linkedin_url);
  const savedLink = linkedinSourceUrlSchema.safeParse(row.member.linkedin_url);
  return link.success && savedLink.success && link.data === savedLink.data && row.why_you.trim() === (row.member.why_you ?? "").trim();
}

export function forumBatchReadyProblem(row: ForumBatchRow): string | null {
  if (!row.selected) return "Select this recipient.";
  if (!row.loaded || row.loading || row.needsReload) return "Load this recipient’s current stored record.";
  if (row.deliveryAttempted) return row.sent ? "Invitation sent in this session." : "A delivery was attempted; check invitation history before trying again.";
  if (!eligibleForumInvitee(row.member)) return "This is no longer an eligible Forum-only invitee.";
  if (!invitationNoteReady(row.why_you)) return "Complete and review the Why you note (at least 20 characters).";
  if (!forumBatchNotesSaved(row)) return "Save the reviewed note and LinkedIn source first.";
  if (!row.nda_confirmed || !row.ndaReviewId) return "Confirm and save this recipient’s own NDA review.";
  if (row.eligibilityProblem) return row.eligibilityProblem;
  if (!sameInvitationNdaProof(row.member, { reference: row.nda_reference, entities: row.nda_entities || null, scope: row.nda_scope })) return "The NDA fields changed; review and save them again.";
  return null;
}

export function forumBatchInvitationPayload(row: ForumBatchRow) {
  const problem = forumBatchReadyProblem(row);
  if (problem) throw new Error(problem);
  const m = row.member;
  return { first_name: m.first_name, last_name: m.last_name, email: m.email,
    organization: m.organization ?? "", title: m.title ?? "", entity: m.entity as "prsc" | "dis" | "both", role: m.role,
    is_candidate: m.is_candidate, is_methodology_committee: m.is_methodology_committee,
    participates_in_forum: m.participates_in_forum ?? true, intended_designation: readIntendedDesignation(m),
    why_you: row.why_you.trim(), selected_member_id: m.id, nda_review_id: row.ndaReviewId!,
    nda_confirmed: true, nda_recipient_email: m.email, nda_reference: row.nda_reference,
    nda_entities: row.nda_entities as "prsc" | "dis" | "both", nda_scope: row.nda_scope };
}
