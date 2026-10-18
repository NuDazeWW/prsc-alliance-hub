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
- Heading "Meet the Board / Our Leadership Team" with the short description from the image.
- List of people: photo, name, title, and a dropdown arrow that expands a short bio.
- Starts with the six names shown in the image as placeholders (these are sample people, not real). Please send real names, titles, bios and headshots, and I will swap them in; later an admin editor can be added if you want.

## Technical details
- Changes limited to `portal.index.tsx` layout markup and a new `LeadershipTeam` component with a static list; no backend, query, or route changes.
- Placeholder headshots generated as images; replaced when real ones arrive.
- Verify at the current desktop width plus tablet and phone with screenshots.
