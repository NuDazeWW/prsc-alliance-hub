import { test } from "node:test";
import assert from "node:assert/strict";
import { importPortalMembersSchema, invitePortalMemberSchema } from "./portal-member-input";
import { parseMemberList } from "./member-import";
import { invitationNoteReady } from "./member-import-validation";

const csv = `first_name,last_name,email,organization,title,invitation_type,entity,roles,methodology_committee,linkedin_url,why_you
Test,One,test1@example.test,,,forum_invitee,None,,Undetermined,https://www.linkedin.com/in/test-one/,
Test,Two,test2@example.test,,,forum_invitee,None,,No,https://www.linkedin.com/in/test-two/,
Test,Three,test3@example.test,Example Group,Executive,forum_invitee,None,,Undetermined,,
Test,Four,test4@example.test,,,forum_invitee,None,,Undetermined,https://www.linkedin.com/in/test-four/,`;

function rows() {
  const parsed = parseMemberList(csv);
  assert.deepEqual(parsed.errors, []);
  return parsed.rows.map(({ background: _background, ...row }) => row);
}

test("Test 1–4 can save a Forum-only roster with no entity, job details or Why You draft", () => {
  const parsed = importPortalMembersSchema.parse({ send_invitations: false, rows: rows() });
  assert.equal(parsed.rows.length, 4);
  for (const row of parsed.rows) {
    assert.equal(row.why_you, "");
    assert.equal(row.intended_designation?.entity, "none");
    assert.equal(row.intended_designation?.kind, "forum_invitee");
    assert.equal(row.is_candidate, true);
    assert.equal(invitationNoteReady(row.why_you), false);
    assert.equal(row.nda_confirmed, undefined);
  }
});

test("the same unfinished four-person roster is rejected when invitation delivery is requested", () => {
  const parsed = importPortalMembersSchema.safeParse({ send_invitations: true, rows: rows() });
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.deepEqual(parsed.error.issues.map((issue) => issue.path), [0, 1, 2, 3].map((index) => ["rows", index, "why_you"]));
});

test("a partially written note may be saved but still cannot be sent", () => {
  const pending = { ...rows()[0], why_you: "Draft" };
  assert.equal(importPortalMembersSchema.safeParse({ send_invitations: false, rows: [pending] }).success, true);
  assert.equal(invitePortalMemberSchema.safeParse(pending).success, false);
});

test("each persisted LinkedIn link remains associated with its original recipient", () => {
  const saved = importPortalMembersSchema.parse({ send_invitations: false, rows: rows() }).rows;
  assert.deepEqual(saved.map(({ email, linkedin_url }) => [email, linkedin_url]), [
    ["test1@example.test", "https://www.linkedin.com/in/test-one/"],
    ["test2@example.test", "https://www.linkedin.com/in/test-two/"],
    ["test3@example.test", null],
    ["test4@example.test", "https://www.linkedin.com/in/test-four/"],
  ]);
});

test("a reviewed substantive note passes input validation without assigning an entity role", () => {
  const row = { ...rows()[0], why_you: "We value your professional perspective for the Forum discussion." };
  const parsed = invitePortalMemberSchema.parse(row);
  assert.equal(parsed.intended_designation?.entity, "none");
  assert.deepEqual(parsed.intended_designation?.roles, []);
  assert.equal(parsed.nda_confirmed, undefined, "input validation cannot invent NDA verification");
});

test("imports cannot smuggle selected-member IDs or another person's NDA review IDs", () => {
  const row = rows()[0];
  for (const key of ["selected_member_id", "nda_review_id"]) {
    assert.equal(importPortalMembersSchema.safeParse({ send_invitations: false, rows: [{ ...row, [key]: "11111111-1111-4111-8111-111111111111" }] }).success, false);
  }
});

test("unfinished roster validation preserves upper bounds and source URL checks", () => {
  const row = rows()[0];
  for (const patch of [{ why_you: "x".repeat(2001) }, { organization: "x".repeat(181) }, { linkedin_url: "https://example.test/profile" }]) {
    assert.equal(importPortalMembersSchema.safeParse({ send_invitations: false, rows: [{ ...row, ...patch }] }).success, false);
  }
});
