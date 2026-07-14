
# PRSC Website — Build Plan

Authoritative, institutional 5-page marketing site for the Partnership Readiness Standards Council. Deep navy foundation, gold highlights, serif headlines, sans-serif body — Mastercard/Visa register.

## Brand assets (received)

- `PRSC_Logo_and_tag_BLK.png` — full logo with tagline (use in footer / hero-adjacent contexts on light or navy).
- `PRSC_tag_mission.png` — mission-tag lockup (use in About/Governance).
- `prsc_hero_v3_state1.jpg` — hero dashboard, composite 82 (animation start + static fallback).
- `prsc_hero_v3_state2.jpg` — hero dashboard, composite 84 (animation end target).
- `PRSC_and_DIS_Color_Pallet.png` — reference for exact hex values (PRSC = Guardian side only).

All PNGs/JPGs uploaded via `lovable-assets` CDN pointers; no binaries committed to the repo.

## Stack & foundations

- TanStack Start (existing template), Tailwind v4, shadcn primitives where useful.
- Lovable Cloud enabled for form submissions + notification/confirmation emails.
- Motion for React for the coded hero animation and the scroll-driven "What Is Readiness?" explainer.
- Serif display font: **Cormorant Garamond** (headlines) + sans body: **Inter Tight** — loaded via `<link>` in `__root.tsx`. Small caps / tracking used sparingly for label rows to match brand chrome.
- Full PRSC "Guardian" palette added as semantic oklch tokens in `src/styles.css` (Guardian Navy `#0A1322`, Council Gold `#D4AF37`, Heritage Bronze `#8C6E3B`, Stone Gray `#3B4149`, Ivory `#F2EFE6`, plus Midnight Blue, Regal Blue, Aged Bronze, Warm Pewter, Sandstone, Antique Gold, Copper, Emerald, Burgundy, Light Gold). Every component uses tokens — no hardcoded hex outside `styles.css`.
- Favicon replaced with the PRSC crest (cropped from the logo); default Lovable favicon removed.

## Global chrome

- Sticky nav bar on Guardian Navy: PRSC crest + wordmark left; right-aligned links (The Standard / Governance / Readiness Vanguard) + gold "Request Briefing" CTA.
- Footer on Guardian Navy: 3 columns (full logo-with-tag + tagline / nav / legal) + version tag "PRSC Readiness Standard, Version 1.0, Published 2026" bottom-right.
- Both live in `__root.tsx`; each route defines its own `head()` for title/description/OG.

## Routes

```
src/routes/
  __root.tsx              # nav + footer + brand meta
  index.tsx               # Home
  the-standard.tsx        # The Standard
  governance.tsx          # Governance (+ Board Interest form)
  readiness-vanguard.tsx  # Vanguard (+ Vanguard Interest form)
  request-briefing.tsx    # Briefing form
```

## Home (`/`)

1. **Hero — "The Living Score"** (coded animation, not AI video).
   - Left 40%: 4 trust-signal badges (Independent Standards Body · Neutral Governance · Free Property Assessment · Evidence-Based Methodology) at 60% ivory; serif H1 "The Independent Standard for Partnership Readiness."; subheadline; gold primary CTA "Request a Briefing" + ivory-outline "Learn About the Standard".
   - Right 60%: `<LivingScoreDashboard />` — coded PRSC dashboard rebuilt to match the two keyframe JPGs (icons, silver→gold gradient bars, gold gauge ring, ivory numerals, "Commercially Undeniable" gold label, PRSC crest above the score column).
     - Values animate 88→91, 79→84, 85→85 (hold), 76→80, 81→78 (intentional dip — do not "fix"), 82→86; composite gauge 82→84.
     - 8–10s seamless loop, ease-in-out, silent, autoplay.
     - Reduced-motion / mobile / slow-connection fallback: swap to `prsc_hero_v3_state1.jpg` as `<img>` in the same frame (no layout shift). Detects `prefers-reduced-motion`, viewport < md, and Network Information API `saveData`/slow effective type.
   - Top 15% and left 40% kept clean per layout rules.
