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

- Use the shared member-role presentation helper for member designations across portal, admin, and emails; stored role values and permissions remain independent of display wording.
- Derive entity acceptance completion from applicable active Stage 2–3 documents in journey.ts, then apply governance.ts appointment review gates through memberDesignation; hydrate reads with withAppointmentProgress. Why: independent PRSC/DIS designations stay consistent without writes or automatic activation.
- Orientation Hub locks body scrolling with cleanup and resets dialog scroll before painting. Why: background stays stable.

- Automatic emails load admin-editable copy by `system_key` via `loadSystemEmail`, with originals in `src/lib/system-email-defaults.ts`; edit wording there, not inline in send code, so admin edits and Reset keep working.
- Meeting details in emails come from the shared `meetingBlockText` helper, and attaching a meeting always enrolls the recipients in that poll, so the email and the Welcome Center card match.
- Meeting creation UI lives only in `MeetingSetupForm` (used by Meetings and the email pop-ups); keep one form so validation and time-zone handling stay identical.
- Meeting times are picked as wall-clock values in the poll's `timezone` and converted to UTC on the server via `zonedToUtc`; always render with `formatSlot(iso, poll.timezone)` so old polls fall back to Eastern.
- The Admin Center UI lives in `src/components/portal/AdminCenter.tsx` with a `page` prop; `/admin` (Overview) and `/admin/send` (Invite & Email) are thin routes so both pages share one state and data source.
- Admin pages render inside PortalShell's `sidebar` slot (AdminSidebar: nav + admin account menu); admin role changes go through `admin-accounts.functions.ts`, which blocks removing yourself or the last admin. Why: one shared frame for both admin pages and safe admin management.
- Recipient journey sequencing/status rules live only in `src/lib/journey.ts` (used by portal, admin, and server enforcement); documents with stage 5 or no stage are one-off records that never affect onboarding. Why: one source of truth for unlock order.
- Admin overview returns per-member journey status computed by the shared journey rules using applicable documents, acknowledgements, and activation records; badges only renumber for Forum opt-outs. Why: roster and member portal must report the same journey.
- Governance gates (NDA, role-combination tiers, Forum clearance, document visibility, appointment checks) live only in `src/lib/governance.ts`, and the `portal_documents` member read policy mirrors `documentVisible`. Why: access stays fail-closed even if app code is rolled back.
- Forum email recipient rules live only in `src/lib/forum-communications.ts` (used by admin screen and server send); sends are keyed per forum, email, version and recipient in `forum_communication_sends`. Why: no duplicate or unauthorized Forum emails.
- `orientation_acknowledged_at` is a non-legal refresher marker set only by the server (DB trigger blocks client writes) and never feeds journey status. Why: keep it separate from Stage 2 and legal acknowledgments.
- Outlook meeting holds are planned only by `planHoldChanges` in `src/lib/calendar-holds.ts` and applied by `safeReconcile`; only events tracked in `meeting_calendar_holds` may be edited or deleted. Why: the portal poll stays authoritative and nothing else on the organizer calendar is touched.
- Forum-only members are `portal_members.is_candidate` (stored with a neutral single-entity advisor role); Stages 2–4 are excluded for them in `appliesTo`, `documentVisible`, and the `portal_documents` read policy, and entity activation is blocked until an admin assigns a role via `updateMemberDetails` (which logs previous values). Display wording comes only from `memberDesignation*`: PRSC/DIS titles appear only after that entity is activated. Why: no one is shown or treated as appointed before verification.
- PRSC/DIS Stage 2 opens only through an `entity_onboarding_releases` row created by `releaseEntityOnboarding` (gated by `stage2ReleaseProblems`); `lockedDocumentIds` and the `portal_documents` read policy key entity tracks off that release, never Forum status. Why: Forum and entity onboarding are independent journeys.
- Executive Questions access/limits/reminder/share rules live only in `src/lib/executive-questions.ts`; member writes go through `executive-questions.functions.ts` (server-checked, own-row reads only) and outbound sharing requires a recorded approval (DB check). Why: confidential submissions never leave the Secretariat without founder approval.
- Profile submission emails are planned by `planProfileEmails` and sent by `deliverProfileEmails` in `src/lib/profile-emails.ts`. Why: one testable rule for at-most-once, minimal-disclosure notices.
- Portal RPCs use requirePortalAccess and portal_access_current with restrictive RLS; invited onboarding remains permitted. Why: revoked bearer sessions must fail immediately.
- Member removal revokes and audits without deleting records/files. Why: retain signed evidence and history.
- Invitation reminder HTTP dispatch verifies a bearer and admin role, never a public key. Why: hiding controls is not authorization.
- Leadership publishing requires explicit portal-member approval and profile field permissions; omit private IDs/paths from member DTOs. Why: linking is not consent.
- Private member files use authenticated portal-file fetches, and calendar downloads require current access. Why: new member links cannot bypass revocation; old storage links expire on their original schedule.
- Password login calls the identity provider directly; anonymous email-keyed locks never govern access. Why: retain provider IP protections without attacker-triggered account denial.
- Export text uses csvCell. Why: CSV quoting does not prevent spreadsheet formulas.

- BoldSign Verification requires matching header/payload and has no side effects; operational callbacks require HMAC. Signing uses exact member/document/version assignments with atomic completion. Why: spoofing and retries cannot misattribute or duplicate evidence.
- NDA invitations reset per recipient and verify recipient-bound evidence on the server. Why: one executive’s NDA cannot authorize another.
