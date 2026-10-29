// The Executive Profile is encouraged but never a gate. This is the single wording used in the
// Welcome Center and the Personal Documents introduction so the policy reads the same everywhere.
//
// Forum document gates are only: the applicable NDA, the approved confidentiality addendum, assignment,
// the acknowledgment/signature sequence, administrative clearance and restricted-access authorization.

export const PROFILE_ENCOURAGEMENT =
  "Your Executive Profile is strongly encouraged for future leadership and advisory consideration. It is not required to view released Forum documents, and it does not replace any confidentiality or signature step.";

export function profileLinkLabel(profileComplete: boolean) {
  return profileComplete ? "Review Your Executive Profile" : "Complete Your Executive Profile";
}

/** One wording for "nothing has been released yet", used by every Personal Documents entry point. */
export const DOCUMENTS_NOT_RELEASED_TITLE = "Not yet assigned or released";
export const DOCUMENTS_NOT_RELEASED_BODY =
  "Your documents have not been assigned or released yet. We will email you when they are. Your Executive Profile is optional for Forum participation.";
