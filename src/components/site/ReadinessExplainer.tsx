import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "motion/react";
import { Radio, Users, Fingerprint, Zap, BarChart3, Handshake } from "lucide-react";
import marketAnchor from "@/assets/prsc-market-anchor.jpg.asset.json";

const DIMENSIONS = [
  { key: "signal", label: "Signal Strength™", icon: Radio, value: 91 },
  { key: "audience", label: "Audience Value™", icon: Users, value: 84 },
  { key: "platform", label: "Platform Identity™", icon: Fingerprint, value: 85 },
  { key: "activation", label: "Activation Capability™", icon: Zap, value: 80 },
  { key: "measurement", label: "Measurement Confidence™", icon: BarChart3, value: 78 },
  { key: "relationship", label: "Relationship Strength™", icon: Handshake, value: 86 },
] as const;

const STEPS = [
  {
    body: "Sponsorship decisions are made on instinct. Brands buy before knowing if a property is ready to deliver.",
  },
  {
    body: "Commercial readiness is multidimensional. The PRSC standard measures six independent pillars of performance.",
  },
  {
    body: "One number the whole market can trust. A 0–100 independent rating that makes properties comparable.",
  },
  {
    body: "From Commercially Invisible to Commercially Undeniable. The credential that proves your value.",
  },
];

function StaticBar({ value, visible, Icon, label }: { value: number; visible: boolean; Icon: typeof Radio; label: string }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0.08, y: visible ? 0 : 8 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-start gap-3"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/40 text-ivory mt-1"
        style={{ opacity: 0.55 }}
      >
        <Icon size={15} strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="label-caps mb-1.5 text-[10px] font-semibold leading-tight"
          style={{ color: "#F2EFE6", opacity: 0.6, letterSpacing: "0.16em" }}
        >
          {label}
        </p>
        <div className="h-[6px] w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(242,239,230,0.4)" }}>
          <motion.div
            className="h-full rounded-full"
            initial={false}
            animate={{ width: visible ? `${value}%` : "0%" }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              background: "linear-gradient(90deg, #F5E6B3 0%, #E6C56A 45%, #D4AF37 100%)",
              boxShadow: "0 0 16px rgba(212,175,55,0.7)",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function StepGauge({ target, active }: { target: number; active: boolean }) {
  const value = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const strokeOffset = useTransform(value, (v) => 565.48 - (565.48 * v) / 100);

  useEffect(() => {
    const controls = animate(value, active ? target : 0, {
      duration: active ? 1.6 : 0.4,
      ease: "easeOut",
    });
    const unsub = value.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, target, active]);

  return (
    <div className="relative h-[180px] w-[180px] md:h-[220px] md:w-[220px]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        <motion.circle
          cx="100" cy="100" r="90" fill="none"
          stroke="url(#explainerGoldGrad)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray="565.48"
          style={{ strokeDashoffset: strokeOffset, filter: "drop-shadow(0 0 6px rgba(212,175,55,0.6))" }}
        />
        <defs>
          <linearGradient id="explainerGoldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5E6B3" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8C6E3B" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[64px] md:text-[76px] leading-none text-ivory tabular-nums">
          {display}
        </div>
      </div>
    </div>
  );
}

function StepVisual({ step }: { step: number }) {
  const leftDims = DIMENSIONS.slice(0, 3);
  const rightDims = DIMENSIONS.slice(3, 6);
  const barsVisibleUpTo = step >= 1 ? 6 : 0;
  const gaugeActive = step >= 2;
  const labelLocked = step >= 3;

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <motion.div
        animate={{ filter: step === 0 ? "blur(10px)" : "blur(0px)", opacity: step === 0 ? 0.55 : 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="flex items-center gap-4 md:gap-6"
      >
        <div className="flex-1 flex flex-col justify-between gap-5" style={{ minHeight: 340 }}>
          {leftDims.map((d, i) => (
            <StaticBar key={d.key} value={d.value} visible={i < barsVisibleUpTo} Icon={d.icon} label={d.label} />
          ))}
        </div>
        <div className="shrink-0 flex flex-col items-center justify-center">
          <StepGauge target={84} active={gaugeActive} />
          <div className="h-6 mt-2 flex items-center justify-center">
            <AnimatePresence>
              {labelLocked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-[11px] md:text-[12px] uppercase font-medium text-center leading-tight"
                  style={{
                    color: "#D4AF37",
                    letterSpacing: "0.14em",
                    textShadow: "0 0 14px rgba(212,175,55,0.55)",
                  }}
                >
                  Commercially Undeniable
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-5" style={{ minHeight: 340 }}>
          {rightDims.map((d, i) => (
            <StaticBar key={d.key} value={d.value} visible={i + 3 < barsVisibleUpTo} Icon={d.icon} label={d.label} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function ReadinessExplainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepRefs.current.forEach((el, idx) => {
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveStep(idx);
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section ref={containerRef} className="bg-navy text-ivory relative overflow-hidden">
      <img
        src={marketAnchor.url}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-100 pointer-events-none"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(10,19,34,0.92) 0%, rgba(10,19,34,0.82) 50%, rgba(10,19,34,0.92) 100%)",
        }}
      />
      <div className="relative">
      <div className="mx-auto max-w-7xl px-6 pt-24 md:pt-32">
        <div className="text-center max-w-3xl mx-auto">
          <p className="label-caps text-gold mb-6">The Explainer</p>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05]">
            What Is Readiness?
          </h2>
          <div className="gold-rule my-8 mx-auto w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 grid gap-10 lg:grid-cols-2 relative">
        {/* LEFT: scrolling text steps */}
        <div>
          {STEPS.map((s, i) => (
            <div
              key={i}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="min-h-[85vh] flex items-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: activeStep === i ? 1 : 0.25, y: activeStep === i ? 0 : 20 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="max-w-lg"
              >
                <p className="label-caps text-gold text-[0.7rem] mb-4">
                  Step {String(i + 1).padStart(2, "0")} / 04
                </p>
                <p className="font-display text-3xl md:text-4xl leading-[1.2] text-ivory">
                  {s.body}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* RIGHT: sticky visual */}
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen flex items-center justify-center">
            <StepVisual step={activeStep} />
          </div>
        </div>
      </div>

      {/* Mobile visual anchored at bottom */}
      <div className="lg:hidden pb-20">
        <StepVisual step={activeStep} />
      </div>
    </section>
  );
}
