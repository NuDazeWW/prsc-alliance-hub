# Orientation-First Sign-In and Forum Email Series

Built on the current portal. No redesign.

## 1. First-sign-in Orientation Hub
- On a member's first sign-in, the Orientation Hub opens on its own. It keeps the current three cards and the current look.
- "Take the 5-Minute Orientation" becomes the main button. It steps through the existing overview cards (PRSC, PRSC Readiness Score™, DIS), then a final "I've reviewed this overview" button.
- That click saves a short **orientation acknowledgment**: date and time only. It is not a signature, it is not a legal acknowledgment, and it does not count toward Stage 2 formal orientation or the journey tracker.
- After the acknowledgment, the hub closes and the member goes straight to their Executive Profile, with a note: "Next: complete your executive profile."
- Members who have acknowledged won't see the hub open on its own again. They can still open it from the left menu.
- Admin roster and member detail show "Orientation reviewed: date" or "Not yet."
- In admin "View portal as member" mode, the hub can be previewed but nothing gets recorded.

## 2. Content check before invitations
- Review the Orientation Hub text against the current PRSC–DIS structure, data-acquisition model and governance positioning. Wording that reveals Readiness Engine methods, or that presents sample outputs as official Scores, is softened or labeled "Illustrative". Every change will be listed for your approval. Approved legal wording stays as it is.

## 3. Updated invitation email (Email 1)
- The existing invitation system and its personalized "Why You" passage stay. The body is replaced with your approved Email 1 copy. The steps read in order: Accept Invitation, 5-Minute Orientation, Executive Profile, Forum Preparation. The appointment disclaimer goes in the footer.
- You can edit and reset it in Email Templates, as now.

## 4. Seven new Forum emails (Emails 2–8)
Each is added as an editable template with your copy, one main button that opens a signed-in portal page, and no attachments:

| # | Email | Who can receive it |
|---|---|---|
| 2 | Forum confirmed | Forum participants with a verified NDA, once the meeting date is confirmed |
| 3 | Strategic briefing released | Forum-cleared members who are allowed to see that document |
| 4 | Executive input requested | Forum-cleared participants |
| 5 | Input reminder | Only those who haven't sent questions yet, before the deadline |
| 6 | Final agenda | Forum-cleared participants |
| 7 | Coordination summary | Attendees, after the admin releases the approved note |
| 8 | Follow-up assignment | Only the person assigned |

- **Admin-controlled sending:** a new "Forum Communications" section in Invite & Email. The admin picks the email and fills in details (date, deadline, action title), and the system lists the members who qualify. Members who don't qualify are shown with the reason, for example "NDA not verified", "Not Forum-cleared", "Opted out of Forum" or "No access to briefing". The admin previews the email, then sends. Each member gets an individual email, and each send is logged.
- Server checks repeat the same rules, so a member who doesn't qualify can't be emailed even if the screen is bypassed.
- The question form (Email 4/5) and the follow-up assignments (Email 8) need the planned Strategic Forum Center pages. Until those exist, those emails link to the portal's Forum section, and the screen shows "available once the Forum workspace is live." **Confirm:** should I build the question form now, or wait for Priority B?

## 5. Before any real sending
- A preview of the updated invitation email, shown in admin.
- A recorded first-sign-in walkthrough with screenshots: sign in, hub opens, 5-minute overview, acknowledgment, Profile. The PDF goes to your Files.
- No live invitations sent.

## Technical details
- Migration: add `orientation_acknowledged_at timestamptz` to members (an update the member can make only for themselves, through a server function).
- `portal.index.tsx`: open the `hub` panel automatically when there is no acknowledgment and the user is not in admin preview. `OrientationHub.tsx`: add the guided mode and the acknowledge call.
- `system-email-defaults.ts`: update `invite`, add `forum_confirmed`, `briefing_released`, `input_requested`, `input_reminder`, `final_agenda`, `coordination_summary`, `followup_assigned`. These load through `loadSystemEmail`.
- New `forum-communications.functions.ts` (admin-checked). Eligibility comes from `governance.ts` (NDA, Forum clearance, `documentVisible`) and `journey.ts` (forum opt-out). Each send uses an idempotency key made from the email key, the member and the event.
- Tests: eligibility rules (NDA missing, not cleared, opted out, document hidden → excluded; reminder skips anyone who already submitted). The acknowledgment does not change journey status.

## Final controls (approved)
- The orientation acknowledgment time is set by the server only. It is kept separate from Stage 2 and from every legal document acknowledgment.
- Every member who hasn't acknowledged sees the refreshed orientation once, including existing accounts. Onboarding status is never reset.
- The question form is not built now. The full question workflow comes in Priority B and will include a "No additional questions" option, which stops reminders for that round.
- Two separate checks decide who gets each email: whether a member can be invited to the Forum, and whether they have completed Forum clearance. The briefing email needs both clearance and permission for that document.
- Emails 4, 5 and 8 stay switched off until their Priority B pages are working and tested.
- Each email is recognized by its forum, its email type and version, and its recipient. This prevents duplicates while still allowing future forums and revised emails.
- The walkthrough uses a test account with made-up details. Screenshots and reports show no real member information.
- No live sends. Invitations start only after you approve the production preview.

## Executive experience and review package
- Tone: Email 1 and the first sign-in should feel like an invitation into the next chapter of an important institution, not an administrative process. Warm welcome first, then personal recognition, then the 5-minute refresher. Forum logistics come later. Administrative steps are kept light and calm.
- One review package, delivered together for you to judge as a whole: (1) the actual Email 1 preview, (2) the first-login walkthrough with a test account, (3) the Orientation Hub content-change report.
- Before invitations: the NDA verification records for each member must be filled in through the admin Governance panel (entity coverage, date, sharing scope). The invitation stays blocked for anyone whose record is missing, even if they signed an NDA.
