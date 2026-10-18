# Orientation Hub opening screen polish

## Card images
- **PRSC card:** the real PRSC crest, the same one used on the homepage and in the site menu.
- **PRSC Readiness Score™ card:** the gold Score gauge picture used for the homepage Score. It shows no real participant score.
- **DIS + Readiness Terminal™ card:** the DIS logo you just uploaded.
  - Its background is a fake grey-and-white checkerboard, not a real transparent one. I'll remove it so only the bird, the rings and the lettering remain, then trim and resize the logo to fit the card.
  - Its "DECISION INTELLIGENCE SYSTEMS" line is dark navy and would disappear on the dark card. I'll lighten that line to silver so it reads, and keep the bird and the metallic "DIS" as they are.
  - I'll check the result against the actual card before using it. If the cleanup damages the logo, I'll stop and tell you.
- All three images get the same height, so the cards line up.

## Card styling (illumination and 3D)
- A soft inner glow from the top-left corner, plus a thin bright line along the top edge for a raised, beveled look.
- A layered drop shadow, with gold glow on the PRSC and Score cards and a cyan glow on the DIS card.
- A gentle light sweep across each card, like the one on the buttons. It stays off for anyone who has reduced motion turned on.
- On hover, a card lifts slightly and its glow brightens.

## Bottom buttons
- Taller and wider, with a larger glow.
- "Take the 5-Minute Orientation" stays solid gold. "Explore the System" and "View Current Materials" keep their outlined gold style but get a stronger glow and edge highlight, so they stand out against the navy.

## Resource Library and links
- Resource Library: the ten titles stay, each marked "Coming soon", with a short note that materials will be added here.
- Links to the pages that already exist on your site:
  - **PRSC Readiness Score™:** the Standard page
  - **Governance:** the Governance page, plus the Charter and Written Standards pages
  - **The Readiness Vanguard™:** the Vanguard page
- These links appear on the View Current Materials screen and on the matching chapters (What PRSC Is, the Score chapters, Why the Score Can Be Trusted, The Readiness Vanguard™). They open in a new tab so members don't lose their place in the hub.

## Technical details
- Remove the DIS background with an image edit, check the result, then save it as a project asset (`dis-logo-hub.png`).
- Add reusable `hub-card` and `hub-card-dis` styles to `src/styles.css`, built on the existing color tokens. No hardcoded colors in components.
- Increase the size of the `cta-glow` buttons inside the hub only.
- Add an optional `links` field to topics in `src/data/orientation-hub.ts`, and a "coming soon" marker for Resource Library items.
- Swap the visuals in `RoleVisual` in `OrientationHub.tsx` for image tags.
- Check the opening screen on a desktop and a phone screen.
