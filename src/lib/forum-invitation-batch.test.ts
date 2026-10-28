import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eligibleForumInvitee, forumBatchAsyncToken, forumBatchInvitationPayload, forumBatchNotesSaved, forumBatchReadyProblem, forumBatchRow, type ForumInviteMember } from "./forum-invitation-batch";

const members: ForumInviteMember[] = [1, 2, 3, 4].map((n) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, first_name: "Test", last_name: String(n),
  email: `fictional-${n}@example.test`, organization: `Fictional Org ${n}`, title: "Executive", entity: "prsc", role: "advisor",
  is_candidate: true, is_methodology_committee: false, participates_in_forum: true, status: "invited", updated_at: "2026-10-28T12:34:56.123456+00:00",
  intended_designation: { version: 1, kind: "forum_invitee", entity: "none", roles: [], other_text: "", committee: "undetermined" },
  why_you: `Reviewed invitation note for fictional Test ${n}.`, linkedin_url: `https://linkedin.com/in/fictional-${n}`,
  nda_reference: `fictional-nda-${n}`, nda_entities: "both", nda_scope: `Individual scope ${n}`,
  nda_verified_at: "2026-10-01T12:00:00Z", nda_verified_by: "10000000-0000-4000-8000-000000000001",
}));
const reviewed = (index = 0) => ({ ...forumBatchRow(members[index], index + 1), loaded: true, loading: false,
  nda_reference: members[index].nda_reference!, nda_entities: "both" as const, nda_scope: members[index].nda_scope!,
  nda_confirmed: true, ndaReviewId: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}` });

describe("saved Forum invitation preparation", () => {
  it("initializes four independent recipients without prechecking NDA confirmation or loading another proof", () => {
    const rows = members.map((member, i) => forumBatchRow(member, i + 1));
    assert.equal(new Set(rows.map((row) => row.member.id)).size, 4);
    rows.forEach((row, i) => {
      assert.equal(row.member.email, members[i].email);
      assert.equal(row.linkedin_url, members[i].linkedin_url);
      assert.equal(row.nda_confirmed, false); assert.equal(row.ndaReviewId, null);
      assert.equal(row.nda_reference, ""); assert.equal(row.nda_scope, "");
      assert.equal(forumBatchReadyProblem(row), "Load this recipient’s current stored record.");
    });
  });

  it("lists only current Forum-only candidates, retaining entity intentions separately", () => {
    assert.equal(eligibleForumInvitee(members[0]), true);
    assert.equal(eligibleForumInvitee({ ...members[0], is_candidate: false }), false);
    assert.equal(eligibleForumInvitee({ ...members[0], status: "revoked" }), false);
    assert.equal(eligibleForumInvitee({ ...members[0], intended_designation: { version: 1, kind: "identified", entity: "dis", roles: ["dis_advisor"], other_text: "", committee: "no" } }), false);
  });

  it("changes asynchronous draft tokens after identity, selection, note, source, or background changes", () => {
    const row = reviewed(); const token = forumBatchAsyncToken(row);
    for (const changed of [
      { ...row, member: { ...row.member, id: members[1].id } },
      { ...row, member: { ...row.member, email: members[1].email } },
      { ...row, epoch: row.epoch + 1 }, { ...row, revision: row.revision + 1 },
      { ...row, why_you: "New administrator text." }, { ...row, linkedin_url: members[1].linkedin_url! },
      { ...row, background: "New supplied background." },
      { ...row, member: { ...row.member, updated_at: "2026-10-28T12:34:57+00:00" } },
    ]) assert.notEqual(forumBatchAsyncToken(changed), token);
  });

  it("requires a saved note and source, yet allows blanks to remain in preparation", () => {
    const row = reviewed(); assert.equal(forumBatchNotesSaved(row), true);
    assert.equal(forumBatchNotesSaved({ ...row, why_you: "A different reviewed note." }), false);
    assert.equal(forumBatchNotesSaved({ ...row, linkedin_url: members[1].linkedin_url! }), false);
    assert.equal(forumBatchNotesSaved({ ...row, linkedin_url: "https://example.test" }), false);
    const blank = { ...row, why_you: "", member: { ...row.member, why_you: "" } };
    assert.equal(forumBatchNotesSaved(blank), true);
    assert.match(forumBatchReadyProblem(blank)!, /at least 20/);
  });

  it("keeps missing, insufficient, unchecked, changed, and unsaved NDA evidence ineligible", () => {
    const row = reviewed(); assert.equal(forumBatchReadyProblem(row), null);
    for (const changed of [
      { ...row, nda_confirmed: false }, { ...row, ndaReviewId: null }, { ...row, nda_reference: members[1].nda_reference! },
      { ...row, nda_scope: "Changed disclosure scope." }, { ...row, eligibilityProblem: "NDA does not cover every entity." },
      { ...row, needsReload: true }, { ...row, selected: false },
    ]) assert.ok(forumBatchReadyProblem(changed));
  });

  it("builds each invitation from its own saved identity and review, with neutral legacy roles and no appointment claims", () => {
    members.forEach((member, i) => {
      const payload = forumBatchInvitationPayload(reviewed(i));
      assert.equal(payload.selected_member_id, member.id); assert.equal(payload.email, member.email);
      assert.equal(payload.nda_recipient_email, member.email); assert.equal(payload.nda_reference, member.nda_reference);
      assert.equal(payload.nda_scope, member.nda_scope); assert.equal(payload.why_you, member.why_you);
      assert.equal(payload.intended_designation.entity, "none"); assert.equal(payload.is_candidate, true);
      assert.equal(payload.role, "advisor"); assert.equal("role_review" in payload, false);
      assert.equal("prsc_activated_at" in payload, false); assert.equal("dis_activated_at" in payload, false);
    });
  });

  it("locks successful and uncertain delivery attempts against another send in the same batch state", () => {
    const row = reviewed();
    for (const sent of [false, true]) {
      const attempted = { ...row, deliveryAttempted: true, sent };
      assert.ok(forumBatchReadyProblem(attempted));
      assert.throws(() => forumBatchInvitationPayload(attempted));
    }
  });
});
