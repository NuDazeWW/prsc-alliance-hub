import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  UNAVAILABLE_LABEL,
  unavailableNotices,
  type AvailabilityDoc,
  type AvailabilityMember,
} from "./document-availability";

const member: AvailabilityMember = {
  participates_in_forum: true,
  nda_verified: true,
  forum_clearance_status: "cleared",
  addendum_complete: true,
};
const doc = (o: Partial<AvailabilityDoc> & { id: string }): AvailabilityDoc => ({
  visible: false,
  classification: "confidential_forum",
  forum_role: null,
  is_forum_prep: false,
  signing_approved: false,
  superseded_at: null,
  ...o,
});
const reasons = (n: ReturnType<typeof unavailableNotices>) =>
  n.map((x) => `${x.label}|${x.reason}`);

describe("unavailable document notices", () => {
  it("says the approved document is awaited when nothing is loaded for an expected Forum item", () => {
    const n = unavailableNotices([], member);
    assert.deepEqual(reasons(n), [
      "Confidentiality Addendum|awaiting_approved",
      "Forum Protocol|awaiting_approved",
      "Pre-Read|awaiting_approved",
    ]);
  });

  it("uses exactly the five approved reason labels", () => {
    assert.deepEqual(Object.values(UNAVAILABLE_LABEL), [
      "Awaiting approved document",
      "Not yet assigned or released",
      "Confidentiality signature required",
      "Prior required action incomplete",
      "Administrative clearance required",
    ]);
  });

  it("asks for the confidentiality signature when the NDA is not verified", () => {
    const docs = [
      doc({ id: "a", forum_role: "addendum", signing_approved: true }),
      doc({ id: "p", forum_role: "protocol" }),
      doc({ id: "r", forum_role: "pre_read" }),
    ];
    const n = unavailableNotices(docs, {
      ...member,
      nda_verified: false,
      addendum_complete: false,
    });
    assert.ok(n.length === 3 && n.every((x) => x.reason === "confidentiality_signature"));
  });

  it("holds Protocol and Pre-Read behind the Addendum, and says so accurately", () => {
    const approved = [
      doc({ id: "a", forum_role: "addendum", signing_approved: true, visible: true }),
      doc({ id: "p", forum_role: "protocol" }),
      doc({ id: "r", forum_role: "pre_read" }),
    ];
    assert.deepEqual(
      reasons(unavailableNotices(approved, { ...member, addendum_complete: false })),
      ["Forum Protocol|confidentiality_signature", "Pre-Read|confidentiality_signature"],
    );
    const unapproved = [
      doc({ id: "a", forum_role: "addendum", signing_approved: false, visible: true }),
      doc({ id: "p", forum_role: "protocol" }),
      doc({ id: "r", forum_role: "pre_read" }),
    ];
    assert.deepEqual(
      reasons(unavailableNotices(unapproved, { ...member, addendum_complete: false })),
      ["Forum Protocol|awaiting_approved", "Pre-Read|awaiting_approved"],
    );
  });

  it("asks for administrative clearance once confidentiality steps are done", () => {
    const docs = [
      doc({ id: "a", forum_role: "addendum", signing_approved: true, visible: true }),
      doc({ id: "p", forum_role: "protocol", visible: true }),
      doc({ id: "r", forum_role: "pre_read" }),
    ];
    assert.deepEqual(
      reasons(unavailableNotices(docs, { ...member, forum_clearance_status: "not_reviewed" })),
      ["Pre-Read|admin_clearance"],
    );
  });

  it("says nothing about items that are already visible", () => {
    const docs = [
      doc({ id: "a", forum_role: "addendum", signing_approved: true, visible: true }),
      doc({ id: "p", forum_role: "protocol", visible: true }),
      doc({ id: "r", forum_role: "pre_read", visible: true }),
    ];
    assert.deepEqual(unavailableNotices(docs, member), []);
  });

  it("never discloses restricted, secretariat-only or administrator-only items", () => {
    const docs = [
      doc({ id: "r1", classification: "restricted_opportunity", forum_role: "restricted_brief" }),
      doc({ id: "r2", classification: "restricted_opportunity" }),
      doc({ id: "s1", classification: "secretariat_only" }),
      doc({ id: "s2", forum_role: "secretariat_controls" }),
      doc({ id: "s3", forum_role: "facilitator_run_of_show" }),
      doc({ id: "g1", forum_role: "agenda" }),
      doc({ id: "a", forum_role: "addendum", signing_approved: true, visible: true }),
      doc({ id: "p", forum_role: "protocol", visible: true }),
      doc({ id: "r", forum_role: "pre_read", visible: true }),
    ];
    assert.deepEqual(unavailableNotices(docs, member), []);
  });

  it("never carries a document id, title or description", () => {
    const docs = [
      doc({ id: "secret-id-123", forum_role: "protocol", classification: "confidential_forum" }),
      doc({ id: "other-id-456", forum_role: null }),
    ];
    const text = JSON.stringify(unavailableNotices(docs, { ...member, nda_verified: false }));
    assert.doesNotMatch(text, /secret-id-123|other-id-456/);
    assert.deepEqual(
      Object.keys(unavailableNotices(docs, { ...member, nda_verified: false })[0]).sort(),
      ["key", "label", "reason"],
    );
  });

  it("gives no reason to a declined member", () => {
    const docs = [doc({ id: "p", forum_role: "protocol" })];
    const n = unavailableNotices(docs, {
      ...member,
      forum_clearance_status: "declined",
      addendum_complete: false,
    });
    assert.ok(!n.some((x) => x.label === "Forum Protocol"));
  });

  it("gives Forum opt-outs no Forum notices", () => {
    assert.deepEqual(unavailableNotices([], { ...member, participates_in_forum: false }), []);
  });

  it("ignores superseded documents", () => {
    const docs = [doc({ id: "old", forum_role: "protocol", superseded_at: "2026-10-01" })];
    assert.ok(
      unavailableNotices(docs, member).some(
        (x) => x.label === "Forum Protocol" && x.reason === "awaiting_approved",
      ),
    );
  });

  it("labels other hidden confidential Forum items generically", () => {
    const n = unavailableNotices([doc({ id: "x", forum_role: null })], {
      ...member,
      nda_verified: false,
    });
    assert.ok(
      n.some(
        (x) =>
          x.label === "Confidential Forum document" && x.reason === "confidentiality_signature",
      ),
    );
  });
});
