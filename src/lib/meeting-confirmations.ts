// Meeting confirmation delivery: one confirmation per poll, confirmed slot and recipient.
// Retries reuse the same delivery key so the email provider deduplicates accepted sends.

export type ConfirmationRow = { member_id: string; status: "sending" | "sent" | "failed" };

export function confirmationKey(pollId: string, slotId: string, memberId: string) {
  return `meeting-confirmed:${pollId}:${slotId}:${memberId}`;
}

/** Recipients still owed this confirmation. "sending" means an uncertain earlier attempt: retry with the same key. */
export function recipientsToConfirm(memberIds: string[], existing: ConfirmationRow[]) {
  const sent = new Set(existing.filter((r) => r.status === "sent").map((r) => r.member_id));
  return memberIds.filter((id) => !sent.has(id));
}

const CONFIDENTIAL_TERMS =
  /\b(confidential|restricted|nascar|jared|nda|addendum|strategy brief|recusal|conflict)\b/i;
/** Polls reach members before the Addendum: their wording must stay neutral. */
export function pollWordingWarning(...texts: string[]) {
  return texts.some((t) => CONFIDENTIAL_TERMS.test(t))
    ? "This wording may reveal confidential details. Poll titles and descriptions are seen before the Confidentiality Addendum, so keep them neutral."
    : null;
}
