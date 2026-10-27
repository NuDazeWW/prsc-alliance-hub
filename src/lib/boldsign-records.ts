export type BoldSignProperties = { status?: string; documentStatus?: string; signerDetails?: { signerEmail?: string; status?: string; signedDate?: string }[] };
export function verifiedSigningState(properties: BoldSignProperties, email: string): "pending" | "signed" | "completed" {
  const signer = properties.signerDetails?.find(s => s.signerEmail?.trim().toLowerCase() === email.trim().toLowerCase());
  if (!signer || !["completed", "signed"].includes(signer.status?.toLowerCase() ?? "")) return "pending";
  return (properties.status ?? properties.documentStatus ?? "").toLowerCase() === "completed" ? "completed" : "signed";
}
export function boldSignDocumentId(url: string | null): string | null {
  if (!url) return null;
  try { const parsed = new URL(url); return parsed.searchParams.get("documentId"); } catch { return null; }
}