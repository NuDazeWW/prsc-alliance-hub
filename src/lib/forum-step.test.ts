import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { forumStep, forumStepText } from "./forum-step";

describe("forum invitee step label", () => {
  it("starts at welcome & profile", () => strictEqual(forumStepText({}), "Step 1 of 4 · Welcome & profile"));
  it("is on documents once released", () => strictEqual(forumStep({ documents_released_at: "2026-11-19" }).n, 2));
  it("moves to clearance review when documents are complete", () => strictEqual(forumStep({ documents_released_at: "a", documents_completed_at: "b" }).label, "Clearance review"));
  it("ends at Forum cleared, including with restrictions", () => {
    strictEqual(forumStep({ forum_clearance_status: "cleared" }).n, 4);
    strictEqual(forumStep({ forum_clearance_status: "cleared_restricted", documents_released_at: "a" }).n, 4);
  });
  it("does not treat an escalated or declined decision as cleared", () => strictEqual(forumStep({ forum_clearance_status: "declined", documents_released_at: "a" }).n, 2));
});
