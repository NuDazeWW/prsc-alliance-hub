import { Check } from "lucide-react";

type State = "done" | "current" | "upcoming";

export function StatusTimeline({
  profileComplete,
  packageStatus,
  documentsReleased,
  allAcknowledged,
  horizontal = false,
}: {
  profileComplete: boolean;
  packageStatus: string;
  documentsReleased: boolean;
  allAcknowledged: boolean;
  horizontal?: boolean;
}) {
  const reviewed = profileComplete && (packageStatus === "in_preparation" || packageStatus === "package_ready" || documentsReleased);
  const prepared = reviewed && (packageStatus === "package_ready" || documentsReleased);
  const steps: { label: string; note: string; state: State }[] = [
    {
      label: "Profile submitted",
      note: profileComplete ? "Received and on file." : "Complete your profile to begin.",
      state: profileComplete ? "done" : "current",
    },
    {
      label: "Leadership review",
      note: reviewed ? "Your profile has been reviewed." : "Our team is reviewing your answers.",
      state: !profileComplete ? "upcoming" : reviewed ? "done" : "current",
    },
    {
      label: "Document preparation",
      note: prepared ? "Your documents have been released." : "Your individualized package is being prepared.",
      state: !reviewed ? "upcoming" : prepared ? "done" : "current",
    },
    {
      label: "Your next steps",
      note: allAcknowledged ? "All documents completed. We'll be in touch." : "Sign, review, and return your documents.",
      state: !prepared ? "upcoming" : allAcknowledged ? "done" : "current",
    },
  ];

  if (horizontal) {
    return (
      <ol className="flex min-w-[580px] items-start" aria-label="Your status timeline">
        {steps.map((s, i) => (
          <li key={s.label} className="relative min-w-0 flex-1 pr-3 last:pr-0">
            <div className="flex items-center">
              <span
                className={`relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                  s.state === "done"
                    ? "border-gold bg-gold text-navy"
                    : s.state === "current"
                      ? "border-gold bg-navy shadow-[0_0_8px_var(--color-gold)]"
                      : "border-ivory/25 bg-navy"
                }`}
              >
                {s.state === "done" ? <Check className="h-3 w-3" strokeWidth={3} /> : s.state === "current" ? <span className="h-1.5 w-1.5 rounded-full bg-gold" /> : null}
              </span>
              {i < steps.length - 1 && (
                <span className={`h-px min-w-3 flex-1 ${s.state === "done" ? "bg-gold/70" : "bg-ivory/15"}`} aria-hidden />
              )}
            </div>
            <p className={`mt-2 pr-2 text-[11px] leading-4 ${s.state === "upcoming" ? "text-ivory/40" : "text-ivory/85"}`}>
              {s.label}
              {s.state === "current" && <span className="ml-1.5 text-[9px] uppercase tracking-[0.14em] text-gold">Now</span>}
            </p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="mt-5 space-y-0" aria-label="Your status timeline">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={`absolute left-[9px] top-5 h-[calc(100%-12px)] w-px ${s.state === "done" ? "bg-gold/70" : "bg-ivory/15"}`}
              aria-hidden
            />
          )}
          <span
            className={`relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border ${
              s.state === "done"
                ? "border-gold bg-gold text-navy"
                : s.state === "current"
                  ? "border-gold bg-navy shadow-[0_0_8px_var(--color-gold)]"
                  : "border-ivory/25 bg-navy"
            }`}
          >
            {s.state === "done" ? <Check className="h-3 w-3" strokeWidth={3} /> : s.state === "current" ? <span className="h-1.5 w-1.5 rounded-full bg-gold" /> : null}
          </span>
          <div>
            <p className={`text-[13px] ${s.state === "upcoming" ? "text-ivory/45" : "text-ivory"}`}>
              {s.label}
              {s.state === "current" && <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-gold">Now</span>}
            </p>
            <p className={`text-[12px] leading-5 ${s.state === "upcoming" ? "text-ivory/35" : "text-ivory/60"}`}>{s.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
