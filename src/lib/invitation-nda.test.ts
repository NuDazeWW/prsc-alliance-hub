import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  invitationNdaProof,
  sameInvitationNdaProof,
  planInvitationNdaVerification,
  invitationNdaSnapshot,
  invitationNdaReviewMatches,
  invitationNdaEligibilityProblem,
  assertInvitationNdaEvidenceOwner,
  invitationNdaSaveSchema,
  suggestedInvitationNdaEvidence,
  assertReviewedInvitationNda,
  type InvitationNdaMember,
  type InvitationNdaEvidence,
} from "./invitation-nda";
import { invitationNdaFormValues, clearInvitationNdaConfirmation } from "./invitation-nda-form";

const originalDate = "2026-09-15T12:00:00.000Z";
const reviewDate = "2026-10-28T15:00:00.000Z";
const firstReviewer = "11111111-1111-4111-8111-111111111111";
const currentReviewer = "22222222-2222-4222-8222-222222222222";
// Four fictional, independent records; no identity-provider, database, or delivery calls.
const members: InvitationNdaMember[] = [1, 2, 3, 4].map((n) => ({
  id: `${n}${n}${n}${n}${n}${n}${n}${n}-0000-4000-8000-000000000000`,
  first_name: `Fictional${n}`,
  last_name: "Candidate",
  email: `fictional${n}@example.test`,
  entity: n === 4 ? "both" : "prsc",
  is_candidate: true,
  status: "invited",
  updated_at: originalDate,
  nda_reference: n === 3 ? null : `nda-fictional-${n}`,
  nda_entities: n === 3 ? null : "prsc",
  nda_scope: n === 3 ? null : `Private PRSC information for fictional ${n}`,
  nda_verified_at: n === 3 ? null : originalDate,
  nda_verified_by: n === 3 ? null : firstReviewer,
}));
const evidenceFor = (m: InvitationNdaMember): InvitationNdaEvidence => ({
  reference: m.nda_reference!,
  recipient_email: m.email,
  recipient_name: `${m.first_name} ${m.last_name}`,
  entities: m.nda_entities!,
  scope: m.nda_scope!,
  reviewer_id: firstReviewer,
  verified_at: originalDate,
});
const proofFor = (m: InvitationNdaMember) => ({
  reference: m.nda_reference!,
  entities: m.nda_entities!,
  scope: m.nda_scope!,
});

