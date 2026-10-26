Plan: Resolve Forum Opt-Out Document Unlocking, Invite NDA Reset, and Profile Email Consistency

1. Forum Opt-Out Document Unlocking (src/lib/journey.ts)

Problem: When an admin invites a member with Forum participation toggled off (participates_in_forum: false), the member progresses along a 4-stage journey (starting at Stage 2). However, lockedDocumentIds currently checks const forumOpen = !blocked && cleared; where cleared is the admin Forum clearance decision. Because opted-out members never receive Forum clearance (cleared remains false), their Stage 2 entity documents stay permanently locked.

Resolution:

Add a forum: boolean = true parameter to lockedDocumentIds(docs, done, entity, cleared = true, forum = true).

When forum === false, bypass the Stage 1 clearance gate:

When forum == true:
  Stage 2 unlocked = (all Stage 1 shared docs completed) AND (Forum cleared)
When forum == false:
  Stage 2 unlocked = true (opens the first Stage 2 entity document immediately)

Propagate member.participates_in_forum across all callers:

src/lib/portal.functions.ts: In the document acknowledgment handler (both the signing gate check and the next-document email alert), pass member.participates_in_forum ?? true.

src/components/portal/MemberDocuments.tsx: Accept participatesInForum?: boolean and pass it to lockedDocumentIds.

src/routes/_authenticated/portal.index.tsx: Pass participatesInForum={member?.participates_in_forum ?? true} to <MemberDocuments />.

src/components/portal/AdminMemberDocuments.tsx: Pass m?.participates_in_forum ?? true so the admin document view reflects the same unlock state.

Add unit test assertions in src/lib/journey.test.ts verifying that an opted-out member with cleared = false has Stage 2 documents unlocked immediately upon release.

2. Invite Form NDA Carryover Reset (src/components/portal/AdminCenter.tsx)

Problem: When an admin successfully dispatches an invitation on /admin/send, the HTML form and inviteDraft state reset, but the separate inviteGov React state (holding nda_confirmed, nda_reference, nda_entities, nda_scope, review_notes, prsc_scope, dis_scope, and conflict_controls) retains the values entered for the previous invitee.

Resolution:

Define a clean initial state:

const EMPTY_INVITE_GOV = {
  nda_confirmed: false,
  nda_reference: "",
  nda_entities: "prsc" as const,
  nda_scope: "",
  review_notes: "",
  prsc_scope: "",
  dis_scope: "",
  conflict_controls: "",
};

Inside onInviteSubmit after await invitePortalMember(...) completes successfully, call setInviteGov(EMPTY_INVITE_GOV) alongside form.reset() and setInviteDraft(emptyInvite).

Keep the validation requirements intact: each new invitation requires explicit NDA verification data before dispatch.

3. Profile Submission Transactional Email Standardization (src/lib/portal.functions.ts)

Problem: In saveMyProfile, the admin alert and member confirmation emails invoke @lovable.dev/email-js directly rather than using the centralized sendPortalEmail helper in src/lib/portal-notify.server.ts. This duplicates configuration and creates divergence from the other email notifications in the system.

Resolution:

Standardize both calls in saveMyProfile to use sendPortalEmail:

Admin submission alert:

await sendPortalEmail(
  ADMIN_EMAIL,
  adminEmailPayload,
  "profile-submitted-admin-alert",
  `profile-submitted-admin-${member.id}-${Date.now()}`
);

Member profile confirmation:

const confirmation = (await loadSystemEmail("profile_received"))({
  first_name: member.first_name?.trim() || "there",
  role: roleLabel,
});
await sendPortalEmail(
  member.email,
  confirmation,
  "profile-submitted-member-confirmation",
  `profile-submitted-member-${member.id}-${Date.now()}`
);

Retain non-blocking try/catch error handling so email provider hiccups never roll back or fail a member's profile submission.

Technical Details & Safety

No database migrations required: All database fields (participates_in_forum, nda_reference, etc.) already exist with proper RLS policies and server validation.

No live emails triggered during testing: Unit and logic tests run against isolated mock data; no real invitations or emails are dispatched during implementation.

Regression coverage: All 77 existing tests in the suite continue to run, augmented by the new test cases in journey.test.ts.

