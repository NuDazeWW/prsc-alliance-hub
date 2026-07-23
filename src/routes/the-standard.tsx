import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Users, Fingerprint, Zap, BarChart3, Handshake, ArrowRight } from "lucide-react";
import { ContinueReading } from "@/components/site/ContinueReading";
import boardroom from "@/assets/prsc-boardroom.jpg.asset.json";
import sealBadge from "@/assets/prsc-seal-badge.png.asset.json";

const slugify = (s: string) => s.toLowerCase().replace(/™/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");



const CANONICAL = "https://prscstandards.com/the-standard";
const OG_IMAGE = `https://prscstandards.com${boardroom.url}`;

export const Route = createFileRoute("/the-standard")({
  head: () => ({
    meta: [
      { title: "PRSC Readiness Score™ — The Independent Standard for Partnership Readiness" },
      { name: "description", content: "The PRSC Readiness Score™ is the independent, evidence-based measure of commercial partnership readiness — built on the Six Readiness Dimensions™ and governed by the Partnership Readiness Standards Council." },
      { name: "keywords", content: "PRSC Readiness Score, PRSC Readiness Standard, Partnership Readiness Standards Council, Six Readiness Dimensions, commercial readiness score, sponsorship readiness" },
      { property: "og:title", content: "PRSC Readiness Score™ — The Independent Standard for Partnership Readiness" },
      { property: "og:description", content: "The PRSC Readiness Score™ — the independent, evidence-based measure of commercial partnership readiness, governed by the Partnership Readiness Standards Council." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PRSC Readiness Score™ — The Independent Standard" },
      { name: "twitter:description", content: "The independent, evidence-based measure of commercial partnership readiness — built on the Six Readiness Dimensions™." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "preload", as: "image", href: boardroom.url, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            "@id": CANONICAL + "#prsc-readiness-score",
            name: "PRSC Readiness Score",
            alternateName: ["PRSC Readiness Score™", "Readiness Score"],
            description: "The PRSC Readiness Score is the independent, evidence-based measure of an organization's commercial partnership readiness, calculated across the Six Readiness Dimensions and governed by the Partnership Readiness Standards Council (PRSC).",
            url: CANONICAL,
            inDefinedTermSet: {
              "@type": "DefinedTermSet",
              name: "PRSC Readiness Standard",
              url: CANONICAL,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "The Six Readiness Dimensions",
            description: "The six independent dimensions of the PRSC Readiness Score methodology for measuring commercial partnership readiness.",
            url: CANONICAL,
            hasDefinedTerm: [
              { "@type": "DefinedTerm", name: "Signal Strength", description: "The clarity, consistency, and reach of an organization's public presence — the raw broadcast footprint on which every partnership is built." },
              { "@type": "DefinedTerm", name: "Audience Value", description: "The quality, composition, and commercial relevance of the audience delivered — not just size, but purchasing power, loyalty, and cultural weight." },
              { "@type": "DefinedTerm", name: "Platform Identity", description: "The distinctness of the brand an organization carries — how sharply it stands apart in a crowded, undifferentiated market." },
              { "@type": "DefinedTerm", name: "Activation Capability", description: "The organization's ability to execute — creative capacity, operational rigor, and speed from partnership idea to market." },
              { "@type": "DefinedTerm", name: "Measurement Confidence", description: "The reliability of the data, methodology, and reporting infrastructure a partner receives — the foundation of any credible ROI conversation." },
              { "@type": "DefinedTerm", name: "Relationship Strength", description: "The trust, retention, and depth of partner relationships — the leading indicator of long-term commercial value." },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is the PRSC Readiness Score?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The PRSC Readiness Score is a single, independent measure of an organization's commercial partnership readiness. It is produced through a structured, peer-reviewed process governed by the Partnership Readiness Standards Council and calculated across the Six Readiness Dimensions.",
                },
              },
              {
                "@type": "Question",
                name: "Who governs the PRSC Readiness Score?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The PRSC Readiness Score is governed by the Partnership Readiness Standards Council (PRSC) — an independent, non-commercial standards body with a peer-reviewed methodology committee.",
                },
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "PRSC", item: "https://prscstandards.com/" },
              { "@type": "ListItem", position: 2, name: "PRSC Readiness Score", item: CANONICAL },
            ],
          },
        ]),
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
          <div className="mt-10 flex justify-center">
            <Link
              to="/request-briefing"
              className="group inline-flex items-center gap-2 label-caps text-[0.75rem] font-semibold tracking-wider text-gold border-b border-transparent hover:border-gold transition-all pb-1"
              style={{ textShadow: "0 0 12px rgba(212,175,55,0.35)" }}
            >
              <span className="shimmer-link">Get Your Score</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>


      {/* INDEPENDENCE BY DESIGN */}
      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 grid gap-16 lg:grid-cols-2 items-center">
          <div className="flex justify-center">
            <img
              src={sealBadge.url}
              alt="PRSC governance seal — Partnership Readiness Standards Council"
              className="w-full h-auto max-w-sm"
              loading="lazy"
            />
          </div>

          <div>
            <p className="label-caps text-gold mb-4">Independence by Design</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
              Governed by the market. Owned by no one.
            </h2>
            <div className="space-y-4 text-lg text-stone leading-relaxed">
              <p>
                A standard is only as credible as the body that governs it. PRSC™ is structured to be non-commercial, methodologically transparent, and independent of any single organization, brand, or platform.
              </p>
              <p>
                Methodology is set by a peer-reviewed committee. Scoring is auditable. Version history is published. The Standard belongs to the market it serves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SIX DIMENSIONS */}
      <section
        id="the-six-dimensions"
        className="relative bg-navy text-ivory py-24 md:py-32 scroll-mt-24 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.6) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          aria-hidden
          style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="label-caps text-gold mb-4">The Framework</p>
            <h2 className="font-display text-4xl md:text-5xl text-ivory leading-tight">
              The Six Readiness Dimensions™
            </h2>
            <div className="gold-rule my-6 mx-auto w-24" />
            <p className="text-lg text-ivory/80 leading-relaxed mb-4">
              Commercial readiness cannot be measured by a single statistic — PRSC evaluates six independent dimensions that together reflect an organization's full capacity to attract, activate, and sustain successful partnerships.
            </p>
            <p className="text-base text-pewter">
              Every organization that carries a Readiness Score™ is evaluated across these six dimensions — no shortcuts, no self-assessment, no exceptions.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((d, i) => (
              <div
                key={d.title}
                id={slugify(d.title)}
                className="group relative scroll-mt-24 rounded-sm border border-gold/20 bg-white/[0.03] p-8 pt-10 backdrop-blur-sm transition-all hover:border-gold/60 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)]"
              >
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  aria-hidden
                  style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.9), transparent)" }}
                />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-navy shadow-[0_8px_24px_-8px_rgba(212,175,55,0.6)]">
                    <d.icon size={22} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <span className="font-display text-3xl text-gold/30 tabular-nums leading-none">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-2xl text-ivory mb-3">{d.title}</h3>
                <p className="text-sm text-ivory/70 leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* READINESS MATURITY INDEX */}
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #F2EFE6 0%, #EBE5D3 55%, #F2EFE6 100%)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          aria-hidden
          style={{ background: "radial-gradient(ellipse at top, rgba(212,175,55,0.10), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl mb-14">
            <p className="label-caps text-gold mb-4">The Readiness Maturity Index™</p>
            <h2 className="font-display text-4xl md:text-5xl text-navy leading-tight mb-6">
              What the score means.
            </h2>
            <div className="gold-rule my-6 w-24" />
            <p className="text-lg text-stone leading-relaxed">
              Every Readiness Score™ maps to a maturity level — a consistent, market-wide reference point for evaluating commercial readiness.
            </p>
          </div>

          <div
            className="relative rounded-sm bg-navy text-ivory overflow-hidden shadow-[0_40px_80px_-30px_rgba(10,19,34,0.45)]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #0F1A2E 0%, #0A1322 100%)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none rounded-sm border border-gold/25" aria-hidden />
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              aria-hidden
              style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.9), transparent)" }}
            />

            <div className="hidden md:grid grid-cols-[140px_minmax(220px,1fr)_minmax(0,2.4fr)] gap-8 px-8 md:px-12 py-5 border-b border-bronze/60">
              <p className="label-caps text-ivory/60 text-[0.65rem]">Score Range</p>
              <p className="label-caps text-ivory/60 text-[0.65rem]">Maturity Level</p>
              <div className="flex justify-between label-caps text-ivory/40 text-[0.6rem] tabular-nums">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>


            <ul className="divide-y divide-bronze/25">
              {[
                { range: "90–100", level: "Commercially Undeniable", start: 90, end: 100, tone: "from-gold-light via-gold to-antique", glow: "rgba(212,175,55,0.55)" },
                { range: "80–89", level: "Commercially Ready", start: 80, end: 89, tone: "from-gold to-bronze", glow: "rgba(212,175,55,0.35)" },
                { range: "70–79", level: "Developing", start: 70, end: 79, tone: "from-bronze to-sandstone", glow: "rgba(140,110,59,0.35)" },
                { range: "60–69", level: "Emerging", start: 60, end: 69, tone: "from-bronze/70 to-pewter", glow: "rgba(122,127,135,0.25)" },
                { range: "Below 60", level: "Commercially Invisible", start: 0, end: 59, tone: "from-pewter to-pewter/40", glow: "rgba(122,127,135,0.2)" },
              ].map((row) => {
                const leftPct = row.start;
                const widthPct = Math.max(row.end - row.start, 6);
                return (
                  <li key={row.range} className="group relative px-5 sm:px-8 md:px-12 py-6 md:py-7 transition-colors hover:bg-white/[0.03]">
                    <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(220px,1fr)_minmax(0,2.4fr)] gap-4 md:gap-8 md:items-center">
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          aria-hidden
                          className="block h-10 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-gold to-bronze opacity-80"
                        />
                        <span className="font-display text-2xl md:text-3xl text-gold tabular-nums leading-none">
                          {row.range}
                        </span>
                      </div>
                      <p className="text-ivory text-base md:text-lg">{row.level}</p>
                      <div className="relative pt-2 md:pt-0">
                        <div className="relative h-2 rounded-full bg-ivory/[0.06] overflow-hidden">
                          <div className="absolute inset-0 flex justify-between pointer-events-none" aria-hidden>
                            {Array.from({ length: 11 }).map((_, i) => (
                              <span
                                key={i}
                                className="w-px h-full"
                                style={{ background: i % 5 === 0 ? "rgba(242,239,230,0.18)" : "rgba(242,239,230,0.08)" }}
                              />
                            ))}
                          </div>
                          <div
                            className={`absolute inset-y-0 rounded-full bg-gradient-to-r ${row.tone}`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              boxShadow: `0 0 18px ${row.glow}, 0 0 2px ${row.glow}`,
                            }}
                          />
                          <div
                            aria-hidden
                            className="absolute inset-y-0 -translate-x-full group-hover:translate-x-[400%] transition-transform duration-[1800ms] ease-out"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                            }}
                          />
                        </div>
                        <span
                          aria-hidden
                          className="absolute top-1 md:-top-1 h-4 w-4 rounded-full border border-gold/70 bg-navy"
                          style={{
                            left: `calc(${row.end}% - 8px)`,
                            boxShadow: `0 0 10px ${row.glow}`,
                          }}
                        />
                      </div>
                    </div>
                  </li>

                );
              })}
            </ul>
          </div>

          <p className="mt-6 text-xs md:text-sm text-pewter">
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
