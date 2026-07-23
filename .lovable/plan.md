
## Overview

Publish the full PRSC Readiness Standard v1.0 as a standalone document-style page at `/standard-v1`. Restructure the sitewide nav to the five-item structure. Add a placeholder `/certification` page. Link from the existing `/the-standard` to the new full-text document.

The attached DOCX is the single source of truth for all copy on `/standard-v1`.

---

## 1. New route: `/standard-v1`

Create `src/routes/standard-v1.tsx`. This page is a long-form document rendering of the Standard.

**Structure (matches your spec exactly):**

1. Header band (navy) — gold eyebrow "PARTNERSHIP READINESS STANDARDS COUNCIL", H1 "The PRSC Readiness Standard", italic gray subhead, gold version badge, right-aligned gold-outlined "Download PDF" button → `#download`.
2. Sticky anchor nav (navy bg, white text, gold active) with the 10 section links. Collapses to a horizontal scroll strip on mobile.
3. Section 1 — Purpose and Governing Philosophy: three paragraphs + styled pull quote (left gold border, italic, `#FDF6E3` bg).
4. Section 2 — Scope and Applicability: intro paragraph + six-row entity table (navy header, alternating rows).
5. Section 3 — The Six Readiness Dimensions™: six cards (white bg, subtle shadow, left gold border). Title in navy bold, two intro paragraphs body, third paragraph (what is evaluated) in smaller italic gray.
6. Section 4 — Scoring Philosophy: body paragraphs + five-tier score table (navy header, alternating rows, centered bold Score Range, bold navy Tier, regular Interpretation).
7. Section 5 — Readiness Drift™: three paragraphs, clean body.
8. Section 6 — The Evidence Standard: body paragraphs + styled pull quote (`#FDF6E3` bg).
9. Section 7 — Version Governance: intro paragraph + five commitments as definition list (bold navy term, body definition).
10. Section 8 — What Is Not Published: intro paragraph + seven bullets with gold markers + closing italic gray paragraph.
11. Section 9 — Governance and Independence: three paragraphs. "Decision Intelligence Systems, Inc." as plain text. `readinessterminal.com` as external link (`target="_blank"`, `rel="noopener"`).
12. Section 10 — Contact: two paragraphs. `prscstandards.com` as link (`href="#"`), "Request a Briefing" as gold link → `/request-briefing`.
13. Footer band (navy): copyright, TM notice, version line, centered small text.

Copy comes verbatim from the parsed DOCX. All headings, table cells, and body text mirror the source.

**Head metadata:** unique title "The PRSC Readiness Standard v1.0 — Full Document", meta description, canonical `https://prscstandards.com/standard-v1`, OG + Twitter tags, BreadcrumbList JSON-LD (Home → The Standard → Standard v1.0).

**Chrome:** the page uses the sitewide `SiteNav` + `SiteFooter` (per restructured nav below). The document's own header band and footer band render inside `<main>` — they are page content, not global chrome. This keeps SEO and consistency with the rest of the site.

---

## 2. New route: `/certification`

Create `src/routes/certification.tsx`. Minimal placeholder:

- Full-viewport navy section
- Gold small-caps eyebrow "PRSC CERTIFICATION"
- Serif H1 "Coming Soon"
- Body line in gold: "Certification criteria and application process — launching Q4 2026."
- Head metadata: title "Certification — PRSC", meta description matching the placeholder copy, canonical, OG/Twitter.

---

## 3. Sitewide nav restructure

Edit `src/components/site/SiteNav.tsx`:

Replace the current `links` array with five items in this order:

```
{ to: "/the-standard",     label: "The Standard" }
{ to: "/governance",       label: "Governance" }
{ to: "/certification",    label: "Certification" }
{ to: "/readiness-vanguard", label: "Vanguard" }
{ to: "/request-briefing", label: "Request a Briefing" }
```

Notes:
- Keep the existing route URLs (`/readiness-vanguard`, `/request-briefing`). Only labels change.
- Nav on `/vanguard/*` remains hidden (existing behavior in `__root.tsx`).
- Mobile drawer picks up the same array — no other changes needed.

Edit `src/components/site/SiteFooter.tsx`:

Update the "The Standard" footer column to match the new labels (The Standard, Governance, Certification, Vanguard, Request a Briefing) so nav + footer stay in sync.

---

## 4. Link from `/the-standard` to `/standard-v1`

In `src/routes/the-standard.tsx`, add a single "Read the Full Standard →" link. Placement: at the end of the "Framework" section (right after the six-dimension grid) as a right-aligned gold text link using the same shimmer/underline treatment as other in-page anchor links. No new section, no button — a text link, so it doesn't disturb the current layout.

---

## 5. Files touched

**New:**
- `src/routes/standard-v1.tsx`
- `src/routes/certification.tsx`

**Modified:**
- `src/components/site/SiteNav.tsx` (five-item nav, both desktop + mobile)
- `src/components/site/SiteFooter.tsx` (footer link column)
- `src/routes/the-standard.tsx` ("Read the Full Standard →" link)

**Not touched:** `/governance`, `/readiness-vanguard`, `/request-briefing`, `/vanguard/*`, `__root.tsx` chrome logic.

---

## Technical notes (design tokens)

Use existing tokens where they match your color spec:
- Navy `#0A1322` → `bg-navy` (already exact)
- Gold `#D4AF37` → `text-gold`, `border-gold` (already exact)
- Ivory `#F2EFE6` → `bg-ivory` (close to your `#F5F5F0` off-white; already the sitewide light background)
- Pull-quote bg `#FDF6E3` and body near-black `#1A1A1A` → applied inline via arbitrary Tailwind values (`bg-[#FDF6E3]`, `text-[#1A1A1A]`) since they're one-off document-specific tones and don't warrant new tokens.
- Fonts already loaded sitewide: Cormorant Garamond (display) + Inter Tight (body). Inter Tight satisfies your "Inter or similar" requirement — no new font needed.

Sticky anchor nav uses `position: sticky; top: 0` inside the scroll container with a scroll-margin offset on each section for correct anchor jumps. `scroll-behavior: smooth` is already set globally in `styles.css`.
