# Outlook Calendar Holds for Meeting Polls (Option B, approved)

Keeps the existing portal availability poll as the only way to schedule. No portal redesign, no second voting process, no automatic confirmation. The admin still picks the final time. All approved onboarding, governance, email and Forum features stay as they are. This work runs alongside the rest and does not hold up the first safe invitations. No live meeting or invitation emails go out until you approve the production preview.

## 1. Why Option B
Microsoft has no public way for another system to create or read a Scheduling Poll. Using one would mean a second vote and no sync, so the portal poll stays the single source of truth.

## 2. Your calendar: protecting the proposed times
- **When holds are created:** only when a poll is published, never while it is a draft.
- **What the holds look like:** each proposed time appears as a Busy event titled "HOLD: [Meeting Title] — Proposed", so Outlook treats those times as taken.
- **Confirming a time:** that hold turns into the confirmed meeting. It stays Busy and gets the link or location. The other holds are removed.
- **Cancelling a poll, or adding or removing times:** the holds are brought back in line with the poll automatically.
- **Only our own events are touched:** the integration only ever edits or deletes events it created and recorded. Nothing else on your calendar is touched.
- **No duplicates:** each hold has a fixed identifier, so a retry finds the existing event instead of creating a new one.
- **If Outlook is disconnected or fails:** the portal poll keeps working normally. The meeting shows "Calendar not synced" until a later sync confirms it has recovered. A Re-sync button is available.
- **Vote counts:** these stay in the portal dashboard. Outlook events are not rewritten after each response.

## 3. Connecting the right calendar (configuration check)
- You connect the Microsoft account where your day-to-day availability is actually kept.
- Before any hold is created, the system reads that account's name and default calendar and shows them in Meetings ("Holds go to: [name / email]") for you to confirm.
- If the connected account is not your working calendar, or cannot write to it, the system reports a configuration blocker. It never falls back to another mailbox on its own.

## 4. Executive holds (best effort, no permissions needed)
- An optional "Hold this time on my calendar" download appears next to times an executive marks Available or If needed.
- The existing confirmation and cancellation emails include calendar updates that try to release unused holds. No new emails are added.
- We do not promise automatic removal. Each downloaded hold carries a clear title ("HOLD (tentative): [Meeting Title] — may be released") and a note.
- After a time is confirmed, the executive's meeting card lists the released times: "You can delete these holds from your calendar."
- Updates and cancellations will be tested in Outlook and Google Calendar, and the real behaviour written up.

## 5. Acceptance demonstration (test meeting data only, no live emails)
1. Publish three proposed times.
2. Show all three Busy holds on your designated calendar.
3. Confirm one time.
4. Show that the final event is Busy and the other two holds are gone.
5. Cancel a second test poll and show it cleans up completely.
6. Disconnect Outlook and show that portal polling still works.
7. Test one external attendee's optional hold and record how its cancellation actually behaves.

Report: the outcome of each step with screenshots, plus the external-attendee findings.

## Prerequisite from you
Connect your working Microsoft calendar through the Outlook connection prompt, which I'll show when building starts. It needs calendar read/write permission. If this is still pending, everything else carries on and invitations are not blocked.

## Technical details
- New table `meeting_calendar_holds`: poll_id, slot_id, kind (hold|final), outlook_event_id, transaction_id, status, last_error, last_synced_at. It has UNIQUE(slot_id, kind), is admin-only under RLS, and carries grants. Only events tracked in this table may be updated or deleted.
- New `src/lib/outlook-calendar.server.ts`, which works through the gateway:
  - Events are created with `POST /me/events`, using `transactionId` = deterministic hash(poll, slot, kind), showAs=busy and the poll's timezone.
  - A pure planner `planHoldChanges(poll, slots, holds)` returns the creates, updates and deletes, and `reconcilePollHolds` applies them.
  - Drafts are skipped.
- A connected-calendar check (`GET /me`, `GET /me/calendar`) is shown in AdminMeetings. A mismatch or missing write access is reported as a blocker.
- `meetings.functions.ts`: after poll publish, slot changes, confirm and cancel, run reconcile in a try/catch. Errors are stored on the hold rows and never block the poll. Add an admin `resyncPollCalendar` server function.
- `ics.ts`: a per-slot hold with stable UID `{slotId}-hold@prscstandards.org`, plus METHOD:CANCEL entries added only to the existing confirmed and cancel emails.
- UI additions only: a sync status pill, a "Holds go to" line and a Re-sync button in AdminMeetings, and the hold download plus released-holds list in MemberMeetings.
- Tests (node:test): the planner only touches tracked events, never duplicates, ignores drafts, and on confirmation keeps one final event and removes the rest.
- roadmap.md gets this task added when building starts.
