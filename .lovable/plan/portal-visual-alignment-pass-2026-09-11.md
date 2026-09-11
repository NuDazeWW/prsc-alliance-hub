# Portal visual alignment pass

## Goal
Bring the existing private board and advisor center into close visual alignment with the supplied reference without changing its content, authentication, data, forms, routes, or interactions.

## Implementation
- Remove the centered desktop shell and establish a full-width header, a roughly 20/80 sidebar-to-content split, and a full-width footer.
- Correct header and footer brand-lockup scale, navigation geometry, account separator, borders, and spacing using the existing approved logo assets and brand tokens.
- Rebalance the sidebar’s typography, avatar, navigation rows, next-step panel, dividers, and help area in normal document flow.
- Recompose the hero with reference-like scale, text hierarchy, CTA placement, image crop, edge blending, statement placement, and lower caption.
- Resize and align the three overview cards, then rebuild the perspective panel’s two-column balance and subtle decorative line treatment.
- Retain and visually integrate the standards, intelligence, next-steps, and questions panels below the perspective panel.
- Preserve the existing mobile navigation behavior while adding clean tablet/mobile reflow for the sidebar, hero, cards, panels, and footer.

## Technical details
- Limit changes to `PortalShell` and the portal home presentation markup/classes, adding narrowly scoped semantic CSS only if utility classes cannot express the required image blending or decorative treatment.
- Keep all current text, links, handlers, queries, permissions, and backend calls unchanged.
- Validate at the current 1797×1141 application viewport, then tablet and mobile widths with browser screenshots, overflow checks, and console/runtime inspection.
