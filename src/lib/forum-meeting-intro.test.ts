import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FORUM_INTRO_PARAGRAPHS, FORUM_NON_VOTING_NOTE, forumSlotsSentence, isForumPoll, slotCountWord } from "./forum-meeting-intro";

describe("Forum meeting calendar introduction", () => {
  it("uses the approved wording for the standard three slots", () => {
    assert.equal(
      forumSlotsSentence(3),
      "We want to meet as soon as possible. We know your time is valuable and calendars are busy, so we've started with three initial meeting slots. Please select every option below that works for you.",
    );
  });

  it("stays accurate when a poll has a different number of slots", () => {
    assert.equal(slotCountWord(2), "two");
    assert.equal(slotCountWord(12), "12");
    assert.match(forumSlotsSentence(1), /one initial meeting slot\./);
    assert.match(forumSlotsSentence(4), /four initial meeting slots\./);
  });

  it("recognises Forum polls only", () => {
    assert.equal(isForumPoll({ meeting_type: "forum", title: "Anything" }), true);
    assert.equal(isForumPoll({ meeting_type: "Forum", title: "x" }), true);
    assert.equal(isForumPoll({ meeting_type: "custom", title: "United Strategic Coordination Forum" }), true);
    assert.equal(isForumPoll({ meeting_type: "board", title: "Inaugural Board Meeting" }), false);
    assert.equal(isForumPoll({ meeting_type: "advisory", title: null }), false);
    assert.equal(isForumPoll({}), false);
  });

  it("keeps restricted briefing details out of the general scheduling copy", () => {
    const copy = [...FORUM_INTRO_PARAGRAPHS, FORUM_NON_VOTING_NOTE, forumSlotsSentence(3)].join(" ");
    assert.doesNotMatch(copy, /jared|nascar/i);
  });

  it("states that participation is non-voting and not an appointment", () => {
    assert.match(FORUM_NON_VOTING_NOTE, /non-voting/);
    assert.match(FORUM_NON_VOTING_NOTE, /does not constitute an appointment to PRSC or DIS/);
  });
});
