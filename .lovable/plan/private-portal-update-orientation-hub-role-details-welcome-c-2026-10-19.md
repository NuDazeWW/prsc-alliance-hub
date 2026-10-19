# Private portal update: Orientation Hub, Role Details, Welcome Center, meeting set-up

This follows your uploaded brief. Nothing changes on the public PRSC site, existing document permissions, member materials, the profile steps, or meetings already saved.

## A. Orientation Hub opening screen and behavior
- Remove the four small labels under the three main buttons (only on the opening screen; deeper pages keep them).
- Opening text, word for word: "This hub is a shared reference point for the individuals helping guide PRSC and DIS. It explains the problem we are solving, how the organizations work together, what the Score and Terminal are designed to do, and why your role matters."
- Card captions use title case: "Standard and Governance", "Shared Commercial-Readiness Language", "Data, Platform, Intelligence, and Ongoing Utility". The middle card reads "The PRSC Readiness Score™".
- "View Current Materials", "Your Documents" and "Current Materials" become **Your Personal Documents** everywhere: left menu, buttons, Hub links.
- The cards and buttons glow only while you point at them, or reach them with the keyboard. Nothing stays lit after a click.
- The page behind the Hub stays still, and every new Hub page opens at the top. Close, Escape and Back keep working the same way.
- Inner pages get less empty space: compact title, short lead line, then content, all lined up on one readable width.

## B. Guided orientation: six chapters
01 The Problem · 02 The System · 03 The PRSC Readiness Score™ · 04 What the Readiness Terminal Delivers · 05 Why This Is Hard to Copy · 06 The Readiness Vanguard™
- The counter reads "Chapter X of 6".
- The last screen has three buttons: Explore the System, View Your Role Details (opens the existing Role Details panel), View Your Personal Documents.

## C. Chapter fixes
- **02**: PRSC, Readiness Terminal™ and DIS cards, each with exactly three bulleted sentences, in your wording. Both relationship statements sit beneath them. "PRSC/DIS" is never used as one name.
- **03**: renamed "The PRSC Readiness Score™" everywhere. It adds your required points (issued by PRSC and delivered through the Terminal; calibrated against peer groups; not a ranking; confidential by default; not certification) and the "Score vs. Certification" callout.
- **04**: a prominent callout with the boundary statement. Audiences are Teams and Drivers; Brands, Partners, and Investors; Partnership Ecosystem Operators™; Series; and Manufacturers (future-state only, not Vanguard).
- **05**: the nine items become an even 3 by 3 grid, with no stair-step. Titles use your exact capitalization: The Readiness Engine, The Six Dimensions, The Data Architecture, The Trademark and Governance Spine. Your shorter competitive paragraph and the "We have not identified a clear direct competitor…" conclusion go beneath the grid.
- **06**: the Vanguard link opens the Vanguard chapter inside the Hub every time. The locked principles stay as written.

## D. Explore the System: four groups
A. The Market and the System · B. The Score and the Terminal · C. Trust, IP, and Governance · D. Validation and Scale
- Topics are placed exactly as in your brief, with a new "Score, Certification, and Confidentiality" topic and a new "How Governance Protects the System" topic.
- The four cards are even and compact. On desktop, the side topic list stays visible. On phones, it becomes a drop-down.
- Board, Advisor and Committee pages move out of Explore.

## E. Role Details, personalized
- Role Details shows only the logged-in member's role or roles: Board, Advisor, or Methodology Committee, using the content points in your brief. Members with more than one role see a separate card for each.
- The "SELECTED ADVISOR · PRSC / DIS" style label becomes "{role} · {full entity name}". Members with more than one role see separate chips.

## F. Added leadership content
- "Why the Score Can Be Trusted" adds the evidence-integrity points, with no internal workflow details.
- Each audience card shows its problem, what becomes possible, what it receives, what is not promised, and when it is available.
- The flywheel and series path follow your high-level chain: verified evidence → calibrated assessment → stronger benchmarks → better decision support → broader learning.

## G. Welcome Center spacing
- The large blank band above "Your Next Step" shrinks to a small gap, so the first action shows right away on desktop, tablet and phone.

## H. Admin: set up a meeting from an email
- "Invite a Member" and "Compose & Send" get a **Set Up a New Meeting** button. It opens the full meeting form in a pop-up. When you save, the meeting is created, the list refreshes, and the new meeting is attached to your draft automatically.
- The same form is used in the Meetings section too. It covers title, description, proposed dates and times, response deadline and time zone.
- You pick each date from a calendar, then choose a time. Selected times appear as chips you can remove. "Respond by" works the same way.
- Time zone choices: Eastern, Central, Mountain, Pacific, UK, Central Europe and other common zones, with Eastern as the default. Emails and the Welcome Center show times in that zone, with a note to confirm in local time. Existing meetings still show in Eastern.

## I. Final check
I'll run through every item in your acceptance list, on desktop and phone, before I report back.

## Technical details
- Content: `src/data/orientation-hub.ts` gets the new `GROUPS` (4), `GUIDED` (6), and `IP_STACK` titles. It adds a `ROLE_DETAILS` content map, the new topics, and the callouts. All copy is verbatim from the brief.
- `OrientationHub.tsx`: drop `PAGE_LABELS`. Add bullets in the relationship block. Show `ipstack` as `grid sm:grid-cols-3`. Topic sidebar on desktop, select on mobile. Internal topic routing for the Vanguard link. End-screen actions call `onOpenRoleDetails` and `onOpenDocuments`.
- `styles.css`: the `hub-card` and `cta-glow` effects apply only on `:hover` and `:focus-visible`.
- `portal.index.tsx`: rename the documents labels, render Role Details per role through `memberRoleLabels`, use role chips, and tighten the top spacing.
- Meetings: extract `MeetingSetupForm` from `AdminMeetings.tsx`, with a Calendar+Popover date picker plus a time input. Show it in a Dialog from `admin.tsx` for invite and compose, with an `onCreated(pollId)` callback that refetches polls and selects the new one.
- Database: add `meeting_polls.timezone text default 'America/New_York'` (nullable). `createMeetingPoll` accepts the time zone and converts local times to UTC. `formatSlot(iso, tz)` replaces `formatSlotET` and the duplicate formatter in `meetings.functions.ts`. `meetingBlockText` names the zone. Tests add a Pacific-zone case.
- `roadmap.md` is updated with these workstreams.
