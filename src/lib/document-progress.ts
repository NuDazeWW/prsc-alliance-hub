// What the Personal Documents progress header counts, stated plainly.
// Only active onboarding actions (journey stages 1–4) count. Reference files, one-off records and
// historical (superseded) records are shown separately and never change the count.

import { isOnboarding } from "./journey";

export type ProgressDoc = { id: string; journey_stage: number | null };

export type DocumentProgress = {
  required: { done: number; total: number };
  otherCount: number;
  historyCount: number;
  /** e.g. "Required actions: 0 of 1 complete" */
  requiredLabel: string | null;
  /** e.g. "Also shown, not counted: 1 reference or one-off file · 2 historical records" */
  alsoShownLabel: string | null;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function documentProgress(
  active: ProgressDoc[],
  history: { id: string }[],
  doneIds: ReadonlySet<string>,
): DocumentProgress {
  const required = active.filter(isOnboarding);
  const done = required.filter((d) => doneIds.has(d.id)).length;
  const otherCount = active.length - required.length;
  const parts: string[] = [];
  if (otherCount > 0)
    parts.push(plural(otherCount, "reference or one-off file", "reference or one-off files"));
  if (history.length > 0)
    parts.push(plural(history.length, "historical record", "historical records"));
  return {
    required: { done, total: required.length },
    otherCount,
    historyCount: history.length,
    requiredLabel:
      required.length > 0 ? `Required actions: ${done} of ${required.length} complete` : null,
    alsoShownLabel: parts.length > 0 ? `Also shown, not counted: ${parts.join(" · ")}` : null,
  };
}
