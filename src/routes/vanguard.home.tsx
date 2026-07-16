import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion, useInView } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowRight,
  FileText,
  HelpCircle,
  UserRound,
  Cloud,
  BarChart2,
  ClipboardList,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import heroImg from "@/assets/vanguard-hero-watkins.jpg?w=640;960;1440;1920&format=webp&as=srcset";
import heroImgFallback from "@/assets/vanguard-hero-watkins.jpg?w=1440&format=webp";
import sealBadge from "@/assets/prsc-seal-badge.png.asset.json";
import { submitVanguardInterest } from "@/lib/forms.functions";

export const Route = createFileRoute("/vanguard/home")({
  head: () => ({
    meta: [
      { title: "Readiness Vanguard — An Invitation | PRSC" },
      {
        name: "description",
        content:
          "An invitation to a select group of Trans Am drivers and teams to join the Readiness Vanguard of the PRSC Readiness Standard.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: VanguardHome,
});

const NAVY = "#0A1322";
const GOLD = "#D4AF37";
const IVORY = "#F2EFE6";
const STONE = "#3B4149";
const SANDSTONE = "#CBB89A";
const MIDNIGHT = "#101B2E";
const PEWTER = "#7A7F87";

/* ------------------------------------------------------------------ */
/* Score ring                                                          */
/* ------------------------------------------------------------------ */

function ScoreRing() {
  const target = 84;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const value = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const CIRC = 565.48;
  const offset = useTransform(value, (v) => CIRC - (CIRC * v) / 100);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      value.set(target);
      setDisplay(target);
      return;
    }
    const controls = animate(value, target, { duration: 2.2, ease: [0.22, 1, 0.36, 1] });
    const unsub = value.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, reduce, value]);

  return (
    <div ref={ref} className="relative mx-auto flex flex-col items-center">
      <div className="relative h-[220px] w-[220px] md:h-[260px] md:w-[260px]">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5E6B3" />
              <stop offset="55%" stopColor="#E6C56A" />
              <stop offset="100%" stopColor={GOLD} />
            </linearGradient>
            <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="6" />
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            style={{ strokeDashoffset: offset, filter: "url(#ringGlow)" }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display tabular-nums text-[72px] md:text-[86px] leading-none"
            style={{ color: IVORY }}
          >
            {display}
          </span>
          <span
            className="mt-2 text-[10px] md:text-[11px] font-semibold tracking-[0.24em]"
            style={{ color: GOLD }}
          >
            COMMERCIALLY
          </span>
          <span
            className="text-[10px] md:text-[11px] font-semibold tracking-[0.24em]"
            style={{ color: GOLD }}
          >
            UNDENIABLE
          </span>
        </div>
      </div>
      <p className="mt-4 text-xs italic" style={{ color: PEWTER }}>
        Illustrative example
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dimension label pill (six around the ring)                          */
/* ------------------------------------------------------------------ */

function DimLabel({ label, align }: { label: string; align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p
        className="text-[10px] md:text-[11px] font-semibold leading-tight"
        style={{ color: IVORY, letterSpacing: "0.18em" }}
      >
        {label}
      </p>
      <div
        className={`mt-2 h-px w-16 ${align === "right" ? "ml-auto" : ""}`}
        style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
      />
    </div>
  );
}

/* Form                                                                */
/* ------------------------------------------------------------------ */

function ReserveForm() {
  const call = useServerFn(submitVanguardInterest);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div
        className="mx-auto max-w-2xl rounded-sm border p-10 text-center"
        style={{ borderColor: "rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.05)" }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 12l6 6L20 6" />
          </svg>
        </div>
        <h3 className="font-display text-2xl mb-2" style={{ color: NAVY }}>
          Request received.
        </h3>
        <p style={{ color: STONE }}>
          The Council will review your consideration for the Readiness Vanguard. Selected organizations
          will receive an invitation directly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        const fd = new FormData(e.currentTarget);
        const data = {
          name: String(fd.get("name") || ""),
          property: String(fd.get("property") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          role: "Trans Am Team / Driver",
        };
        try {
          await call({ data: data as never });
          setDone(true);
        } catch (err) {
          setError((err as Error).message || "Something went wrong.");
        } finally {
          setPending(false);
        }
      }}
      className="mx-auto grid max-w-4xl gap-3 md:grid-cols-2"
    >
      <input
        name="name"
        required
        placeholder="Name"
        maxLength={120}
        className="w-full rounded-sm border px-4 py-3 text-[15px] placeholder:italic focus:outline-none focus:ring-1"
        style={{
          borderColor: "rgba(10,19,34,0.25)",
          background: "#fff",
          color: NAVY,
        }}
      />
      <input
        name="property"
        required
        placeholder="Team / Organization"
        maxLength={160}
        className="w-full rounded-sm border px-4 py-3 text-[15px] placeholder:italic focus:outline-none focus:ring-1"
        style={{ borderColor: "rgba(10,19,34,0.25)", background: "#fff", color: NAVY }}
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        maxLength={200}
        className="w-full rounded-sm border px-4 py-3 text-[15px] placeholder:italic focus:outline-none focus:ring-1"
        style={{ borderColor: "rgba(10,19,34,0.25)", background: "#fff", color: NAVY }}
      />
      <input
        name="phone"
        type="tel"
        required
        placeholder="Phone"
        maxLength={40}
        className="w-full rounded-sm border px-4 py-3 text-[15px] placeholder:italic focus:outline-none focus:ring-1"
        style={{ borderColor: "rgba(10,19,34,0.25)", background: "#fff", color: NAVY }}
      />
      {error && (
        <p className="md:col-span-2 text-sm" style={{ color: "#7A1F2B" }}>
          {error}
        </p>
      )}
      <motion.button
        type="submit"
        disabled={pending}
        whileHover={pending ? undefined : { scale: 1.02 }}
        whileTap={pending ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="group relative md:col-span-2 mt-2 inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] shadow-[0_6px_20px_-8px_rgba(212,175,55,0.55)] transition-[background,box-shadow,filter] duration-200 hover:brightness-110 hover:shadow-[0_10px_28px_-10px_rgba(212,175,55,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
        style={{
          background: GOLD,
          color: NAVY,
          // @ts-expect-error CSS custom prop for focus ring color
          "--tw-ring-color": IVORY,
          "--tw-ring-offset-color": NAVY,
        }}
      >
        {/* subtle sheen sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/30 opacity-0 transition-all duration-500 ease-out group-hover:left-[120%] group-hover:opacity-100"
        />
        {pending ? "Submitting…" : (
          <>
            Request Consideration
            <ArrowRight
              size={16}
              strokeWidth={2.25}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </>
        )}
      </motion.button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function VanguardHome() {
  const seatsFilled = 11;
  const seatsTotal = 25;
  const seatsRemaining = seatsTotal - seatsFilled;
  const pct = Math.round((seatsFilled / seatsTotal) * 100);

  return (
    <div style={{ background: NAVY, color: IVORY }} className="w-full overflow-x-hidden">
      {/* ==================== BLOCK 1 — HERO ==================== */}
      <section
        className="relative w-full overflow-hidden min-h-[640px] md:min-h-[720px]"
        style={{ background: NAVY }}
      >
        {/* hero image — full-bleed on mobile, right side on md+ */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src={heroImgFallback}
            srcSet={heroImg}
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 65vw, 62vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute right-0 top-0 h-full w-full object-cover object-center md:object-right md:w-[65%] lg:w-[62%]"
            style={{ opacity: 0.9 }}
          />
          {/* gradient — softer on mobile so the image reads */}
          <div
            aria-hidden
            className="absolute inset-0 hidden md:block"
            style={{
              background: `linear-gradient(90deg, ${NAVY} 0%, ${NAVY} 30%, rgba(10,19,34,0.85) 45%, rgba(10,19,34,0.35) 65%, rgba(10,19,34,0.15) 100%)`,
            }}
          />
          {/* mobile overlay: darken so copy is readable over full-bleed image */}
          <div
            aria-hidden
            className="absolute inset-0 md:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,19,34,0.85) 0%, rgba(10,19,34,0.55) 40%, rgba(10,19,34,0.75) 100%)",
            }}
          />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-10 md:py-14 min-h-[640px] md:min-h-[720px]">
          {/* Top: seal centered */}
          <div className="flex justify-center">
            <img
              src={sealBadge.url}
              alt="PRSC crest"
              className="h-[60px] w-auto"
              style={{ filter: "drop-shadow(0 4px 12px rgba(212,175,55,0.35))" }}
            />
          </div>


          {/* Left content block */}
          <div className="mt-14 md:mt-20 max-w-[560px]">
            <p
              className="text-[12px] font-semibold uppercase mb-4"
              style={{ color: GOLD, letterSpacing: "0.12em" }}
            >
              An Invitation to the Readiness Vanguard
            </p>
            <p className="font-display italic text-[15px] mb-8" style={{ color: SANDSTONE }}>
              For a select group of Trans Am drivers and teams.
            </p>
            <h1
              className="font-display leading-[1.05] text-[44px] sm:text-[52px] md:text-[58px]"
              style={{ color: IVORY, letterSpacing: "-0.01em" }}
            >
              There&rsquo;s a reason why even the best race programs don&rsquo;t always get sponsored.
            </h1>
            <p
              className="mt-8 max-w-[440px] text-[18px] leading-relaxed"
              style={{ color: IVORY, opacity: 0.9 }}
            >
              We&rsquo;re building the first true standard designed to help teams prove their
              value to sponsors — and we&rsquo;re inviting a select group to help shape it.
            </p>
            <div className="mt-12">
              <ArrowDown size={26} strokeWidth={1.5} style={{ color: GOLD }} className="animate-bounce" />
            </div>
          </div>

          <div className="grow" />
        </div>
      </section>

      {/* ==================== BLOCK 2 — THE PROBLEM ==================== */}
      <section style={{ background: IVORY }} className="px-6 pt-16 pb-6 md:pt-20 md:pb-8">
        <div className="mx-auto max-w-[700px] text-center">
          <p
            className="font-display leading-snug text-[24px] md:text-[28px]"
            style={{ color: NAVY }}
          >
            Sponsors don&rsquo;t buy race cars. They invest in organizations they believe can deliver
            business results.{" "}
            <span style={{ color: NAVY, opacity: 0.75 }}>
              Most teams have never been able to prove that.
            </span>
          </p>
          <div
            className="mx-auto mt-8 h-px w-40"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />
        </div>
      </section>

      {/* ==================== BLOCK 3 — WHY IT EXISTS ==================== */}
      <section style={{ background: IVORY }} className="px-6 pt-4 pb-16 md:pt-6 md:pb-20">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="font-display leading-snug text-[24px] md:text-[28px]" style={{ color: STONE }}>
            Without a standard for commercial readiness, every sponsorship decision is an educated guess.
            <br />
            Brands don&rsquo;t want to guess.
            <br />
            And teams lose opportunities they should have won.
          </p>
        </div>
      </section>

      {/* ==================== BLOCK 4 — A BETTER WAY + THE SOLUTION ==================== */}
      <section style={{ background: NAVY }} className="px-6 py-16 md:py-20">
        {/* Top: A Better Way (centered) */}
        <div className="mx-auto max-w-5xl text-center">
          <p
            className="text-[12px] font-semibold uppercase mb-5"
            style={{ color: GOLD, letterSpacing: "0.24em" }}
          >
            A Better Way
          </p>
          <div
            className="mx-auto mb-8 h-px w-16"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />
          <h2
            className="font-display leading-tight text-[22px] sm:text-[24px] md:text-[28px]"
            style={{ color: IVORY }}
          >
            <span className="block">This isn&rsquo;t another sponsorship program or agency.</span>
            <span className="block lg:whitespace-nowrap">
              It&rsquo;s the beginning of an independent commercial standard for motorsport.
            </span>
          </h2>
          <p
            className="mt-8 font-display italic text-[20px] md:text-[24px] leading-snug"
            style={{ color: GOLD }}
          >
            Every major market runs on a trusted standard.
            <br />
            Motorsport doesn&rsquo;t have one – until now.
          </p>
        </div>

        {/* Divider between "A Better Way" and the illustrative Solution block */}
        <div
          className="mx-auto mt-16 h-px w-24"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
        />

        {/* Bottom: The Solution — two columns */}
        <div className="mx-auto mt-12 grid max-w-6xl items-center gap-12 md:gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Left: copy */}
          <div className="max-w-md">
            <p
              className="text-[12px] font-semibold uppercase mb-4"
              style={{ color: GOLD, letterSpacing: "0.24em" }}
            >
              The Solution
            </p>
            <div className="mb-6 h-px w-12" style={{ background: GOLD }} />
            <div className="space-y-4 text-[15px] leading-relaxed" style={{ color: IVORY, opacity: 0.9 }}>
              <p>
                Commercial readiness score — your organization&rsquo;s ability to attract, secure, and retain
                sponsorship.
              </p>
              <p>
                The PRSC Readiness Score is the first independent commercial rating for teams and
                drivers in motorsport.
              </p>
              <p>
                A score that tells teams, drivers, sponsors, manufacturers and series — exactly what
                they need to know to make clear sponsorship and partnership decisions.
              </p>
            </div>
          </div>

          {/* Right: ring with 6 dimension labels around it */}
          <div className="flex flex-col items-center">
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-10">
              <div className="flex flex-col gap-8">
                <DimLabel label="SIGNAL STRENGTH" align="right" />
                <DimLabel label="AUDIENCE VALUE" align="right" />
                <DimLabel label="PLATFORM IDENTITY" align="right" />
              </div>
              <ScoreRing />
              <div className="flex flex-col gap-8">
                <DimLabel label="ACTIVATION CAPABILITY" align="left" />
                <DimLabel label="MEASUREMENT CONFIDENCE" align="left" />
                <DimLabel label="RELATIONSHIP STRENGTH" align="left" />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ==================== BLOCK 6 — COMPARISON ==================== */}
      <section style={{ background: NAVY }} className="px-6 pb-16 md:pb-20">
        <div className="mx-auto max-w-5xl">
          <div
            className="mx-auto mb-16 h-px w-24"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />
          <div className="relative grid justify-items-center gap-12 md:grid-cols-2 md:gap-16 text-center">
            {/* vertical divider */}
            <div
              aria-hidden
              className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2"
              style={{ background: `linear-gradient(180deg, transparent, ${GOLD}, transparent)` }}
            />

            {/* TODAY */}
            <div>
              <p
                className="mb-8 text-[12px] font-semibold uppercase"
                style={{ color: IVORY, letterSpacing: "0.28em", opacity: 0.9 }}
              >
                Today
              </p>
              <ul className="space-y-6">
                {[
                  { Icon: FileText, label: "Media kit" },
                  { Icon: HelpCircle, label: "Sponsor guesswork" },
                  { Icon: UserRound, label: "Hard to compare" },
                  { Icon: Cloud, label: "Hope" },
                ].map(({ Icon, label }) => (
                  <li key={label} className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(122,127,135,0.15)", color: PEWTER }}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <span className="text-[15px]" style={{ color: IVORY, opacity: 0.75 }}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WITH PRSC */}
            <div>
              <p
                className="mb-8 text-[12px] font-semibold uppercase"
                style={{ color: GOLD, letterSpacing: "0.28em" }}
              >
                With PRSC
              </p>
              <ul className="space-y-6">
                {[
                  { Icon: BarChart2, label: "Independent Readiness Score" },
                  { Icon: ClipboardList, label: "Commercial Strength Report" },
                  { Icon: Trophy, label: "Industry Benchmark" },
                  { Icon: ShieldCheck, label: "Evidence" },
                ].map(({ Icon, label }) => (
                  <li key={label} className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: "rgba(212,175,55,0.5)", color: GOLD, background: "rgba(212,175,55,0.08)" }}
                    >
                      <Icon size={18} strokeWidth={1.6} />
                    </div>
                    <span className="text-[15px] font-medium" style={{ color: IVORY }}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== BLOCK 7 — VANGUARD + RECEIVE ==================== */}
      <section style={{ background: IVORY }} className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl grid gap-14 md:grid-cols-2 md:gap-16">
          {/* Left */}
          <div>
            <h3 className="font-display text-[28px] md:text-[30px]" style={{ color: NAVY }}>
              The Readiness Vanguard
            </h3>
            <div className="mt-3 h-[2px] w-16" style={{ background: GOLD }} />
            <p className="mt-6 text-[15px] leading-relaxed" style={{ color: STONE }}>
              The Readiness Vanguard is the first cohort of teams and drivers ever evaluated under the
              PRSC Readiness Standard. Their experience will shape the first commercial readiness
              benchmark in motorsport.
            </p>
            <p
              className="mt-6 font-display italic text-[17px] leading-snug"
              style={{ color: GOLD }}
            >
              Watkins Glen marks the beginning. The inaugural cohort will be selected from
              organizations that request consideration during race weekend.
            </p>
          </div>

          {/* Right */}
          <div>
            <h3 className="font-display text-[28px] md:text-[30px]" style={{ color: NAVY }}>
              What Readiness Vanguard Members Receive
            </h3>
            <div className="mt-3 h-[2px] w-16" style={{ background: GOLD }} />
            <ul className="mt-6 space-y-4">
              {[
                "Your independent PRSC Readiness Score",
                "A confidential Commercial Strength Report highlighting sponsor strengths and gaps",
                "Benchmarking against the inaugural Vanguard participants",
                "Readiness Vanguard designation — permanent",
                "A direct role in shaping the industry's first commercial readiness standard",
              ].map((item) => (
                <li key={item} className="flex gap-4">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: GOLD }}
                    aria-hidden
                  />
                  <span className="text-[15px] leading-relaxed" style={{ color: STONE }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ==================== BLOCK 8 — WHAT WE PROMISE ==================== */}
      <section style={{ background: MIDNIGHT }} className="px-6 py-14 md:py-16">
        <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-[auto_auto_1fr] md:items-center">
          {/* crest */}
          <div className="flex justify-center md:justify-start">
            <img
              src={sealBadge.url}
              alt=""
              className="h-20 w-auto"
              style={{ filter: "drop-shadow(0 4px 12px rgba(212,175,55,0.3))" }}
            />
          </div>

          {/* headline */}
          <div className="text-center md:text-left md:pl-4 md:border-l" style={{ borderColor: "rgba(212,175,55,0.25)" }}>
            <h3 className="font-display text-[28px]" style={{ color: IVORY }}>
              What We Promise
            </h3>
            <div className="mt-3 h-[2px] w-16 md:mx-0 mx-auto" style={{ background: GOLD }} />
          </div>

          {/* body */}
          <div className="space-y-3 text-[15px] leading-relaxed md:pl-4 md:border-l" style={{ color: IVORY, borderColor: "rgba(212,175,55,0.25)" }}>
            <p>We can&rsquo;t promise you sponsorship.</p>
            <p>
              What we can offer is something motorsport has never had before: an independent way to
              understand, measure, and improve how sponsors evaluate your organization.
            </p>
            <p>That&rsquo;s what the Readiness Vanguard is helping build.</p>
          </div>
        </div>
      </section>

      {/* ==================== BLOCK 9 — SCARCITY STRIP ==================== */}
      <section style={{ background: GOLD }} className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p
              className="text-[13px] md:text-[14px] font-bold uppercase"
              style={{ color: NAVY, letterSpacing: "0.14em" }}
            >
              Readiness Vanguard — Trans Am Series 2026
            </p>
            <motion.p
              className="inline-flex items-center gap-2 text-[13px] md:text-[14px] font-semibold"
              style={{ color: NAVY }}
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: NAVY, boxShadow: `0 0 0 0 ${NAVY}` }}
                animate={{ boxShadow: [`0 0 0 0 rgba(10,19,34,0.55)`, `0 0 0 8px rgba(10,19,34,0)`] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
              {seatsFilled} of {seatsTotal} invitations remaining
            </motion.p>
          </div>

          {/* progress bar */}
          <div
            className="mt-4 h-3 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(10,19,34,0.15)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: NAVY }}
            />
          </div>

          <p
            className="mt-4 text-center font-display italic text-[14px]"
            style={{ color: NAVY }}
          >
            Applications close when all invitations have been accepted.
          </p>
        </div>
      </section>

      {/* dark strip */}
      <section style={{ background: "#000000" }} className="px-6 py-4">
        <p
          className="mx-auto max-w-5xl text-center text-[13px] md:text-[14px]"
          style={{ color: IVORY, letterSpacing: "0.02em" }}
        >
          Twenty-five organizations will become the founding benchmark against which future teams are
          measured.
        </p>
      </section>

      {/* keep seatsRemaining reference to avoid unused warning */}
      <span className="hidden" aria-hidden>
        {seatsRemaining}
      </span>

      {/* ==================== BLOCK 10 — FORM ==================== */}
      <section style={{ background: IVORY }} className="px-6 py-16 md:py-20 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-display leading-tight tracking-tight text-balance text-[26px] sm:text-[32px] md:text-[36px] lg:text-[40px]"
            style={{ color: NAVY }}
          >
            Reserve Your Spot.
            <br />
            <span className="block text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] leading-snug">
              Request Consideration for the Readiness Vanguard.
            </span>
          </h2>
          <p className="mx-auto mt-5 md:mt-6 max-w-2xl text-[14px] md:text-[15px] leading-relaxed text-balance" style={{ color: STONE }}>
            The Readiness Vanguard is limited to 25 Trans Am teams and drivers. Participation is
            complimentary. Selection is based on the Council&rsquo;s review and is not guaranteed.
          </p>
        </div>

        <div className="mt-12">
          <ReserveForm />
        </div>

        <div className="mx-auto mt-8 max-w-2xl text-center space-y-1" style={{ color: PEWTER }}>
          <p className="text-[11px]">
            Every submission is reviewed by the Partnership Readiness Standards Council.
          </p>
          <p className="text-[11px]">
            Selected organizations will receive an invitation to participate in the Readiness Vanguard.
          </p>
        </div>
      </section>
    </div>
  );
}
