# Admin Center redesign (Overview + Invite & Email) to match the reference images

Layout and styling only, plus the new admin account menu. All existing features, wording, data and buttons keep working as they do today.

## Shared frame (both pages)
- **Left menu** (new): PRSC logo; "Administration" label; admin avatar circle with name and a small dropdown (moved from the top-right); then Overview, Invite & Email, Members, Inquiries, Meetings, Activity (jump to the matching page/section, active item gold-highlighted); "Need help? Questions? Send a message" at the bottom. On phones it becomes a slide-out menu.
- **Top bar**: summary counts with icons (Members, Open inquiries, Email templates, Recent events), search and alerts bell. The ADMIN icon is removed from here.
- **Page header**: "Administration" label, large "Private center" title, subtitle, Overview / Invite & Email pill tabs, night-road image on the right with "A higher standard for a stronger industry."

## Admin account menu (click the admin name in the left menu)
- **Change password**: current password, new password, confirm (with show/hide eyes).
- **Manage administrators**: list current admins; add an administrator by name and email (they get a secure set-your-password invitation email); remove an admin (you can't remove yourself or the last admin).
- Sign out.

## Overview page
```text
+------------------------------+  +------------------+
| Members (wide)               |  | Leadership Team  |
|                              |  | Upload member list|
+------------------------------+  | Recent inquiries |
| Meetings & calendar          |  | Activity log     |
+------------------------------+  +------------------+
```
- Members: two-column gold-bullet help box, search/filters + Export CSV on one row, full table.
- Meetings: "Propose a meeting" opens the existing form in a pop-up; Upcoming / Calendar view toggle; compact rows with "View details".
- Leadership: first 3 people, "View all team members" expands; Activity log: last 5, "View full activity log" expands.

## Invite & Email page
```text
+--------+--------+--------+--------+
| Members| Open   | Email  | Recent |   <- four stat cards with icons
|   2    | inq. 0 | tmpl 6 | events |
+--------------+-----------------+-------------+
| 1. Invite a  | 2. Compose &    | Live preview|
| member       | send            +-------------+
| steps 2-4    | (Compose / Tem- | Email       |
| numbered     | plate Library   | templates   |
| gold circles | toggle)         | table       |
+--------------+-----------------+-------------+
| Members (full width, compact table)          |
+----------------------------------------------+
```
- Invite card: fields in two columns; "Attach an upcoming meeting", "Draft Why You with AI", "Why this candidate was chosen" as numbered steps 2–4; Preview invitation / Send invitation at the bottom.
- Compose card: Compose & Send / Template Library Editor toggle in the header; recipients shown as selectable member chips; Clear / Save template / Send to N member(s).
- Right column: live email preview (Desktop/Mobile switch) and an Email templates table (name, type, last updated, status, Edit) with "+ New template".

## Every card
- 2.5px gold outline, rounded corners, soft glow, dark fill, gold line icon + serif title, actions on the right, "..." to collapse.
- Phones: everything stacks in one column.

## Technical details
- New `AdminShell` (sidebar + top bar + header) used by `AdminCenter` for both pages; shared `AdminCard` wrapper; `admin-card` utility in `styles.css` from existing tokens.
- Regrid both pages in `AdminCenter.tsx`; `AdminMeetings`/`AdminLeadership` get compact modes; email preview moves to its own right-column card fed by the same compose state.
- Change password: `supabase.auth.updateUser({ password, current_password })`.
- Admins: new server functions `listAdmins`, `addAdmin`, `removeAdmin` (verify caller is admin via `has_role`, then use the admin client to invite the user and insert/delete `user_roles` rows; block removing self/last admin). Invite email uses existing branded sending.
- Verify both pages signed in as admin at desktop and phone widths, plus the password and add-admin flows.
