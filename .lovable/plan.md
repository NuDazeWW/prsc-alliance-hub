# The Orientation Hub

## Scope
- In the Welcome Center's left menu, "Refresh on PRSC" and "Learn about DIS" become one link: **The Orientation Hub**.
- The Orientation Hub is an internal reference experience for authorized PRSC and DIS Board members, Advisors, and Methodology Committee members. Existing document, paperwork, and materials permissions remain unchanged.
- This is not a public website or a Readiness Terminal product experience. It is an internal orientation hub for the people responsible for guiding, governing, advising, and protecting the work of PRSC and DIS.
- The hub opens in the lightbox shell and dark navy setting you use today. Each choice changes the view inside that same lightbox, so there are no pop-ups inside pop-ups.

## Inside the lightbox
Every screen keeps the same frame:
- a close button
- a "Back to Orientation Hub" link
- a chapter progress bar
- a short list of chapters down the side (it becomes a drop-down on phones)

**1. Opening screen: "Welcome to the PRSC & DIS Orientation Hub"**
- The tone orients members. It does not pitch to them. The opening message, word for word: "This hub is a shared reference point for the people helping guide PRSC and DIS. It explains the problem we are solving, how the organizations work together, what the Score and Terminal are designed to do, and why your role matters."
- Three role cards:
  - PRSC — Standard and governance (navy and gold)
  - PRSC Readiness Score™ — Shared commercial-readiness language (a sample 0–100 ring, never a real score)
  - DIS + Readiness Terminal™ — Data, platform, intelligence, and ongoing utility (DIS cyan and electric blue)
- Three buttons: Take the 5-Minute Orientation, Explore the System, View Current Materials.

**2. The 5-Minute Orientation**
- Seven chapters with Next and Previous buttons and a "Chapter X of 7" counter: The Problem, The System, The Score, What the Terminal Delivers, Why It Is Different, The Readiness Vanguard™, Why Your Role Matters.
- At the end there are three buttons: Explore the full system, View documents and materials, Return to portal.

**3. Explore by Topic (six groups)**
- A. The Market and the Problem
- B. PRSC, DIS and the Score
- C. The Readiness Terminal™ and Audience Value
- D. Data, Trust and Defensibility
- E. Validation and Scale
- F. Governance and Your Role: Why Governance Matters, The Board, Advisors, The Methodology Committee, Quick Reference, Resource Library

The Methodology Committee gets its own screen:
- It opens with: "The Methodology Committee protects the integrity of the PRSC Readiness Standard™ and the PRSC Readiness Score™."
- It lists what the Committee does:
  - reviews methodology and calibration updates
  - governs evidence and verification rules
  - reviews unusual, unresolved, or anomalous scoring matters
  - helps ensure fairness across comparable peer groups
  - keeps the Score separate from commercial pressure
- It closes with: "The Board helps the organizations grow responsibly. Advisors keep the work connected to the market. The Methodology Committee protects the integrity of the Score."

**Relationship visual (replaces the simple arrow map)**
Three columns:

| PRSC | Readiness Terminal™ | DIS |
|---|---|---|
| Defines and governs the Standard | The market-facing product experience | Builds and operates the platform |
| Governs methodology, fairness, and independence | Delivers Score reports, benchmark context, and intelligence views | Builds data pipelines, benchmarks, subscriber tools, and intelligence products |
| Issues the official PRSC Readiness Score™ | Makes complex information understandable and usable | Does not govern the Standard or issue the Score |

Directly beneath it:
- "PRSC sets the rules and issues the Score. DIS builds the technology that makes the Score, data, and benchmark intelligence useful."
- "PRSC protects trust in the Score. DIS makes the information useful."

"PRSC/DIS" is never used as one combined name.

**Other interactive parts**
- Six Score tiles. Each shows only the simple question it answers.
- Audience tabs, each with its boundary note: Teams & Drivers, Series, Sponsors, Agencies & Agents, Manufacturers.
- An availability key: Core / Available as data comes online / Future-state / Optional.
- A six-layer IP stack.
- A benchmark flywheel.

**4. View Current Materials**
- Points to the existing "Your Documents" area without changing it.

## Content source
- Content comes only from the final approved Orientation Hub content specification.
- I won't reuse the old PRSC lightbox copy, the old DIS lightbox copy, outdated Vanguard wording, or earlier platform language unless the final content includes it.
- One content file holds all hub copy, cards, chapters, boundaries, availability labels and visual treatments.
- No invented claims. A market-size figure appears only if it is in the approved content with a validated source.

## Content guardrails
- PRSC governs the Standard and issues the official PRSC Readiness Score™.
- DIS builds and operates the Readiness Terminal™.
- The Terminal delivers the Score, the Commercial Strength Report™, benchmark context, and intelligence experiences. It does not issue the Score.
- PRSC, DIS, and the Terminal do not broker deals, matchmake, make introductions, or take a percentage of sponsorship outcomes.
- Never promise sponsorship, funding, brand interest, a commercial deal, sales, ROI, or financial return.
- Individual Scores are private by default.
- No scoring weights, formulas, calibration logic, data mappings, or other trade-secret mechanics.
- Use "The Readiness Vanguard™" only. Never "Founding Vanguard" or "Founding Members."
- The Readiness Vanguard™ is exactly 25 supply-side slots. Manufacturers are a future-state Terminal audience, not Vanguard participants.
- Audience sections teach members what PRSC and DIS make possible. They are not product onboarding or simulated outside-user experiences.

## Visual tokens
DIS colors:
- Midnight #050B14
- Deep Navy #0B1E2E
- DIS Cyan #00D6FF
- Electric Blue #0066FF
- Silver #C7D2DE
- Gold Accent #F4C542

How they are used:
- PRSC, governance, methodology, the Vanguard and Score integrity use the existing navy and gold.
- DIS, the Terminal, intelligence and data infrastructure use cyan, electric blue, silver and deep navy.
- The relationship screens sit on a navy base with a restrained gold-to-cyan handoff.
- The look stays premium, calm and institutional. It is not a Terminal-style product demo.

## Not changing
- Paperwork, documents, permissions, meetings, the leadership panel and member-specific materials.
- Only the two informational panels are replaced.

## Technical details
- `src/data/orientation-hub.ts` is the structured source of truth for all hub content.
- `src/components/portal/OrientationHub.tsx` holds the view state (hub / guided step / topic / materials) inside the existing dialog shell.
- In `portal.index.tsx`, the two nav entries become one ("The Orientation Hub"). The `prsc` and `dis` panel bodies are replaced by the hub.
- The DIS tokens are added to `src/styles.css`, with no hardcoded hex values in components.
- I'll add the task to `roadmap.md` and check the hub at desktop and phone widths.
