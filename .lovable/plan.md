# Correct Six Access, Activation and Notification Findings

Scope: only the six findings below. No redesign, real invitations, live signing, appointments, uploads, restricted-brief releases or publishing. Gate B stays paused. Historical records stay as they are.

## 1. Critical: addendum required before protected document reads
- One shared rule, `addendumSatisfied(member)`, in `governance.ts`. It is true only when the member has a current-version Confidentiality Addendum signature or acknowledgment that has not been superseded.
- A protected document is any Forum document marked confidential or restricted, plus any Stage 1 item listed after the Addendum.
- The rule applies in three places:
  - the member document list
  - the authenticated file endpoint (`portal-file`)
  - the `portal_documents` member read policy, using a new SQL helper `member_addendum_complete(member_id)`
- The Addendum itself and items before it stay readable, so members can still sign it.
- Tests: the same member is denied before signing and allowed after. A direct file request gets 403.

## 2. Critical: individual authorization for the restricted Jared brief
- New admin-only table `restricted_document_grants` with: document, member, granted_by, granted_at, revoked_at, reason. It has unique active grants, an audit log entry for each change, and no member write access.
- `documentVisible` and the read policy allow `restricted_opportunity` only when all of these hold:
  - an active grant exists
  - the NDA is verified
  - Forum clearance is granted
  - the Addendum is complete
- Without a grant, access is still denied.
- Admins grant and revoke inside the existing document controls in `AdminMemberDocuments`. Grants are never automatic.
- Tests cover: no grant, grant, revoked grant, and a grant given to a different member.

## 3. Critical: invitation activation bound to the recipient
- `accept-invitation` checks that the email on the invitation token matches the signed-in user before it changes a password.
- On a mismatch, it signs the other account out and shows "You're signed in as another account". It never changes a password on a mismatch.
- The server side checks the same match again.
- Test: an admin session combined with a Test 1 invitation is refused, with no password change.

## 4. Important: Forum clearance needs completed prerequisites
- New helper `stage1ClearanceProblems(member)` returns any of: Addendum missing, required Stage 1 actions incomplete, NDA not verified.
- Ordinary clearance is blocked while any problem remains. The admin sees the list of problems.
- A separate administrative review decision (approve, deny or hold, with notes) is still recorded in `governance_reviews`, as it is today. It never grants clearance on its own.
- Tests cover both the blocked and allowed cases.

## 5. Important: conflict questionnaire answers kept with the signed form
- When a BoldSign conflict or recusal assignment is created, the member's structured answers are saved in a frozen snapshot:
  - columns `disclosure_snapshot` and `disclosure_hash` on `boldsign_assignments`
  - the answers are also pre-filled into the form fields where the template supports it
- On completion, the snapshot and hash are kept with the executed PDF and audit file. Admins see them next to the signed record.
- If a member changes answers after sending, they must sign again. The old record stays unchanged.
- Test: the snapshot is unchanged after the member edits the questionnaire later.

## 6. Important: one confirmation email per meeting per recipient
- New table `meeting_confirmation_sends`, unique on (poll, confirmed slot, member). Each row records its status.
- Confirmation claims a row before sending and uses a stable delivery key built from poll, slot and member.
  - The same slot confirmed again sends nothing.
  - A changed slot sends a new notice.
  - Failed sends are recorded and can be retried.
- The broad suppression for these notices is removed.
- Tests: a repeat confirmation sends nothing new, a changed slot sends once, and a failure is retried.

## 7. Correct the Forum document inventory (eight supplied documents)
- Replace the report's "six identified, two missing" statement with the founder's eight-item list:
  1. Confidentiality & Restricted Information Addendum: BoldSign signature after legal approval
  2. Participation Protocol: Acknowledge
  3. Executive Pre-Read: Acknowledge
  4. Conflict / Recusal Confirmation: Complete and sign (with the snapshot from item 5)
  5. Inaugural Strategic Agenda: Read after clearance
  6. Restricted Jared/NASCAR Strategy Brief: Read after a specific grant (item 2)
  7. Secretariat Controls: Admin only
  8. Facilitator Run of Show: Admin/facilitator only
- Items 7 and 8 must never be visible to members. They are stored with an admin-only audience, and the read policy and file endpoint already deny them to members. A test confirms this.
- Add "Forum inventory correction" to roadmap.md. No files are uploaded or released.

## 8. Automatic BoldSign send and collection, with an admin copy
- When a signature-required document becomes actionable for a member, the portal does the following automatically. Actionable means released, eligible and unlocked in sequence (the Addendum only after legal approval).
  - Creates the member's BoldSign request from that document's approved template.
  - Records the exact member, document and version assignment.
  - Opens embedded signing behind the existing "Review and Sign" button.
- The existing authenticated callback then collects the executed PDF and audit trail. It stores both privately, marks the item complete only once, and advances the journey.
- Admin copy: after completion, one notice per signed document goes to admin@prscstandards.com.
  - The notice carries a short-lived, sign-in-required link to the executed PDF and audit trail, not a file attachment. App emails cannot carry attachments, and this keeps signed evidence behind access checks.
  - Delivery is tracked per document, so replays send nothing new.
- Safeguards:
  - Nothing goes out for unreleased, restricted or unapproved templates.
  - Nothing goes out for real executives until Gate B.
  - Before release, the trigger runs only for fictional TEST accounts.
  - The 24 pre-existing BoldSign documents are never touched.
- Decision needed:
  - Earlier security work disabled emailing signed copies. This change re-enables it only as an admin link notice.
  - admin@prscstandards.com is not a portal admin login. The current admin login is admin@readinessterminal.com, so the link will require signing in as that admin.

## Member journey these fixes must preserve
1. Personalized invitation, then the member securely activates their own account (fix 3)
2. Five-minute Orientation Hub
3. Meeting availability, if a poll is active
4. Prominent but non-blocking Executive Profile invitation
5. Sign the approved confidentiality addendum (fixes 1 and 8)
6. Acknowledge the Forum Protocol and Executive Pre-Read
7. Complete and sign the Conflict / Recusal Confirmation, with disclosures captured (fix 5)
8. Separate administrative Forum clearance, given only after steps 5–7 (fix 4)
9. Approved agenda. The restricted Jared briefing and Executive Questions only with specific authorization (fix 2)
10. Confirmed meeting details sent once per member (fix 6), then attend the Forum

Members can stop and return to the Welcome Center at any point. The profile is encouraged, while the confidentiality and conflict steps are enforced.

Limit for fix 8: the automatic BoldSign trigger is built and tested with mocked BoldSign calls only. No real signing transaction is created this cycle.

## Verification
- Focused tests for each rule, plus the existing suite.
- Read-only access checks using the existing fictional accounts:
  - direct file access before and after the Addendum
  - Jared brief with no grant, then a TEST-only grant on a TEST document
- No real sends and no publishing.
- No broad scan.
- One short PASS/FAIL report. For each fix it says resolved, or still needs an approved source document (for example, the final Addendum, the Conflict template, or the Jared brief).

## Technical notes
- Three migrations: the Addendum and restricted-grant helpers with the read-policy update, the `restricted_document_grants` table, and the `meeting_confirmation_sends` table plus the assignment snapshot columns. Each includes grants and RLS.
- Rules stay in `governance.ts`, `journey.ts` and `meetings.functions.ts`, following AGENTS.md.
- AGENTS.md gets one rule each for the addendum gate, the restricted grants and the confirmation keying.