describe("recipient-specific invitation NDA review", () => {
  it("preserves each selected candidate’s own stored data without inheriting another record", () => {
    const snapshots = members.map(invitationNdaSnapshot);
    assert.equal(new Set(snapshots.map((s) => s.member_id)).size, 4);
    assert.equal(snapshots[0].recipient_email, "fictional1@example.test");
    assert.equal(snapshots[1].reference, "nda-fictional-2");
    assert.equal(snapshots[2].reference, "");
    assert.equal(snapshots[2].verified_at, null);
    assert.equal(sameInvitationNdaProof(members[1], proofFor(members[0])), false);
  });
  it("requires a fresh explicit confirmation and rejects caller-supplied identity or verification stamps", () => {
    const input = {
      member_id: members[0].id,
      expected_updated_at: originalDate,
      ...proofFor(members[0]),
      confirmed: true,
    };
    assert.equal(invitationNdaSaveSchema.safeParse(input).success, true);
    assert.equal(invitationNdaSaveSchema.safeParse({ ...input, confirmed: false }).success, false);
    const { confirmed: _c, ...notConfirmed } = input;
    assert.equal(invitationNdaSaveSchema.safeParse(notConfirmed).success, false);
    for (const extra of [
      { email: members[1].email },
      { nda_verified_at: reviewDate },
      { nda_verified_by: currentReviewer },
    ])
      assert.equal(invitationNdaSaveSchema.safeParse({ ...input, ...extra }).success, false);
  });
  it("retains the original verification date and reviewer when re-reviewing unchanged proof", () => {
    const member = members[0];
    const plan = planInvitationNdaVerification(
      member,
      proofFor(member),
      currentReviewer,
      reviewDate,
    );
    assert.equal(plan.proofChanged, false);
    assert.equal(plan.verificationPreserved, true);
    assert.equal(plan.patch.nda_verified_at, originalDate);
    assert.equal(plan.patch.nda_verified_by, firstReviewer);
    assert.equal(invitationNdaProof(member).reference, member.nda_reference);
    const differentlyCased = { ...member, nda_reference: "NDA-Fictional-1" };
    assert.equal(
      planInvitationNdaVerification(differentlyCased, proofFor(member), currentReviewer, reviewDate)
        .patch.nda_reference,
      "NDA-Fictional-1",
    );
  });
  it("attributes corrected proof or missing verification to the current reviewing administrator", () => {
    const changed = planInvitationNdaVerification(
      members[0],
      { ...proofFor(members[0]), scope: "Corrected PRSC and DIS information scope" },
      currentReviewer,
      reviewDate,
    );
    assert.equal(changed.proofChanged, true);
    assert.equal(changed.patch.nda_verified_at, reviewDate);
    assert.equal(changed.patch.nda_verified_by, currentReviewer);
    const missing = planInvitationNdaVerification(
      members[2],
      { reference: "new-fictional-3", entities: "prsc", scope: "Private PRSC information" },
      currentReviewer,
      reviewDate,
    );
    assert.equal(missing.verificationPreserved, false);
    assert.equal(missing.patch.nda_verified_by, currentReviewer);
    const renamed = planInvitationNdaVerification(
      members[0],
      proofFor(members[0]),
      currentReviewer,
      reviewDate,
      true,
    );
    assert.equal(renamed.verificationPreserved, false);
  });
  it("permits same-recipient corrections while forbidding reference transfer to another candidate", () => {
    assert.doesNotThrow(() =>
      assertInvitationNdaEvidenceOwner(members[0], evidenceFor(members[0]), [members[0].id]),
    );
    assert.throws(() => assertInvitationNdaEvidenceOwner(members[1], evidenceFor(members[0])));
    assert.throws(() =>
      assertInvitationNdaEvidenceOwner(members[0], evidenceFor(members[0]), [members[1].id]),
    );
    assert.throws(() => assertInvitationNdaEvidenceOwner(members[2], null, [members[0].id]));
  });
  it("suggests only canonical or uniquely owned evidence, without choosing the latest among multiple options", () => {
    const candidate3 = members[2];
    const first = {
      ...evidenceFor(members[0]),
      reference: "stored-fictional-3",
      recipient_email: candidate3.email,
      recipient_name: `${candidate3.first_name} ${candidate3.last_name}`,
    };
    const second = { ...first, reference: "other-fictional-3", verified_at: reviewDate };
    assert.equal(suggestedInvitationNdaEvidence(candidate3, [first])?.reference, first.reference);
    assert.equal(suggestedInvitationNdaEvidence(candidate3, [second, first]), null);
    assert.equal(
      suggestedInvitationNdaEvidence({ ...candidate3, nda_reference: first.reference }, [
        second,
        first,
      ])?.reference,
      first.reference,
    );
    assert.equal(suggestedInvitationNdaEvidence(candidate3, [evidenceFor(members[0])]), null);
    assert.equal(suggestedInvitationNdaEvidence(members[0], [first]), null);
  });
  it("retains existing evidence verification when explicitly adopting unchanged recipient-owned proof", () => {
    const member = members[2];
    const source = {
      ...evidenceFor(members[0]),
      reference: "stored-fictional-3",
      recipient_email: member.email,
      recipient_name: `${member.first_name} ${member.last_name}`,
    };
    const plan = planInvitationNdaVerification(
      member,
      { reference: source.reference, entities: "prsc", scope: source.scope },
      currentReviewer,
      reviewDate,
      false,
      source,
    );
    assert.equal(plan.verificationPreserved, true);
    assert.equal(plan.verificationSource, "evidence");
    assert.equal(plan.patch.nda_verified_at, originalDate);
    assert.equal(plan.patch.nda_verified_by, firstReviewer);
    const corrected = planInvitationNdaVerification(
      member,
      { reference: source.reference, entities: "prsc", scope: "Corrected source scope" },
      currentReviewer,
      reviewDate,
      false,
      source,
    );
    assert.equal(corrected.verificationPreserved, false);
    assert.equal(corrected.patch.nda_verified_by, currentReviewer);
  });
  it("keeps missing or insufficient entity coverage ineligible without changing the original governance checks", () => {
    assert.equal(invitationNdaEligibilityProblem(members[0], evidenceFor(members[0])), null);
    assert.match(invitationNdaEligibilityProblem(members[2], null)!, /verification date/);
    assert.match(
      invitationNdaEligibilityProblem(members[3], evidenceFor(members[3]))!,
      /every entity/,
    );
    assert.match(invitationNdaEligibilityProblem(members[0], null)!, /Review and save/);
    assert.match(
      invitationNdaEligibilityProblem(members[0], evidenceFor(members[1]))!,
      /does not match/,
    );
  });
  it("binds a completed audit to the exact member and current facts; incomplete or stale reviews cannot authorize an invitation", () => {
    const member = members[0];
    const review = {
      member_id: member.id,
      kind: "nda",
      decision: "verified",
      details: { source: "invitation_nda_review", saved: invitationNdaSnapshot(member) },
    };
    assert.equal(invitationNdaReviewMatches(review, member), true);
    assert.equal(invitationNdaReviewMatches(review, members[1]), false);
    assert.equal(invitationNdaReviewMatches({ ...review, decision: "reviewed" }, member), false);
    assert.equal(
      invitationNdaReviewMatches({ ...review, decision: "save_incomplete" }, member),
      false,
    );
    assert.equal(
      invitationNdaReviewMatches(review, { ...member, nda_scope: "Edited after the saved review" }),
      false,
    );
    assert.equal(invitationNdaReviewMatches(review, { ...member, email: members[1].email }), false);
    assert.equal(
      invitationNdaReviewMatches(review, { ...member, nda_verified_by: currentReviewer }),
      false,
    );
  });
  it("requires a fresh recipient NDA review after intended roles change and retains the wider existing coverage requirement", () => {
    const oldIntent = {
      version: 1 as const,
      kind: "identified" as const,
      entity: "prsc" as const,
      roles: ["prsc_board" as const],
      other_text: "",
      committee: "undetermined" as const,
    };
    const original = { ...members[0], intended_designation: oldIntent };
    const review = {
      member_id: original.id,
      kind: "nda",
      decision: "verified",
      details: { source: "invitation_nda_review", saved: invitationNdaSnapshot(original) },
    };
    const changed = {
      ...original,
      intended_designation: {
        ...oldIntent,
        entity: "both" as const,
        roles: ["prsc_board" as const, "dis_advisor" as const],
      },
    };
    assert.equal(invitationNdaReviewMatches(review, changed), false);
    assert.match(invitationNdaEligibilityProblem(changed, evidenceFor(changed))!, /every entity/);
    const existingBoth = { ...original, is_candidate: false, entity: "both" };
    assert.match(
      invitationNdaEligibilityProblem(existingBoth, evidenceFor(existingBoth))!,
      /every entity/,
    );
  });
});

