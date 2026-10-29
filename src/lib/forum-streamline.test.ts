import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { APPROVED_DOCUMENT_BLOCK, documentVisible, forumReviewChecklist, stage1ClearanceProblems, type ForumReviewInput, type VisibilityMember } from "./governance";
import { journeyStatus, lockedDocumentIds, type JourneyDoc } from "./journey";
import { signingAction } from "./signing-preparation";
import { confirmationKey, recipientsToConfirm } from "./meeting-confirmations";
import { activationProblem, activationRecord } from "./invitation-activation";

// Fictional accounts only.
const jd = (id: string, order: number, role: string | null = null, stage = 1): JourneyDoc => ({ id, journey_stage: stage, journey_track: "shared", sort_order: order, created_at: "2026-01-01", forum_role: role });
const FORUM = [jd("addendum", 10, "addendum"), jd("protocol", 20, "protocol"), jd("preread", 30, "pre_read"), jd("conflict", 40, "conflict"), jd("agenda", 50, "agenda"), jd("brief", 60, "restricted_brief")];
const noActivation = { prsc: null, dis: null };
const opts = { forum: true, released: { prsc: false, dis: false } };

describe("Forum document progression (already automatic)", () => {
  it("Protocol and Pre-Read open in order with no administrator action once the Addendum is complete", () => {
    const locked0 = lockedDocumentIds(FORUM.slice(0, 4), new Set(), "prsc", opts);
    assert.deepEqual([...locked0].sort(), ["conflict", "preread", "protocol"]);
    const locked1 = lockedDocumentIds(FORUM.slice(0, 4), new Set(["addendum"]), "prsc", opts);
    assert.deepEqual([...locked1].sort(), ["conflict", "preread"]);
    const locked2 = lockedDocumentIds(FORUM.slice(0, 4), new Set(["addendum", "protocol", "preread"]), "prsc", opts);
    assert.deepEqual([...locked2], []);
  });

  const member = (o: Partial<VisibilityMember> = {}): VisibilityMember => ({ nda_verified_at: "2026-10-01", forum_clearance_status: "not_reviewed", addendum_complete: true, ...o });
  const prep = (role: string) => ({ classification: "confidential_forum", superseded_at: null, is_forum_prep: true, forum_role: role });
  const agenda = { classification: "confidential_forum", superseded_at: null, is_forum_prep: false, forum_role: "agenda" };

  it("Protocol and Pre-Read stay hidden until the Addendum is executed, then show without a member-specific release", () => {
    assert.equal(documentVisible(prep("protocol"), member({ addendum_complete: false }), false), false);
    assert.equal(documentVisible(prep("protocol"), member(), false), true);
    assert.equal(documentVisible(prep("pre_read"), member(), false), true);
  });

  it("the approved Agenda appears after administrative clearance with no second release action, and not before", () => {
    assert.equal(documentVisible(agenda, member(), false), false);
    assert.equal(documentVisible(agenda, member({ forum_clearance_status: "cleared" }), false), true);
    assert.equal(documentVisible(agenda, member({ forum_clearance_status: "cleared_restricted" }), false), true);
    assert.equal(documentVisible(agenda, member({ forum_clearance_status: "declined" }), false), false);
  });

  it("clearance is never automatic: signed paperwork alone still leaves the conflict review problem", () => {
    const problems = stage1ClearanceProblems({ ndaVerified: true, addendumComplete: true, incompleteStage1: [], conflictSigned: true, conflictReviewDecision: null });
    assert.deepEqual(problems, ["Administrative conflict review not approved"]);
  });

  it("the Jared/NASCAR briefing still needs an exact-version individual grant even for a cleared member", () => {
    const brief = { id: "b1", classification: "restricted_opportunity", superseded_at: null, is_forum_prep: false, forum_role: "restricted_brief", version_label: "v1.2" };
    const cleared = member({ forum_clearance_status: "cleared" });
    assert.equal(documentVisible(brief, cleared, false), false);
    assert.equal(documentVisible(brief, { ...cleared, grants: [{ document_id: "b1", version_label: "v1.2", revoked_at: null }] }, false), true);
    assert.equal(documentVisible(brief, { ...cleared, grants: [{ document_id: "b1", version_label: "v1.1", revoked_at: null }] }, false), false);
  });
});

