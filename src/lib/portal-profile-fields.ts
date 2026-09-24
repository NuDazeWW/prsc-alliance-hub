export const PORTAL_PROFILE_STAGES = [
  "Your information",
  "Your experience",
  "Visibility & participation",
  "Final details",
  "Received",
] as const;

export const PORTAL_EXPERIENCE_QUESTIONS = [
  "What perspective or expertise do you bring to this work?",
  "Which market challenges deserve the greatest attention?",
  "Where do you see the strongest opportunity for impact?",
  "Which stakeholders should this work serve first?",
  "What would make this initiative credible to you?",
  "What should success look like over the next 12–24 months?",
] as const;

export const PORTAL_VISIBILITY_PERMISSIONS = [
  "Use my name in company materials",
  "Use my title and organization",
  "Use my professional biography",
  "Use my headshot",
  "Reference my participation in investor materials",
  "Invite me to selected external briefings",
] as const;

export const PORTAL_PERMISSION_LABELS: Record<string, string> = {
  yes: "Yes",
  discuss: "Discuss first",
  no: "No",
};