# Overview page redesign to match the reference image

Layout and styling only. All features, wording, data and buttons stay as they are.

## Page header
- "Administration" label, large "Private center" title, subtitle "Manage your members, meetings, and communications in one place."
- Overview / Invite & Email as pill tabs under the title (gold filled = active).
- Road-at-night image on the right with "A higher standard for a stronger industry." and a short gold rule.
- Top bar summary counts get icons (members, inquiries, email templates, recent events).

## Two-column layout (desktop)
```text
+------------------------------+  +------------------+
| Members (wide, ~62%)         |  | Leadership Team  |
|                              |  +------------------+
|                              |  | Upload member list|
+------------------------------+  +------------------+
| Meetings & calendar          |  | Recent inquiries |
|                              |  +------------------+
|                              |  | Activity log     |
+------------------------------+  +------------------+
```
- On phones everything stacks in one column: Members, Meetings, Leadership, Upload, Inquiries, Activity.

## Each card
- Thicker gold outline (2px), rounded corners, soft gold glow, dark panel fill, so each section is clearly separate.
- Header row: gold line icon + serif title, action buttons on the right (e.g. Add person, Propose a meeting), and a small "..." circle that collapses or expands the card.
- Icons: Members (people), Meetings (calendar), Leadership (people), Upload (upload arrow), Inquiries (speech bubble), Activity (pulse line).

## Section sizing
- Members: help text shown as a two-column gold-bullet box; search and filters on one row with Export CSV; table with checkbox, member, designation, where they are, package status, emails received, actions.
- Meetings: "Propose a meeting" opens the existing meeting form in a pop-up; "Upcoming meetings / Calendar view" toggle; compact one-line rows with date, time, length, format chip and "View details" (opens the existing tally/confirm view).
- Leadership: compact list showing the first 3 people with "View all team members" to expand; panel text settings move into the expanded view.
- Upload a member list: description plus Download template / Choose file buttons.
- Recent inquiries: latest few, compact.
- Activity log: last 5 entries with gold bullets and timestamps; "View full activity log" expands.

## Technical details
- Edit `AdminCenter.tsx` overview sections into a `lg:grid-cols-[1.6fr_1fr]` grid with left/right stacks; add a shared `AdminCard` wrapper (icon, title, actions, collapse via `useStoredFlag`).
- Add `admin-card` utility in `styles.css` using existing gold/navy tokens.
- `AdminMeetings` gets a compact list mode + dialog for `MeetingSetupForm`; `AdminLeadership` gets a compact preview mode.
- Reuse existing hero image asset. Invite & Email page unchanged except shared header.
- Verify signed in as admin at 1377px and phone widths.
