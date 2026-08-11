import { useEffect, useRef, useState } from "react";

/**
 * PRSCReadinessGauge — a live, dimensional instrument built from layered
 * HTML/CSS material surfaces with SVG used only for tick geometry and the
 * needle path. No raster gauge image is used.
 */

const FINAL_VALUE = 72; // illustrative needle position only — not a score
const START_ANGLE = -90; // needle straight left (value 0)
const SWEEP = 180;
const angleFor = (v: number) => START_ANGLE + (v / 100) * SWEEP;

const R_TICK = 148;
const MINOR_LEN = 7;
const MAJOR_LEN = 15;

function GaugeScale() {
  const ticks: JSX.Element[] = [];
  const total = 50; // minor ticks every 2 units
  for (let i = 0; i <= total; i++) {
    const value = (i / total) * 100;
    const isMajor = i % 5 === 0;
    const a = ((angleFor(value) - 90) * Math.PI) / 180;
    const len = isMajor ? MAJOR_LEN : MINOR_LEN;
    const x1 = 200 + Math.cos(a) * R_TICK;
    const y1 = 200 + Math.sin(a) * R_TICK;
    const x2 = 200 + Math.cos(a) * (R_TICK - len);
    const y2 = 200 + Math.sin(a) * (R_TICK - len);
    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isMajor ? "#E3C46A" : "#8C6E3B"}
        strokeWidth={isMajor ? 2.2 : 1}
        strokeLinecap="butt"
        opacity={isMajor ? 0.95 : 0.6}
      />,
    );
  }
  // center registration mark (value 50)
  const ac = ((angleFor(50) - 90) * Math.PI) / 180;
  ticks.push(
    <line
      key="reg"
      x1={200 + Math.cos(ac) * (R_TICK + 6)}
      y1={200 + Math.sin(ac) * (R_TICK + 6)}
      x2={200 + Math.cos(ac) * (R_TICK - MAJOR_LEN - 7)}
      y2={200 + Math.sin(ac) * (R_TICK - MAJOR_LEN - 7)}
      stroke="#F5E6B3"
      strokeWidth={3.2}
      strokeLinecap="round"
    />,
  );

  return (
    <svg viewBox="0 0 400 400" className="prsc-gauge__scale" aria-hidden focusable="false">
      <g className="prsc-gauge__ticks">{ticks}</g>
      <path
        d={`M ${200 - R_TICK + 26} 200 A ${R_TICK - 26} ${R_TICK - 26} 0 0 1 ${200 + R_TICK - 26} 200`}
        fill="none"
        stroke="rgba(212,175,55,0.18)"
        strokeWidth="1"
      />
    </svg>
  );
}

function GaugeNeedle() {
  return (
    <svg viewBox="0 0 400 400" className="prsc-gauge__needle" aria-hidden focusable="false">
      <defs>
        <linearGradient id="prscNeedleTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7EBC2" />
          <stop offset="48%" stopColor="#D9B854" />
          <stop offset="52%" stopColor="#7A5F30" />
          <stop offset="100%" stopColor="#4A391D" />
        </linearGradient>
      </defs>
      <g className="prsc-gauge__needle-rotor">
        {/* tapered blade */}
        <path
          d="M 200 196.5 L 60 199.4 L 60 200.6 L 200 203.5 Z"
          fill="url(#prscNeedleTop)"
        />
        {/* edge highlight */}
        <path d="M 200 197.2 L 62 199.6 L 62 200.05 L 200 198.6 Z" fill="rgba(255,246,214,0.75)" />
        {/* counterweight */}
        <path
          d="M 200 194 L 232 197 A 4 4 0 0 1 232 203 L 200 206 Z"
          fill="url(#prscNeedleTop)"
        />
      </g>
    </svg>
  );
}

export function PRSCReadinessGauge() {
  const ref = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.dataset["state"] = "final";
      setSettled(true);
      return;
    }
    const id = window.requestAnimationFrame(() => {
      el.dataset["state"] = "enter";
    });
    const t = window.setTimeout(() => setSettled(true), 2400);
    return () => {
      window.cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <figure
      className="prsc-gauge-figure"
      role="group"
      aria-label="PRSC Readiness Score ranges from 0 to 100 and provides an independent measure of commercial readiness."
    >
      <div
        ref={ref}
        className="prsc-gauge"
        data-state="init"
        data-settled={settled ? "true" : "false"}
        style={
          {
            "--needle-final": `${angleFor(FINAL_VALUE)}deg`,
            "--needle-start": `${angleFor(0)}deg`,
          } as React.CSSProperties
        }
      >
        <div className="prsc-gauge__atmosphere" aria-hidden />
        <div className="prsc-gauge__frame" aria-hidden>
          <div className="prsc-gauge__rim" />
          <div className="prsc-gauge__channel" />
          <div className="prsc-gauge__bezel" />
          <div className="prsc-gauge__face">
            <div className="prsc-gauge__grain" />
            <div className="prsc-gauge__ringreg" />
          </div>
        </div>

        <GaugeScale />

        <div className="prsc-gauge__labels" aria-hidden>
          <span className="prsc-gauge__label prsc-gauge__label--min">0</span>
          <span className="prsc-gauge__label prsc-gauge__label--max">100</span>
        </div>

        <div className="prsc-gauge__type">
          <span className="prsc-gauge__value font-display">0–100</span>
          <span className="prsc-gauge__title">PRSC Readiness Score</span>
          <span className="prsc-gauge__sub">Independent. Objective. Built to last.</span>
        </div>

        <GaugeNeedle />

        <div className="prsc-gauge__hub" aria-hidden>
          <span className="prsc-gauge__hub-inner" />
          <span className="prsc-gauge__hub-core" />
        </div>

        <div className="prsc-gauge__glass" aria-hidden />
        <div className="prsc-gauge__sweep" aria-hidden />
        <div className="prsc-gauge__contact" aria-hidden />
      </div>
    </figure>
  );
}