describe("reviewed invitation recipient gate", () => {
  const member = members[0];
  const payload = {
    selected_member_id: member.id,
    email: member.email,
    first_name: member.first_name,
    last_name: member.last_name,
    nda_reference: member.nda_reference!,
    nda_entities: member.nda_entities!,
    nda_scope: member.nda_scope!,
    nda_confirmed: true,
  };
  const review = {
    member_id: member.id,
    kind: "nda",
    decision: "verified",
    reviewer_id: currentReviewer,
    details: { source: "invitation_nda_review", saved: invitationNdaSnapshot(member) },
  };
  it("rejects another selected candidate or substituted payload identity even with a real saved review", () => {
    for (const changed of [
      { selected_member_id: members[1].id },
      { email: members[1].email },
      { first_name: members[1].first_name },
      { last_name: "A different executive" },
    ])
      assert.throws(() =>
        assertReviewedInvitationNda({ ...payload, ...changed }, member, review, currentReviewer),
      );
    assert.throws(() => assertReviewedInvitationNda(payload, members[1], review, currentReviewer));
    assert.throws(() => assertReviewedInvitationNda(payload, null, review, currentReviewer));
  });
  it("rejects changed NDA reference, entity coverage or scope after the administrator saved a review", () => {
    for (const changed of [
      { nda_reference: members[1].nda_reference! },
      { nda_entities: "dis" },
      { nda_scope: "New scope not in the saved review" },
    ])
      assert.throws(() =>
        assertReviewedInvitationNda({ ...payload, ...changed }, member, review, currentReviewer),
      );
    assert.throws(() =>
      assertReviewedInvitationNda(
        payload,
        { ...member, nda_scope: "A concurrent correction" },
        review,
        currentReviewer,
      ),
    );
  });
  it("requires this administrator's completed review and a fresh explicit attestation", () => {
    assert.throws(() =>
      assertReviewedInvitationNda(
        payload,
        member,
        { ...review, reviewer_id: firstReviewer },
        currentReviewer,
      ),
    );
    for (const decision of ["reviewed", "save_incomplete", "declined"])
      assert.throws(() =>
        assertReviewedInvitationNda(payload, member, { ...review, decision }, currentReviewer),
      );
    assert.throws(() => assertReviewedInvitationNda(payload, member, null, currentReviewer));
    assert.throws(() =>
      assertReviewedInvitationNda(
        { ...payload, nda_confirmed: false },
        member,
        review,
        currentReviewer,
      ),
    );
    assert.throws(() =>
      assertReviewedInvitationNda(
        { ...payload, nda_confirmed: undefined },
        member,
        review,
        currentReviewer,
      ),
    );
    assert.throws(() =>
      assertReviewedInvitationNda(
        payload,
        { ...member, status: "revoked" },
        review,
        currentReviewer,
      ),
    );
  });
  it("accepts a fresh current-admin review while preserving the original verifier and verification date", () => {
    const plan = planInvitationNdaVerification(
      member,
      proofFor(member),
      currentReviewer,
      reviewDate,
    );
    const saved = { ...member, ...plan.patch };
    const freshReview = {
      ...review,
      details: {
        source: "invitation_nda_review",
        saved: invitationNdaSnapshot(saved),
        reviewed_at: reviewDate,
      },
    };
    assert.doesNotThrow(() =>
      assertReviewedInvitationNda(
        { ...payload, email: " FICTIONAL1@EXAMPLE.TEST " },
        saved,
        freshReview,
        currentReviewer,
      ),
    );
    assert.equal(saved.nda_verified_at, originalDate);
    assert.equal(saved.nda_verified_by, firstReviewer);
    assert.equal(freshReview.reviewer_id, currentReviewer);
    assert.equal(member.nda_verified_at, originalDate);
  });
  it("accepts the same verification instant after database timestamp serialization", () => {
    const databaseMember = { ...member, nda_verified_at: originalDate.replace(".000Z", "+00:00") };
    assert.doesNotThrow(() =>
      assertReviewedInvitationNda(payload, databaseMember, review, currentReviewer),
    );
    assert.equal(
      invitationNdaReviewMatches(review, {
        ...databaseMember,
        nda_verified_at: "2026-09-15T08:00:00-04:00",
      }),
      true,
    );
    assert.equal(
      invitationNdaReviewMatches(review, {
        ...databaseMember,
        nda_verified_at: "2026-09-15T12:00:01+00:00",
      }),
      false,
    );
  });
  it("rejects a review with missing verification or insufficient coverage even when its snapshot matches", () => {
    for (const incomplete of [
      { ...member, nda_verified_at: null },
      { ...member, nda_verified_by: null },
      { ...member, entity: "both" },
    ]) {
      const matchingReview = {
        ...review,
        details: { source: "invitation_nda_review", saved: invitationNdaSnapshot(incomplete) },
      };
      assert.throws(() =>
        assertReviewedInvitationNda(payload, incomplete, matchingReview, currentReviewer),
      );
    }
  });
});

