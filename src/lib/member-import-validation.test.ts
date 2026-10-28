import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { importWhyYouSchema, invitationWhyYouSchema, invitationNoteReady, linkedinSourceUrlSchema, rosterProfileSourceSchema, saveMemberInvitationNotesSchema } from "./member-import-validation";

describe("roster preparation and invitation note validation", () => {
  it("allows blank, null, missing, and short Why you notes while preparing the roster", () => {
    for (const value of ["", "   ", null, undefined]) assert.equal(importWhyYouSchema.parse(value), "");
    assert.equal(importWhyYouSchema.parse("  Draft later.  "), "Draft later.");
    assert.equal(importWhyYouSchema.safeParse("x".repeat(2001)).success, false);
    assert.equal(importWhyYouSchema.safeParse({ text: "Invented" }).success, false);
  });

  it("keeps the separate invitation minimum and refuses empty or incomplete notes", () => {
    for (const value of ["", " ", null, undefined, "Draft later.", "x".repeat(19)]) {
      assert.equal(invitationWhyYouSchema.safeParse(value).success, false);
      assert.equal(invitationNoteReady(value), false);
    }
    assert.equal(invitationNoteReady("x".repeat(20)), true);
    assert.equal(invitationNoteReady("x".repeat(2001)), false);
  });

  it("normalizes a missing source link to SQL NULL without inventing a source", () => {
    for (const value of ["", "  ", null, undefined]) assert.equal(linkedinSourceUrlSchema.parse(value), null);
    assert.deepEqual(rosterProfileSourceSchema.parse({}), { linkedin_url: null, background: "" });
  });

  it("accepts only public professional LinkedIn profiles, retaining valid source URLs", () => {
    for (const url of [
      "https://www.linkedin.com/in/test-one/", "https://linkedin.com/in/test-two",
      "https://uk.linkedin.com/in/test-three?trk=public_profile", "https://www.linkedin.com/pub/test-four/1/2/3",
    ]) assert.equal(linkedinSourceUrlSchema.parse(`  ${url}  `), url);
    for (const url of [
      "http://linkedin.com/in/test", "https://example.test/in/test", "https://linkedin.com.evil.test/in/test",
      "https://linkedin.com@evil.test/in/test", "https://user:password@linkedin.com/in/test",
      "https://linkedin.com:444/in/test", "https://linkedin.com/company/test", "https://linkedin.com/feed",
      "https://127.0.0.1/in/test", "file:///in/test", "https://linkedin.com/in/test\\other",
      "https://linkedin.com/in/test\nother",
    ]) assert.equal(linkedinSourceUrlSchema.safeParse(url).success, false, url);
  });

  it("saves fictional member-specific notes and links only against the selected row version", () => {
    for (const n of [1, 2, 3, 4]) {
      const input = { member_id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, expected_updated_at: "2026-10-28T12:34:56.123456+00:00", why_you: n % 2 ? null : `Reviewed note for fictional Test ${n}.`, linkedin_url: `https://www.linkedin.com/in/fictional-test-${n}` };
      const parsed = saveMemberInvitationNotesSchema.parse(input);
      assert.equal(parsed.member_id, input.member_id);
      assert.equal(parsed.linkedin_url, input.linkedin_url);
      assert.equal(parsed.why_you, input.why_you ?? "");
      for (const extra of [{ nda_confirmed: true }, { role: "admin" }, { status: "active" }, { send_invitations: true }, { background: "Not persisted" }]) {
        assert.equal(saveMemberInvitationNotesSchema.safeParse({ ...input, ...extra }).success, false);
      }
    }
  });

  it("keeps administrator background transient and bounded", () => {
    assert.deepEqual(rosterProfileSourceSchema.parse({ linkedin_url: null, background: "  Supplied facts.  " }), { linkedin_url: null, background: "Supplied facts." });
    assert.equal(rosterProfileSourceSchema.safeParse({ background: "x".repeat(8001) }).success, false);
    assert.equal(rosterProfileSourceSchema.safeParse({ nda_verified: true }).success, false);
  });
});
