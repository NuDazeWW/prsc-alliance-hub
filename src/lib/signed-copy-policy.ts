/** Founder directive (initial launch): no external email delivery of signed copies; portal access only. */
export const SIGNED_COPY_EMAIL_ENABLED = false as boolean;
export const SIGNED_COPY_EMAIL_DISABLED_MESSAGE =
  "Emailing signed copies is turned off for launch. Members download executed copies from their portal.";

/** Founder-designated authorized administrator for signing-completion notices (link only, never an attachment). */
export const SIGNING_NOTICE_ADMIN = "admin@readinessterminal.com";
export function signingNoticeKey(assignmentId: string) {
  return `boldsign-completed-admin:${assignmentId}`;
}
