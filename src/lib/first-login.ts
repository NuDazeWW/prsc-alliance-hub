export function afterOrientation(polls: readonly { status: string }[]) {
  return polls.some((p) => p.status === "open") ? "meetings" : "profile";
}
