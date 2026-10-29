// Whether a member has actually been emailed an invitation. A saved roster entry carries the stored status
// "invited" before anything is sent, so that status alone must never be shown to an administrator as
// "invited". `inviteUserByEmail` marks the sign-in account with `invited_at`; staging a member does not.

export type InvitationEvidence = {
  first_access_at?: string | null;
  has_profile?: boolean;
  /** `invited_at` on the member's sign-in account, or null when the account was only staged. */
  auth_invited_at?: string | null;
  /** Count of successfully delivered portal emails (invitation, reminders, notices). */
  emails_sent?: number;
};

/** True when there is any evidence the person was emailed an invitation or has already come in. */
export function invitationWasSent(e: InvitationEvidence): boolean {
  return Boolean(e.first_access_at || e.has_profile || e.auth_invited_at || (e.emails_sent ?? 0) > 0);
}

export const NOT_INVITED_LABEL = "Added — not invited yet";
export const NOT_INVITED_DETAIL = "No invitation email has been sent";
