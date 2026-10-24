# Switch the Outlook calendar to shirley.johnson@prscstandards.com

The Outlook holds feature is built. The calendar currently connected is **shirley.johnson@nudaze.com**, which is not the calendar you want. No test holds have been placed on it.

## Steps
1. Open the Outlook connection card. Choose **New connection** and sign in with **shirley.johnson@prscstandards.com**. This needs a Microsoft 365 or Outlook mailbox for that address.
2. Unlink the nudaze connection from this project so holds can never go to it. It stays in your workspace for other use.
3. Read back the connected account and calendar. If it does not show shirley.johnson@prscstandards.com with permission to write to its calendar, stop and report this as a configuration blocker. There is no fallback to another mailbox.
4. Run the acceptance demonstration on that calendar using test events, dated December 2026 and titled "TEST":
   1. Place three Busy holds.
   2. Confirm one of them.
   3. Check that it stays Busy and the other two are removed.
   4. Cancel a second test set and check it is fully cleaned up.
   5. Check that the portal poll still works without Outlook.
   6. Test the optional executive hold download and record how it behaves.

   Each step that changes your calendar asks for your approval first.
5. Remove every test event afterwards, then report the results.

No member emails or invitations are sent during any of this.
