# Final Integration — Existing-Member Access, 14-Template Library, Executive Questions

## Part 1 — Existing-member access (finding)
The live portal currently holds 0 member records, 0 documents and 0 signatures. No existing member lost access, so no reconciliation is needed. To cover future cases:
- Add an admin-only "Stage 2 release review" panel to Admin Overview, grouped by PRSC and DIS. It lists members who have unsigned Stage 2–4 documents but no release, along with their intended role, appointment status, document versions, signatures and release state
- Classify each case: "Prior authorization on record" (an entity activation, or a signed Stage 2 document for that entity) or "Needs review"
- Add a "Reconcile release" action for authorized cases only. It runs the same NDA, role-combination and review checks, records who acted and the reason, and sends no email
- History is never edited

## Part 2 — Stage 2 verification
Run an authenticated admin walkthrough on fictional members created in the preview only, then delete them. Cover all eight scenarios in the brief. Notification failure is simulated, so no real email goes out.

## Part 3 — 14-template library
- Existing: invite, meeting_poll, meeting_confirmed, forum_documents_ready (maps to the current documents_ready Forum template), briefing_released, input_requested, input_reminder, final_agenda, coordination_summary, followup_assigned, profile_received
- New, already added: entity_documents_ready, profile_submitted_admin_alert
- New: meeting_poll_reminder (reuses the existing 48-hour nonresponder reminder wording)
- Kept separately without duplication: forum_confirmed is suppressed whenever meeting_confirmed covers the same confirmation, plus the cancellation, reschedule and signature templates
- Active/disabled: followup_assigned stays disabled until the Priority B follow-up feature exists. input_requested and input_reminder are enabled only after Part 4 passes its tests
- Profile email tests: the centralized helper, one send per submission, stable retry key, a send failure keeps the saved profile, autosave sends nothing, and the admin alert carries only name, time and reference

## Part 4 — Executive Questions (minimum Priority B slice inside the Forum workspace)
Data:
- question_rounds: forum, opens_at, deadline, status
- executive_questions: up to three per member per round, priority 1–3, question, why it matters, source (Jared / Internal / External), context
- round_responses: member status of submitted or "No additional questions"
- question_register: consolidated groups, original question links, category, route [C]/[P]/[D]/[X], priority, review status
- outbound_requests: approver, date, recipient, exact list, responses, unresolved items

Access:
- Members read and write only their own rows, only while the round is open, and only with Forum clearance plus access to the briefing. The server and the database enforce this
- Reviewers are admins only

Member view: an Executive Questions card in the Forum workspace. It allows editing until the deadline and shows the member's own status. Submitting is optional.

Register (admin): filter by round, group overlapping questions, categorize, route, prioritize, build the Jared list and the internal list.
- An outbound record can be marked shared only after founder approval is recorded
- Nothing is ever sent automatically
- The register carries this note: "Statements are not official NASCAR commitments or verified conclusions"

Emails: input_requested goes to eligible participants. input_reminder skips anyone who submitted or chose "No additional questions". Both name the Forum and the round. Each send is logged per recipient and retry-safe.

## Part 6 — Verification package
A PDF in Files containing:
- The template inventory and differences from the approved copy
- Desktop and mobile previews of the seven listed emails, using fictional data
- Journey and Executive Questions demonstration screenshots from preview-only fictional members
- Test results and remaining blockers

## Not doing
- No live sends, no automatic appointments, no portal redesign
- Workstream dashboard and follow-up assignments stay for later
- Stage 1 documents, NDA records and founder approval remain operational blockers