2. **"The market is broken" intro** — ivory bg, navy serif H2, body copy verbatim.
3. **3-column pathway cards** — For Properties / For Brands & Investors / For Governance, minimalist gold icons (lucide), links to respective pages.
4. **Scroll-driven "What Is Readiness?" explainer** — 4 pinned steps on Guardian Navy using Motion's `useScroll`/`useTransform`: text fades in left; right side progresses blurred dashboard → dimension bars appear sequentially → gauge rises to 84 → gold "Commercially Undeniable" badge locks in.
5. **Full-width CTA strip** — Midnight Blue, gold CTA to Vanguard.

## The Standard (`/the-standard`)

- Hero: editorial motorsport photo (placeholder generated from prompt) with navy overlay + H1 "The PRSC Readiness Score".
- 2-col "Independence by Design": abstract SVG data-viz (navy + gold) left, copy right.
- 6-card grid "The Six Readiness Dimensions™" on ivory, distinct gold lucide icon per dimension (broadcast tower, users, fingerprint, zap, bar-chart, handshake to match the JPGs), copy verbatim.
- Full-width "Actionable Intelligence": custom SVG Scorecard infographic (score 82, "Commercially Undeniable", benchmark bar) on Midnight Blue.

## Governance (`/governance`)

- Hero: solid Guardian Navy, ivory text; H1 "Governed by the Market. Built for the Market."
- "Why We Built This" text block.
- Three-layer architectural SVG infographic (Governing Body / Methodology Committee / Advisory Network) in bronze/sandstone on navy.
- Board Interest form (Name, Title, Organization, LinkedIn URL, statement of interest) on ivory.

## Readiness Vanguard (`/readiness-vanguard`)

- Hero: motorsport photo with navy overlay; H1 "The Readiness Vanguard".
- 3-col feature: The Credential / The Benchmark / The Legacy.
- Scarcity CTA strip on Midnight Blue.
- Vanguard Interest form (Name, Property/Team, Role, Email, Phone).

## Request a Briefing (`/request-briefing`)

- Minimal ivory hero.
- Detailed form: First/Last Name, Organization, Role, Email, dropdown "How do you interact with the sponsorship market?" (Property / Demand / Channel / Ecosystem), optional message.

## Forms & Cloud backend

- Enable Lovable Cloud.
- One table per form: `briefing_requests`, `board_interest`, `vanguard_interest`. Anonymous `INSERT` policy only (no anon SELECT); explicit `GRANT INSERT TO anon` per public-schema rules; `service_role` full access for admin/edge use.
- One `createServerFn` per form: Zod-validate → insert row → send admin notification email + submitter confirmation via the scaffolded app-email helper.
- React Email templates in PRSC brand (navy header band, gold rule, serif display, ivory body): `briefing-confirmation`, `board-interest-confirmation`, `vanguard-interest-confirmation` + `*-notification` counterparts to admin.
- Admin recipient email address collected as a follow-up before wiring notifications (placeholder env var until provided).
- Success state: inline confirmation panel on the same page (no redirect).

## SEO / metadata

- Per-route `head()` with unique title + description + og:title/og:description/og:type + twitter:card. No og:image until brand social card is provided.
- Semantic HTML, single H1 per page, alt text on all imagery, JSON-LD `Organization` schema on home.

## Assets to generate

- Motorsport editorial hero photography for The Standard and Vanguard (generated at premium quality with a strict editorial prompt; navy overlay will guarantee legibility even if generation is imperfect).
- Abstract data-viz SVGs (Independence by Design, Scorecard, Governance three-layer diagram) — authored as inline React SVG components in `src/components/graphics/`.

## Out of scope

- CMS/blog, member portal, actual scoring engine, payments, multilingual.

## Order of implementation

1. Enable Cloud; add brand tokens, fonts, favicon, and asset pointers (logos, hero keyframes); build nav/footer shell.
2. Home hero (coded dashboard + JPG fallback) → rest of home sections.
3. The Standard, Governance, Vanguard, Briefing pages (structure + copy + SVG infographics + generated photography).
4. Form tables + server functions + email templates + wire submissions.
5. Polish motion timing, mobile passes, SEO tags, accessibility sweep.
