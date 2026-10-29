import { test } from "node:test";
import assert from "node:assert/strict";
import { planHoldChanges, holdTransactionId } from "./calendar-holds";

test("publishing three times creates three holds", () => {
  const p = planHoldChanges({ status: "open", confirmed_slot_id: null }, ["a", "b", "c"], []);
  assert.equal(p.create.length, 3);
  assert.equal(p.remove.length, 0);
});

test("re-running sync never duplicates existing holds", () => {
  const holds = ["a", "b", "c"].map((s) => ({
    slot_id: s,
    kind: "hold" as const,
    outlook_event_id: `e-${s}`,
  }));
  const p = planHoldChanges({ status: "open", confirmed_slot_id: null }, ["a", "b", "c"], holds);
  assert.deepEqual(p, { create: [], promote: [], remove: [] });
});

test("confirming keeps one final event and removes the other two", () => {
  const holds = ["a", "b", "c"].map((s) => ({
    slot_id: s,
    kind: "hold" as const,
    outlook_event_id: `e-${s}`,
  }));
  const p = planHoldChanges(
    { status: "confirmed", confirmed_slot_id: "b" },
    ["a", "b", "c"],
    holds,
  );
  assert.deepEqual(p.promote, ["b"]);
  assert.deepEqual(p.remove.map((h) => h.slot_id).sort(), ["a", "c"]);
});

test("cancelling removes every tracked hold", () => {
  const holds = ["a", "b"].map((s) => ({
    slot_id: s,
    kind: "hold" as const,
    outlook_event_id: `e-${s}`,
  }));
  const p = planHoldChanges({ status: "cancelled", confirmed_slot_id: null }, ["a", "b"], holds);
  assert.equal(p.remove.length, 2);
});

test("removed time slots release their hold", () => {
  const holds = [{ slot_id: "old", kind: "hold" as const, outlook_event_id: "e1" }];
  const p = planHoldChanges({ status: "open", confirmed_slot_id: null }, ["new"], holds);
  assert.deepEqual(p.create, [{ slot_id: "new", kind: "hold" }]);
  assert.equal(p.remove[0].slot_id, "old");
});

test("drafts never touch the calendar", () => {
  const p = planHoldChanges({ status: "draft", confirmed_slot_id: null }, ["a"], []);
  assert.deepEqual(p, { create: [], promote: [], remove: [] });
});

test("only tracked events with an id are deleted", () => {
  const holds = [{ slot_id: "a", kind: "hold" as const, outlook_event_id: null }];
  const p = planHoldChanges({ status: "cancelled", confirmed_slot_id: null }, ["a"], holds);
  assert.equal(p.remove.length, 0);
});

test("transaction ids are deterministic", () => {
  assert.equal(holdTransactionId("p", "s"), holdTransactionId("p", "s"));
});
