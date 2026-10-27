import { hasCommunicationPreferences } from "./portal-profile-fields";

export function leadershipPublicationAllowed(row: { is_placeholder?: boolean; publication_scope?: string; publication_approved_at?: string | null; publication_approved_by?: string | null }) {
  return Boolean(row.is_placeholder || (row.publication_scope === "portal_members" && row.publication_approved_at && row.publication_approved_by));
}

export function linkedProfilePermissions(permissions: Record<string, unknown> | null | undefined) {
  // Intake preferences authorize internal preparation only, even if stale historic
  // p1…p4 grants remain in the same JSON record or its version is unrecognized.
  if (hasCommunicationPreferences(permissions)) return { name: false, affiliation: false, bio: false, photo: false };
  return { name: permissions?.p1 === "yes", affiliation: permissions?.p2 === "yes", bio: permissions?.p3 === "yes", photo: permissions?.p4 === "yes" };
}
