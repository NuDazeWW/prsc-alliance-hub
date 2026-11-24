// Forum invitees only ever go through the Forum steps, never Stages 2 to 5, so they get their own four-step label.
export type ForumStepInput = {
  forum_clearance_status?: string | null;
  documents_released_at?: string | null;
  documents_completed_at?: string | null;
};

export const FORUM_STEP_LABELS = ["Welcome & profile", "Documents", "Clearance review", "Forum cleared"] as const;

export function forumStep(m: ForumStepInput): { n: 1 | 2 | 3 | 4; total: 4; label: string } {
  const cleared = m.forum_clearance_status === "cleared" || m.forum_clearance_status === "cleared_restricted";
  const n = cleared ? 4 : m.documents_completed_at ? 3 : m.documents_released_at ? 2 : 1;
  return { n: n as 1 | 2 | 3 | 4, total: 4, label: FORUM_STEP_LABELS[n - 1] };
}

export const forumStepText = (m: ForumStepInput) => { const s = forumStep(m); return `Step ${s.n} of ${s.total} · ${s.label}`; };
