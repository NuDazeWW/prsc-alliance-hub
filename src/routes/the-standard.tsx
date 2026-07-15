import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Users, Fingerprint, Zap, BarChart3, Handshake, ArrowRight } from "lucide-react";
import { ContinueReading } from "@/components/site/ContinueReading";
import boardroom from "@/assets/prsc-boardroom.jpg.asset.json";

const slugify = (s: string) => s.toLowerCase().replace(/™/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");



const CANONICAL = "https://prscstandards.com/the-standard";
const OG_IMAGE = `https://prscstandards.com${boardroom.url}`;

export const Route = createFileRoute("/the-standard")({
  head: () => ({
    meta: [
      { title: "The PRSC Readiness Score — The Standard" },
      { name: "description", content: "The Six Readiness Dimensions™ — an independent, evidence-based methodology for commercial partnership readiness." },
      { property: "og:title", content: "The PRSC Readiness Score — The Standard" },
      { property: "og:description", content: "The independent methodology and Six Readiness Dimensions™ that define commercial partnership readiness." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The PRSC Readiness Score — The Standard" },
      { name: "twitter:description", content: "The Six Readiness Dimensions™ — an independent, evidence-based methodology for commercial partnership readiness." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "preload", as: "image", href: boardroom.url, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          name: "The Six Readiness Dimensions",
          description: "The six independent dimensions of the PRSC Readiness Score™ methodology for measuring commercial partnership readiness.",
          url: CANONICAL,
          hasDefinedTerm: [
            { "@type": "DefinedTerm", name: "Signal Strength", description: "The clarity, consistency, and reach of an organization's public presence — the raw broadcast footprint on which every partnership is built." },
            { "@type": "DefinedTerm", name: "Audience Value", description: "The quality, composition, and commercial relevance of the audience delivered — not just size, but purchasing power, loyalty, and cultural weight." },
            { "@type": "DefinedTerm", name: "Platform Identity", description: "The distinctness of the brand an organization carries — how sharply it stands apart in a crowded, undifferentiated market." },
            { "@type": "DefinedTerm", name: "Activation Capability", description: "The organization's ability to execute — creative capacity, operational rigor, and speed from partnership idea to market." },
            { "@type": "DefinedTerm", name: "Measurement Confidence", description: "The reliability of the data, methodology, and reporting infrastructure a partner receives — the foundation of any credible ROI conversation." },
            { "@type": "DefinedTerm", name: "Relationship Strength", description: "The trust, retention, and depth of partner relationships — the leading indicator of long-term commercial value." },
          ],
        }),
      },
    ],
  }),
  component: TheStandardPage,
});


const DIMENSIONS = [
  { icon: Radio, title: "Signal Strength™", body: "The clarity, consistency, and reach of an organization's public presence — the raw broadcast footprint on which every partnership is built." },
  { icon: Users, title: "Audience Value™", body: "The quality, composition, and commercial relevance of the audience delivered — not just size, but purchasing power, loyalty, and cultural weight." },
  { icon: Fingerprint, title: "Platform Identity™", body: "The distinctness of the brand an organization carries — how sharply it stands apart in a crowded, undifferentiated market." },
  { icon: Zap, title: "Activation Capability™", body: "The organization's ability to execute — creative capacity, operational rigor, and speed from partnership idea to market." },
  { icon: BarChart3, title: "Measurement Confidence™", body: "The reliability of the data, methodology, and reporting infrastructure a partner receives — the foundation of any credible ROI conversation." },
  { icon: Handshake, title: "Relationship Strength™", body: "The trust, retention, and depth of partner relationships — the leading indicator of long-term commercial value." },
];

