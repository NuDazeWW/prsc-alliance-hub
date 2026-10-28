import { freshInviteGovernance } from "./invitation-evidence";
import { suggestedInvitationNdaEvidence, type InvitationNdaEvidence, type InvitationNdaMember } from "./invitation-nda";

/** Stored values are form suggestions, never an administrator's attestation. */
export function invitationNdaFormValues(member: InvitationNdaMember, options: InvitationNdaEvidence[]) {
  const evidence = suggestedInvitationNdaEvidence(member, options);
  return {
    ...freshInviteGovernance(),
    nda_reference: member.nda_reference || evidence?.reference || "",
    nda_entities: member.nda_entities || (evidence?.entities as "prsc" | "dis" | "both") || "",
    nda_scope: member.nda_scope || evidence?.scope || "",
  };
}

/** Any correction or change to the intended invitation needs a new review. */
export function clearInvitationNdaConfirmation<T extends { nda_confirmed: boolean; nda_recipient_email: string }>(form: T): T {
  return { ...form, nda_confirmed: false, nda_recipient_email: "" };
}
