# Floating "Questions?" FAQ Module

Add a persistent floating pill on every page that opens a near-fullscreen, searchable FAQ overlay containing the ~100 Q&As from the PRSC FAQ document, plus a matching indexable `/faq` page.

## Content

The uploaded document contains 9 categories:

1. About the Score
2. Understanding Your Score
3. Sponsorship & Commercial Value
4. The Readiness Vanguard™
5. Your Data & Privacy
6. Independence & Governance
7. Why Trust PRSC?
8. Cost
9. Getting Started

All questions and answers are extracted verbatim into a single typed data file. No copy is rewritten. Trademark marks (PRSC Readiness Score™, etc.) are preserved as written.

## The floating pill

- Fixed bottom-right, above all content, on every route — including `/vanguard/home` (which has no nav or footer).
- Label: "Questions?" with a small question-mark icon.
- Navy pill with gold border and gold text, subtle hover lift and gold glow — matching the existing CTA treatment.
- Hidden while the overlay is open; overlay closes on Esc, backdrop click, or the X.
- Safe-area aware on mobile so it never collides with browser chrome.

## The FAQ overlay

- Near-fullscreen panel (about 92% viewport height, max width ~5xl, centered) over a dimmed navy backdrop; full-screen on mobile.
- Header: "Frequently Asked Questions", gold rule, close button.
- Sticky search bar directly under the header, autofocused on open.
- Category filter chips ("All" plus the 9 categories) under the search bar, horizontally scrollable on mobile.
- Results are accordion rows: bold question, expands to reveal the answer. One open at a time.
- Live filtering as the user types: matches on question text first, then answer text, ranked question-matches-first, with matched words highlighted in the question. Diacritic/case-insensitive, ignores punctuation, matches all typed words in any order.
- Empty state: "No questions match that search" plus a link to Request a Briefing.
- Result count line ("18 of 100 questions").
- Scroll lock on the body while open; focus trapped in the panel; returns focus to the pill on close.

## The /faq page

- New route rendering the same data grouped by category, with in-page anchor links to each category.
- Own title, description, canonical, OG/Twitter tags, `BreadcrumbList` and `FAQPage` JSON-LD covering all questions.
- Added to `sitemap.xml` and to the footer link list.
- Overlay footer links to `/faq` ("View all questions as a page").

## Technical notes

- `src/data/faq.ts` — extracted array of `{ id, category, question, answer }`, plus the category list. Answers stored as plain strings; any bolded inline terms in the source are kept as plain text.
- `src/components/site/FaqLauncher.tsx` — the pill plus overlay state; rendered once in `src/routes/__root.tsx` outside the `isChrome` gate so it also appears on `/vanguard/home`.
- `src/components/site/FaqSearch.tsx` — search input, chips, filtered accordion list; shared by the overlay and `/faq`.
- Search is a simple in-memory scored filter (no dependency added), memoized on query + category.
- `src/routes/faq.tsx` — the indexable page; `src/routes/sitemap[.]xml.ts` gains the `/faq` entry.
- Uses existing tokens (navy, ivory, gold, stone) — no hardcoded colors.
