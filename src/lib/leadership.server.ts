import { memberRoleLabel } from "@/lib/member-role-labels";

/**
 * Puts a member who has submitted their profile into the Leadership Team panel (portal members only). Idempotent: a member who
 * already has a row, including one an administrator hid, is left as it is. Name, organization, bio and photo are read live
 * from the member's profile, so later profile edits carry through.
 */
export async function ensureLeaderForMember(sb: any, memberId: string, approvedBy: string): Promise<"added" | "exists" | "skipped"> {
  const { data: existing } = await sb.from("leadership_team").select("id").eq("member_id", memberId).limit(1);
  if (existing?.length) return "exists";
  const [{ data: member }, { data: profile }] = await Promise.all([
    sb.from("portal_members").select("id, first_name, last_name, role, entity, is_candidate, status").eq("id", memberId).maybeSingle(),
    sb.from("portal_profiles").select("preferred_name, professional_role, current_organization, submitted_at").eq("member_id", memberId).maybeSingle(),
  ]);
  if (!member || member.status === "revoked" || !profile?.submitted_at) return "skipped";
  const { data: last } = await sb.from("leadership_team").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim();
  const affiliation = [profile.professional_role, profile.current_organization].map((v: string | null) => (v ?? "").trim()).filter(Boolean).join(", ");
  const { error } = await sb.from("leadership_team").insert({
    name: (profile.preferred_name ?? "").trim() || fullName || "Member",
    title: member.is_candidate ? "Forum participant" : memberRoleLabel(member.role, member.entity, false),
    affiliation: affiliation || null,
    bio: null, photo_path: null, member_id: member.id, visible: true, is_placeholder: false,
    sort_order: (last?.[0]?.sort_order ?? 0) + 1,
    publication_scope: "portal_members", publication_approved_at: new Date().toISOString(), publication_approved_by: approvedBy,
  });
  if (error) throw error;
  return "added";
}
