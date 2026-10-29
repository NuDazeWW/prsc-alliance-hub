import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { documentProgress } from "./document-progress";
import { lockReasonFor } from "./journey";

const jd = (id: string, stage: number | null, track: "shared" | "prsc" | "dis" | null = null) => ({
  id,
  journey_stage: stage,
  journey_track: track,
  sort_order: 0,
  created_at: "2026-01-01",
});

describe("document progress header", () => {
  it("explains the reported '0 of 1 complete' with two files: one required action plus one reference file", () => {
    const p = documentProgress(
      [jd("confidentiality", 1), jd("integration-test", null)],
      [],
      new Set(),
    );
    assert.equal(p.requiredLabel, "Required actions: 0 of 1 complete");
    assert.equal(p.alsoShownLabel, "Also shown, not counted: 1 reference or one-off file");
  });

  it("keeps historical test records out of the count and says so", () => {
    const p = documentProgress(
      [jd("c", 1)],
      [{ id: "old-test" }, { id: "old-2" }],
      new Set(["old-test"]),
    );
    assert.deepEqual(p.required, { done: 0, total: 1 });
    assert.equal(p.alsoShownLabel, "Also shown, not counted: 2 historical records");
  });

  it("counts only completed required actions, never completed reference files", () => {
    const p = documentProgress([jd("a", 1), jd("b", 1), jd("ref", 5)], [], new Set(["a", "ref"]));
    assert.deepEqual(p.required, { done: 1, total: 2 });
    assert.equal(p.requiredLabel, "Required actions: 1 of 2 complete");
  });

  it("shows no required-action line when none are assigned", () => {
    const p = documentProgress([jd("ref", null)], [], new Set());
    assert.equal(p.requiredLabel, null);
    assert.equal(p.alsoShownLabel, "Also shown, not counted: 1 reference or one-off file");
  });

  it("combines labels with singular and plural wording", () => {
    const p = documentProgress([jd("a", 1), jd("r1", null), jd("r2", 5)], [{ id: "h" }], new Set());
    assert.equal(
      p.alsoShownLabel,
      "Also shown, not counted: 2 reference or one-off files · 1 historical record",
    );
  });
});

describe("why a document is locked", () => {
  it("an unreleased entity track is 'not released', not a sequence problem", () => {
    assert.equal(
      lockReasonFor(jd("x", 2, "prsc"), "prsc", { prsc: false, dis: false }),
      "not_released",
    );
  });
  it("a released track that is waiting on an earlier document is 'prior action'", () => {
    assert.equal(
      lockReasonFor(jd("x", 3, "prsc"), "prsc", { prsc: true, dis: false }),
      "prior_action",
    );
  });
  it("Forum (Stage 1) documents are always sequence-locked", () => {
    assert.equal(lockReasonFor(jd("x", 1), "both", { prsc: false, dis: false }), "prior_action");
  });
  it("each entity track is judged on its own release", () => {
    const released = { prsc: true, dis: false };
    assert.equal(lockReasonFor(jd("p", 2, "prsc"), "both", released), "prior_action");
    assert.equal(lockReasonFor(jd("d", 2, "dis"), "both", released), "not_released");
  });
});
