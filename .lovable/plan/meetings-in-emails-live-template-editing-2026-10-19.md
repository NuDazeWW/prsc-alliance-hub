# Meetings in emails + live template editing

## What you will be able to do

### 1. Attach a meeting to the first invitation
- The "Invite a member" form gets a new box: **Attach an upcoming meeting**.
- Pick an open meeting from a list. The list only shows meetings that fit the person's role, for example Board Meetings for board members.
- The invitation email then shows a meeting section: the meeting name, virtual or in person, length, the proposed dates and times, and a line asking them to mark their availability once they enter the Welcome Center.
- The new member is added to that meeting automatically, so the availability card is waiting at the top of their Welcome Center when they first sign in.
- If no meeting exists yet, a link takes the admin to the Meetings section to propose dates first.

### 2. Attach a meeting to any later email
- "Compose & send" gets the same **Attach an upcoming meeting** picker.
- Picking a meeting adds the meeting section with its dates to the email and sets the button to open the member's calendar card.
- Anyone selected as a recipient who is not yet on that meeting's list is added to it when the email goes out.

### 3. Edit every email template live
- Every automatic email appears in the template list with an "Auto" tag, ready to edit:
  - Invitation
  - Meeting availability request
  - Meeting confirmed (with calendar file)
  - Profile received
  - Documents ready
- Clicking a template opens it in the editor. A live preview sits beside the fields and updates as you type. No upload needed.
- A "Preview as" picker shows the email with a chosen member's name and role filled in.
- **Save** updates the template. Every future automatic email uses the saved wording right away.
- **Reset to original** restores the starting wording for automatic emails.
- "Upload content" stays as an optional shortcut.

## Technical details
- Add `system_key` rows for `meeting_poll`, `meeting_confirmed`, `profile_received`, `documents_ready`, with current hard-coded copy as defaults (seeded in a migration with `ON CONFLICT DO NOTHING`). Copy keeps the existing `{{tokens}}` plus new `{{meeting_block}}`.
- New shared helper builds the meeting block text from a poll and its slots (Eastern time, local-time note). It's used by the invite email, Compose sends, and the poll email.
- `invitePortalMember` and `sendTemplateToMembers` accept optional `poll_id`; they append member ids to `meeting_polls.invited_member_ids` with an admin check before the update.
- The invite auth webhook reads the attached poll from the new member's latest pending poll link (`portal_members.pending_poll_id`, new nullable column) and renders the meeting section in `InviteEmail`.
- Server sends for meetings, profile received, and documents ready read their `system_key` template first and fall back to built-in copy.
- New `resetEmailTemplate` server function restores defaults for system templates only.
- Admin: the Compose area gets a two-column layout (fields | live preview iframe using existing `renderBrandedEmail`). On phones, the preview stacks below the fields.
- Tests for the meeting block formatting and the role-to-meeting filter.
