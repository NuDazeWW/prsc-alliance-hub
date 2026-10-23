# Editable private profile and photo circle

## What's wrong today
Once a member has submitted their profile, "Update Private Profile" opens a read-only "Your profile, on file" summary. It has no way to change anything, and it tells the member to email info@ instead.

## Changes

1. **Update Private Profile actually edits**
   - The "Update Private Profile" link in the left navigation opens the profile in edit mode, starting at Stage 01 with all saved answers filled in.
   - Members can move through the stages, change anything, and press **Save changes**. Their profile stays marked as received, so they don't have to submit it again and their status and timeline stay the same.
   - The "Your profile, on file" summary (from "Review Your Profile") gets an **Edit profile** button that opens the same edit mode.
   - The admin activity log records a "Profile updated" entry, so the admin can see when something changed.
   - The "Contact info@ to make changes" line on the summary is removed.

2. **Pencil icon on the photo circle**
   - The photo or initials circle in the left navigation gets a small gold pencil badge in the bottom-right corner.
   - Clicking the circle or the pencil opens a file picker. The same rules as the profile page apply: images only, up to 5 MB.
   - After upload, the new photo replaces the initials right away. It also updates on the profile page and on Our Leadership Team.
   - You can do this at any time, before or after submitting the profile.
   - In admin "View portal as member" mode, the pencil is hidden and the circle can't be clicked, so it stays read-only.

## Technical details
- `portal.profile.tsx`: add `editing` state. A `?edit=1` search param, or the Edit button, sets the stage to 1 when `submitted_at` exists. Saving while submitted calls `saveMyProfile` with `submit:false` and keeps the user on the page with a "Changes saved" status. The last stage shows "Save changes" in place of "Submit profile".
- `saveMyProfile`: when the profile already has `submitted_at`, never reset `current_stage` below 5 or clear `submitted_at`. Insert a `profile_updated` activity row.
- Nav link in `portal.index.tsx` points to `/portal/profile?edit=1`.
- Pull the upload logic out of `HeadshotField` into a shared hook (`useHeadshotUpload`) so the nav circle and the profile page use the same code. Upload goes to the `member-headshots` bucket, then `setMyHeadshot`, then the `my-headshot` and leadership queries are refreshed.
