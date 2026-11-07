import { it } from "node:test";
import assert from "node:assert/strict";
import { leadershipPublicationAllowed, linkedProfilePermissions } from "./leadership-publication";
it("a row is shown to members only when its portal approval is recorded", () => {
  assert.equal(leadershipPublicationAllowed({ publication_scope: "none" }), false);
  assert.equal(leadershipPublicationAllowed({ publication_scope: "portal_members" }), false);
  assert.equal(leadershipPublicationAllowed({ publication_scope: "portal_members", publication_approved_at: "2026-10-27", publication_approved_by: "admin" }), true);
});
it("an approved linked row shows the member's name, organization, bio and photo inside the portal", () => {
  const all = { name: true, affiliation: true, bio: true, photo: true };
  assert.deepEqual(linkedProfilePermissions(null), all);
  assert.deepEqual(linkedProfilePermissions({ version: "communication_v1", profile_handling: "private" }), all);
});
