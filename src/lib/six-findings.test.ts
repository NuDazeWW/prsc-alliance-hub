import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { addendumSatisfied, documentVisible, grantCovers, stage1ClearanceProblems } from "./governance";
import { activationProblem } from "./invitation-activation";
import { confirmationKey, pollWordingWarning, recipientsToConfirm } from "./meeting-confirmations";
import { disclosureHash, signingAction } from "./signing-preparation";
import { questionAccessBlock } from "./executive-questions";
import { SIGNING_NOTICE_ADMIN, signingNoticeKey } from "./signed-copy-policy";

const addendum = { id: "add", forum_role: "addendum", superseded_at: null, signing_approved: true, version_label: "v1", countersignature_required: false, member_id: null };
const done = { document_id: "add", status: "completed", version_label: "v1", countersigned_at: null };
const cleared = { nda_verified_at: "2026-10-01", forum_clearance_status: "cleared", participates_in_forum: true };
const protocol = { id: "p", classification: "confidential_forum", superseded_at: null, is_forum_prep: true, journey_stage: 1, forum_role: "protocol" };
const brief = { id: "b", classification: "restricted_opportunity", superseded_at: null, is_forum_prep: false, journey_stage: 1, forum_role: "restricted_brief", version_label: "v1.2" };

describe("Fix 1: Addendum gates protected reads", () => {
  it("is satisfied only by a completed BoldSign execution of the approved version", () => {
    strictEqual(addendumSatisfied([addendum], [done]), true);
    strictEqual(addendumSatisfied([addendum], [{ ...done, status: "signed" }]), false);
    strictEqual(addendumSatisfied([addendum], [{ ...done, version_label: "v0" }]), false);
    strictEqual(addendumSatisfied([{ ...addendum, signing_approved: false }], [done]), false);
    strictEqual(addendumSatisfied([{ ...addendum, superseded_at: "2026-10-02" }], [done]), false);
    strictEqual(addendumSatisfied([addendum], []), false, "a portal acknowledgment never counts");
  });
  it("requires a countersignature only when the document is marked for one", () => {
    const cs = { ...addendum, countersignature_required: true };
    strictEqual(addendumSatisfied([cs], [done]), false);
    strictEqual(addendumSatisfied([cs], [{ ...done, countersigned_at: "2026-10-03" }]), true);
  });
  it("binds to the member the Addendum is assigned to", () => {
    strictEqual(addendumSatisfied([{ ...addendum, member_id: "other" }], [done], "me"), false);
  });
  it("denies the same member before signing and allows after", () => {
    strictEqual(documentVisible(protocol, { ...cleared, addendum_complete: false }, false), false);
    strictEqual(documentVisible(protocol, { ...cleared, addendum_complete: true }, false), true);
  });
  it("keeps the Addendum itself readable for signing", () => {
    strictEqual(documentVisible({ ...protocol, id: "add", forum_role: "addendum" }, { ...cleared, addendum_complete: false }, false), true);
  });
});

describe("Fix 2: Restricted brief needs an individual, exact-version grant", () => {
  const m = { ...cleared, addendum_complete: true };
  const grant = { document_id: "b", version_label: "v1.2", revoked_at: null };
  it("denies without a grant", () => strictEqual(documentVisible(brief, { ...m, grants: [] }, false), false));
  it("allows with an active grant", () => strictEqual(documentVisible(brief, { ...m, grants: [grant] }, false), true));
  it("denies a revoked grant", () => strictEqual(documentVisible(brief, { ...m, grants: [{ ...grant, revoked_at: "2026-10-05" }] }, false), false));
  it("denies a grant for another document", () => strictEqual(documentVisible(brief, { ...m, grants: [{ ...grant, document_id: "x" }] }, false), false));
  it("never carries to a new version or a superseded one", () => {
    strictEqual(grantCovers([grant], { id: "b", version_label: "v2.0", superseded_at: null }), false);
    strictEqual(grantCovers([grant], { id: "b", version_label: "v1.2", superseded_at: "2026-10-06" }), false);
  });
  it("closes when clearance is lost", () => strictEqual(documentVisible(brief, { ...m, forum_clearance_status: "escalated", grants: [grant] }, false), false));
  it("Executive Questions need the same grant (briefing visibility)", () => {
    strictEqual(questionAccessBlock({ status: "active", ...cleared }, false), "The strategic briefing has not been individually authorized for you yet");
    strictEqual(questionAccessBlock({ status: "active", ...cleared }, true), null);
  });
});

describe("Fix 7: admin-only Forum items and Forum opt-outs", () => {
  it("never shows Secretariat Controls or the Facilitator Run of Show to members", () => {
    for (const r of ["secretariat_controls", "facilitator_run_of_show"])
      strictEqual(documentVisible({ ...protocol, classification: "general_orientation", forum_role: r }, { ...cleared, addendum_complete: true }, false), false);
  });
  it("gives opt-outs nothing until an entity release", () => {
    const optOut = { ...cleared, participates_in_forum: false, addendum_complete: true };
    const entityDoc = { id: "e", classification: "entity_confidential", superseded_at: null, is_forum_prep: false, journey_stage: 5 };
    strictEqual(documentVisible(entityDoc, { ...optOut, has_entity_release: false }, false), false);
    strictEqual(documentVisible(entityDoc, { ...optOut, has_entity_release: true }, false), true);
    strictEqual(documentVisible(protocol, { ...optOut, has_entity_release: true }, false), false);
  });
});

