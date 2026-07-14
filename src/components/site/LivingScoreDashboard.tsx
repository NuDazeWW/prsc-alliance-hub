import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "motion/react";
import { Radio, Users, Fingerprint, Zap, BarChart3, Handshake } from "lucide-react";
import heroState1 from "@/assets/prsc-hero-state1.jpg.asset.json";
import logo from "@/assets/prsc-logo-tag.png.asset.json";

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
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 text-ivory/80">
        <Icon size={17} strokeWidth={1.4} />
      </div>
      <div>
        <p className="label-caps text-ivory/85 mb-2 text-[0.65rem]">{label}</p>
        <div className="h-[6px] w-full rounded-full bg-ivory/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width,
              background: "linear-gradient(90deg, #C0C0C0 0%, #E6C56A 55%, #D4AF37 100%)",
              boxShadow: "0 0 12px rgba(212,175,55,0.4)",
            }}
          />
        </div>
      </div>
      <div className="tabular-nums text-ivory text-sm font-medium w-11 text-right">{display}%</div>
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
      <div className="relative h-[220px] w-[220px] md:h-[260px] md:w-[260px]">
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
          <div className="font-display text-[5.5rem] md:text-[6.5rem] leading-none text-ivory tabular-nums">
            {display}
          </div>
          <div className="label-caps text-gold text-[0.6rem] mt-1 text-center leading-tight">
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

  return (
    <div ref={ref} className="relative w-full">
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-center gap-6 md:gap-10">
        <div className="space-y-4 md:space-y-5 order-2 md:order-1">
          <div className="flex justify-center md:justify-start mb-2 md:mb-4">
            <img src={logo.url} alt="" className="h-16 w-auto opacity-90" aria-hidden />
          </div>
          {DIMENSIONS.map((d, i) => (
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
        <div className="order-1 md:order-2 flex justify-center">
          <CompositeGauge />
        </div>
      </div>
      <div
        className="mt-8 md:mt-10 flex flex-col gap-0.5 font-mono text-[10px] leading-snug text-left"
        style={{ color: "#7A7F87", opacity: 0.7 }}
        aria-hidden
      >
        <span>PRSC Readiness Standard · Version 1.0</span>
        <span>Benchmark Sample · 2026</span>
        <span>Methodology Reference: RMI-6</span>
        <span>Last Calibrated: Q2 2026</span>
      </div>
      {isMobile && (
        <p className="mt-4 text-center label-caps text-ivory/40 text-[0.6rem]">
          PRSC Readiness Score™ · Live Demonstration
        </p>
      )}
    </div>
  );
}