describe("administrative review state (the gap fixed here)", () => {
  const stageOneDone = new Set(["addendum", "protocol", "preread", "conflict"]);

  it("a member who finished every member-side document shows 'Clearance Pending Review' even though the Agenda and restricted briefing are not yet released", () => {
    const status = journeyStatus(FORUM, stageOneDone, "prsc", noActivation, true, false);
    assert.equal(status.label, "Clearance Pending Review");
  });

  it("clearance moves the member forward without requiring the post-clearance reading to be opened first", () => {
    const status = journeyStatus(FORUM, stageOneDone, "prsc", noActivation, true, true);
    assert.equal(status.forumCleared, true);
    assert.equal(status.stageDone[0], true);
  });

  it("an incomplete required document still keeps the member out of the review state", () => {
    const status = journeyStatus(FORUM, new Set(["addendum", "protocol", "preread"]), "prsc", noActivation, true, false);
    assert.equal(status.label, "Needs Forum Clearance");
  });

  it("stage-1 documents without a Forum role behave exactly as before", () => {
    const docs = [jd("a", 1), jd("b", 2)];
    assert.equal(journeyStatus(docs, new Set(["a"]), "prsc", noActivation, true, false).label, "Needs Forum Clearance");
    assert.equal(journeyStatus(docs, new Set(["a", "b"]), "prsc", noActivation, true, false).label, "Clearance Pending Review");
  });

  it("a stage that contains only post-clearance material is not treated as complete", () => {
    const status = journeyStatus([jd("agenda", 1, "agenda")], new Set(["agenda"]), "prsc", noActivation, true, false);
    assert.notEqual(status.label, "Clearance Pending Review");
  });
});

describe("consolidated administrator review", () => {
  const base: ForumReviewInput = {
    ndaVerified: true,
    addendum: { approved: 1, complete: true },
    protocol: { assigned: 1, done: 1 },
    preRead: { assigned: 1, done: 1 },
    conflict: { assigned: 1, signed: true },
    conflictReviewDecision: null,
    clearanceStatus: "not_reviewed",
    restrictions: null,
  };
  const status = (r: ReturnType<typeof forumReviewChecklist>, key: string) => r.items.find((i) => i.key === key)?.status;

  it("reports all member-side items done but still requires the administrator's decisions", () => {
    const r = forumReviewChecklist(base);
    assert.equal(r.readyForDecision, true);
    assert.equal(status(r, "conflict_review"), "pending");
    assert.equal(status(r, "restrictions"), "pending");
    assert.deepEqual(r.items.map((i) => i.key), ["nda", "addendum", "protocol", "pre_read", "conflict_signed", "conflict_review", "restrictions"]);
  });

  it("is not ready while any member-side item is outstanding", () => {
    assert.equal(forumReviewChecklist({ ...base, protocol: { assigned: 1, done: 0 } }).readyForDecision, false);
    assert.equal(forumReviewChecklist({ ...base, ndaVerified: false }).readyForDecision, false);
    assert.equal(forumReviewChecklist({ ...base, addendum: { approved: 1, complete: false } }).readyForDecision, false);
    assert.equal(forumReviewChecklist({ ...base, conflict: { assigned: 1, signed: false } }).readyForDecision, false);
  });

  it("reports a missing approved document as BLOCKED rather than done, and never ready", () => {
    const r = forumReviewChecklist({ ...base, addendum: { approved: 0, complete: false }, protocol: { assigned: 0, done: 0 }, preRead: { assigned: 0, done: 0 } });
    assert.equal(status(r, "addendum"), "unavailable");
    assert.equal(status(r, "protocol"), "unavailable");
    assert.equal(status(r, "pre_read"), "unavailable");
    assert.ok(r.items.filter((i) => i.status === "unavailable").every((i) => i.detail === APPROVED_DOCUMENT_BLOCK));
    assert.equal(r.readyForDecision, false);
    assert.equal(APPROVED_DOCUMENT_BLOCK, "BLOCKED — APPROVED DOCUMENT NOT AVAILABLE");
  });

  it("an unapproved (draft) Addendum is never counted as executable", () => {
    assert.equal(status(forumReviewChecklist({ ...base, addendum: { approved: 0, complete: true } }), "addendum"), "unavailable");
  });

  it("shows the recorded conflict decision and restrictions without altering them", () => {
    const hold = forumReviewChecklist({ ...base, conflictReviewDecision: "hold" });
    assert.equal(status(hold, "conflict_review"), "pending");
    assert.match(hold.items.find((i) => i.key === "conflict_review")!.detail, /hold/);
    const restricted = forumReviewChecklist({ ...base, conflictReviewDecision: "approved", clearanceStatus: "cleared_restricted", restrictions: "Session 2 only" });
    assert.equal(status(restricted, "conflict_review"), "done");
    assert.match(restricted.items.find((i) => i.key === "restrictions")!.detail, /Session 2 only/);
    assert.equal(restricted.readyForDecision, false, "an already-cleared member is not queued for another decision");
  });
});

