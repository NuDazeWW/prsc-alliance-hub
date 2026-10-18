# The Orientation Hub

## What changes
- In the Welcome Center's left menu, "Refresh on PRSC" and "Learn about DIS" become one link: **The Orientation Hub**. Every member sees it.
- The link opens the same lightbox style that "Refresh on PRSC" uses now (same frame, close button and dark navy look). Inside, it becomes a hub that moves between screens. It never opens a pop-up inside a pop-up.

## Inside the lightbox (following the experience model)
Every screen keeps the same frame:
- a close button
- a "Back to Orientation Hub" link
- a progress bar for the chapters
- a short list of chapters down the side (it becomes a drop-down on phones)

**1. Opening screen: "Welcome to the PRSC & DIS Orientation Hub"**
- The short opening text from the model, word for word.
- Three cards:
  - PRSC: navy and gold, with a shield icon
  - The PRSC Readiness Score™: a sample 0–100 ring, not a real score
  - DIS + the Readiness Terminal™: cyan and electric blue lines from the DIS palette
- Three buttons: Take the 5-Minute Orientation, Explore the System, View Current Materials.

**2. The 5-Minute Orientation**
- Seven short chapters with Next and Previous buttons and a "Chapter X of 7" counter: The Problem, The System, The Score, What the Terminal Delivers, Why It Is Different, The Readiness Vanguard™, Why Your Role Matters.
- At the end there are three buttons: Explore the full system, View documents and materials, Return to portal.

**3. Explore by Topic**
- A menu of chapters in five groups:
  - A. The Market and the Problem
  - B. PRSC, DIS and the Score
  - C. The Terminal and Audience Value
  - D. Data, Trust and Defensibility
  - E. Validation and Scale
- Each group holds the matching sections from the Orientation Hub document.
- Interactive parts suggested by the model:
  - the PRSC → Terminal ← DIS relationship map
  - six Score tiles that show only the simple question each one answers
  - audience tabs for Teams & Drivers, Series, Sponsors, Agencies & Agents and Manufacturers, each with its boundary note
  - the availability key (Core / Available as data comes online / Future-state / Optional)
  - the six-layer IP stack
  - the benchmark flywheel
- The Quick Reference and Resource Library sections are included too.

**4. View Current Materials**
- Points to the member's existing "Your Documents" area. The existing site links (Score, Governance, Vanguard) move here.

## Content rules
- All wording comes straight from your two files. Nothing is invented. I won't show market-size numbers unless your document already gives the figure and its source.
- The labels "What exists now / What is being built / What grows as the benchmark grows / Future-state" appear wherever the document uses them.
- PRSC parts use navy and gold. DIS and Terminal parts use the DIS palette: Electric Blue #1EA7FF, Aurora Blue #22D3EE, Cyber Blue #0B5B7A and Steel Blue #1B2A3D.

## Not changing
- The rest of the Welcome Center layout, the profile steps, documents, meetings, the leadership panel and admin.
- The old DIS lightbox is removed, because its content now lives in the hub.

## Technical details
- New `src/data/orientation-hub.ts` holds the structured content: chapters, groups, sections and cards, all taken from the uploaded markdown.
- New `src/components/portal/OrientationHub.tsx` keeps the view state inside one dialog (hub / guided step / topic id / materials). It reuses the dialog shell the current "prsc" panel uses.
- `portal.index.tsx`: the two nav entries are replaced with one `{ label: "The Orientation Hub", onSelect: () => setPanel("hub") }`. The `prsc` and `dis` panel bodies are replaced with the hub.
- DIS colors are added as semantic tokens in `src/styles.css`. No hardcoded hex values in components.
- I'll check the hub at desktop and phone widths in the preview.
