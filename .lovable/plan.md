## Goal
Combine "A Better Way" and "The Solution" into a single, tighter Navy section to reclaim scroll space. No copy or animation changes.

## Structure
1. **Top band — full-width, centered** (current "A Better Way" content, unchanged):
   - Gold eyebrow "A BETTER WAY"
   - Gold gradient hairline
   - Heading + gold italic pullquote

2. **Two-column band below** (current "The Solution" content, unchanged):
   - **Left:** "THE SOLUTION" gold eyebrow + short gold rule + three body paragraphs.
   - **Right:** `ScoreRing` centered, with the six dimension labels arranged around it (3 left, 3 right). Each label is text-only with a **small gold gradient hairline directly beneath it**, matching the reference image. No lucide icons. "illustrative example" caption below the ring.

```text
┌───────────────────────────────────────────────────────────────┐
│                        A BETTER WAY                            │
│                     ── gold hairline ──                        │
│      This isn't another sponsorship program or agency.         │
│  It's the beginning of an independent commercial standard…     │
│      Every major market eventually adopts a trusted standard.  │
│              Motorsport hasn't had one — until now.            │
├───────────────────────────────────────────────────────────────┤
│ THE SOLUTION           │  SIGNAL STRENGTH  ⭘   ACTIVATION …   │
│ ──                     │   ─────           ( 84 )  ─────       │
│ Commercial readiness…  │  AUDIENCE VALUE       MEASUREMENT…    │
│ The PRSC Readiness…    │   ─────                ─────          │
│ A score that tells…    │  PLATFORM ID          RELATIONSHIP…   │
│                        │   ─────                ─────          │
│                        │        illustrative example           │
└───────────────────────────────────────────────────────────────┘
```

## Implementation
- Merge Blocks 4 and 5 into one `<section>`; drop redundant vertical padding.
- Restore text-only `DimLabel` (label + gold gradient hairline, no `Icon`).
- Preserve every string, motion prop, and color token — pure JSX restructure.
- File touched: `src/routes/vanguard.home.tsx`.
