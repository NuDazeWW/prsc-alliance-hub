// The one next incomplete step shown in the Welcome Center.
// Closing a popup never completes anything: each step is "done" only from its own real record.

export type NextStepKey = "orientation" | "availability" | "documents" | "profile";

export type NextStep = { key: NextStepKey; title: string; detail: string; action: string };

export function nextIncompleteStep(input: {
  needsOrientation: boolean;
  orientationStarted: boolean;
  pendingMeetings: number;
  documentsRemaining: number;
  profileComplete: boolean;
}): NextStep | null {
  if (input.needsOrientation) {
    return input.orientationStarted
      ? {
          key: "orientation",
          title: "Finish your 5-minute orientation",
          detail: "Pick up where you left off. Your place was saved.",
          action: "Continue Orientation",
        }
      : {
          key: "orientation",
          title: "Begin your 5-minute orientation",
          detail: "A current picture of PRSC and DIS, and why your role matters.",
          action: "Begin Orientation",
        };
  }
  if (input.pendingMeetings > 0) {
    return {
      key: "availability",
      title: "Mark your meeting availability",
      detail: `${input.pendingMeetings} meeting${input.pendingMeetings === 1 ? " is" : "s are"} waiting for your response.`,
      action: "Open Meeting Calendar",
    };
  }
  if (input.documentsRemaining > 0) {
    return {
      key: "documents",
      title: "Review your released documents",
      detail: `${input.documentsRemaining} document${input.documentsRemaining === 1 ? " needs" : "s need"} your attention.`,
      action: "Open Your Personal Documents",
    };
  }
  if (!input.profileComplete) {
    return {
      key: "profile",
      title: "Complete your Executive Profile",
      detail: "Optional for Forum participation. About 7–10 minutes, and private.",
      action: "Complete Executive Profile",
    };
  }
  return null;
}
