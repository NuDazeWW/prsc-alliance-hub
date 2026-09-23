# Password visibility and failed-attempt protection

## Build
- Add an eye control to sign-in and password-reset fields so users can reveal or hide what they typed.
- Track consecutive failed sign-in attempts for each invited account in the protected backend.
- After the third failed attempt, stop further sign-ins and direct the user to password recovery.
- Clear the failed-attempt requirement after a successful password reset; also clear ordinary failed counts after a successful sign-in.
- Keep messages generic so the page does not reveal whether an email address has an account.

## Technical details
- Route password sign-in through a server-side function that checks the lock state and records success or failure.
- Store only normalized email, attempt count, and reset-required state—never passwords.
- Restrict the tracking table to privileged server access with row-level security enabled and no public policies.
- Preserve the existing role-based destination: administrators go to `/admin`; members and advisors go to `/portal`.

## Validation
- Verify eye controls in sign-in and password setup modes.
- Verify three failures switch the page into recovery mode.
- Verify a completed password reset removes the restriction.
- Check preview rendering and the current build status.
