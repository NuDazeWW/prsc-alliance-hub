export function normalizedRecipient(email: string): string { return email.trim().toLowerCase(); }
export function assertNdaRecipient(email: string, verifiedEmail?: string) {
  if (!verifiedEmail || normalizedRecipient(email) !== normalizedRecipient(verifiedEmail)) {
    throw new Error("Verify the executed NDA for this recipient before inviting");
  }
}
export function assertInviteIdentity(email: string, actualEmail: string | undefined, existingUserId: string | null, actualUserId: string) {
  if (!actualEmail || normalizedRecipient(email) !== normalizedRecipient(actualEmail) || (existingUserId && existingUserId !== actualUserId)) {
    throw new Error("Invitation identity does not match the verified recipient");
  }
}
export const freshInviteGovernance = () => ({ nda_confirmed: false, nda_reference: "", nda_entities: "" as "" | "prsc" | "dis" | "both", nda_scope: "", review_notes: "", prsc_scope: "", dis_scope: "", conflict_controls: "", nda_recipient_email: "" });