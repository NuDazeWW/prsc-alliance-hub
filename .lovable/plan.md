# Orientation Hub polish + meeting set-up from emails

## Orientation Hub
1. **Main buttons stay lit**: the three buttons (Take the 5-Minute Orientation, Explore the System, View Current Materials) and the three cards above them return to their normal look as soon as the pointer leaves. A clicked button no longer stays glowing.
2. **Remove the small labels** under the buttons ("What exists now", "What is being built", etc.).
3. **Opening text**: "the people helping guide" becomes "the individuals helping guide", and "designed to do, and why your role matters" becomes "designed to do and why your role matters".
4. **Chapter 02 (The System)**: the three PRSC / Readiness Terminal / DIS cards show a bullet point before each line.
5. **Chapter 05 (Why This Is Hard to Copy)**:
   - The nine numbered boxes line up evenly on the left, with no stair-step indent.
   - Titles capitalized to match the rest: 04 "The Six Dimensions", 05 "The Data Architecture", 09 "The Trademark and Governance Spine".

## Admin: attaching a meeting
1. **Set up a meeting without leaving the email**: in "Invite a member" and "Compose & send", the "Attach an upcoming meeting" box gets a **Set up a new meeting** button. It opens a pop-up with the full meeting form. When you save, the new meeting is attached to the email you're working on right away.
2. **Pop-up calendar for dates**: each proposed time opens a month calendar where you pick the day, then a time picker. Selected dates show as easy-to-read chips you can remove. "Respond by" uses the same calendar.
3. **Time zone choice**: you pick the meeting's time zone (Eastern, Central, Mountain, Pacific, UK, Central Europe, and others). Times are saved correctly for that zone. Emails and the Welcome Center show the time in that zone, with a note to check local time.
4. The Meetings section uses the same updated form.

## Technical details
- `OrientationHub.tsx`: drop `PAGE_LABELS` render; add bullets in the relationship block; remove `marginLeft` stagger in `ipstack`. Fix hover by limiting the glow/shimmer to `:hover` and `:focus-visible` only (not `:focus`/`:active`) in the `hub-card` and `cta-glow` styles in `styles.css`.
- `orientation-hub.ts`: update `HUB_INTRO` and the three `IP_STACK` names.
- Pull the propose-meeting form out of `AdminMeetings.tsx` into a reusable `MeetingSetupForm` used by both Meetings and a new dialog in `admin.tsx`. On success, refresh polls and set the picker to the new poll id.
- Date picking uses the existing shadcn Calendar in a Popover plus a time input.
- Add a nullable `timezone` column to `meeting_polls` (defaults to `America/New_York`). Convert slot times from the chosen zone to UTC on save. `formatSlotET` becomes a zone-aware formatter that keeps Eastern as the fallback; update `meeting-block` tests to cover a non-Eastern zone.