describe("BoldSign preparation: manual Test 2 staging vs the unverified template workflow", () => {
  const addendum = { action: "boldsign", signing_approved: true, boldsign_template_id: null, superseded_at: null, version_label: "DRAFT-v0.9" };

  it("with no template id, signing falls back to the manually staged assignment path, exactly like Test 2", () => {
    assert.deepEqual(signingAction(addendum, null, null), { kind: "manual" });
  });

  it("with an approved template, a fictional test identity starts exactly one request", () => {
    assert.deepEqual(signingAction({ ...addendum, boldsign_template_id: "tpl_fictional" }, null, null), { kind: "start" });
  });

  it("an existing assignment is always reused, never duplicated", () => {
    const existing = { status: "pending", version_label: "DRAFT-v0.9", boldsign_document_id: "bs_1" };
    assert.deepEqual(signingAction({ ...addendum, boldsign_template_id: "tpl_fictional" }, existing, null), { kind: "resume" });
  });

  it("the approved template is the only authorization needed: no email-based restriction applies", () => {
    assert.deepEqual(signingAction({ ...addendum, boldsign_template_id: "tpl" }, null, null), { kind: "start" });
  });

  it("an unapproved draft with a template id is not started automatically", () => {
    assert.deepEqual(signingAction({ ...addendum, signing_approved: false, boldsign_template_id: "tpl" }, null, null), { kind: "manual" });
  });
});

describe("meeting confirmation stays independent and deduplicated (already works)", () => {
  it("uses one delivery key per poll, slot and recipient", () => {
    assert.equal(confirmationKey("poll1", "slot1", "m1"), confirmationKey("poll1", "slot1", "m1"));
    assert.notEqual(confirmationKey("poll1", "slot1", "m1"), confirmationKey("poll1", "slot1", "m2"));
    assert.notEqual(confirmationKey("poll1", "slot1", "m1"), confirmationKey("poll1", "slot2", "m1"));
  });

  it("a repeat confirmation owes nobody who already received it, and retries only the failed", () => {
    const owed = recipientsToConfirm(["m1", "m2", "m3"], [
      { member_id: "m1", status: "sent", attempts: 1 },
      { member_id: "m2", status: "failed", attempts: 1 },
    ] as any);
    assert.deepEqual([...owed].sort(), ["m2", "m3"]);
  });
});

describe("first sign-in is recorded when the password is set", () => {
  const now = 1_800_000_000;
  const amr = [{ method: "magiclink", timestamp: now - 60 }];
  const invited = { user_id: "u1", email: "fictional.test1@example.com", status: "invited", first_access_at: null };

  it("writes active status and first/last access times", () => {
    assert.deepEqual(activationRecord("2026-10-28T12:00:00.000Z"), { status: "active", first_access_at: "2026-10-28T12:00:00.000Z", last_access_at: "2026-10-28T12:00:00.000Z" });
  });

  it("an unused invitation can be activated, and once recorded the same invitation is refused", () => {
    assert.equal(activationProblem({ userId: "u1", sessionEmail: invited.email, amr, nowSeconds: now, member: invited }), null);
    const after = { ...invited, ...activationRecord("2026-10-28T12:00:00.000Z") };
    assert.equal(activationProblem({ userId: "u1", sessionEmail: invited.email, amr, nowSeconds: now, member: after }), "This invitation has already been used");
  });

  it("another account's invitation is still refused", () => {
    assert.equal(activationProblem({ userId: "u2", sessionEmail: invited.email, amr, nowSeconds: now, member: invited }), "This invitation belongs to a different account");
  });
});
