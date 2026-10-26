import { describe, it } from "node:test";
const none = { released: { prsc: false, dis: false } };
const both = { released: { prsc: true, dis: true } };
import { strictEqual } from "node:assert";
import { entityAcceptanceComplete, journeyStatus, lockedDocumentIds, type JourneyDoc } from "./journey";

const d = (id: string, stage: number | null, track: JourneyDoc["journey_track"], sort = 0): JourneyDoc => ({ id, journey_stage: stage, journey_track: track, sort_order: sort, created_at: "2026-01-01" });
const docs = [d("f1", 1, "shared", 0), d("f2", 1, "shared", 1), d("p2", 2, "prsc"), d("p3", 3, "prsc"), d("x", 5, "shared"), d("dis2", 2, "dis")];

describe("journey sequencing", () => {
  it("unlocks only the first Forum document at start", () => {
    const locked = lockedDocumentIds(docs, new Set(), "prsc", none);
    strictEqual(locked.has("f1"), false);
    strictEqual(locked.has("f2"), true);
    strictEqual(locked.has("p2"), true);
  });
  it("one-off records are never locked", () => {
    strictEqual(lockedDocumentIds(docs, new Set(), "prsc", none).has("x"), false);
  });
  it("entity stages open after explicit release", () => {
    const locked = lockedDocumentIds(docs, new Set(["f1", "f2"]), "both", both);
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
  it("non-Forum members show Stage 2 as current but documents stay locked until release", () => {
    const entityDocs = docs.filter((x) => x.journey_stage !== 1 && x.id !== "dis2");
    const st = journeyStatus(entityDocs, new Set(), "prsc", { prsc: null, dis: null }, false);
    strictEqual(st.currentStage, 2);
    strictEqual(lockedDocumentIds(entityDocs, new Set(), "prsc", none).has("p2"), true);
    strictEqual(lockedDocumentIds(entityDocs, new Set(), "prsc", both).has("p2"), false);
  });
});

describe("forum clearance", () => {
  it("signing every Forum document does not clear Stage 1 without an admin clearance", () => {
    const done = new Set(["f1", "f2"]);
    const st = journeyStatus(docs, done, "prsc", { prsc: null, dis: null }, true, false);
    strictEqual(st.forumCleared, false);
    strictEqual(st.label, "Clearance Pending Review");
    strictEqual(lockedDocumentIds(docs, done, "prsc", none).has("p2"), true);
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

describe("independent Forum and entity onboarding", () => {
  const set = [d("f1", 1, "shared"), d("p2", 2, "prsc"), d("p2b", 2, "prsc", 1), d("p3", 3, "prsc"), d("d2", 2, "dis")];
  it("1. Forum invitee with no entity release: Stage 1 open, Stage 2 locked", () => {
    const l = lockedDocumentIds(set, new Set(), "prsc", none);
    strictEqual(l.has("f1"), false);
    strictEqual(l.has("p2"), true);
  });
  it("2. Forum-cleared member without release keeps Stage 2 locked", () => {
    strictEqual(lockedDocumentIds(set, new Set(["f1"]), "prsc", none).has("p2"), true);
  });
  it("3. Forum opt-out without release keeps Stage 2 locked", () => {
    const optOut = set.filter((x) => x.journey_stage !== 1);
    strictEqual(lockedDocumentIds(optOut, new Set(), "prsc", none).has("p2"), true);
  });
  it("4. Forum opt-out with explicit release opens only the first Stage 2 document", () => {
    const optOut = set.filter((x) => x.journey_stage !== 1);
    const l = lockedDocumentIds(optOut, new Set(), "prsc", { released: { prsc: true, dis: false } });
    strictEqual(l.has("p2"), false);
    strictEqual(l.has("p2b"), true);
    strictEqual(l.has("p3"), true);
  });
  it("5. Forum participant with release opens Stage 2 without Forum completion", () => {
    strictEqual(lockedDocumentIds(set, new Set(), "both", { released: { prsc: true, dis: false } }).has("p2"), false);
  });
  it("6. PRSC released, DIS not: only PRSC opens", () => {
    const l = lockedDocumentIds(set, new Set(), "both", { released: { prsc: true, dis: false } });
    strictEqual(l.has("p2"), false);
    strictEqual(l.has("d2"), true);
  });
  it("9. release alone does not complete Stage 3 or acceptance", () => {
    strictEqual(entityAcceptanceComplete(set, new Set(), "prsc").prsc, false);
  });
  it("historical completions stay unlocked without a release", () => {
    strictEqual(lockedDocumentIds(set, new Set(["p2"]), "prsc", none).has("p2"), false);
  });
});
