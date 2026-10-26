# Plan: Independent Forum and Entity Onboarding, NDA Reset, Profile Emails, Executive Email Library

The portal keeps its current design and five-stage journey. Nothing is appointed automatically, and no live emails go out until the founder approves the previews.

## Part A: Forum and entity onboarding run separately

- We will not make the earlier proposed change that unlocks Stage 2 when a member opts out of the Forum.
- Workflow A (United Forum) covers Orientation, meeting availability, the Stage 1 documents, Forum clearance, briefings and meetings.
  - Members can open the Stage 1 documents before they are cleared, because those documents are needed to get cleared.
  - Restricted Forum materials open only after clearance and permission for that specific document.
- Workflow B (PRSC / DIS onboarding): Stage 2 starts only when an admin clicks a new **Start Entity Onboarding / Release Stage 2 & Notify** action for that entity.
  - The member must already have an intended role recorded.
  - Before release, the system checks NDA coverage, role eligibility and cross-entity review. Prohibited combinations cannot be overridden.
  - The release records who released it, when, the entity, the role, the document versions released, and the notice that went out.
  - Only the next applicable documents open. The rest of the package stays locked.
  - PRSC and DIS are released and tracked separately.
- If the email fails, the release still stands. The admin sees the failure and can retry without sending a duplicate.
- Stage 2 never starts because of: accepting the invite, Orientation, Forum clearance, opting out, attending the Forum, or being given an intended role.
- Existing members keep their current state. Entity documents they have already signed stay counted. No new default unlocks anything.
- The designations stay unchanged: United Forum Invitee, Forum Participant, Candidate, Pending Appointment, Appointed. Releasing Stage 2 never creates Pending Appointment or Appointed.

## Part B: Clear NDA details between invitations

- After a successful invitation, every field resets: NDA reference, entities covered, sharing scope, role review fields, conflict controls, and any preview or check results.
- NDA coverage will no longer start with PRSC preselected. The admin must choose the coverage for each person, and the invite is blocked until they do.
- If an invitation fails, everything the admin entered stays in place so it can be corrected.
- CSV imports and repeat invitations never reuse another person's NDA or review details.

## Part C: Profile notification emails

- `saveMyProfile` will send both emails through the shared sender and editable templates: `profile_received` for the member and a new `profile_submitted_admin_alert` for the admin.
- A retry of the same submission will not send a second email, because the duplicate-prevention key is tied to the submission instead of the clock.
- An email failure never undoes a saved profile.
- The admin alert includes only the member's name, the time and a submission reference. It leaves out professional details.

## Part D: Executive email library (14 templates)

- **Reuse and update wording:** `invite` (Why You text and orientation-first order kept), `meeting_poll`, `meeting_confirmed`, `profile_received`.
- **Map to the existing Forum email series** instead of creating duplicates: `meeting_poll_reminder`, `forum_documents_ready`, `briefing_released`, `final_agenda`, `coordination_summary`.
- **Add:** `entity_documents_ready` (sent once per Stage 2 release, covering everything released together) and `profile_submitted_admin_alert`.
- **Kept switched off until the question and assignment features are built:** `input_requested`, `input_reminder`, `followup_assigned`.
- Every email works the same way:
  - It uses the member's first name and has one button that opens the signed-in portal.
  - It has no attachments and includes no employer, title or private disclosures.
  - Roles are called "Candidate" until activated.
  - The admin can edit and preview it.
- Duplicates are suppressed:
  - No separate meeting poll email when the invitation already included the poll.
  - Meeting confirmation and Forum confirmation go out as one message.
  - No reminder goes to anyone who has already responded.
- Each send has a stable duplicate-prevention key based on the poll, meeting, release, briefing version, round, assignment or submission.
- I will list every wording difference from your copy for approval rather than silently overwriting approved text.

## Part E: Tests and what you will receive

- I will add the 24 regression cases from your document to the existing test files and run the full suite.
- You will receive a review package in Files containing:
  - Rendered previews of the invitation, availability request, Forum documents email and Stage 2 email, using fictional data
  - The email inventory, marked reused, revised or new
  - Test results
  - A demonstration with fictional members: Forum opt-out stays locked until release, then a release with its first email
  - Proof that NDA details reset between invites
  - Confirmation that no live emails were sent and no appointments were activated

## Technical details

- **Migration:** one additive change, a new table `entity_onboarding_releases` with these columns:
  - `member_id`, `entity`, `role`, `released_by`, `released_at`
  - `document_ids` and versions
  - `notify_status`, `notify_error`, `notify_attempts`
  - It has grants, admin-only write access, members can read their own rows, and it is unique per member and entity.
- **Existing members:** they get no row, so nothing new unlocks for them. Signed rows stay counted.
  - A member who already has signed Stage 2 rows will be listed for you to review. They will not be given a release automatically.
- **Document locking:** `journey.ts` `lockedDocumentIds(docs, done, entity, opts)` takes named options: `{ forumParticipant, forumCleared, released: { prsc, dis } }`.
  - Stage 1 is open to Forum participants without clearance.
  - The PRSC and DIS tracks are gated only by their own release.
  - This applies in `portal.functions.ts` (document read, acknowledge and sign, plus the next-document notice), `MemberDocuments`, `AdminMemberDocuments` and `portal.index`.
  - The `portal_documents` member read policy is updated to require a release row for Stage 2–4 documents.
- **New server function** `releaseEntityOnboarding` (admin only): reuses the governance.ts checks, writes the release first, then sends through `sendPortalEmail` with the key `entity-release-{releaseId}`. A `retryReleaseNotice` function covers failed sends.
- **AdminCenter:** an `EMPTY_INVITE_GOV` constant with `nda_entities: ""`. It is reset only on success, and the server rejects an empty NDA coverage.
- **New template defaults** go in `system-email-defaults.ts`. Forum emails keep using `forum-communications.ts`.
- `AGENTS.md` gets a rule for the release record.