describe("candidate selection and NDA form acceptance (fictional Test 1–4)", () => {
  it("loads each record's own stored fields and clears attestation while switching all four candidates", () => {
    const forms = members.map((member) =>
      invitationNdaFormValues(member, member.nda_reference ? [evidenceFor(member)] : []),
    );
    for (const [index, form] of forms.entries()) {
      assert.equal(form.nda_reference, members[index].nda_reference ?? "");
      assert.equal(form.nda_entities, members[index].nda_entities ?? "");
      assert.equal(form.nda_scope, members[index].nda_scope ?? "");
      assert.equal(form.nda_confirmed, false);
      assert.equal(form.nda_recipient_email, "");
    }
    const checkedFirst = {
      ...forms[0],
      nda_confirmed: true,
      nda_recipient_email: members[0].email,
      review_notes: "Fictional 1 review only",
    };
    const next = invitationNdaFormValues(members[1], [
      evidenceFor(members[0]),
      evidenceFor(members[1]),
    ]);
    assert.equal(checkedFirst.nda_confirmed, true);
    assert.equal(next.nda_confirmed, false);
    assert.equal(next.nda_recipient_email, "");
    assert.equal(next.review_notes, "");
    assert.equal(next.nda_reference, members[1].nda_reference);
    assert.equal(next.nda_scope.includes("fictional 1"), false);
    // Test 3 has no evidence; Test 4's narrower saved proof remains visibly narrower and ineligible for both entities.
    assert.equal(forms[2].nda_reference, "");
    assert.equal(forms[2].nda_scope, "");
    assert.equal(forms[3].nda_entities, "prsc");
    assert.match(
      invitationNdaEligibilityProblem(members[3], evidenceFor(members[3]))!,
      /every entity/,
    );
  });
  it("prefills a missing record only from uniquely owned evidence, never foreign or ambiguous sources", () => {
    const missing = members[2];
    const own = {
      ...evidenceFor(members[0]),
      reference: "test-3-own-evidence",
      recipient_email: missing.email,
      recipient_name: `${missing.first_name} ${missing.last_name}`,
      scope: "Test 3 private PRSC information",
    };
    const foreignOnly = invitationNdaFormValues(missing, [evidenceFor(members[0])]);
    assert.equal(foreignOnly.nda_reference, "");
    assert.equal(foreignOnly.nda_scope, "");
    const suggested = invitationNdaFormValues(missing, [evidenceFor(members[0]), own]);
    assert.equal(suggested.nda_reference, own.reference);
    assert.equal(suggested.nda_scope, own.scope);
    assert.equal(suggested.nda_confirmed, false);
    assert.equal(suggested.nda_recipient_email, "");
    const ambiguous = invitationNdaFormValues(missing, [
      own,
      { ...own, reference: "test-3-another-evidence", verified_at: reviewDate },
    ]);
    assert.equal(ambiguous.nda_reference, "");
    assert.equal(ambiguous.nda_entities, "");
    const canonical = invitationNdaFormValues({ ...missing, nda_reference: own.reference }, [
      own,
      { ...own, reference: "newer-record", verified_at: reviewDate },
    ]);
    assert.equal(canonical.nda_reference, own.reference);
    assert.equal(canonical.nda_scope, own.scope);
  });
  it("clears recipient attestation after every proof correction or intended-capacity change", () => {
    const checked = {
      ...invitationNdaFormValues(members[0], [evidenceFor(members[0])]),
      nda_confirmed: true,
      nda_recipient_email: members[0].email,
      intended_entity: "prsc",
    };
    const edits = [
      { nda_reference: "corrected-test-1-reference" },
      { nda_scope: "Corrected information-sharing scope" },
      { nda_entities: "both" as const },
      { intended_entity: "both" },
    ];
    for (const edit of edits) {
      const corrected = clearInvitationNdaConfirmation({ ...checked, ...edit });
      assert.equal(corrected.nda_confirmed, false);
      assert.equal(corrected.nda_recipient_email, "");
      for (const [key, value] of Object.entries(edit))
        assert.equal((corrected as Record<string, unknown>)[key], value);
    }
    assert.equal(checked.nda_confirmed, true);
    assert.equal(checked.nda_scope, members[0].nda_scope);
  });
});
