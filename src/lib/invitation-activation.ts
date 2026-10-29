// Invitation activation binding: the session must come from this recipient's own
// invitation link, not from an unrelated existing sign-in.

export const INVITE_LINK_METHODS = ["otp", "invite", "magiclink", "recovery", "email/signup"];
export const INVITE_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export type AmrEntry = { method?: string; timestamp?: number };
export type ActivationMember = { user_id: string; email: string; status: string; first_access_at: string | null } | null;

export function activationProblem(input: {
  userId: string;
  sessionEmail: string | null | undefined;
  amr: unknown;
  nowSeconds: number;
  member: ActivationMember;
}): string | null {
  const amr = Array.isArray(input.amr) ? (input.amr as AmrEntry[]) : [];
  const fromLink = amr.some((a) => a && INVITE_LINK_METHODS.includes(String(a.method)) && typeof a.timestamp === "number" && input.nowSeconds - a.timestamp <= INVITE_SESSION_MAX_AGE_SECONDS && a.timestamp <= input.nowSeconds + 60);
  if (!fromLink) return "This session did not come from a valid invitation link";
  const m = input.member;
  if (!m) return "No invitation exists for this account";
  if (m.user_id !== input.userId) return "This invitation belongs to a different account";
  if (!input.sessionEmail || m.email.trim().toLowerCase() !== input.sessionEmail.trim().toLowerCase()) return "This invitation belongs to a different account";
  if (m.status !== "invited" || m.first_access_at) return "This invitation has already been used";
  return null;
}

/**
 * Recorded once, when the recipient sets their own password through their own invitation link. Before this was
 * written, members who had signed in and finished steps still showed "Invited / Hasn't signed in yet", received
 * invitation reminders and nudges, and their invitation never counted as used.
 */
export function activationRecord(nowIso: string) {
  return { status: "active" as const, first_access_at: nowIso, last_access_at: nowIso };
}
