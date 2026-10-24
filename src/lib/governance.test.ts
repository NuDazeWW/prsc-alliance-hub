import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { roleCombinationTier, roleReviewBlocks, ndaProblem, documentVisible, appointmentProblems, governanceStatusLabel } from "./governance";

const nda = { verified_at: "2026-10-01", verified_by: "admin", reference: "Vault/NDA-001", entities: "prsc", scope: "Forum materials" };
const pending = { nda_verified_at: "2026-10-01", forum_clearance_status: "not_reviewed" };

describe("NDA gate", () => {
  it("blocks invitation with no NDA verification", () => {
    strictEqual(!!ndaProblem({ verified_at: null, verified_by: null, reference: null, entities: null, scope: null }, "prsc"), true);
  });
  it("blocks when the NDA covers only PRSC but the candidate is for both entities", () => {
    strictEqual(!!ndaProblem(nda, "both"), true);
  });
  it("passes a complete PRSC NDA for a PRSC candidate", () => {
    strictEqual(ndaProblem(nda, "prsc"), null);
  });
});

describe("role combinations", () => {
  it("cross-entity mixed roles are blocked pending review, not prohibited", () => {
    strictEqual(roleCombinationTier("both", "board_member").tier, "review");
    strictEqual(roleCombinationTier("prsc", "prsc_board_dis_advisor").tier, "review");
  });
  it("single-entity roles need no review", () => {
    strictEqual(roleCombinationTier("prsc", "board_member").tier, "none");
  });
  it("pending review blocks; approval unblocks", () => {
    strictEqual(roleReviewBlocks("pending"), true);
    strictEqual(roleReviewBlocks("prohibited"), true);
    strictEqual(roleReviewBlocks("approved"), false);
  });
});

describe("Forum material access", () => {
  const prep = { classification: "confidential_forum", superseded_at: null, is_forum_prep: true };
  const forumContent = { classification: "confidential_forum", superseded_at: null, is_forum_prep: false };
  it("NDA-verified invitees open Stage 1 preparation before clearance", () => {
    strictEqual(documentVisible(prep, pending, false), true);
  });
  it("other Forum content stays closed until clearance", () => {
    strictEqual(documentVisible(forumContent, pending, false), false);
    strictEqual(documentVisible(forumContent, { ...pending, forum_clearance_status: "cleared" }, false), true);
  });
  it("no NDA on file means no Forum materials at all", () => {
    strictEqual(documentVisible(prep, { nda_verified_at: null, forum_clearance_status: "cleared" }, false), false);
  });
  it("restricted and secretariat items are never shown to members", () => {
    strictEqual(documentVisible({ ...prep, classification: "restricted_opportunity" }, { ...pending, forum_clearance_status: "cleared" }, false), false);
  });
  it("superseded documents leave the queue but signed copies stay visible", () => {
    const old = { classification: "entity_confidential", superseded_at: "2026-10-20", is_forum_prep: false };
    strictEqual(documentVisible(old, pending, false), false);
    strictEqual(documentVisible(old, pending, true), true);
  });
});

describe("appointment", () => {
  it("cannot be appointed without countersignature and appointment record", () => {
    const p = appointmentProblems({ ndaOk: true, roleReviewOk: true, forumOk: true, trackDocsComplete: true, countersigned: false, appointmentRef: "" });
    strictEqual(p.length, 2);
  });
  it("all verified elements allow appointment", () => {
    deepStrictEqual(appointmentProblems({ ndaOk: true, roleReviewOk: true, forumOk: true, trackDocsComplete: true, countersigned: true, appointmentRef: "Board resolution 2026-04" }), []);
  });
  it("candidates are never labelled appointed before activation", () => {
    strictEqual(governanceStatusLabel({ status: "active", forumCleared: true, stage3Done: true, appointed: { prsc: false, dis: false }, tracks: ["prsc"] }), "Pending Appointment");
  });
});
