# Final Bounded Security Verification and Launch Closure

Scope: one confirm-and-fix pass on the 16 findings from the latest deep review. No new features, no redesign, no real invitations, no appointment activation, no broad re-scan cycle.

## 1. Establish the tested version
- Record the saved version the deep review analysed (scan timestamp 2026-10-27 03:34 UTC) and the current saved version.
- For each finding, check the cited code location in the current files to see whether the vulnerable code is still there.

## 2. Label every finding
Each of the 16 findings gets one label: Fixed (with test evidence), Still vulnerable, Accepted exception, or Non-launch-critical limitation.

| Finding | Expected check |
|---|---|
| Private meeting calendars reachable without sign-in | Confirm the calendar download requires a signed-in member who currently has access and is on that meeting's invite list; confirm the old link-token path is gone |
| Leadership heading settings readable | Accepted founder exception (generic heading text only); does not cover member profiles or bios |
| Anyone can lock another member's account | Confirm the lock code and its calls are removed |
| Anyone can make the app query signing records | Find the reachable entry point; fix it if it isn't sign-in and access checked |
| Revoked members can still read meeting invitations, time options, responses, notes and their question records (6 findings) | Confirm the current-access restriction covers each of these tables; check again with the revoked fictional account |
| Revoked member's documents, headshot or leadership photo reachable through an old link (3 findings) | New links are checked on every request; links issued earlier expire on their original schedule. Non-launch-critical limitation |
| Emailed signed copies (3 findings) | Resolved by the decision in section 3 |

## 3. Signed-copy delivery decision (founder directive)
- Turn off emailing signed copies outside the portal: the server action refuses, and the admin control is hidden or disabled with a short note.
- Members get executed copies only through the signed-in portal, which checks current access.
- Keep every executed copy, signature, timestamp and audit entry as it is.
- Check the email log for signed-copy messages already sent. Record the number, send dates, actual expiry dates (send date + 7 days), and whether recipients were fictional test members or real people.

## 4. Fix only what is still vulnerable
- Make the smallest possible change for each finding labelled Still vulnerable.
- Add one focused test per rule and run it against the current code. Reuse earlier passing results where the code hasn't changed.

## 5. Targeted verification (no broad re-scan)
- Run the current test suite and a fresh check for build errors.
- Run browser checks with the fictional accounts: calendar download signed out (must be refused), calendar download as a revoked member (refused), signing-record lookup as a candidate (refused), meeting and question reads while revoked (empty), invitation sending as a candidate (refused).
- Run the quick database check once to confirm only the accepted heading exception remains.

## 6. Password recovery
- Record the result of the Testone reset you complete. Document which login-service protections can be verified and state plainly which settings can't be inspected.

## 7. Final report
One concise report in Files containing: the version tested, the label for each finding, evidence for each fix, accepted exceptions, deferred noncritical items, signed-copy link inventory, password-recovery result, and a GO / NO-GO recommendation for publishing the corrected version for controlled testing only. Real executive invitations stay paused.

## Technical details
- Files likely touched: `src/lib/portal.functions.ts` (turn off `sendSignedCopy`, audit the signing-record lookup), `src/components/portal/AdminCenter.tsx` or the admin documents panel (disable the control), possibly one small migration if a meeting or question table lacks the restrictive `portal_access_current()` policy, and a new `node:test` case file in `src/lib`.
- Signed-copy link inventory comes from the email send log, filtered to template `signed-copy-member`.
- Mark findings Fixed in the security panel only after the current code and tests confirm it. Record the heading exception as ignored, with the founder's approval as the reason.
