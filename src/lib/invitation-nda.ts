import { ndaProblem } from "./governance";
import { z } from "zod";
import {
  intendedDesignationSchema,
  requiredInvitationNdaEntity,
  type IntendedDesignation,
} from "./intended-designation";

export const invitationNdaSaveSchema = z
  .object({
    member_id: z.string().uuid(),
    expected_updated_at: z.string().datetime({ offset: true }),
    reference: z.string().trim().min(3, "Add this candidate’s executed NDA reference.").max(400),
    entities: z.enum(["prsc", "dis", "both"]),
    scope: z
      .string()
      .trim()
      .min(3, "Describe the information-sharing scope covered by this NDA.")
      .max(600),
    confirmed: z.literal(true, {
      errorMap: () => ({
        message: "Confirm that you reviewed this candidate’s own executed NDA before saving.",
      }),
    }),
    review_note: z.string().trim().max(2000).optional(),
  })
  .strict();

export type InvitationNdaEntities = "prsc" | "dis" | "both";
export type InvitationNdaProof = {
  reference: string;
  entities: InvitationNdaEntities;
  scope: string;
};
export type InvitationNdaMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  entity: string;
  is_candidate: boolean;
  status: string;
  updated_at: string;
  nda_reference: string | null;
  nda_entities: InvitationNdaEntities | null;
  nda_scope: string | null;
  nda_verified_at: string | null;
  nda_verified_by: string | null;
  intended_designation?: IntendedDesignation | null;
};
export type InvitationNdaEvidence = {
  reference: string;
  recipient_email: string;
  recipient_name: string;
  entities: string;
  scope: string;
  reviewer_id: string;
  verified_at: string;
};
export const normalizedNdaReference = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();
const normalizedEmail = (value: string) => value.trim().toLowerCase();
export const invitationNdaRecipientName = (
  member: Pick<InvitationNdaMember, "first_name" | "last_name">,
) => `${member.first_name.trim()} ${member.last_name.trim()}`;
export function invitationNdaProof(
  member: Pick<InvitationNdaMember, "nda_reference" | "nda_entities" | "nda_scope">,
) {
  return {
    reference: normalizedNdaReference(member.nda_reference),
    entities: member.nda_entities,
    scope: (member.nda_scope ?? "").trim(),
  };
}
export function sameInvitationNdaProof(
  member: Pick<InvitationNdaMember, "nda_reference" | "nda_entities" | "nda_scope">,
  proof: { reference: string; entities: string | null; scope: string },
) {
  const previous = invitationNdaProof(member);
  return (
    previous.reference === normalizedNdaReference(proof.reference) &&
    previous.entities === proof.entities &&
    previous.scope === proof.scope.trim()
  );
}
export function planInvitationNdaVerification(
  member: InvitationNdaMember,
  proof: InvitationNdaProof,
  reviewerId: string,
  now: string,
  recipientProofChanged = false,
  sourceEvidence?: InvitationNdaEvidence | null,
) {
  const proofChanged = recipientProofChanged || !sameInvitationNdaProof(member, proof);
  const preserveMember = !proofChanged && Boolean(member.nda_verified_at && member.nda_verified_by);
  const preserveEvidence =
    !recipientProofChanged &&
    Boolean(
      sourceEvidence &&
      normalizedEmail(sourceEvidence.recipient_email) === normalizedEmail(member.email) &&
      sourceEvidence.recipient_name === invitationNdaRecipientName(member) &&
      normalizedNdaReference(sourceEvidence.reference) ===
        normalizedNdaReference(proof.reference) &&
      sourceEvidence.entities === proof.entities &&
      sourceEvidence.scope === proof.scope.trim() &&
      sourceEvidence.verified_at &&
      sourceEvidence.reviewer_id,
    );
  const verificationPreserved = preserveMember || preserveEvidence;
  return {
    proofChanged,
    verificationPreserved,
    verificationSource: preserveMember ? "member" : preserveEvidence ? "evidence" : "new_review",
    patch: {
      nda_reference:
        !proofChanged && member.nda_reference
          ? member.nda_reference
          : normalizedNdaReference(proof.reference),
      nda_entities: proof.entities,
      nda_scope: proof.scope.trim(),
      nda_verified_at: preserveMember
        ? member.nda_verified_at!
        : preserveEvidence
          ? sourceEvidence!.verified_at
          : now,
      nda_verified_by: preserveMember
        ? member.nda_verified_by!
        : preserveEvidence
          ? sourceEvidence!.reviewer_id
          : reviewerId,
    },
  };
}
/** A suggestion is never verification. Never guess among multiple records or replace a different canonical reference. */
export function suggestedInvitationNdaEvidence(
  member: InvitationNdaMember,
  options: InvitationNdaEvidence[],
) {
  const owned = options.filter(
    (evidence) => normalizedEmail(evidence.recipient_email) === normalizedEmail(member.email),
  );
  const reference = normalizedNdaReference(member.nda_reference);
  const canonical = owned.find(
    (evidence) => normalizedNdaReference(evidence.reference) === reference,
  );
  if (canonical) return canonical;
  return !reference && owned.length === 1 && (!member.nda_entities || !member.nda_scope?.trim())
    ? owned[0]
    : null;
}
export function assertInvitationNdaEvidenceOwner(
  member: InvitationNdaMember,
  evidence: InvitationNdaEvidence | null,
  otherMemberIds: string[] = [],
) {
  if (
    otherMemberIds.some((id) => id !== member.id) ||
    (evidence && normalizedEmail(evidence.recipient_email) !== normalizedEmail(member.email))
  ) {
    throw new Error(
      "This NDA reference belongs to another recipient. Use this candidate’s own executed NDA reference; evidence cannot be transferred.",
    );
  }
}
export function invitationNdaEligibilityProblem(
  member: InvitationNdaMember,
  evidence: InvitationNdaEvidence | null,
) {
  if (member.status === "revoked")
    return "This candidate’s portal access is revoked; an NDA review does not restore access.";
  const problem = ndaProblem(
    {
      verified_at: member.nda_verified_at,
      verified_by: member.nda_verified_by,
      reference: member.nda_reference,
      entities: member.nda_entities,
      scope: member.nda_scope,
    },
    requiredInvitationNdaEntity(member),
  );
  if (problem) return problem;
  if (!evidence) return "Review and save this recipient’s NDA evidence before inviting.";
  if (
    normalizedEmail(evidence.recipient_email) !== normalizedEmail(member.email) ||
    evidence.recipient_name !== invitationNdaRecipientName(member) ||
    normalizedNdaReference(evidence.reference) !== normalizedNdaReference(member.nda_reference) ||
    evidence.entities !== member.nda_entities ||
    evidence.scope !== member.nda_scope?.trim()
  ) {
    return "The saved NDA evidence does not match this candidate’s current details. Review and save the correction before inviting.";
  }
  return null;
}
export function invitationNdaSnapshot(member: InvitationNdaMember) {
  const verifiedAt = member.nda_verified_at ? new Date(member.nda_verified_at) : null;
  return {
    member_id: member.id,
    recipient_email: normalizedEmail(member.email),
    recipient_name: invitationNdaRecipientName(member),
    ...invitationNdaProof(member),
    verified_at:
      verifiedAt && Number.isFinite(verifiedAt.getTime())
        ? verifiedAt.toISOString()
        : member.nda_verified_at,
    verified_by: member.nda_verified_by,
    intended_designation: member.intended_designation
      ? JSON.stringify(intendedDesignationSchema.parse(member.intended_designation))
      : null,
  };
}
/** An invitation may reuse only the exact reviewed member/proof/stamp; IDs from another candidate never qualify. */
export function invitationNdaReviewMatches(
  review: { member_id?: string; kind?: string; decision?: string; details?: unknown } | null,
  member: InvitationNdaMember,
) {
  if (
    !review ||
    review.member_id !== member.id ||
    review.kind !== "nda" ||
    review.decision !== "verified" ||
    !review.details ||
    typeof review.details !== "object"
  )
    return false;
  const details = review.details as { source?: string; saved?: unknown };
  if (
    details.source !== "invitation_nda_review" ||
    !details.saved ||
    typeof details.saved !== "object"
  )
    return false;
  const saved = details.saved as Record<string, unknown>;
  return Object.entries(invitationNdaSnapshot(member)).every(
    ([key, value]) => saved[key] === value,
  );
}

