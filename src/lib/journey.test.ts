import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { entityAcceptanceComplete, journeyStatus, lockedDocumentIds, type JourneyDoc } from "./journey";

const d = (id: string, stage: number | null, track: JourneyDoc["journey_track"], sort = 0): JourneyDoc => ({ id, journey_stage: stage, journey_track: track, sort_order: sort, created_at: "2026-01-01" });
const docs = [d("f1", 1, "shared", 0), d("f2", 1, "shared", 1), d("p2", 2, "prsc"), d("p3", 3, "prsc"), d("x", 5, "shared"), d("dis2", 2, "dis")];

describe("journey sequencing", () => {
  it("unlocks only the first Forum document at start", () => {
    const locked = lockedDocumentIds(docs, new Set(), "prsc");
    strictEqual(locked.has("f1"), false);
    strictEqual(locked.has("f2"), true);
    strictEqual(locked.has("p2"), true);
  });
  it("one-off records are never locked", () => {
    strictEqual(lockedDocumentIds(docs, new Set(), "prsc").has("x"), false);
  });
  it("entity stages open after the Forum is cleared", () => {
    const locked = lockedDocumentIds(docs, new Set(["f1", "f2"]), "both");
    strictEqual(locked.has("p2"), false);
    strictEqual(locked.has("dis2"), false);
    strictEqual(locked.has("p3"), true);
  });
  it("not fully activated until the admin records activation", () => {
    const done = new Set(["f1", "f2", "p2", "p3"]);
    const prscDocs = docs.filter((x) => x.id !== "dis2");
    strictEqual(journeyStatus(prscDocs, done, "prsc", { prsc: null, dis: null }).label, "Pending Activation");
    strictEqual(journeyStatus(prscDocs, done, "prsc", { prsc: "2026-01-02", dis: null }).label, "Fully Activated");
  });
  it("non-Forum members start in Stage 2 without any Forum documents", () => {
    const entityDocs = docs.filter((x) => x.journey_stage !== 1 && x.id !== "dis2");
    const st = journeyStatus(entityDocs, new Set(), "prsc", { prsc: null, dis: null }, false);
    strictEqual(st.currentStage, 2);
    strictEqual(lockedDocumentIds(entityDocs, new Set(), "prsc").has("p2"), false);
  });
});

describe("forum clearance", () => {
  it("signing every Forum document does not clear Stage 1 without an admin clearance", () => {
    const done = new Set(["f1", "f2"]);
    const st = journeyStatus(docs, done, "prsc", { prsc: null, dis: null }, true, false);
    strictEqual(st.forumCleared, false);
    strictEqual(st.label, "Clearance Pending Review");
    strictEqual(lockedDocumentIds(docs, done, "prsc", false).has("p2"), true);
  });
});

describe("per-entity Stage 3 acceptance", () => {
  const requirements = [d("p2", 2, "prsc"), d("p3", 3, "prsc"), d("d2", 2, "dis"), d("d3", 3, "dis"), d("d3-disclosure", 3, "dis"), d("p4", 4, "prsc"), d("ongoing", 5, "shared")];
  it("does not complete Stage 3 when no requirements exist", () => {
    strictEqual(entityAcceptanceComplete([], new Set(), "both").prsc, false);
    strictEqual(entityAcceptanceComplete([], new Set(), "both").dis, false);
  });
  it("keeps DIS incomplete when its disclosure remains unsigned", () => {
    const result = entityAcceptanceComplete(requirements, new Set(["p2", "p3", "d2", "d3"]), "both");
    strictEqual(result.prsc, true);
    strictEqual(result.dis, false);
  });
  it("requires the applicable earlier orientation but not Stage 4 or ongoing records", () => {
    strictEqual(entityAcceptanceComplete(requirements, new Set(["p3"]), "prsc").prsc, false);
    strictEqual(entityAcceptanceComplete(requirements, new Set(["p2", "p3"]), "prsc").prsc, true);
  });
  it("assigns legacy untracked Stage 3 requirements to the existing first entity track", () => {
    const legacy = [d("accept", 3, null)];
    strictEqual(entityAcceptanceComplete(legacy, new Set(["accept"]), "dis").dis, true);
    strictEqual(entityAcceptanceComplete(legacy, new Set(["accept"]), "both").dis, false);
  });
});
