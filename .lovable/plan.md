# Initial Member Journey: Forum-First Sequence

Preserves the five-stage onboarding, document requirements, portal design, invitation template, confidentiality controls and audit history. No new member features, and the Orientation Hub does not grow. No live sends.

## 1. Revised first-login sequence (for founder approval)

```text
1. Accept invitation -> set password -> sign in
2. Orientation Hub opens on its own -> 5-Minute Orientation -> "I've reviewed this overview"
3. Meetings & Calendar  (NEW landing step: mark availability for the inaugural Forum)
4. Executive Profile + Forum participation controls
5. Controlled strategic briefing (Email 3, sent by admin to Forum-cleared members with document permission)
6. United Strategic Coordination Forum
-> Formal agreements, disclosures and activation continue through Stages 2-4 afterwards
```

Change: after the orientation acknowledgment, the member now goes to the Welcome Center's Meetings & Calendar section instead of the Executive Profile. The note reads "Next: mark your availability for the inaugural Forum, then complete your executive profile." The profile stays one click away and keeps its current steps.

Confirmed in the current portal: marking availability does not require a submitted profile. That stays as it is.

## 2. Orientation Hub: essential factual correction only
The Readiness Vanguard chapter currently says "The first 25 teams and drivers" and calls it a "fixed, curated first group". Proposed wording:
- Heading: "A planned first cohort of 25 teams and drivers."
- Opening line: "The Readiness Vanguard™ is planned as a curated first cohort of up to 25 teams and drivers... Recruitment and enrollment are under way; the cohort is not yet fully recruited or contractually enrolled."
- Locked principle: "Designed as a 25-slot, supply-side-first program"

Nothing else changes. Jared Odrick and NASCAR are not mentioned in the hub.

## 3. Forum framing in member-facing copy
Check the Forum email templates (2, 3, 6, 7) and the Meetings card wording. Each must describe the Forum as strategic coordination that leads to recommendations, not as a joint Board meeting, and must not replace separate entity approvals. Wording is adjusted only where a sentence suggests otherwise, and every change is listed for approval.

## 4. Remaining Priority A blockers (to be reported back)
- NDA verification records for every invited member (Governance panel)
- Two cross-entity role reviews
- Stage 1 Forum documents (Protocol, Pre-Read Packet, Conflict/Recusal form) approved and loaded
- An inaugural Forum availability poll created in Meetings (dates and slots from you)
- Confirmation of the data-acquisition description in the Orientation Hub
- Founder approval of the review package and the production preview

## Technical details
- `portal.index.tsx` `handleAcknowledge`: navigate to `/portal` with hash `meetings` (scroll to `#meetings`) instead of `/portal/profile`; update the toast text.
- `src/data/orientation-hub.ts` `vanguard` chapter: three string edits only.
- `system-email-defaults.ts`: wording check of the forum templates only. The keys and the shape of `loadSystemEmail` stay the same.
- Update the walkthrough test step 4 so it expects Meetings. Re-run the existing tests.
