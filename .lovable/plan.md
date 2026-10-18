# Welcome Center layout redesign + Leadership Team

## Goal
Rearrange the member Welcome Center to match the supplied reference. All existing text, buttons, links, forms and behavior stay the same — only placement and sizing change, plus a new "Meet the Board" team panel.

## New layout (desktop)
```text
| Logo          | Your Next Step tracker ............ | Welcome, Alex | Sign out |
|---------------|----------------------------------------------------------------|
| Sidebar       | Hero banner (Welcome, Alex / road image / side statement)     |
| (unchanged    |----------------------------------------------------------------|
|  items)       | Intro + Complete Your Profile card | Why You card + quote     |
|----------------------------------------------------------------------------- |
|   Meetings & Calendar (wide, ~60%)        | Meet the Board / Leadership Team |
|------------------------------------------------------------------------------|
| Footer                                                                        |
```
- Hero becomes a shorter wide banner; the intro paragraph and profile button move into their own card below it, side by side with the Why You card.
- Meetings card and the new team panel sit side by side below, spanning under the sidebar edge as in the image.
- Tablet/phone: everything stacks in one column in the same order.

## Leadership Team panel
- Small gold label and heading both read "Our Leadership Team" (replacing "Meet the Board"), with the image's subtext: "A distinguished group of advisors and executives guiding PRSC's mission and industry impact."
- Each row: photo, name, role, and a dropdown arrow that expands the bio.
- For now it shows the six placeholder people from the image (sample only).
- Once your spreadsheet arrives, the list will be built from it (names and roles). Each person's photo and bio fill in automatically when they complete their profile card; until then a placeholder photo/initials and no bio show.
- A short "Bio" box is added to the first step of the member profile so members can supply that text (the headshot upload already exists).

## Technical details
- Layout changes in `portal.index.tsx`; new `LeadershipTeam` component.
- Add a nullable `bio` column to member profiles and a field in profile step 1; a signed-in server function returns team rows (name, role, headshot link, bio) for active members only, falling back to the placeholder list while no team data exists.
- Spreadsheet import (names, roles, document timing) handled in a later step when the file is uploaded.
- Placeholder headshots generated as images.
- Verify at desktop, tablet and phone with screenshots.
