## Change

In `src/routes/index.tsx`, move the `TRUST_BADGES` row out of the left column so it spans the full hero width and distributes evenly across both sections — while keeping it on the same vertical line it currently sits on.

## How

1. Remove the current badges block (the `<div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">...</div>`) from inside the left `max-w-xl` column.
2. Add it as a new full-width row inside the hero container, positioned so it sits at the same vertical position it currently occupies (aligned with where it renders today under the sub-copy). Implementation: make the hero grid a subgrid/row where the badges are a `col-span-2` element placed after the two columns, using `justify-between` (instead of `gap-x-4`) so the four badges stretch evenly edge-to-edge across the full `max-w-7xl` width.
3. Keep every other element — crest, headline, paragraphs, CTAs, and the `LivingScoreDashboard` — exactly where it is. No spacing, size, color, or copy changes anywhere else.

## Result

The four trust badges (Independent Standards Body • Neutral Governance • Free Readiness Score™ • Evidence-Based Methodology) render on one line, evenly distributed across the full width of the hero (spanning both the copy column and the dashboard column), with the divider pips between them preserved.
