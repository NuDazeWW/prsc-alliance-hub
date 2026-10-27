export function leadershipPublicationAllowed(row: { is_placeholder?: boolean; publication_scope?: string; publication_approved_at?: string | null; publication_approved_by?: string | null }) {
  return Boolean(row.is_placeholder || (row.publication_scope === "portal_members" && row.publication_approved_at && row.publication_approved_by));
}

export function linkedProfilePermissions(permissions: Record<string, unknown> | null | undefined) {
  return { name: permissions?.p1 === "yes", affiliation: permissions?.p2 === "yes", bio: permissions?.p3 === "yes", photo: permissions?.p4 === "yes" };
}