import { STAGES, type JourneyStatus } from "./journey";

/** Display the existing journey status without presenting a storage entity as an assignment. */
export function memberJourneyPresentation(
  member: { is_candidate?: boolean | null; participates_in_forum?: boolean | null },
  journey: JourneyStatus,
) {
  const forumOnly = member.is_candidate === true;
  const forumParticipationComplete = member.participates_in_forum !== false && journey.stageDone[0] === true && journey.forumCleared;
  const label = forumOnly
    ? forumParticipationComplete ? `${STAGES[0].label} complete` : journey.currentStage === 1 ? journey.label : STAGES[0].label
    : journey.label;
  return { forumOnly, forumParticipationComplete, label };
}
