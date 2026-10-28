import { test } from "node:test";
import { strictEqual } from "node:assert";
import { journeyStatus, type JourneyDoc } from "./journey";
import { memberJourneyPresentation } from "./member-journey-presentation";

const forumDocument: JourneyDoc = { id: "forum", journey_stage: 1, journey_track: "shared", sort_order: 1, created_at: "2026-10-01" };
const noActivation = { prsc: null, dis: null };

test("Forum-only members do not appear to enter entity qualification after clearance", () => {
  const journey = journeyStatus([forumDocument], new Set(["forum"]), "prsc", noActivation, true, true);
  strictEqual(journey.currentStage, 2);
  const presented = memberJourneyPresentation({ is_candidate: true }, journey);
  strictEqual(presented.forumOnly, true);
  strictEqual(presented.forumParticipationComplete, true);
  strictEqual(presented.label, "Forum Participation complete");
});

test("completed Forum documents remain pending until actual Forum clearance", () => {
  const journey = journeyStatus([forumDocument], new Set(["forum"]), "prsc", noActivation, true, false);
  const presented = memberJourneyPresentation({ is_candidate: true }, journey);
  strictEqual(presented.forumParticipationComplete, false);
  strictEqual(presented.label, "Clearance Pending Review");
});

test("an unreleased Forum stage does not count as completed", () => {
  const journey = journeyStatus([], new Set(), "prsc", noActivation, true, false);
  const presented = memberJourneyPresentation({ is_candidate: true }, journey);
  strictEqual(presented.forumParticipationComplete, false);
  strictEqual(presented.label, "Needs Forum Clearance");
});

test("a Forum opt-out does not claim completed participation", () => {
  const journey = journeyStatus([], new Set(), "prsc", noActivation, false, false);
  const presented = memberJourneyPresentation({ is_candidate: true, participates_in_forum: false }, journey);
  strictEqual(presented.forumParticipationComplete, false);
  strictEqual(presented.label, "Forum Participation");
});

test("members with an entity assignment retain existing journey presentation", () => {
  const journey = journeyStatus([forumDocument], new Set(["forum"]), "both", noActivation, true, true);
  const presented = memberJourneyPresentation({ is_candidate: false }, journey);
  strictEqual(presented.forumOnly, false);
  strictEqual(presented.label, journey.label);
});
