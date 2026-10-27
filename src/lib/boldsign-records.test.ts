import { test } from "node:test";
import assert from "node:assert/strict";
import { verifiedSigningState, boldSignDocumentId } from "./boldsign-records";
test("individual signature is not final multi-signer completion", () => {
  assert.equal(verifiedSigningState({ status: "InProgress", signerDetails: [{ signerEmail: "a@example.test", status: "Completed" }] }, "a@example.test"), "signed");
});
test("final completion requires the intended signer to be verified", () => {
  assert.equal(verifiedSigningState({ status: "Completed", signerDetails: [{ signerEmail: "b@example.test", status: "Completed" }] }, "a@example.test"), "pending");
  assert.equal(verifiedSigningState({ status: "Completed", signerDetails: [{ signerEmail: "a@example.test", status: "Completed" }] }, "a@example.test"), "completed");
});
test("only an exact documentId is extracted; title or substring matching is unavailable", () => {
  assert.equal(boldSignDocumentId("https://app.boldsign.com/sign?documentId=abc"), "abc");
  assert.equal(boldSignDocumentId("https://app.boldsign.com/sign/abc"), null);
});