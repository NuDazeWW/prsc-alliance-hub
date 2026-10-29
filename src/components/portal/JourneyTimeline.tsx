import { Check } from "lucide-react";
import { STAGES } from "@/lib/journey";

/** Five-stage recipient journey tracker for the portal header. */
export function JourneyTimeline({
  currentStage,
  stageDone,
  forum = true,
}: {
  currentStage: number;
  stageDone: boolean[];
  forum?: boolean;
}) {
  // Members not attending the Forum see a clean 4-stage journey (Stage 1 hidden, renumbered).
  const stages = forum ? STAGES : STAGES.slice(1);
  const offset = forum ? 0 : 1;
  const current = STAGES[currentStage - 1] ?? STAGES[0];
  return (
    <>
      <div
        className="flex items-center gap-3 lg:hidden"
        aria-label={`Current stage: ${current.label}`}
      >
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-gold bg-navy shadow-[0_0_8px_var(--color-gold)]">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
        <p className="min-w-0 truncate text-[11px] text-ivory/85">{current.label}</p>
        <span className="ml-auto shrink-0 text-[9px] uppercase tracking-[0.14em] text-gold">
          Stage {currentStage - offset} of {stages.length}
        </span>
      </div>
      <ol className="hidden min-w-[700px] items-start lg:flex" aria-label="Your journey">
        {stages.map((s, j) => {
          const i = j + offset;
          const state = stageDone[i] ? "done" : s.n === currentStage ? "current" : "upcoming";
          return (
            <li key={s.n} className="relative min-w-0 flex-1 pr-3 last:pr-0">
              <div className="flex items-center">
                <span
                  className={`relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                    state === "done"
                      ? "border-gold bg-gold text-navy"
                      : state === "current"
                        ? "border-gold bg-navy shadow-[0_0_8px_var(--color-gold)]"
                        : "border-ivory/25 bg-navy"
                  }`}
                >
                  {state === "done" ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : state === "current" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  ) : null}
                </span>
                {j < stages.length - 1 && (
                  <span
                    className={`h-px min-w-3 flex-1 ${state === "done" ? "bg-gold/70" : "bg-ivory/15"}`}
                    aria-hidden
                  />
                )}
              </div>
              <p
                className={`mt-2 pr-2 text-[11px] leading-4 ${state === "upcoming" ? "text-ivory/40" : "text-ivory/85"}`}
              >
                {s.label}
                {state === "current" && (
                  <span className="ml-1.5 text-[9px] uppercase tracking-[0.14em] text-gold">
                    Now
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ol>
    </>
  );
}
