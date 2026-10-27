# src/lib rules (emails, meetings, calendar)

- Automatic emails load admin-editable copy by `system_key` via `loadSystemEmail`, with originals in `src/lib/system-email-defaults.ts`; edit wording there, not inline in send code, so admin edits and Reset keep working.
- Meeting details in emails come from the shared `meetingBlockText` helper, and attaching a meeting always enrolls the recipients in that poll, so the email and the Welcome Center card match.
- Meeting creation UI lives only in `MeetingSetupForm` (used by Meetings and the email pop-ups); keep one form so validation and time-zone handling stay identical.
- Meeting times are picked as wall-clock values in the poll's `timezone` and converted to UTC on the server via `zonedToUtc`; always render with `formatSlot(iso, poll.timezone)` so old polls fall back to Eastern.
- Outlook meeting holds are planned only by `planHoldChanges` in `src/lib/calendar-holds.ts` and applied by `safeReconcile`; only events tracked in `meeting_calendar_holds` may be edited or deleted. Why: the portal poll stays authoritative and nothing else on the organizer calendar is touched.
- Profile submission emails are planned by `planProfileEmails` and sent by `deliverProfileEmails` in `src/lib/profile-emails.ts`. Why: one testable rule for at-most-once, minimal-disclosure notices.
