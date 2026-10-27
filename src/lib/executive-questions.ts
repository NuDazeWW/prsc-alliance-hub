// Executive Questions rules (Strategic Forum Center, minimum Priority B slice).
// Shared by the member card, the admin register and server enforcement.
import { forumCleared } from "@/lib/governance";

export const MAX_QUESTIONS = 3;
export const QUESTION_SOURCES = [
  { value: "jared", label: "Jared" },
  { value: "internal", label: "Internal PRSC/DIS" },
  { value: "external", label: "External verification" },
] as const;
export const QUESTION_CATEGORIES = ["opportunity", "vanguard_strategy", "data_methodology", "commercial", "governance", "technology", "execution", "other"] as const;
export const CATEGORY_LABELS: Record<string, string> = {
  opportunity: "Opportunity", vanguard_strategy: "Vanguard strategy", data_methodology: "Data and methodology", commercial: "Commercial relationships",
  governance: "Governance", technology: "Technology", execution: "Execution", other: "Other",
};
export const ROUTES = ["C", "P", "D", "X"] as const;
export const EXTERNAL_DISCLAIMER = "Statements are not official NASCAR commitments or independently verified conclusions";

export type Round = { status: string; opens_at: string; deadline: string };
export type QuestionMember = { status: string; participates_in_forum: boolean | null; nda_verified_at: string | null; forum_clearance_status: string };

/** Null when the member may view and edit questions in this round, else the reason. */
export function questionAccessBlock(m: QuestionMember, hasBriefing: boolean): string | null {
  if (m.status === "revoked") return "Access is not active";
  if (m.participates_in_forum === false) return "Not participating in the Forum";
  if (!m.nda_verified_at) return "NDA not verified";
  if (!forumCleared(m.forum_clearance_status)) return "Forum clearance is not complete";
  if (!hasBriefing) return "The strategic briefing has not been individually authorized for you yet";
  return null;
}

export function roundOpen(r: Round, now = new Date()) {
  return r.status === "open" && now >= new Date(r.opens_at) && now < new Date(r.deadline);
}

export type QuestionInput = { priority: number; question: string; why_it_matters: string; source: string; context?: string | null };

export function validateQuestions(qs: QuestionInput[]): string | null {
  if (qs.length > MAX_QUESTIONS) return `Up to ${MAX_QUESTIONS} questions per round`;
  const pr = new Set<number>();
  for (const q of qs) {
    if (![1, 2, 3].includes(q.priority) || pr.has(q.priority)) return "Each question needs a unique priority from 1 to 3";
    pr.add(q.priority);
    if (!q.question.trim() || !q.why_it_matters.trim()) return "Each question needs the question and why it matters";
    if (!QUESTION_SOURCES.some((s) => s.value === q.source)) return "Choose an information source";
  }
  return null;
}

/** Reminders skip anyone who submitted or chose "No additional questions". */
export function needsReminder(responseStatus: string | null | undefined) {
  return !responseStatus;
}

/** Outbound lists can be marked shared only after founder/Secretariat approval is recorded. */
export function shareBlock(o: { approved_at: string | null }): string | null {
  return o.approved_at ? null : "Founder or authorized Secretariat approval is required before sharing";
}
