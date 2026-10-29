// Client-side resume marker for the 5-minute orientation.
// It only remembers which chapter a member was on. It is never a completion record:
// completion is recorded by the server (`acknowledgeOrientation`) and nothing here feeds it.

export const ORIENTATION_CHAPTERS = 6;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const progressKey = (memberId: string) => `prsc-orientation-progress:${memberId}`;
const dismissedKey = (memberId: string) => `prsc-orientation-dismissed:${memberId}`;

function browserStore(kind: "local" | "session"): Store | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Saved chapter index (0-based), or null when there is no usable progress to resume. */
export function readOrientationStep(memberId: string | null | undefined, store: Store | null = browserStore("local"), chapters = ORIENTATION_CHAPTERS): number | null {
  if (!memberId || !store) return null;
  try {
    const raw = store.getItem(progressKey(memberId));
    if (raw === null || !/^\d+$/.test(raw)) return null;
    const step = Number(raw);
    return step < chapters ? step : null;
  } catch {
    return null;
  }
}

export function saveOrientationStep(memberId: string | null | undefined, step: number, store: Store | null = browserStore("local")) {
  if (!memberId || !store) return;
  try {
    store.setItem(progressKey(memberId), String(step));
  } catch {
    /* storage unavailable: resume simply starts at the beginning */
  }
}

export function clearOrientationProgress(memberId: string | null | undefined, local: Store | null = browserStore("local"), session: Store | null = browserStore("session")) {
  if (!memberId) return;
  try { local?.removeItem(progressKey(memberId)); } catch { /* ignore */ }
  try { session?.removeItem(dismissedKey(memberId)); } catch { /* ignore */ }
}

/** True once the member has closed the orientation themselves during this browser session. */
export function orientationDismissed(memberId: string | null | undefined, store: Store | null = browserStore("session")) {
  if (!memberId || !store) return false;
  try {
    return store.getItem(dismissedKey(memberId)) === "1";
  } catch {
    return false;
  }
}

export function markOrientationDismissed(memberId: string | null | undefined, store: Store | null = browserStore("session")) {
  if (!memberId || !store) return;
  try {
    store.setItem(dismissedKey(memberId), "1");
  } catch {
    /* ignore */
  }
}

/**
 * Whether the orientation should open by itself when the Welcome Center loads.
 * Members who have not completed it are shown it, unless they closed it on purpose this session
 * (they then get the Continue Orientation action instead of being forced back into a popup).
 */
export function shouldAutoOpenOrientation(input: { needsOrientation: boolean; memberId: string | null | undefined; alreadyOpenedFor: string | null; dismissed: boolean }) {
  if (!input.needsOrientation || !input.memberId) return false;
  if (input.alreadyOpenedFor === input.memberId) return false;
  return !input.dismissed;
}
