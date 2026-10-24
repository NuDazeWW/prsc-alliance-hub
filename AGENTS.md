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
- The Orientation Hub owns a fixed-body scroll lock with cleanup, and resets its dialog scroll before painting each view; keep background position stable during navigation.

- Automatic emails load admin-editable copy by `system_key` via `loadSystemEmail`, with originals in `src/lib/system-email-defaults.ts`; edit wording there, not inline in send code, so admin edits and Reset keep working.
- Meeting details in emails come from the shared `meetingBlockText` helper, and attaching a meeting always enrolls the recipients in that poll, so the email and the Welcome Center card match.
- Meeting creation UI lives only in `MeetingSetupForm` (used by Meetings and the email pop-ups); keep one form so validation and time-zone handling stay identical.
- Meeting times are picked as wall-clock values in the poll's `timezone` and converted to UTC on the server via `zonedToUtc`; always render with `formatSlot(iso, poll.timezone)` so old polls fall back to Eastern.
- The Admin Center UI lives in `src/components/portal/AdminCenter.tsx` with a `page` prop; `/admin` (Overview) and `/admin/send` (Invite & Email) are thin routes so both pages share one state and data source.
- Admin pages render inside PortalShell's `sidebar` slot (AdminSidebar: nav + admin account menu); admin role changes go through `admin-accounts.functions.ts`, which blocks removing yourself or the last admin. Why: one shared frame for both admin pages and safe admin management.
- Recipient journey sequencing/status rules live only in `src/lib/journey.ts` (used by portal, admin, and server enforcement); documents with stage 5 or no stage are one-off records that never affect onboarding. Why: one source of truth for unlock order.
- Admin overview returns per-member journey status computed by the shared journey rules using applicable documents, acknowledgements, and activation records; badges only renumber for Forum opt-outs. Why: roster and member portal must report the same journey.
