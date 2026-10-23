# Split the Admin Center into two pages

## Goal
Less scrolling and clearer grouping. The top navigation buttons become real page tabs instead of jump links on one long page.

## Page 1 — Overview (`/admin`)
In this order, each in its own clearly titled section:
1. Members (status board, filters, member profile drawer)
2. Meetings & calendar
3. Inquiries
4. Activity log
5. Leadership Team
6. Upload a member list

## Page 2 — Invite & Email (`/admin/send`)
1. Invite a member
2. Compose & send
3. Email templates (library editor)
4. Members (compact list for reference while inviting/emailing)

## Navigation
- Top bar shows two tabs: "Overview" and "Invite & Email"; the active one is underlined gold.
- Summary counts and the alerts bell stay in the top bar on both pages; alert links go to the right page.
- Mobile: the tabs appear as a simple two-button switcher under the logo.
- The swap-columns / full-width controls are removed where they no longer apply; collapse buttons stay.

## What does not change
All features, data, wording, email behavior, pop-ups (meeting setup, previews, member drawer) and "View portal as member" work exactly as today.

## Technical details
- Extract the existing sections of `admin.tsx` into components under `src/components/portal/admin/` sharing one admin data query.
- New route `src/routes/_authenticated/admin.send.tsx`; `admin.tsx` becomes a layout rendering `<Outlet />`, with the overview body in `admin.index.tsx`. Both keep admin server-side checks and noindex head metadata.
- Verify both pages signed in as admin on desktop and phone.
