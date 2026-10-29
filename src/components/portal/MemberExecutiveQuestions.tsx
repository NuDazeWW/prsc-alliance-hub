import { userFacingError } from "@/lib/user-facing-error";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getMyQuestionRounds, saveMyQuestions } from "@/lib/executive-questions.functions";
import { MAX_QUESTIONS, QUESTION_SOURCES } from "@/lib/executive-questions";

type Q = {
  priority: number;
  question: string;
  why_it_matters: string;
  source: string;
  context: string;
};
const blank = (p: number): Q => ({
  priority: p,
  question: "",
  why_it_matters: "",
  source: "internal",
  context: "",
});
const field = "mt-1 w-full rounded-md border border-input bg-navy px-3 py-2 text-base text-ivory";

type QuestionRound = Awaited<ReturnType<typeof getMyQuestionRounds>>["rounds"][number];

/** Executive Questions inside the Forum workspace. Shown only to cleared participants with briefing access. */
export function MemberExecutiveQuestions({ readOnly = false }: { readOnly?: boolean }) {
  const q = useQuery({
    queryKey: ["my-question-rounds"],
    queryFn: () => getMyQuestionRounds().catch(() => ({ rounds: [] })),
  });
  const rounds: QuestionRound[] = q.data?.rounds ?? [];
  if (!rounds.length) return null;
  return (
    <section
      id="executive-questions"
      className="scroll-mt-6 border border-gold/25 bg-[linear-gradient(135deg,var(--color-midnight),var(--color-navy))] p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Strategic Forum</p>
      <h2 className="mt-2 font-serif text-2xl text-ivory">Executive Questions</h2>
      <p className="mt-2 text-sm text-ivory/60">
        Share up to three questions we may not have considered. Optional, and not required to attend
        the Forum. Your questions are seen only by you and the Secretariat
      </p>
      <div className="mt-6 space-y-8">
        {rounds.map((r) => (
          <RoundForm key={r.id} round={r} readOnly={readOnly} />
        ))}
      </div>
    </section>
  );
}

function RoundForm({ round, readOnly }: { round: QuestionRound; readOnly: boolean }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<Q[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    setItems(
      round.questions.length
        ? round.questions.map((x) => ({ ...x, context: x.context ?? "" }))
        : [blank(1)],
    );
  }, [round.id]);
  const editable = round.open && !readOnly;
  async function save(noQuestions: boolean) {
    setStatus("");
    try {
      const qs = items
        .filter((i) => i.question.trim())
        .map((i, n) => ({ ...i, priority: n + 1, context: i.context || null }));
      await saveMyQuestions({
        data: { round_id: round.id, no_questions: noQuestions, questions: noQuestions ? [] : qs },
      });
      setStatus(
        noQuestions
          ? "Recorded: no additional questions."
          : "Your questions are saved. You can edit them until the deadline.",
      );
      await qc.invalidateQueries({ queryKey: ["my-question-rounds"] });
    } catch (e) {
      setStatus(userFacingError(e, "Could not save"));
    }
  }
  const resp = round.response?.status;
  return (
    <div className="border border-gold/15 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg text-ivory">{round.title}</p>
        <p className="text-sm text-ivory/60">
          {round.open
            ? `Open until ${new Date(round.deadline).toLocaleString()}`
            : `Closed ${new Date(round.deadline).toLocaleDateString()}`}
        </p>
      </div>
      <p className="mt-1 text-sm text-gold">
        Status:{" "}
        {resp === "submitted"
          ? "Submitted"
          : resp === "no_questions"
            ? "No additional questions"
            : "Not yet submitted"}
      </p>
      <div className="mt-4 space-y-5">
        {items.map((it, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm text-ivory/70">
              Question {i + 1} (priority {i + 1})
            </p>
            <textarea
              disabled={!editable}
              aria-label={`Question ${i + 1}`}
              value={it.question}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))
              }
              rows={2}
              className={field}
              placeholder="Your question"
            />
            <textarea
              disabled={!editable}
              aria-label={`Why question ${i + 1} matters`}
              value={it.why_it_matters}
              onChange={(e) =>
                setItems(
                  items.map((x, j) => (j === i ? { ...x, why_it_matters: e.target.value } : x)),
                )
              }
              rows={2}
              className={field}
              placeholder="Why it matters"
            />
            <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
              <select
                disabled={!editable}
                aria-label={`Source for question ${i + 1}`}
                value={it.source}
                onChange={(e) =>
                  setItems(items.map((x, j) => (j === i ? { ...x, source: e.target.value } : x)))
                }
                className={field}
              >
                {QUESTION_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <input
                disabled={!editable}
                aria-label={`Context for question ${i + 1}`}
                value={it.context}
                onChange={(e) =>
                  setItems(items.map((x, j) => (j === i ? { ...x, context: e.target.value } : x)))
                }
                className={field}
                placeholder="Supporting context (optional)"
              />
            </div>
            {editable && items.length > 1 && (
              <button
                type="button"
                className="text-sm text-ivory/50 underline"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {editable && (
        <div className="mt-5 flex flex-wrap gap-3">
          {items.length < MAX_QUESTIONS && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setItems([...items, blank(items.length + 1)])}
            >
              Add a question
            </Button>
          )}
          <Button type="button" onClick={() => save(false)}>
            Submit Questions
          </Button>
          <Button type="button" variant="outline" onClick={() => save(true)}>
            No additional questions
          </Button>
        </div>
      )}
      {status && (
        <p className="mt-3 text-sm text-ivory/70" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
