# Automatic BoldSign Signing and Admin Copy: No Changes Needed

Founder decision: keep the current setup.

## What is already built
- When a released, approved signature document is ready for a member:
  - "Review and Sign" creates the BoldSign request from the approved template automatically.
  - It opens the request embedded in the portal, never duplicates it, and BoldSign sends no emails of its own.
- When signing is complete, the portal collects the executed PDF and audit trail and stores them privately. The member's journey then advances.
- One sign-in-required notice per signed document goes to admin@readinessterminal.com. It has no attachment.

## Not changing
- admin@prscstandards.com gets no copy, since it is not an admin login and app emails cannot carry attachments.
- Automatic requests stay limited to TEST accounts until Gate B.

## Remaining dependency
- The approved BoldSign templates still need to be loaded and marked "Approved for signing" in Documents.

No code changes.
