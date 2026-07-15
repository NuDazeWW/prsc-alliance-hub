import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion, useInView } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowRight,
  Radio,
  Users,
  Fingerprint,
  Zap,
  BarChart3,
  Handshake,
  FileText,
  HelpCircle,
  UserRound,
  Cloud,
  BarChart2,
  ClipboardList,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import heroImg from "@/assets/vanguard-hero-watkins.jpg";
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

function DimLabel({ Icon, label, align }: { Icon: typeof Radio; label: string; align: "left" | "right" }) {
  return (
    <div
      className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
        style={{ borderColor: "rgba(212,175,55,0.45)", color: GOLD }}
      >
        <Icon size={15} strokeWidth={1.6} />
      </div>
      <div className={`flex-1 min-w-0 ${align === "right" ? "items-end" : ""}`}>
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
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
          role: "Trans Am Team / Driver",
          phone: "",
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
      className="mx-auto grid max-w-4xl gap-3 md:grid-cols-3"
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
      {error && (
        <p className="md:col-span-3 text-sm" style={{ color: "#7A1F2B" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="md:col-span-3 mt-2 inline-flex items-center justify-center gap-3 rounded-sm px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] transition-all hover:brightness-105 disabled:opacity-60"
        style={{ background: GOLD, color: NAVY }}
      >
        {pending ? "Submitting…" : (
          <>
            Request Consideration <ArrowRight size={16} strokeWidth={2.25} />
          </>
        )}
      </button>
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
        className="relative w-full overflow-hidden"
        style={{ background: NAVY, minHeight: "100vh" }}
      >
        {/* right-side hero image */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src={heroImg}
            alt=""
            className="absolute right-0 top-0 h-full w-full object-cover object-right md:w-[65%] lg:w-[62%]"
            style={{ opacity: 0.9 }}
          />
          {/* gradient fade to navy on the left */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${NAVY} 0%, ${NAVY} 30%, rgba(10,19,34,0.85) 45%, rgba(10,19,34,0.35) 65%, rgba(10,19,34,0.15) 100%)`,
            }}
          />
          {/* mobile: darken more */}
          <div
            aria-hidden
            className="absolute inset-0 md:hidden"
            style={{ background: "rgba(10,19,34,0.55)" }}
          />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 md:py-14">
          {/* Top: seal centered */}
          <div className="flex justify-center">
            <img
              src={sealBadge.url}
              alt="PRSC crest"
              className="h-[60px] w-auto"
              style={{ filter: "drop-shadow(0 4px 12px rgba(212,175,55,0.35))" }}
            />
          </div>

          {/* Watkins Glen label upper-right */}
          <p
            className="absolute right-6 top-10 md:top-14 text-[11px] font-semibold tracking-[0.28em] uppercase"
            style={{ color: IVORY, opacity: 0.85 }}
          >
            Watkins Glen
          </p>

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
              The best race programs don&rsquo;t always get sponsored.
            </h1>
            <p
              className="mt-8 max-w-[420px] text-[16px] leading-relaxed"
              style={{ color: IVORY, opacity: 0.9 }}
            >
              We&rsquo;re building the first independent standard designed to help teams prove their
              value to sponsors — and we&rsquo;re inviting a select group to help shape it.
            </p>
            <div className="mt-10">
              <ArrowDown size={26} strokeWidth={1.5} style={{ color: GOLD }} className="animate-bounce" />
            </div>
          </div>

          <div className="grow" />
        </div>
      </section>

      {/* ==================== BLOCK 2 — THE PROBLEM ==================== */}
      <section style={{ background: IVORY }} className="px-6 py-24 md:py-32">
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
            className="mx-auto mt-14 h-px w-40"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />
        </div>
      </section>

      {/* ==================== BLOCK 3 — WHY IT EXISTS ==================== */}
      <section style={{ background: IVORY }} className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="text-[18px] md:text-[20px] leading-relaxed" style={{ color: STONE }}>
            Sponsors invest in organizations that reduce risk. Without a shared standard for measuring
            commercial readiness, every decision is a guess. Brands guess. Teams lose deals they should
            win.
          </p>
        </div>
      </section>

      {/* ==================== BLOCK 4 — CATEGORY DECLARATION ==================== */}
      <section style={{ background: NAVY }} className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
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
            className="font-display leading-tight text-[26px] md:text-[32px]"
            style={{ color: IVORY }}
          >
            This isn&rsquo;t another sponsorship program or agency.
            <br />
            It&rsquo;s the beginning of an independent commercial standard for motorsport.
          </h2>
          <p
            className="mt-8 font-display italic text-[20px] md:text-[24px] leading-snug"
            style={{ color: GOLD }}
          >
            Every major market eventually adopts a trusted standard.
            <br />
            Motorsport hasn&rsquo;t had one — until now.
          </p>
        </div>
      </section>

      {/* ==================== BLOCK 5 — THE SOLUTION ==================== */}
      <section style={{ background: NAVY }} className="border-t px-6 py-24 md:py-32"
        // subtle divider
        // eslint-disable-next-line react/forbid-dom-props
      >
        <div className="mx-auto max-w-5xl flex flex-col items-center text-center">
          {/* Heading */}
          <p
            className="text-[12px] font-semibold uppercase mb-5"
            style={{ color: GOLD, letterSpacing: "0.24em" }}
          >
            The Solution
          </p>
          <div
            className="mx-auto mb-8 h-px w-16"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />

          {/* Copy */}
          <div
            className="max-w-2xl space-y-4 text-[15px] leading-relaxed mb-12"
            style={{ color: IVORY, opacity: 0.9 }}
          >
            <p>
              Commercial readiness — your organization&rsquo;s ability to attract, secure, and retain
              sponsorship — is now measurable.
            </p>
            <p>
              The PRSC Readiness Score is the first independent commercial rating for teams and
              drivers in motorsport.
            </p>
            <p>A score that tells sponsors exactly what they need to know.</p>
          </div>

          {/* Ring with side labels */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-10">
            <div className="flex flex-col gap-8">
              <DimLabel Icon={Radio} label="SIGNAL STRENGTH" align="right" />
              <DimLabel Icon={Users} label="AUDIENCE VALUE" align="right" />
              <DimLabel Icon={Fingerprint} label="PLATFORM IDENTITY" align="right" />
            </div>
            <ScoreRing />
            <div className="flex flex-col gap-8">
              <DimLabel Icon={Zap} label="ACTIVATION CAPABILITY" align="left" />
              <DimLabel Icon={BarChart3} label="MEASUREMENT CONFIDENCE" align="left" />
              <DimLabel Icon={Handshake} label="RELATIONSHIP STRENGTH" align="left" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== BLOCK 6 — COMPARISON ==================== */}
      <section style={{ background: NAVY }} className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-5xl">
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
                style={{ color: STONE, letterSpacing: "0.28em", opacity: 0.9 }}
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
      <section style={{ background: IVORY }} className="px-6 py-24 md:py-32">
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
      <section style={{ background: MIDNIGHT }} className="px-6 py-20 md:py-24">
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
            <p
              className="text-[13px] md:text-[14px] font-semibold"
              style={{ color: NAVY }}
            >
              {seatsFilled} of {seatsTotal} invitations remaining
            </p>
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

      {/* darker gold strip */}
      <section style={{ background: "#B8962B" }} className="px-6 py-4">
        <p
          className="mx-auto max-w-5xl text-center text-[13px] md:text-[14px]"
          style={{ color: NAVY, letterSpacing: "0.02em" }}
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
      <section style={{ background: IVORY }} className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-display leading-tight text-[32px] md:text-[40px]"
            style={{ color: NAVY }}
          >
            Reserve Your Spot. Request Consideration for the Readiness Vanguard.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed" style={{ color: STONE }}>
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
