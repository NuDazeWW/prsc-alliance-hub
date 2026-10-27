import { it } from "node:test";
import assert from "node:assert/strict";
import { leadershipPublicationAllowed, linkedProfilePermissions } from "./leadership-publication";
it("linking a person does not approve publication", () => {
  assert.equal(leadershipPublicationAllowed({ publication_scope: "none" }), false);
  assert.equal(leadershipPublicationAllowed({ publication_scope: "portal_members", publication_approved_at: "2026-10-27", publication_approved_by: "admin" }), true);
});
it("no, discuss and missing profile permissions fail closed", () => {
  assert.deepEqual(linkedProfilePermissions({ p1: "yes", p2: "no", p3: "discuss" }), { name: true, affiliation: false, bio: false, photo: false });
  assert.equal(linkedProfilePermissions({ p3: "yes", p4: "yes" }).photo, true);
});