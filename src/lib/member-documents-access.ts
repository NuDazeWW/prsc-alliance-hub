/** Fetch authorized documents for every signed-in member; the server owns release/eligibility checks. */
export function shouldLoadMemberDocuments(session: { member?: unknown; hasProfile?: boolean } | null | undefined) {
  return Boolean(session?.member);
}