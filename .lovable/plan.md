# Portal copy update (text-only, single pass)

Apply every wording change from the uploaded brief exactly as written (punctuation, ™, en/em dashes). No layout, styling, logic, or structure changes, with one exception the brief requests: "Brighter Opportunities" heading is kept on one line.

## Overview page (Welcome Center)
1. "Your Submission is Private" becomes "Your submission is private".
2. "Brighter Opportunities" heading set to not wrap.
3. Upper-right box body replaced with the new "We've been intentional..." text.

## Your Personal Documents pop-up
4. Heading: "Documents to read, sign, return, and retain."
5. Body: "Your documents are prepared individually. Once your profile is completed, the documents will appear here."

## Orientation Hub
6. Opening paragraph replaced.
- 01 The Problem: four boxes retitled (Teams & Drivers, Series, Sponsors, Manufacturers) with new bodies.
- 02 The System: middle box 2nd bullet, last box first/last bullets, text below boxes, and the three "Why separation matters" bullets.
- 03 The Score: new headline and subline; "The Essentials", "What it does", and "What it is not" bullets replaced.
- 04 Terminal: "BOUNDARY" to "Boundary"; boxes 4, 5 (title + body), 6 updated.
- 05: every "Why this is hard to copy" becomes "Why this is hard to replicate" (menu, headline, anywhere else, matching case); nine card texts/titles updated (Six Readiness Areas, Trademark and Governance Framework); Competitive Context body and bottom quote replaced.
- 06 Vanguard: intro paragraph replaced; four lists replaced; last list renamed "What participants should not expect".

## Site-wide in the portal
- Any score-related "confidential" changed to "private"; other portal "confidential" text also changed to "private" per the brief.

## Afterward
- Click through the Hub chapters and Welcome Center to confirm the text, and report any item that could not be located.

## Technical details
- Most Hub text lives in `src/data/orientation-hub.ts`; Welcome Center and documents pop-up text in `src/routes/_authenticated/portal.index.tsx` and `src/components/portal/MemberDocuments.tsx`. 
- "Brighter Opportunities" gets `whitespace-nowrap` only.
- `rg -i confidential` across portal files to find remaining instances; email/legal-document wording outside the portal is left alone.
