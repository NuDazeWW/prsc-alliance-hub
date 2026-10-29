import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countersignatureVerified, signingReady, signingUiState, verifiedSigningState } from "./boldsign-records";
import { panelFromHash } from "./portal-panel-hash";
import { PROFILE_ENCOURAGEMENT, profileLinkLabel } from "./profile-encouragement";
import { documentVisible } from "./governance";

const member = "member@example.test";
const signer = (email: string, status: string) => ({ signerEmail: email, status });

describe("BoldSign verified signing state", () => {
  it("is pending until the member's own signer record is completed", () => {
    assert.equal(verifiedSigningState({ status: "InProgress", signerDetails: [signer(member, "NotCompleted")] }, member), "pending");
    assert.equal(verifiedSigningState({ status: "Completed", signerDetails: [signer("someone@else.test", "Completed")] }, member), "pending");
  });

  it("member signed but the document is not completed (countersignature outstanding) is only 'signed'", () => {
    const props = { status: "InProgress", signerDetails: [signer(member, "Completed"), signer("counsel@example.test", "NotCompleted")] };
    assert.equal(verifiedSigningState(props, member), "signed");
    assert.equal(signingUiState("signed"), "signed_awaiting");
  });

  it("completed only when BoldSign reports the document completed", () => {
    assert.equal(verifiedSigningState({ status: "Completed", signerDetails: [signer(member, "Completed")] }, member), "completed");
  });
});

describe("countersignature verification", () => {
  it("requires a completed document, another signer, and every signer finished", () => {
    assert.equal(countersignatureVerified({ status: "Completed", signerDetails: [signer(member, "Completed"), signer("counsel@example.test", "Completed")] }, member), true);
  });
  it("is never inferred from the member's signature alone", () => {
    assert.equal(countersignatureVerified({ status: "Completed", signerDetails: [signer(member, "Completed")] }, member), false);
  });
  it("is false while the document is still in progress", () => {
    assert.equal(countersignatureVerified({ status: "InProgress", signerDetails: [signer(member, "Completed"), signer("counsel@example.test", "Completed")] }, member), false);
  });
  it("is false when any signer has not finished", () => {
    assert.equal(countersignatureVerified({ status: "Completed", signerDetails: [signer(member, "Completed"), signer("counsel@example.test", "NotCompleted")] }, member), false);
  });
  it("does not count a second record for the same member as a countersignature", () => {
    assert.equal(countersignatureVerified({ status: "Completed", signerDetails: [signer(member, "Completed"), signer(member.toUpperCase(), "Completed")] }, member), false);
  });
});

describe("what the member is shown for a signing assignment", () => {
  it("only a completed assignment is complete", () => {
    assert.equal(signingUiState(null), "none");
    assert.equal(signingUiState("preparing"), "in_progress");
    assert.equal(signingUiState("pending"), "in_progress");
    assert.equal(signingUiState("signed"), "signed_awaiting");
    assert.equal(signingUiState("completed"), "completed");
  });
});

describe("signing readiness", () => {
  it("an approved template is ready", () => {
    assert.equal(signingReady({ signing_approved: true, boldsign_template_id: "tpl" }, "m1"), true);
  });
  it("an unapproved document with no recorded BoldSign document is not ready", () => {
    assert.equal(signingReady({ signing_approved: false, boldsign_template_id: "tpl" }, "m1"), false);
    assert.equal(signingReady({ signing_approved: true, boldsign_template_id: null }, "m1"), false);
  });
  it("an administrator-recorded document is ready only for the member it was recorded for", () => {
    const doc = { member_id: "m1", external_url: "https://app.boldsign.com/x?documentId=abc" };
    assert.equal(signingReady(doc, "m1"), true);
    assert.equal(signingReady(doc, "m2"), false);
  });
});

describe("Personal Documents deep link", () => {
  it("opens the single documents experience from #documents only", () => {
    assert.equal(panelFromHash("#documents"), "documents");
    assert.equal(panelFromHash("documents"), "documents");
    assert.equal(panelFromHash("#meetings"), null);
    assert.equal(panelFromHash(""), null);
    assert.equal(panelFromHash(null), null);
  });
});

describe("Executive Profile stays encouraged but non-blocking", () => {
  it("states it is not required for released Forum documents and is not a substitute for a signature", () => {
    assert.match(PROFILE_ENCOURAGEMENT, /strongly encouraged/);
    assert.match(PROFILE_ENCOURAGEMENT, /not required to view released Forum documents/);
    assert.match(PROFILE_ENCOURAGEMENT, /does not replace any confidentiality or signature step/);
  });
  it("links with the right label", () => {
    assert.equal(profileLinkLabel(false), "Complete Your Executive Profile");
    assert.equal(profileLinkLabel(true), "Review Your Executive Profile");
  });
  it("document visibility takes no profile input: a released Forum prep document opens without one", () => {
    const m = { nda_verified_at: "2026-10-01", forum_clearance_status: "not_reviewed", addendum_complete: true };
    assert.equal(documentVisible({ classification: "confidential_forum", superseded_at: null, is_forum_prep: true }, m, false), true);
  });
  it("the profile is not an alternative to the confidentiality signature", () => {
    const noNda = { nda_verified_at: null, forum_clearance_status: "cleared", addendum_complete: true };
    assert.equal(documentVisible({ classification: "confidential_forum", superseded_at: null, is_forum_prep: true }, noNda, false), false);
    const noAddendum = { nda_verified_at: "2026-10-01", forum_clearance_status: "cleared", addendum_complete: false };
    assert.equal(documentVisible({ classification: "confidential_forum", superseded_at: null, is_forum_prep: true, forum_role: "protocol" }, noAddendum, false), false);
  });
});
