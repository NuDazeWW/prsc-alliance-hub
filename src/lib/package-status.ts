// "Package ready" is the end of the journey for members who are not in the Forum. For Forum members the journey ends
// when they are cleared for the Forum, so the same stored status reads "Forum cleared" once clearance is recorded.
type StatusMember = { package_status: string; participates_in_forum?: boolean | null; forum_clearance_status?: string | null };

export function isForumCleared(m: Pick<StatusMember, "forum_clearance_status">) {
  return m.forum_clearance_status === "cleared" || m.forum_clearance_status === "cleared_restricted";
}

export function packageStatusLabel(m: StatusMember): string {
  if (m.participates_in_forum !== false && isForumCleared(m)) return "Forum cleared";
  if (m.package_status === "package_ready" && m.participates_in_forum !== false) return "Documents complete";
  return m.package_status.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

export function packageReadyOptionLabel(m: Pick<StatusMember, "participates_in_forum">) {
  return m.participates_in_forum !== false ? "Documents complete" : "Package ready";
}