describe("Fix 3: activation is bound to the invitation", () => {
  const now = 1_800_000_000;
  const member = { user_id: "u1", email: "test1@example.com", status: "invited", first_access_at: null };
  const link = [{ method: "otp", timestamp: now - 60 }];
  it("accepts a fresh invitation-link session for the invited account", () =>
    strictEqual(activationProblem({ userId: "u1", sessionEmail: "Test1@example.com", amr: link, nowSeconds: now, member }), null));
  it("refuses an unrelated password session (e.g. admin already signed in)", () =>
    strictEqual(activationProblem({ userId: "u1", sessionEmail: "test1@example.com", amr: [{ method: "password", timestamp: now - 60 }], nowSeconds: now, member }), "This session did not come from a valid invitation link"));
  it("refuses a different account", () =>
    strictEqual(activationProblem({ userId: "admin", sessionEmail: "admin@x.com", amr: link, nowSeconds: now, member: null }), "No invitation exists for this account"));
  it("refuses a link session older than 24 hours", () =>
    ok(activationProblem({ userId: "u1", sessionEmail: "test1@example.com", amr: [{ method: "otp", timestamp: now - 25 * 3600 }], nowSeconds: now, member })));
  it("refuses a used invitation", () =>
    strictEqual(activationProblem({ userId: "u1", sessionEmail: "test1@example.com", amr: link, nowSeconds: now, member: { ...member, status: "active" } }), "This invitation has already been used"));
});

describe("Fix 4: clearance needs prerequisites plus a separate review", () => {
  const all = { ndaVerified: true, addendumComplete: true, incompleteStage1: [], conflictSigned: true, conflictReviewDecision: "approved" };
  it("allows when everything is complete", () => deepStrictEqual(stage1ClearanceProblems(all), []));
  it("blocks without the Addendum", () => strictEqual(stage1ClearanceProblems({ ...all, addendumComplete: false }).length, 1));
  it("blocks with incomplete Stage 1 items", () => strictEqual(stage1ClearanceProblems({ ...all, incompleteStage1: ["Executive Pre-Read"] })[0], "Stage 1 items incomplete: Executive Pre-Read"));
  it("blocks without an approved conflict review", () => {
    strictEqual(stage1ClearanceProblems({ ...all, conflictReviewDecision: null }).length, 1);
    strictEqual(stage1ClearanceProblems({ ...all, conflictReviewDecision: "hold" }).length, 1);
  });
});

describe("Fix 5/8: signing preparation", () => {
  const doc = { action: "boldsign", signing_approved: true, boldsign_template_id: "tpl", superseded_at: null, version_label: "v1" };
  it("starts once, then resumes the same session", () => {
    deepStrictEqual(signingAction(doc, null, null), { kind: "start" });
    deepStrictEqual(signingAction(doc, { status: "pending", version_label: "v1", boldsign_document_id: "bs1" }, null), { kind: "resume" });
    strictEqual(signingAction(doc, { status: "preparing", version_label: "v1", boldsign_document_id: "preparing:x" }, null).kind, "block");
  });
  it("starts from the administrator-approved template for any authorized member, with no separate launch gate", () => {
    strictEqual(signingAction(doc, null, null).kind, "start");
  });
  it("never auto-creates from an unapproved template", () => {
    strictEqual(signingAction({ ...doc, signing_approved: false }, null, null).kind, "manual");
  });
  it("freezes disclosures: changed answers cannot reuse the signed version", async () => {
    const h1 = await disclosureHash({ conflict_answer: "changed", conflict_details: "Board seat at X" });
    const h2 = await disclosureHash({ conflict_answer: "changed", conflict_details: "Board seat at Y" });
    strictEqual(h1, await disclosureHash({ conflict_answer: "changed", conflict_details: " Board seat at X " }));
    ok(h1 !== h2);
    strictEqual(signingAction(doc, { status: "pending", version_label: "v1", boldsign_document_id: "bs1", disclosure_hash: h1 }, h2).kind, "block");
  });
  it("notifies only the designated administrator, once per assignment", () => {
    strictEqual(SIGNING_NOTICE_ADMIN, "admin@readinessterminal.com");
    strictEqual(signingNoticeKey("a1"), signingNoticeKey("a1"));
  });
});

describe("Fix 6: meeting confirmations per meeting and recipient", () => {
  it("does not resend to recipients already confirmed for this slot", () =>
    deepStrictEqual(recipientsToConfirm(["a", "b"], [{ member_id: "a", status: "sent" }]), ["b"]));
  it("retries failed or uncertain sends with the same key", () => {
    deepStrictEqual(recipientsToConfirm(["a", "b"], [{ member_id: "a", status: "failed" }, { member_id: "b", status: "sending" }]), ["a", "b"]);
    strictEqual(confirmationKey("p", "s", "a"), confirmationKey("p", "s", "a"));
  });
  it("a changed slot gets a new key", () => ok(confirmationKey("p", "s1", "a") !== confirmationKey("p", "s2", "a")));
  it("warns on confidential poll wording", () => {
    ok(pollWordingWarning("Jared NASCAR strategy session"));
    strictEqual(pollWordingWarning("Inaugural Forum", "Ninety-minute virtual session"), null);
  });
});
