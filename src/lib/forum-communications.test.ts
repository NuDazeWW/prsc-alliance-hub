import { describe, it } from "node:test";
import { strictEqual, notStrictEqual } from "node:assert";
import {
  confirmedThroughPoll,
  forumEmailBlock,
  forumInviteEligible,
  forumIdempotencyKey,
} from "./forum-communications";

const cleared = {
  status: "active",
  participates_in_forum: true,
  nda_verified_at: "2026-10-01",
  forum_clearance_status: "cleared",
};
const invitable = { ...cleared, forum_clearance_status: "not_reviewed" };
const briefing = {
  classification: "confidential_forum",
  superseded_at: null,
  is_forum_prep: false,
};

describe("Forum email recipients", () => {
  it("excludes a member with no verified NDA", () => {
    strictEqual(
      forumEmailBlock("forum_confirmed", { ...cleared, nda_verified_at: null }),
      "NDA not verified",
    );
  });
  it("excludes a member opted out of the Forum", () => {
    strictEqual(
      forumEmailBlock("final_agenda", { ...cleared, participates_in_forum: false }),
      "Opted out of Forum",
    );
  });
  it("sends Forum confirmation to an invitable member who is not yet cleared", () => {
    strictEqual(forumEmailBlock("forum_confirmed", invitable), null);
    strictEqual(forumInviteEligible(invitable), true);
  });
  it("withholds the final agenda until Forum clearance is complete", () => {
    strictEqual(forumEmailBlock("final_agenda", invitable), "Not Forum-cleared");
  });
  it("requires both clearance and document permission for the briefing", () => {
    strictEqual(forumEmailBlock("briefing_released", invitable, briefing), "Not Forum-cleared");
    strictEqual(
      forumEmailBlock("briefing_released", cleared, {
        ...briefing,
        classification: "restricted_opportunity",
      }),
      "No access to briefing",
    );
    strictEqual(
      forumEmailBlock("briefing_released", { ...cleared, addendum_complete: true }, briefing),
      null,
    );
  });
  it("keeps Email 8 switched off until follow-up assignments exist", () => {
    notStrictEqual(forumEmailBlock("followup_assigned", cleared), null);
  });
  it("makes duplicate protection specific to forum, version and recipient", () => {
    const a = forumIdempotencyKey("forum-1", "final_agenda", 1, "m1");
    notStrictEqual(a, forumIdempotencyKey("forum-2", "final_agenda", 1, "m1"));
    notStrictEqual(a, forumIdempotencyKey("forum-1", "final_agenda", 2, "m1"));
    notStrictEqual(a, forumIdempotencyKey("forum-1", "final_agenda", 1, "m2"));
    strictEqual(a, forumIdempotencyKey("forum-1", "final_agenda", 1, "m1"));
  });
  it("blocks a second confirmation when the Meetings poll already confirmed the member", () => {
    const polls = [{ invited_member_ids: ["m1", "m2"] }];
    strictEqual(confirmedThroughPoll("m1", polls), true);
    strictEqual(confirmedThroughPoll("m3", polls), false);
    strictEqual(confirmedThroughPoll("m1", []), false);
    strictEqual(confirmedThroughPoll("m1", [{ invited_member_ids: null }]), false);
  });
});
