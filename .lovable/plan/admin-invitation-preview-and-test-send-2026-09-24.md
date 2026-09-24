# Admin invitation preview and test-send

## Goal
Add a safe review step to **Invite a member** so the administrator can inspect and test the exact invitation before creating a member or sending the real invitation.

## What will change
- Convert the invitation fields to controlled values so the same entered name, email, PRSC/DIS/Both designation, and Board Member/Advisor role drive preview, test, and final send.
- Add **Preview invitation** beside **Send invitation**. It will open the real branded invite design in a large modal using a clearly marked non-working sample access link.
- Show a compact verification summary above the preview: capitalized greeting, selected company wording, selected role, displayed logos, recipient address, and linked `info@readinessterminal.com` contact.
- Add **Send test to admin** inside the preview. The test will be delivered only to `admin@readinessterminal.com`, while rendering the invitee details entered in the form.
- Keep **Send invitation** as the only action that creates or updates a member and generates a live invitation link. Previewing or test-sending will not modify member records or invitation history.

## Safety and behavior
- Protect test sending with the existing signed-in administrator check; the browser cannot choose another test recipient.
- Use Lovable’s verified `notify.readinessterminal.com` sender and the existing `no-reply@readinessterminal.com` / `info@readinessterminal.com` identities.
- Reuse one invitation render path for auth invites, previews, and tests so capitalization, entity copy, logos, links, and future edits cannot drift.
- Validate the required invitation fields before preview or test-send, and show clear success/error feedback without closing the preview.
- Disable test delivery in the unsigned preview environment; visual preview remains available there.

## Validation
- Verify PRSC, DIS, and Both previews show only the appropriate logos and wording.
- Verify lowercase/mixed-case names render capitalized and the contact line opens an email to `info@readinessterminal.com`.
- Verify test delivery reaches only the administrator and does not create an invitee account or member row.
- Check desktop and mobile modal layout, the current build signal, and the live admin interaction flow.
