import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertNdaRecipient,
  assertInviteIdentity,
  freshInviteGovernance,
} from "./invitation-evidence";
test("A's NDA attestation cannot verify B", () => {
  assert.throws(() => assertNdaRecipient("b@example.test", "a@example.test"));
  assert.doesNotThrow(() => assertNdaRecipient("A@example.test", " a@example.test "));
});
test("new invitation clears verification, scope, reference and review state", () => {
  const a = freshInviteGovernance();
  a.nda_confirmed = true;
  a.nda_reference = "A";
  a.nda_entities = "prsc";
  a.review_notes = "A";
  const b = freshInviteGovernance();
  assert.equal(b.nda_confirmed, false);
  assert.equal(b.nda_reference, "");
  assert.equal(b.nda_entities, "");
  assert.equal(b.review_notes, "");
});
test("a returned auth identity cannot rebind an existing member", () => {
  assert.throws(() => assertInviteIdentity("a@example.test", "b@example.test", null, "u1"));
  assert.throws(() => assertInviteIdentity("a@example.test", "a@example.test", "u1", "u2"));
  assert.doesNotThrow(() => assertInviteIdentity("a@example.test", "a@example.test", "u1", "u1"));
});
