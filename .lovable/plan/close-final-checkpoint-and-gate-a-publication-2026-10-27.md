# Close Final Checkpoint and Gate A Publication

Scope: only the items below. No broad scan, redesign, real invitations, appointments, restricted releases or real legal signing.

## 1. Leadership heading access correction (Option 1, approved)
- First confirm the existing current-portal-access check allows admins and invited or active members, including Forum-only invitees and Forum opt-outs, and refuses revoked members.
- Then replace the open signed-in read rule on the Leadership heading settings with that check, so only those people can read it.
- No change to biographies, photos, candidate profiles, governance records or any other access rule. Heading and description text stay as they are.
- Checks: admin and fictional invited/active, Forum-only and opt-out accounts can read the heading; the revoked fictional account and a signed-out request get nothing through direct database requests.
- Run the quick security scan once and confirm finding `lov_db_rls_tautology_permissive_v1_32ceccda9c2ba06e` is resolved; mark it fixed.

## 2. BoldSign credentials
- The previously disclosed webhook secret is never used. The founder reports the rotated secret is now saved as BOLDSIGN_WEBHOOK_SECRET; confirm it is present (without revealing it) before testing.
- Keep the existing API key and webhook address unchanged; no integration redesign.
- Confirm whether the saved API key belongs to BoldSign Live or Sandbox with a read-only request, before any signing test.

## 3. Fictional signing test (only after the rotated secret is in place)
- One nonbinding signing transaction using only founder-controlled test identities; no BoldSign notifications to real executives.
- Verify embedded signing, authenticated callback, completed PDF retrieval, audit trail retained, portal status updated, a repeated event creates no duplicate, and another member or signed-out request is refused.
- If the rotated secret is not yet configured, this item is reported as PENDING, never as passed.

## 4. Focused workflow checks (run while the secret is being configured)
- Forum opt-out fictional member with one explicitly released fictional Stage 2 document: document unlocks and completes correctly.
- Two consecutive fictional invitations in admin: NDA details reset between recipients and evidence for one cannot be reused for the other (no emails sent).

## 5. Report and publication
- Tests and build check, then one concise final acceptance report (PASS/FAIL/PENDING) in Files.
- If the leadership correction and other launch-critical checks pass, publish the corrected build for the fictional-account rehearsal (Gate A), with any BoldSign item clearly marked pending. Gate B stays unauthorized.

## Technical details
- One migration: drop and recreate the `leadership_settings` SELECT policy `TO authenticated USING (public.portal_access_current())`; existing admin write policy untouched. Read the `portal_access_current()` definition first to confirm its statuses.
- Add a focused test asserting the policy predicate; access checks via signed-in fictional sessions against the database.
- Add these tasks to roadmap.md.
