# Outlook Calendar Holds for Meeting Polls

Keeps the existing portal availability poll as the only way to schedule. No portal redesign, no second voting process, no automatic scheduling. The admin still picks the final time.

## 1. Evaluation and recommendation

**Option A: native Microsoft Scheduling Poll. Not recommended.**
- Microsoft has no public way for another system to create, read or close a Scheduling Poll (formerly FindTime). It only works inside Outlook.
- Using it would mean executives vote in Microsoft and again in the portal, or the portal would stop tracking availability. Votes cannot be synced either way. This fails the "no voting twice, no second process" rule.

**Option B: the existing portal poll plus Outlook holds. Recommended.**
- It is the simplest reliable solution and meets the minimum requirement in full.

## 2. What will happen (organizer calendar: minimum requirement)

- **Publishing a poll:** each proposed time is put on the organizer's Outlook calendar as a tentative hold, titled "HOLD: [meeting title] (proposed)". Only the organizer's own calendar gets these holds. No invitations go to anyone.
- **Live availability:** each hold's notes update as responses come in, for example "Available 4/7 · If needed 1".
- **Confirming a time:** the chosen hold becomes the real meeting, marked Busy, with the virtual link or location. Every other hold is deleted.
- **Cancelling a poll:** all of its holds are deleted.
- **Changing dates:** holds are added for new times and deleted for times that were removed.
- **Safety net:** every hold is recorded against its poll. A "Re-sync calendar" button on each meeting repairs anything missing or left over, and no hold is ever created twice.
- **If Outlook is down or disconnected:** the poll works exactly as it does today. The meeting card shows "Calendar not synced", with a retry button.

## 3. Executive holds (preferred enhancement, opt-in and needing no calendar access)

- Changing an executive's calendar automatically needs their own permission. We will not ask for that, because the rules say no one has to grant calendar access just to respond.
- Instead, when an executive marks a time "Available" or "If needed", the portal offers "Hold this time on my calendar". This downloads a tentative calendar entry that works in Outlook, Apple and Google.
- When the admin confirms the final time, the existing confirmation email (no new email) includes:
  - the final meeting entry;
  - a cancellation for any time held this way, so most calendar apps remove the unused holds on their own.
- If a poll is cancelled, the existing cancellation notice includes the same removals.
- This will be tested with Outlook.com and Gmail attendee accounts, and the results written up (cancellation behaviour differs between calendar apps).

## 4. Prerequisites (from you)

- A designated organizer mailbox with a calendar: Microsoft 365 Business or Exchange Online (for example admin@readinessterminal.com or your own).
- Connect that mailbox through Lovable's Outlook connection, which I will start in chat. It needs permission to read and write the calendar (Calendars.ReadWrite). There is no app registration for you to manage.
- One separate external test account (Outlook.com or Gmail) for the attendee test.

## 5. Acceptance tests (documented in a short report)

- Publishing three proposed times shows three tentative holds on the organizer's calendar.
- Confirming one time leaves one busy meeting and zero holds.
- Cancelling or changing dates leaves no orphaned holds, and re-running sync creates no duplicates.
- With the connection turned off, the poll still works and shows the warning.
- The external attendee's hold and its removal are observed and recorded.
- No executive needs to grant calendar access at any point.

## Technical details

- New table `meeting_calendar_holds` (poll_id, slot_id, outlook_event_id, kind hold|final, status, last_synced_at). It is admin-only under RLS, and UNIQUE(slot_id, kind) prevents duplicates.
- New `src/lib/outlook-calendar.server.ts`: Graph calls through the connector gateway (`POST/PATCH/DELETE /me/events`). Holds use showAs=tentative and the poll's timezone. A `reconcilePollHolds(pollId)` function brings the calendar in line with the poll and is safe to run repeatedly.
- `meetings.functions.ts`: after createMeetingPoll, confirmPollSlot, cancelPoll, slot edits and member responses, call reconcile in a try/catch so failures are logged and never block the poll. Add a `resyncPollCalendar` admin server function.
- `ics.ts`: add tentative per-slot holds with stable UID `{slotId}@prscstandards.org`, plus METHOD:CANCEL entries. These go into the existing confirmed and cancel emails only.
- UI: a sync status pill and re-sync button in AdminMeetings, and a hold-download link in MemberMeetings. No layout changes.
- Tests: reconcile planning logic (which holds to create, update or delete) as a pure function with node:test.
