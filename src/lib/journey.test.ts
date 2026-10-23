import { describe, expect, it } from "vitest";
import { journeyStatus, lockedDocumentIds, type JourneyDoc } from "./journey";

const d = (id: string, stage: number | null, track: JourneyDoc["journey_track"], sort = 0): JourneyDoc => ({ id, journey_stage: stage, journey_track: track, sort_order: sort, created_at: "2026-01-01" });
const docs = [d("f1", 1, "shared", 0), d("f2", 1, "shared", 1), d("p2", 2, "prsc"), d("p3", 3, "prsc"), d("x", 5, "shared"), d("dis2", 2, "dis")];

describe("journey sequencing", () => {
  it("unlocks only the first Forum document at start", () => {
    const locked = lockedDocumentIds(docs, new Set(), "prsc");
    expect(locked.has("f1")).toBe(false);
    expect(locked.has("f2")).toBe(true);
    expect(locked.has("p2")).toBe(true);
  });
  it("one-off records are never locked", () => {
    expect(lockedDocumentIds(docs, new Set(), "prsc").has("x")).toBe(false);
  });
  it("entity stages open after the Forum is cleared", () => {
    const locked = lockedDocumentIds(docs, new Set(["f1", "f2"]), "both");
    expect(locked.has("p2")).toBe(false);
    expect(locked.has("dis2")).toBe(false);
    expect(locked.has("p3")).toBe(true);
  });
  it("not fully activated until the admin records activation", () => {
    const done = new Set(["f1", "f2", "p2", "p3"]);
    const prscDocs = docs.filter((x) => x.id !== "dis2");
    expect(journeyStatus(prscDocs, done, "prsc", { prsc: null, dis: null }).label).toBe("Pending Activation");
    expect(journeyStatus(prscDocs, done, "prsc", { prsc: "2026-01-02", dis: null }).label).toBe("Fully Activated");
  });
});
