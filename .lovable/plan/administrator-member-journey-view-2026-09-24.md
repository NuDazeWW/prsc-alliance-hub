# Administrator member journey view

## Goal
Give the administrator one clear place to open any member record and see exactly what that person has completed or submitted throughout the portal journey.

## Changes
- Keep a visible **View profile** action on every member row, including members who have only saved partial progress.
- Expand the member panel with a journey summary: invitation/access state, last access, profile stage, completion status, submission date, document readiness, and inquiry activity.
- Show all saved profile responses with the same full question wording members see, rather than internal field codes.
- Clearly distinguish **In progress**, **Submitted**, and **Not started**, and show unanswered fields as “Not provided.”
- Keep document preparation controls in the same member panel so the administrator can move directly from review to the next step.

## Technical details
- Extend the existing administrator member-detail read to include profile, activity, inquiry, document, and acknowledgement summaries already protected by administrator access.
- Reuse the portal’s question and permission labels through shared constants so member and administrator wording stays aligned.
- Preserve the current private-access protections; no public or member permissions are widened.
- Verify the panel in preview at desktop and mobile widths and confirm the project builds cleanly.
