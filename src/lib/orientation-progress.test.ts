import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearOrientationProgress, markOrientationDismissed, orientationDismissed, readOrientationStep, saveOrientationStep, shouldAutoOpenOrientation } from "./orientation-progress";

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    keys: () => [...data.keys()],
  };
}

describe("orientation progress", () => {
  it("remembers the chapter a member reached and restores it", () => {
    const local = memoryStore();
    assert.equal(readOrientationStep("m1", local), null);
    saveOrientationStep("m1", 3, local);
    assert.equal(readOrientationStep("m1", local), 3);
  });

  it("keeps progress separate per member on the same browser", () => {
    const local = memoryStore();
    saveOrientationStep("m1", 4, local);
    assert.equal(readOrientationStep("m2", local), null);
  });

  it("ignores corrupt or out-of-range saved values", () => {
    for (const bad of ["abc", "-1", "6", "2.5", ""]) {
      assert.equal(readOrientationStep("m1", memoryStore({ "prsc-orientation-progress:m1": bad })), null, bad);
    }
  });

  it("works without storage and never throws", () => {
    assert.equal(readOrientationStep("m1", null), null);
    assert.doesNotThrow(() => saveOrientationStep("m1", 2, null));
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    assert.equal(readOrientationStep("m1", broken), null);
    assert.doesNotThrow(() => saveOrientationStep("m1", 2, broken));
    assert.equal(orientationDismissed("m1", broken), false);
    assert.doesNotThrow(() => markOrientationDismissed("m1", broken));
    assert.doesNotThrow(() => clearOrientationProgress("m1", broken, broken));
  });

  it("clears progress and the closed-it-myself marker once orientation is completed", () => {
    const local = memoryStore();
    const session = memoryStore();
    saveOrientationStep("m1", 5, local);
    markOrientationDismissed("m1", session);
    clearOrientationProgress("m1", local, session);
    assert.equal(readOrientationStep("m1", local), null);
    assert.equal(orientationDismissed("m1", session), false);
  });
});

describe("orientation auto-open", () => {
  const base = { needsOrientation: true, memberId: "m1", alreadyOpenedFor: null as string | null, dismissed: false };

  it("first login: a member who has not completed orientation is presented with it", () => {
    assert.equal(shouldAutoOpenOrientation(base), true);
  });

  it("returning member who already completed it is not forced to repeat it", () => {
    assert.equal(shouldAutoOpenOrientation({ ...base, needsOrientation: false }), false);
  });

  it("does not reopen on top of itself for the same member", () => {
    assert.equal(shouldAutoOpenOrientation({ ...base, alreadyOpenedFor: "m1" }), false);
  });

  it("opens again for a different member signing in without leaving the page", () => {
    assert.equal(shouldAutoOpenOrientation({ ...base, alreadyOpenedFor: "m1", memberId: "m2" }), true);
  });

  it("does not trap a member who closed it on purpose", () => {
    assert.equal(shouldAutoOpenOrientation({ ...base, dismissed: true }), false);
  });

  it("waits until the member is known", () => {
    assert.equal(shouldAutoOpenOrientation({ ...base, memberId: undefined }), false);
  });
});
