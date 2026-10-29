// Member-facing explanation shown above Forum availability choices in the meeting calendar.
// General scheduling copy only: no restricted briefing details belong here or in poll emails.

export const FORUM_CALENDAR_WELCOME = "Welcome to Your Live Meeting Calendar!";
export const FORUM_CALENDAR_PURPOSE = "This calendar is used to coordinate and confirm meetings among invited executives and advisors.";
export const FORUM_INTRO_HEADING = "We're Planning the First United Strategic Coordination Forum";
export const FORUM_INTRO_PARAGRAPHS = [
  "We are bringing together a select group of experienced executives and strategic advisors for an inaugural United Strategic Coordination Forum, a confidential, 90-minute working discussion focused on the next phase of growth for the Partnership Readiness Standards Council (PRSC) and Decision Intelligence Systems (DIS).",
  "Our urgent, central issue is how emerging opportunities and potential strategic partnerships could change the way we introduce the PRSC Readiness Standard™ and the DIS technology platform to the market. We will explore potential brand, media, data, and industry relationships; evaluate alternative approaches; and identify the evidence and next steps needed to move forward responsibly.",
] as const;
export const FORUM_NON_VOTING_NOTE =
  "This is a collaborative, non-voting strategic discussion—not a formal board meeting or decision-making session. Your experience, independent judgment, and perspective are the reasons you've been invited. Participation does not constitute an appointment to PRSC or DIS or a commitment to accept a future role.";

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

/** "three" for 3 (the approved wording), so the sentence stays true if a poll has a different number of slots. */
export function slotCountWord(count: number) {
  return Number.isInteger(count) && count >= 1 && count < NUMBER_WORDS.length ? NUMBER_WORDS[count] : String(count);
}

export function forumSlotsSentence(slotCount: number) {
  return `We want to meet as soon as possible. We know your time is valuable and calendars are busy, so we've started with ${slotCountWord(slotCount)} initial meeting ${slotCount === 1 ? "slot" : "slots"}. Please select every option that works for you.`;
}

/** Forum polls are stored with meeting_type "forum"; tolerate a custom type or title that names the Forum. */
export function isForumPoll(poll: { meeting_type?: string | null; title?: string | null }) {
  return /forum/i.test(poll.meeting_type ?? "") || /forum/i.test(poll.title ?? "");
}
