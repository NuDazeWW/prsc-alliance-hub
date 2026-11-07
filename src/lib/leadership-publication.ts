export function leadershipPublicationAllowed(row: { is_placeholder?: boolean; publication_scope?: string; publication_approved_at?: string | null; publication_approved_by?: string | null }) {
  return Boolean(row.is_placeholder || (row.publication_scope === "portal_members" && row.publication_approved_at && row.publication_approved_by));
}

/**
 * Policy (owner decision): submitting the Executive Profile places the member in the Leadership Team panel, inside the
 * portal only. Everyone with portal access is under NDA, and nothing is ever shown outside the portal. The approved
 * leadership row is therefore the consent; individual profile fields are shown with it. Administrators can still hide
 * or remove a person, and a revoked member is never shown.
 */
export function linkedProfilePermissions(_permissions?: Record<string, unknown> | null) {
  return { name: true, affiliation: true, bio: true, photo: true };
}
