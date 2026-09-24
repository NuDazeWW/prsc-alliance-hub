# Correct the invitation password handoff

## Changes
- Stop the invitation page from showing an expired-link message after a valid invitation session is confirmed.
- After the member creates a password, sign out the temporary invitation session and open the normal sign-in page.
- Prefill the invited email address and show a clear success message telling the member to sign in with that email and their new password.
- Update the invitation-page wording and button label so the two-step process is clear before submission.
- Make every gold action button retain dark, readable text and a visible gold background while hovered.

## Verification
- Check valid, invalid, and delayed invitation states.
- Confirm the password-complete handoff reaches sign-in with the email prefilled and clear instructions.
- Confirm yellow actions remain visible in their hover state.
- Confirm the app builds without errors.
