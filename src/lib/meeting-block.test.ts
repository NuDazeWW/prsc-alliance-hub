import { describe, test } from "node:test";
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { meetingBlockText, pollFitsMember } from "./meeting-block";

const poll = { title: "Inaugural Board Meeting", meeting_type: "board", format: "virtual", duration_minutes: 60 };

describe("meeting block", () => {
  test("lists every proposed time in date order, in New York time", () => {
    const text = meetingBlockText(poll, [
      { starts_at: "2026-11-13T16:00:00Z" },
      { starts_at: "2026-11-12T19:00:00Z" },
    ]);
    const lines = text.split("\n").filter((l) => l.startsWith("• "));
    deepStrictEqual(lines, ["• Thursday, November 12, 2026 at 2:00 PM EST", "• Friday, November 13, 2026 at 11:00 AM EST"]);
  });
  test("names the meeting, type and length", () => {
    ok(meetingBlockText(poll, []).startsWith("Upcoming meeting: Inaugural Board Meeting (Official Board Meeting)"));
    ok(meetingBlockText(poll, []).includes("Duration: 60 minutes"));
  });
});

describe("meeting audience", () => {
  test("board meetings go to board members and mixed roles", () => {
    strictEqual(pollFitsMember("board", "board_member"), true);
    strictEqual(pollFitsMember("board", "prsc_advisor_dis_board"), true);
    strictEqual(pollFitsMember("board", "advisor"), false);
  });
  test("advisory meetings go to advisors and mixed roles", () => {
    strictEqual(pollFitsMember("advisory", "advisor"), true);
    strictEqual(pollFitsMember("advisory", "board_member"), false);
  });
  test("committee meetings only go to committee members", () => {
    strictEqual(pollFitsMember("methodology", "board_member"), false);
    strictEqual(pollFitsMember("methodology", "board_member", true), true);
    strictEqual(pollFitsMember("methodology", "methodology_committee"), true);
  });
});
