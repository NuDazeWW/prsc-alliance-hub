import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "motion/react";
import { Radio, Users, Fingerprint, Zap, BarChart3, Handshake } from "lucide-react";
import heroState1 from "@/assets/prsc-hero-state1.jpg.asset.json";


/**
 * The Living Score dashboard. Six dimensions animate silver→gold as bars fill,
 * composite gauge rises 82 → 84 and back on an 8.5s loop.
 */

const DIMENSIONS = [
  { key: "signal", label: "Signal Strength™", icon: Radio, start: 88, end: 91 },
  { key: "audience", label: "Audience Value™", icon: Users, start: 79, end: 84 },
  { key: "platform", label: "Platform Identity™", icon: Fingerprint, start: 85, end: 85 },
  { key: "activation", label: "Activation Capability™", icon: Zap, start: 76, end: 80 },
  { key: "measurement", label: "Measurement Confidence™", icon: BarChart3, start: 81, end: 78 },
  { key: "relationship", label: "Relationship Strength™", icon: Handshake, start: 82, end: 86 },
] as const;

function DimensionRow({ label, Icon, start, end, delay }: {
  label: string; Icon: typeof Radio; start: number; end: number; delay: number;
}) {
  const value = useMotionValue(start);
  const width = useTransform(value, (v) => `${v}%`);
  const [display, setDisplay] = useState(start);

  useEffect(() => {
    const controls = animate(value, [start, start, end, end, start], {
      duration: 8.5,
      times: [0, 0.15, 0.5, 0.75, 1],
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    });
    const unsub = value.on("change", (v) => setDisplay(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  }, [value, start, end, delay]);

  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory/40 text-ivory mt-1"
        style={{ opacity: 0.55 }}
      >
        <Icon size={17} strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="label-caps mb-2 text-[11px] font-semibold leading-tight"
          style={{ color: "#F2EFE6", opacity: 0.6, letterSpacing: "0.16em" }}
        >
          {label}
        </p>
        <div
          className="h-[7px] w-full rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(242,239,230,0.4)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width,
              background: "linear-gradient(90deg, #F5E6B3 0%, #E6C56A 45%, #D4AF37 100%)",
              boxShadow: "0 0 16px rgba(212,175,55,0.7)",
            }}
          />
        </div>
        <div className="mt-2 tabular-nums text-ivory/90 text-xs font-medium">
          {display}%
        </div>
      </div>
    </div>
  );
}

function CompositeGauge() {
  const value = useMotionValue(82);
  const [display, setDisplay] = useState(82);
  const strokeOffset = useTransform(value, (v) => 565.48 - (565.48 * v) / 100);

  useEffect(() => {
    const controls = animate(value, [82, 82, 84, 84, 82], {
      duration: 8.5,
      times: [0, 0.15, 0.5, 0.75, 1],
      repeat: Infinity,
      ease: "easeInOut",
    });
    const unsub = value.on("change", (v) => setDisplay(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  }, [value]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.05) 40%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative h-[160px] w-[160px] sm:h-[200px] sm:w-[200px] md:h-[240px] md:w-[240px] xl:h-[260px] xl:w-[260px]">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <motion.circle
            cx="100" cy="100" r="90" fill="none"
            stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="565.48"
            style={{ strokeDashoffset: strokeOffset, filter: "drop-shadow(0 0 6px rgba(212,175,55,0.6))" }}
          />
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5E6B3" />
              <stop offset="60%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8C6E3B" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-[52px] sm:text-[64px] md:text-[80px] xl:text-[88px] leading-none text-ivory tabular-nums">
            {display}
          </div>
          <div className="text-gold text-[9px] sm:text-[10px] md:text-[11px] mt-1 sm:mt-2 text-center leading-tight uppercase font-medium" style={{ letterSpacing: "0.12em" }}>
            Commercially<br />Undeniable
          </div>
        </div>
      </div>
    </div>
  );
}

export function LivingScoreDashboard() {
  const prefersReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (prefersReduced) {
    return (
      <div className="relative w-full">
        <img src={heroState1.url} alt="PRSC Readiness Score dashboard showing six dimensions and a composite score of 82, Commercially Undeniable." className="w-full h-auto" />
      </div>
    );
  }

  const leftDims = DIMENSIONS.slice(0, 3);
  const rightDims = DIMENSIONS.slice(3, 6);

  return (
    <div ref={ref} className="relative w-full" style={{ height: 420 }}>
      <div
        className="flex flex-col md:flex-row items-stretch w-full h-full"
        style={{ gap: 32 }}
      >
        <div
          className="flex flex-col justify-between order-2 md:order-1 flex-1"
          style={{ height: 420 }}
        >
          {leftDims.map((d, i) => (
            <DimensionRow
              key={d.key}
              label={d.label}
              Icon={d.icon}
              start={d.start}
              end={d.end}
              delay={i * 0.08}
            />
          ))}
        </div>
        <div
          className="order-1 md:order-2 flex flex-col items-center justify-center shrink-0 w-[160px] sm:w-[200px] md:w-[240px]"
          style={{ height: 420 }}
        >
          <CompositeGauge />
        </div>
        <div
          className="flex flex-col justify-between order-3 flex-1"
          style={{ height: 420 }}
        >
          {rightDims.map((d, i) => (
            <DimensionRow
              key={d.key}
              label={d.label}
              Icon={d.icon}
              start={d.start}
              end={d.end}
              delay={(i + 3) * 0.08}
            />
          ))}
        </div>
      </div>
      {isMobile && (
        <p className="mt-4 text-center label-caps text-ivory/40 text-[0.6rem]">
          PRSC Readiness Score™ · Live Demonstration
        </p>
      )}
    </div>
  );
}
