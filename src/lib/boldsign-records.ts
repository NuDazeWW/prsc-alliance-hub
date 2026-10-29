export type BoldSignProperties = {
  status?: string;
  documentStatus?: string;
  signerDetails?: { signerEmail?: string; status?: string; signedDate?: string }[];
};
export function verifiedSigningState(
  properties: BoldSignProperties,
  email: string,
): "pending" | "signed" | "completed" {
  const signer = properties.signerDetails?.find(
    (s) => s.signerEmail?.trim().toLowerCase() === email.trim().toLowerCase(),
  );
  if (!signer || !["completed", "signed"].includes(signer.status?.toLowerCase() ?? ""))
    return "pending";
  return (properties.status ?? properties.documentStatus ?? "").toLowerCase() === "completed"
    ? "completed"
    : "signed";
}
export function boldSignDocumentId(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("documentId");
  } catch {
    return null;
  }
}

const DONE_SIGNER = ["completed", "signed"];

/**
 * True only when BoldSign itself reports the whole document completed, with at least one signer
 * other than the member, and every signer finished. Never inferred from the member's signature alone.
 */
export function countersignatureVerified(
  properties: BoldSignProperties,
  memberEmail: string,
): boolean {
  if ((properties.status ?? properties.documentStatus ?? "").toLowerCase() !== "completed")
    return false;
  const signers = properties.signerDetails ?? [];
  const member = memberEmail.trim().toLowerCase();
  if (
    signers.length < 2 ||
    !signers.every((s) => DONE_SIGNER.includes(s.status?.toLowerCase() ?? ""))
  )
    return false;
  return signers.some((s) => (s.signerEmail ?? "").trim().toLowerCase() !== member);
}

/** What the member should see for a signing assignment. Only a verified, completed assignment is "completed". */
export type SigningUiState = "none" | "in_progress" | "signed_awaiting" | "completed";
export function signingUiState(assignmentStatus: string | null | undefined): SigningUiState {
  if (!assignmentStatus) return "none";
  if (assignmentStatus === "completed") return "completed";
  if (assignmentStatus === "signed") return "signed_awaiting";
  return "in_progress";
}

/** Mirrors signingAction: a signing request can start from an approved template or an admin-recorded BoldSign document. */
export function signingReady(
  doc: {
    signing_approved?: boolean | null;
    boldsign_template_id?: string | null;
    member_id?: string | null;
    external_url?: string | null;
  },
  memberId: string,
): boolean {
  if (doc.signing_approved && doc.boldsign_template_id) return true;
  return doc.member_id === memberId && boldSignDocumentId(doc.external_url ?? null) !== null;
}
