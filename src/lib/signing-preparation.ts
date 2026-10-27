// Automatic BoldSign preparation rules: pure and shared by server code and tests.

/** Gate B (real executives) is not authorized: automatic requests go only to fictional TEST identities. */
export const GATE_B_AUTHORIZED = false;

export function isFictionalTestIdentity(email: string) {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  return /test/.test(local);
}

export type PrepDoc = { action: string; signing_approved?: boolean | null; boldsign_template_id?: string | null; superseded_at: string | null; version_label: string | null };
export type PrepAssignment = { status: string; version_label: string; boldsign_document_id: string; disclosure_hash?: string | null } | null;

/** start: create one request; resume: reuse the existing session; block: reason. */
export function signingAction(doc: PrepDoc, existing: PrepAssignment, memberEmail: string, disclosureHash: string | null):
  { kind: "resume" } | { kind: "start" } | { kind: "manual" } | { kind: "block"; reason: string } {
  if (doc.action !== "boldsign" || doc.superseded_at || !doc.version_label) return { kind: "block", reason: "This signing assignment requires a current approved version" };
  if (existing) {
    if (existing.status === "preparing") return { kind: "block", reason: "Your signing session is being prepared. Please try again in a moment" };
    if (existing.version_label !== doc.version_label) return { kind: "block", reason: "Signing assignment changed; administrator review required" };
    if (disclosureHash && existing.disclosure_hash && existing.disclosure_hash !== disclosureHash)
      return { kind: "block", reason: "Your answers differ from the version prepared for signing. Please contact the Secretariat to issue a new signing version" };
    return { kind: "resume" };
  }
  if (doc.signing_approved && doc.boldsign_template_id) {
    if (!GATE_B_AUTHORIZED && !isFictionalTestIdentity(memberEmail)) return { kind: "block", reason: "Automatic signing is not yet enabled for this account" };
    return { kind: "start" };
  }
  return { kind: "manual" };
}

export type Disclosures = { conflict_answer: "none" | "changed" | "unsure"; conflict_details: string };

export function canonicalDisclosures(d: Disclosures) {
  return JSON.stringify({ conflict_answer: d.conflict_answer, conflict_details: d.conflict_details.trim() });
}

export async function disclosureHash(d: Disclosures) {
  const bytes = new TextEncoder().encode(canonicalDisclosures(d));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const CONFLICT_LABELS: Record<Disclosures["conflict_answer"], string> = { none: "No conflict", changed: "New or changed conflict", unsure: "Unsure, please review" };