function TheStandardPage() {
  return (
    <>
      <section className="relative text-ivory pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        <img
          src={boardroom.url}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,19,34,0.7)" }} aria-hidden />
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(212,175,55,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="label-caps text-gold mb-6">The Standard</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
            The PRSC Readiness Score™.
          </h1>
          <div className="gold-rule my-8 mx-auto w-24" />
          <p className="mt-4 text-xl text-ivory/80 max-w-3xl mx-auto leading-relaxed">
            A single, independent measure of an organization's commercial partnership readiness — built on six dimensions, governed by the market, evidence at every step.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/request-briefing"
              className="inline-flex items-center rounded-sm bg-gold px-6 py-3 text-navy font-medium tracking-wide hover:bg-gold-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Request a Briefing
            </Link>
            <a
              href="#the-six-dimensions"
              className="inline-flex items-center rounded-sm border border-gold/50 px-6 py-3 text-ivory hover:border-gold hover:bg-gold/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Explore the Framework
            </a>
          </div>
        </div>
      </section>


      {/* INDEPENDENCE BY DESIGN */}
      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <svg viewBox="0 0 400 400" className="w-full h-auto max-w-md mx-auto">
              <defs>
                <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F5E6B3" />
                  <stop offset="100%" stopColor="#8C6E3B" />
                </linearGradient>
              </defs>
              {[180, 140, 100, 60].map((r, i) => (
                <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={i === 0 ? "url(#ring-gold)" : "#0A1322"} strokeOpacity={i === 0 ? 1 : 0.15 - i * 0.02} strokeWidth={i === 0 ? 2 : 1} />
              ))}
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * Math.PI * 2) / 12;
                const x1 = 200 + Math.cos(a) * 60; const y1 = 200 + Math.sin(a) * 60;
                const x2 = 200 + Math.cos(a) * 180; const y2 = 200 + Math.sin(a) * 180;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0A1322" strokeOpacity="0.1" />;
              })}
              <circle cx="200" cy="200" r="42" fill="#0A1322" />
              <text x="200" y="196" textAnchor="middle" fill="#D4AF37" fontFamily="Cormorant Garamond, serif" fontSize="34" fontWeight="500">82</text>
              <text x="200" y="218" textAnchor="middle" fill="#F2EFE6" fontSize="7" letterSpacing="2">PRSC</text>
              {[0.15, 0.45, 0.72, 0.88].map((t, i) => {
                const a = (t * Math.PI * 2) - Math.PI / 2;
                const cx = 200 + Math.cos(a) * 180; const cy = 200 + Math.sin(a) * 180;
                return <circle key={i} cx={cx} cy={cy} r="5" fill="#D4AF37" />;
              })}
            </svg>
          </div>
          <div>
            <p className="label-caps text-gold mb-4">Independence by Design</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
              Governed by the market. Owned by no one.
            </h2>
            <div className="space-y-4 text-lg text-stone leading-relaxed">
              <p>
                A standard is only as credible as the body that governs it. PRSC is structured to be non-commercial, methodologically transparent, and independent of any single organization, brand, or platform.
              </p>
              <p>
                Methodology is set by a peer-reviewed committee. Scoring is auditable. Version history is published. The Standard belongs to the market it serves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SIX DIMENSIONS */}
      <section id="the-six-dimensions" className="bg-ivory pb-24 md:pb-32 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="label-caps text-gold mb-4">The Framework</p>
            <h2 className="font-display text-4xl md:text-5xl text-navy leading-tight">
              The Six Readiness Dimensions™
            </h2>
            <div className="gold-rule my-6 mx-auto w-24" />
            <p className="text-lg text-navy leading-relaxed mb-4">
              Commercial readiness cannot be measured by a single statistic — PRSC evaluates six independent dimensions that together reflect an organization's full capacity to attract, activate, and sustain successful partnerships.
            </p>
            <p className="text-lg text-stone">
              Every organization that carries a Readiness Score™ is evaluated across these six dimensions — no shortcuts, no self-assessment, no exceptions.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((d) => (
              <div
                key={d.title}
                id={slugify(d.title)}
                className="scroll-mt-24 rounded-sm border border-navy/10 bg-card p-8 transition-all hover:border-gold hover:shadow-[0_20px_50px_-25px_rgba(10,19,34,0.35)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold mb-5">
                  <d.icon size={20} strokeWidth={1.4} aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl text-navy mb-3">{d.title}</h3>
                <p className="text-sm text-stone leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* READINESS MATURITY INDEX */}
      <section className="bg-ivory pb-24 md:pb-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <p className="label-caps text-gold mb-4">The Readiness Maturity Index™</p>
            <h2 className="font-display text-4xl md:text-5xl text-navy leading-tight mb-6">
              What the score means.
            </h2>
            <p className="text-lg text-stone leading-relaxed max-w-2xl mx-auto">
              Every Readiness Score™ maps to a maturity level — a consistent, market-wide reference point for evaluating commercial readiness.
            </p>
          </div>

          <div className="rounded-sm bg-navy text-ivory overflow-hidden">
            <table className="w-full">
              <caption className="sr-only">Readiness Maturity Index scoring bands</caption>
              <thead>
                <tr className="border-b border-bronze">
                  <th className="label-caps text-ivory/70 text-[0.7rem] text-left px-6 md:px-10 py-5 w-2/5">
                    Score Range
                  </th>
                  <th className="label-caps text-ivory/70 text-[0.7rem] text-left px-6 md:px-10 py-5">
                    Maturity Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["90–100", "Commercially Undeniable"],
                  ["80–89", "Commercially Ready"],
                  ["70–79", "Developing"],
                  ["60–69", "Emerging"],
                  ["Below 60", "Commercially Invisible"],
                ].map(([range, level], i, arr) => (
                  <tr
                    key={range}
                    className={i < arr.length - 1 ? "border-b border-bronze/35" : undefined}
                  >
                    <td className="font-display text-2xl md:text-3xl text-gold px-6 md:px-10 py-6 tabular-nums">
                      {range}
                    </td>
                    <td className="text-ivory text-base md:text-lg px-6 md:px-10 py-6">
                      {level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs md:text-sm text-center text-pewter">
            Scores are calibrated by the PRSC Methodology Committee and reviewed on a defined annual cycle.
          </p>
        </div>
      </section>


      {/* THE SCORING PROCESS */}
      <section className="bg-navy text-ivory py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl mb-14">
            <p className="label-caps text-gold mb-4">The Scoring Process</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
              Governed at every step.
            </h2>
            <p className="text-lg text-ivory/75 leading-relaxed">
              The Readiness Score™ is not self-reported. Every score is produced through a structured, peer-reviewed process governed by the PRSC Methodology Committee.
            </p>
          </div>

          <ol className="grid gap-6 md:gap-0 md:grid-cols-6">
            {[
              "Evidence Submission",
              "Independent Assessment",
              "Peer Review",
              "Calibration",
              "Readiness Score™ Issued",
              "Certification (where applicable)",
            ].map((step, i, arr) => (
              <li key={step} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-5">
                <div aria-hidden="true" className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-gold/10 text-gold font-display text-xl tabular-nums">
                  {i + 1}
                </div>
                {i < arr.length - 1 && (
                  <div
                    aria-hidden
                    className="hidden md:block absolute top-6 left-[calc(50%+1.75rem)] right-[calc(-50%+1.75rem)] h-px"
                    style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.15))" }}
                  />
                )}
                <div className="md:text-center md:px-2">
                  <p className="label-caps text-ivory/70 text-[0.6rem] mb-1">Step {i + 1}</p>
                  <p className="text-ivory text-sm md:text-[0.95rem] leading-snug">{step}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-14 text-sm text-center text-pewter">
            The scoring methodology is versioned, published, and subject to annual review. Current release: Version 1.0, 2026.
          </p>
        </div>
      </section>


      {/* ACTIONABLE INTELLIGENCE */}
      <section className="bg-midnight text-ivory py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <p className="label-caps text-gold mb-4">Actionable Intelligence</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
              A score is not a verdict.<br />It's a map.
            </h2>
            <div className="space-y-4 text-lg text-ivory/75 leading-relaxed">
              <p>
                The Readiness Score™ reveals not only where an organization stands, but where the highest-leverage investments lie. Every dimension is diagnostic. Every score is a plan.
              </p>
              <p>Benchmarks are peer-relative. Guidance is specific. The next step is always visible.</p>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-sm border border-gold/25 bg-navy/60 backdrop-blur-sm p-8">
              <div className="flex items-baseline justify-between mb-6">
                <p className="label-caps text-gold text-[0.65rem]">Composite Readiness</p>
                <p className="label-caps text-ivory/50 text-[0.6rem]">Percentile 92</p>
              </div>
              <div className="flex items-end gap-6 mb-8">
                <div className="font-display text-7xl text-ivory tabular-nums">82</div>
                <div>
                  <p className="label-caps text-gold text-[0.7rem]">Commercially Undeniable</p>
                  <p className="text-sm text-ivory/60 mt-1">+3 vs prior period</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Peer Benchmark (Top Quartile)", value: 78 },
                  { label: "This Organization", value: 82, gold: true },
                  { label: "Category Median", value: 61 },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs text-ivory/70 mb-1"><span>{r.label}</span><span className="tabular-nums">{r.value}</span></div>
                    <div className="h-1.5 rounded-full bg-ivory/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${r.value}%`, background: r.gold ? "linear-gradient(90deg,#C0C0C0,#D4AF37)" : "rgba(255,255,255,0.35)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContinueReading
        links={[
          { to: "/governance", label: "Governance" },
          { to: "/readiness-vanguard", label: "The Readiness Vanguard" },
          { to: "/request-briefing", label: "Request a Briefing" },
        ]}
      />
    </>
  );
}
