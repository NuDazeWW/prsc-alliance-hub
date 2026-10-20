import gaugeAsset from "@/assets/prsc-score-gauge.png.asset.json";

/**
 * Hero gauge: chrome-and-gold dial representing the 0–100 PRSC Readiness Score™.
 */
export function ScoreGauge() {
  return (
    <div className="relative w-full flex items-center justify-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.07) 40%, transparent 72%)",
        }}
        aria-hidden
      />
      <img
        src={gaugeAsset.url}
        alt="PRSC Readiness Score™ gauge, scored 0 to 100 — independent, objective, built to last."
        width={890}
        height={772}
        fetchPriority="high"
        decoding="async"
        className="relative w-full max-w-[520px] h-auto"
      />
    </div>
  );
}
