<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Subdirectories have their own `AGENTS.md`; read it before changing files there.
- Use the shared member-role presentation helper for member designations across portal, admin, and emails; stored role values and permissions remain independent of display wording.
- Derive entity acceptance completion from applicable active Stage 2–3 documents in journey.ts, then apply governance.ts appointment review gates through memberDesignation; hydrate reads with withAppointmentProgress. Why: independent PRSC/DIS designations stay consistent without writes or automatic activation.
- Orientation Hub locks body scrolling with cleanup and resets dialog scroll before painting. Why: background stays stable.
- Orientation resume state (`orientation-progress.ts`) stores only the chapter reached and a closed-it-myself marker, never completion; completion is only the server-set `orientation_acknowledged_at`. The Welcome Center shows one "Your next step" from `next-step.ts` and closing a popup never completes anything. Why: a dismissed popup stays resumable without faking progress.
- Forum calendar explanation copy lives only in `src/lib/forum-meeting-intro.ts` (general scheduling text, no restricted briefing details). Why: poll screens and emails stay minimal-disclosure.

- AdminCenter's page prop serves thin /admin and /admin/send routes. Why: shared state and data.
- Admin pages render inside PortalShell's `sidebar` slot (AdminSidebar: nav + admin account menu); admin role changes go through `admin-accounts.functions.ts`, which blocks removing yourself or the last admin. Why: one shared frame for both admin pages and safe admin management.
- Recipient journey sequencing/status rules live only in `src/lib/journey.ts` (used by portal, admin, and server enforcement); documents with stage 5 or no stage are one-off records that never affect onboarding. Why: one source of truth for unlock order.
- Admin overview returns per-member journey status computed by the shared journey rules using applicable documents, acknowledgements, and activation records; badges only renumber for Forum opt-outs. Why: roster and member portal must report the same journey.
- Governance gates (NDA, role-combination tiers, Forum clearance, document visibility, appointment checks) live only in `src/lib/governance.ts`, and the `portal_documents` member read policy mirrors `documentVisible`. Why: access stays fail-closed even if app code is rolled back.
- Forum email recipient rules live only in `src/lib/forum-communications.ts` (used by admin screen and server send); sends are keyed per forum, email, version and recipient in `forum_communication_sends`. Why: no duplicate or unauthorized Forum emails.
- `orientation_acknowledged_at` is a non-legal refresher marker set only by the server (DB trigger blocks client writes) and never feeds journey status. Why: keep it separate from Stage 2 and legal acknowledgments.
- Forum-only candidates use `is_candidate` and a neutral advisor role; appliesTo/documentVisible/RLS hide Stages 2–4. Admin role assignment is audited; memberDesignation* displays appointments only after activation. Why: candidates have no entity authority.
- PRSC/DIS Stage 2 opens only through an `entity_onboarding_releases` row created by `releaseEntityOnboarding` (gated by `stage2ReleaseProblems`); `lockedDocumentIds` and the `portal_documents` read policy key entity tracks off that release, never Forum status. Why: Forum and entity onboarding are independent journeys.
- Executive Questions access/limits/reminder/share rules live only in `src/lib/executive-questions.ts`; member writes go through `executive-questions.functions.ts` (server-checked, own-row reads only) and outbound sharing requires a recorded approval (DB check). Why: confidential submissions never leave the Secretariat without founder approval.
- Portal RPCs use requirePortalAccess and portal_access_current with restrictive RLS; invited onboarding remains permitted. Why: revoked bearer sessions must fail immediately.
- Member removal revokes and audits without deleting records/files. Why: retain signed evidence and history.
- Invitation reminder HTTP dispatch verifies a bearer and admin role, never a public key. Why: hiding controls is not authorization.
- Leadership publishing requires explicit portal-member approval and profile field permissions; omit private IDs/paths from member DTOs. Why: linking is not consent.
- Private member files use authenticated portal-file fetches, and calendar downloads require current access. Why: new member links cannot bypass revocation; old storage links expire on their original schedule.
- Password login calls the identity provider directly; anonymous email-keyed locks never govern access. Why: retain provider IP protections without attacker-triggered account denial.
- Export text uses csvCell. Why: CSV quoting does not prevent spreadsheet formulas.

- BoldSign Verification requires matching header/payload and has no side effects; operational callbacks require HMAC. Signing uses exact member/document/version assignments with atomic completion. Why: spoofing and retries cannot misattribute or duplicate evidence.
- NDA invitations reset per recipient and verify recipient-bound evidence on the server. Why: one executive’s NDA cannot authorize another.
- Member document loading requires a session, never profile submission; server release/eligibility checks stay authoritative. Why: optional profiles cannot block released Forum requirements.
- Protected Forum reads (confidential/restricted) require `addendumSatisfied` (completed BoldSign execution of the approved assigned Addendum version, countersignature when flagged), mirrored by `member_addendum_complete()` in the read policy. Why: acknowledgments or UI gates cannot substitute for the legal prerequisite.
- Restricted documents and Executive Questions open only through exact-version `restricted_document_grants`; supersession, revocation or lost clearance ends access. Why: authorization is individual, never inherited.
- Invitation password setting runs only server-side via `activateInvitation` after `activationProblem` passes; meeting confirmations are keyed per poll/slot/recipient in `meeting_confirmation_sends`. Why: wrong-account changes and duplicate or suppressed notices are impossible.
- `openBoldSign` claims one assignment before any automatic BoldSign request (embedded, emails disabled, TEST identities only until Gate B) and freezes conflict disclosures by hash. Why: no duplicate requests and signed answers stay provable.
- Every member-facing documents entry point (Welcome Center, `/portal#documents`, email links, summary page) resolves to the one `MemberDocuments` panel; unavailable items surface only a reason label from `document-availability.ts`, never titles, ids or contents of restricted/secretariat documents. Why: one canonical room, no disclosure by omission.
- Document progress separates required actions from reference files and historical records (`document-progress.ts`); history is never deleted or counted to fix a display. Why: accurate counts without destroying signed evidence.
- A BoldSign assignment is complete only when `complete_boldsign_assignment` runs after BoldSign-verified completion; "member signed" alone shows awaiting countersignature, and `countersigned_at` is written only from verified all-signer completion. Why: a partial signature must never open protected documents.
- Forum materials released only after clearance or never shown to members (`POST_CLEARANCE_FORUM_ROLES` in `governance.ts`: Agenda, restricted briefing, secretariat-only) never count toward clearance prerequisites or hold the "Clearance Pending Review" roster state back; the administrator checklist (`forumReviewChecklist`) is read-only and never records or implies a decision. Why: members reach the review queue automatically while conflict review and clearance stay explicit human decisions.
