# Correct live member workflow issues

## What will change
- Treat a submitted profile as **Profile Received** immediately, instead of leaving the member at **Awaiting Profile**.
- Make **Review Your Profile** open a readable review of the submitted answers, not the receipt screen.
- Only present **Review Your Documents** when documents have actually been released; otherwise show a clear “being prepared” state.
- Keep the gold inquiry button visible while hovering and submitting.
- Replace the easy-to-miss inquiry status line with a clear confirmation screen and a **Return to Welcome Center** action.

## Data correction
- Add an automatic database rule that moves a member to `profile_received` when their profile is submitted.
- Correct already-submitted records that are still marked `awaiting_profile`.
- Preserve later administrator-managed states such as **In Preparation** and **Package Ready**.

## Verification
- Test the submitted-profile review, welcome-center status, empty document state, inquiry hover, and inquiry confirmation.
- Confirm the existing live inquiry was recorded and no member documents were actually released yet.
