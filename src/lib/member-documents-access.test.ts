import { it } from "node:test";
import assert from "node:assert/strict";
import { shouldLoadMemberDocuments } from "./member-documents-access";

it("an incomplete optional executive profile does not prevent loading released requirements", () => {
  assert.equal(shouldLoadMemberDocuments({ member: { id: "fictional" }, hasProfile: false }), true);
});
it("document loading still requires a member session", () => {
  assert.equal(shouldLoadMemberDocuments({ member: null, hasProfile: true }), false);
  assert.equal(shouldLoadMemberDocuments(null), false);
});