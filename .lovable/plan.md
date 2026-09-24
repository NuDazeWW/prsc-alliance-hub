# Selective test-data deletion

## What will change
- Remove the “Clear email history” action that deletes every email record.
- Add a selection checkbox to each member row, plus a header checkbox to select or clear the visible member list.
- Add a guarded “Delete selected” action that permanently deletes only the selected member records and their associated test data.
- Show each email-history entry as an individually selectable record, with a separate guarded action to delete only the selected email records.
- Keep existing profile, access, and package controls unchanged.

## Safety and feedback
- Disable deletion actions until at least one record is selected.
- Show the selected count in each deletion action.
- Require a confirmation that states exactly how many records will be deleted.
- Clear selections and refresh the tracker after successful deletion.

## Technical details
- Add an admin-only server action accepting a validated list of email-history record IDs.
- Reuse the existing secure member deletion action for selected members, processing only explicitly selected IDs.
- Preserve preview mode by showing the controls without changing live data.
- Verify the selection states, confirmations, and visible records in the admin preview.
