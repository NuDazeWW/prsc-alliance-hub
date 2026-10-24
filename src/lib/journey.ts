// Five-part recipient journey: pure rules shared by the portal, admin, and server.
// Stage 1 (Forum) is shared; stages 2–4 run per entity track; stage 5 / unstaged
// documents are ongoing records that never affect onboarding progress.

export type JourneyTrack = "shared" | "prsc" | "dis";
export type JourneyDoc = {
  id: string;
  journey_stage: number | null;
  journey_track: JourneyTrack | null;
  sort_order: number;
  created_at: string;
};

export const STAGES = [
  { n: 1, label: "Forum Participation" },
  { n: 2, label: "Entity Orientation" },
  { n: 3, label: "Role Acceptance & Disclosure" },
  { n: 4, label: "Entity Activation" },
  { n: 5, label: "Ongoing & Conditional Records" },
] as const;

export function memberTracks(entity: string): ("prsc" | "dis")[] {
  return entity === "both" ? ["prsc", "dis"] : entity === "dis" ? ["dis"] : ["prsc"];
}

export function isOnboarding(d: Pick<JourneyDoc, "journey_stage">) {
  return d.journey_stage != null && d.journey_stage >= 1 && d.journey_stage <= 4;
}

function order(a: JourneyDoc, b: JourneyDoc) {
  return (a.journey_stage! - b.journey_stage!) || a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);
}

/** Stage 1 is always shared; later onboarding docs without a track belong to the member's first track. */
function trackOf(d: JourneyDoc, entity: string): JourneyTrack {
  if (d.journey_stage === 1) return "shared";
  return d.journey_track && d.journey_track !== "shared" ? d.journey_track : memberTracks(entity)[0];
}

/** IDs of onboarding documents still locked behind an earlier incomplete one. */
export function lockedDocumentIds(docs: JourneyDoc[], done: Set<string>, entity: string): Set<string> {
  const locked = new Set<string>();
  const onboarding = docs.filter(isOnboarding);
  const shared = onboarding.filter((d) => trackOf(d, entity) === "shared").sort(order);
  let blocked = false;
  for (const d of shared) {
    if (blocked) locked.add(d.id);
    else if (!done.has(d.id)) blocked = true;
  }
  const forumOpen = !blocked;
  for (const t of ["prsc", "dis"] as const) {
    let tBlocked = !forumOpen;
    for (const d of onboarding.filter((x) => trackOf(x, entity) === t).sort(order)) {
      if (tBlocked) locked.add(d.id);
      else if (!done.has(d.id)) tBlocked = true;
    }
  }
  return locked;
}

export type JourneyStatus = {
  currentStage: number; // 1–5
  stageDone: boolean[]; // index 0..4 for stages 1..5
  label: string;
  forumCleared: boolean;
};

export function journeyStatus(
  docs: JourneyDoc[],
  done: Set<string>,
  entity: string,
  activated: { prsc: string | null; dis: string | null },
  forum = true,
): JourneyStatus {
  const tracks = memberTracks(entity);
  const onboarding = docs.filter(isOnboarding);
  const stageComplete = (n: number) => onboarding.filter((d) => d.journey_stage === n).every((d) => done.has(d.id));
  const allActivated = tracks.every((t) => activated[t]);
  // Members opted out of the Forum skip Stage 1 entirely (4-stage journey).
  const s1 = !forum || (stageComplete(1) && onboarding.some((d) => d.journey_stage === 1));
  const s2 = s1 && stageComplete(2);
  const s3 = s2 && stageComplete(3);
  const s4 = s3 && stageComplete(4) && allActivated;
  const stageDone = [s1, s2, s3, s4, false];
  const currentStage = s4 ? 5 : s3 ? 4 : s2 ? 3 : s1 ? 2 : 1;
  const label = s4
    ? "Fully Activated"
    : s3
      ? "Pending Activation"
      : s1
        ? forum ? "Forum Cleared — In Entity Qualification" : "In Entity Qualification"
        : "Needs Forum Clearance";
  return { currentStage, stageDone, label, forumCleared: s1 };
}
