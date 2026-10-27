import { it } from "node:test";
import assert from "node:assert/strict";
import { afterOrientation } from "./first-login";
it("orientation leads to availability when an active poll exists", () => {
  assert.equal(afterOrientation([{ status: "open" }]), "meetings");
});
it("orientation goes directly to profile when no active poll exists", () => {
  assert.equal(afterOrientation([]), "profile");
  assert.equal(afterOrientation([{ status: "confirmed" }, { status: "cancelled" }]), "profile");
});