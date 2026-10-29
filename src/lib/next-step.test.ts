import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextIncompleteStep } from "./next-step";

const done = { needsOrientation: false, orientationStarted: false, pendingMeetings: 0, documentsRemaining: 0, profileComplete: true };

describe("next incomplete step", () => {
  it("is nothing when everything is complete", () => {
    assert.equal(nextIncompleteStep(done), null);
  });

  it("leads with orientation, and says Continue once it has been started", () => {
    const fresh = nextIncompleteStep({ ...done, needsOrientation: true, pendingMeetings: 2, documentsRemaining: 3, profileComplete: false });
    assert.equal(fresh?.key, "orientation");
    assert.equal(fresh?.action, "Begin Orientation");
    const started = nextIncompleteStep({ ...done, needsOrientation: true, orientationStarted: true });
    assert.equal(started?.key, "orientation");
    assert.equal(started?.action, "Continue Orientation");
  });

  it("then availability, then documents, then the optional profile", () => {
    assert.equal(nextIncompleteStep({ ...done, pendingMeetings: 1, documentsRemaining: 2, profileComplete: false })?.key, "availability");
    assert.equal(nextIncompleteStep({ ...done, documentsRemaining: 2, profileComplete: false })?.key, "documents");
    assert.equal(nextIncompleteStep({ ...done, profileComplete: false })?.key, "profile");
  });

  it("a closed popup completes nothing: unchanged inputs give the same step", () => {
    const input = { ...done, needsOrientation: true, orientationStarted: true };
    assert.deepEqual(nextIncompleteStep(input), nextIncompleteStep({ ...input }));
    assert.equal(nextIncompleteStep(input)?.key, "orientation");
  });

  it("uses correct singular and plural wording", () => {
    assert.match(nextIncompleteStep({ ...done, pendingMeetings: 1 })!.detail, /1 meeting is/);
    assert.match(nextIncompleteStep({ ...done, pendingMeetings: 2 })!.detail, /2 meetings are/);
    assert.match(nextIncompleteStep({ ...done, documentsRemaining: 1 })!.detail, /1 document needs/);
    assert.match(nextIncompleteStep({ ...done, documentsRemaining: 4 })!.detail, /4 documents need/);
  });
});
