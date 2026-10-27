# Close Final Checkpoint and Gate A Publication

Scope: only the items below. No broad scan, redesign, real invitations, appointments, restricted releases or real legal signing.

## 1. Leadership heading access correction (Option 1, approved)
- Replace the open signed-in read rule on the Leadership heading settings with the existing current-portal-access check, so only admins and members with current access (invited or active, including Forum-only invitees and Forum opt-outs) can read it.
- No change to biographies, photos, candidate profiles, governance records or any other access rule. Heading and description text stay as they are.
- Checks: admin and fictional invited/active, Forum-only and opt-out accounts can read the heading; the revoked fictional account and a signed-out request get nothing through direct database requests.
- Run the quick security scan once and confirm finding `lov_db_rls_tautology_permissive_v1_32ceccda9c2ba06e` is resolved; mark it fixed.

## 2. BoldSign environment
- Confirm whether the saved API key belongs to BoldSign Live or Sandbox using a read-only request, before any signing test.
- Wait for the webhook secret you add through the secure Secrets form; do not request or generate it.

## 3. Fictional signing test (only after the secret is present and the key is Sandbox, or you confirm a nonbinding Live test)
- Embedded signing as a fictional member, signed callback accepted, completed PDF and audit trail stored, portal status updated, a repeated event creates no duplicate, and another member or signed-out request is refused.
- If the secret is not yet configured, this item is reported as PENDING, not FAIL.

## 4. Focused workflow checks
- Forum opt-out fictional member with one explicitly released fictional Stage 2 document: document unlocks and completes correctly.
- Two consecutive fictional invitations in admin: NDA details reset between recipients and evidence for one cannot be reused for the other (no emails sent).

## 5. Report and publication
- Tests and build check, then one concise PASS/FAIL report in Files.
- If item 1 passes and no launch-critical defect remains, publish the corrected build for the fictional-account rehearsal (Gate A). Gate B stays paused.

## Technical details
- One migration: drop and recreate the `leadership_settings` SELECT policy `TO authenticated USING (public.portal_access_current())`; existing admin write policy untouched.
- Add a focused test asserting the policy predicate; access checks via signed-in fictional sessions against the database.
- Add the task to roadmap.md.
