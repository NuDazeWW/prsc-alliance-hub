# Streamline the Member Welcome Center Header

## What will change

- Remove the member photo/profile icon and its dropdown from the top navigation so the left-panel portrait or initials remains the single identity marker.
- Keep the personalized `Welcome, [Name]` greeting in the top navigation without a dropdown.
- Add a clear **Update Private Profile** link beside the portrait/initials area in the left panel, while retaining the existing role details action.
- Add a small **Sign out** link at the far right of the top navigation.
- Move the entire **Your Next Step** experience out of the left panel and into the top navigation area.
- Rework the four-stage tracker into a compact horizontal timeline with completed, current, and upcoming states.
- Preserve the current status message and relevant action in the compact header area, including document review when documents are ready.
- Remove the old sidebar tracker card to reduce page height and scrolling.

## Responsive behavior

- Desktop: logo, personalized greeting, horizontal progress tracker, and sign-out link share the header without overlap.
- Mobile: the tracker becomes a compact horizontally scrollable row or wraps cleanly beneath the primary header row; the profile update link remains beside the member identity area.
- Keep all progress states, labels, and actions legible at both desktop and mobile widths.

## Technical details

- Extend the shared portal shell with a member-only progress area and a direct sign-out control, without changing the admin header.
- Add a horizontal display mode to the existing status timeline so its status logic remains shared.
- Pass the member's current profile, package, document, and acknowledgement state from the Welcome Center into the header.
- Keep the current private access protections and data behavior unchanged.

## Verification

- Confirm only one member portrait/initials marker is visible.
- Confirm **Update Private Profile** opens the profile page.
- Confirm **Sign out** is visible at the far right and returns to sign-in.
- Confirm all four timeline stages render correctly and only one stage is marked current.
- Check desktop and mobile layouts for clipping, overlap, and excess page scroll.
- Confirm the app builds without errors.