/** Only a saved review of this exact selected recipient may supply existing NDA stamps. */
export function assertReviewedInvitationNda(
  input: {
    selected_member_id: string;
    email: string;
    first_name: string;
    last_name: string;
    nda_reference?: string;
    nda_entities?: string;
    nda_scope?: string;
    nda_confirmed?: boolean;
  },
  member: InvitationNdaMember | null,
  review: {
    reviewer_id?: string;
    member_id?: string;
    kind?: string;
    decision?: string;
    details?: unknown;
  } | null,
  adminId: string,
) {
  if (
    !member ||
    member.id !== input.selected_member_id ||
    normalizedEmail(member.email) !== normalizedEmail(input.email) ||
    member.first_name.trim() !== input.first_name ||
    member.last_name.trim() !== input.last_name ||
    member.status === "revoked" ||
    !input.nda_confirmed ||
    !sameInvitationNdaProof(member, {
      reference: input.nda_reference ?? "",
      entities: input.nda_entities ?? null,
      scope: input.nda_scope ?? "",
    }) ||
    review?.reviewer_id !== adminId ||
    !invitationNdaReviewMatches(review, member)
  ) {
    throw new Error(
      "This candidate’s identity or NDA review has changed. Reload their stored details, confirm and save the review again before proceeding.",
    );
  }
  const problem = ndaProblem(
    {
      verified_at: member.nda_verified_at,
      verified_by: member.nda_verified_by,
      reference: member.nda_reference,
      entities: member.nda_entities,
      scope: member.nda_scope,
    },
    requiredInvitationNdaEntity(member),
  );
  if (problem) throw new Error(problem);
}
