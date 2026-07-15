import { createFileRoute } from "@tanstack/react-router";
import { Landmark, ScrollText, Users, ChevronDown, ShieldCheck, Eye, GitBranch, BookOpenCheck } from "lucide-react";
import { BoardInterestForm } from "@/components/forms/PrscForms";
import { ContinueReading } from "@/components/site/ContinueReading";

const CANONICAL = "https://prsc-alliance-hub.lovable.app/governance";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Governance — Governed by the Market. Built for the Market." },
      { name: "description", content: "PRSC is a market-governed standards body. Read our governance architecture and register interest in the founding board." },
      { property: "og:title", content: "Governance — Partnership Readiness Standards Council" },
      { property: "og:description", content: "A neutral, non-commercial, market-governed standards body for the global partnership industry." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Governance — Partnership Readiness Standards Council" },
      { name: "twitter:description", content: "A neutral, non-commercial, market-governed standards body for the global partnership industry." },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: GovernancePage,
});

const PRECEDENTS = [
  { market: "Accounting", body: "GAAP / IFRS" },
  { market: "Credit", body: "FICO" },
  { market: "Information Security", body: "ISO 27001" },
  { market: "Digital Measurement", body: "MRC" },
  { market: "Partnership Readiness", body: "PRSC", ours: true },
];

const LAYERS = [
  {
    icon: Landmark,
    name: "Governing Body",
    color: "#D4AF37",
    body: "The Council itself. Sets the constitution, approves methodology versions, and safeguards independence.",
    chips: ["Constitution", "Methodology approval", "Independence"],
  },
  {
    icon: ScrollText,
    name: "Methodology Committee",
    color: "#C29A3A",
    body: "Practitioners and researchers who develop, peer-review, and version the Standard. Publishes changes, rationale, and calibration data.",
    chips: ["Peer review", "Version control", "Calibration"],
  },
  {
    icon: Users,
    name: "Advisory Network",
    color: "#8C6E3B",
    body: "Rotating advisors from organizations, brands, media, academia, and government. Ensures the Standard evolves with the market it serves.",
    chips: ["Rotating seats", "Cross-sector", "Market signal"],
  },
];

const PRINCIPLES = [
  { icon: ShieldCheck, label: "Independent" },
  { icon: Eye, label: "Transparent" },
  { icon: BookOpenCheck, label: "Peer-Reviewed" },
  { icon: GitBranch, label: "Versioned" },
];

function GovernancePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-navy text-ivory pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          aria-hidden
          style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)" }}
        />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="label-caps text-gold mb-6">Governance</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
            Governed by the Market.<br />Built for the Market.
          </h1>
          <div className="gold-rule my-8 mx-auto w-24" />
          <p className="text-lg md:text-xl text-ivory/75 max-w-3xl mx-auto leading-relaxed">
            PRSC is a neutral standards body — independent of any single organization, brand, agency, or platform. Its authority comes from the market it serves and the rigor of the Standard it maintains.
          </p>
        </div>
      </section>

      {/* WHY WE BUILT THIS + PRECEDENT TABLE */}
      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 grid gap-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <p className="label-caps text-gold mb-4">Why We Built This</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-8">
              A market that moves $100B+ deserves an institution.
            </h2>
            <div className="space-y-5 text-lg text-stone leading-relaxed">
              <p>Every mature market has a standards body — for accounting, for credit, for security, for measurement. Partnership and sponsorship, uniquely, do not.</p>
              <p>PRSC exists to fill that gap: to build the durable, non-commercial infrastructure the industry has always lacked, so capital can be deployed with the confidence that mature markets require.</p>
            </div>
          </div>

          <div className="relative">
            <div
              className="rounded-sm border border-navy/10 bg-white/70 backdrop-blur-sm overflow-hidden shadow-[0_30px_60px_-30px_rgba(10,19,34,0.25)]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10 bg-navy/[0.03]">
                <p className="label-caps text-navy/60 text-[0.65rem]">Market</p>
                <p className="label-caps text-navy/60 text-[0.65rem]">Standards Body</p>
              </div>
              <ul>
                {PRECEDENTS.map((p) => (
                  <li
                    key={p.market}
                    className={`flex items-center justify-between px-6 py-4 border-b border-navy/5 last:border-b-0 ${
                      p.ours ? "bg-gradient-to-r from-gold/10 to-transparent" : ""
                    }`}
                  >
                    <span className={`text-sm md:text-base ${p.ours ? "font-medium text-navy" : "text-stone"}`}>
                      {p.market}
                    </span>
                    <span
                      className={`font-display text-lg md:text-xl tabular-nums tracking-wide ${
                        p.ours ? "text-gold" : "text-navy/80"
                      }`}
                    >
                      {p.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-xs text-stone/70 text-right">Every mature market. One institution each.</p>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE — PILLARS */}
      <section className="relative bg-navy text-ivory py-24 md:py-32 overflow-hidden">
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
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="label-caps text-gold mb-4">The Architecture</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">Three layers. One institution.</h2>
            <div className="gold-rule my-6 mx-auto w-24" />
            <p className="text-base md:text-lg text-ivory/70">
              A layered structure that separates governance, methodology, and market perspective — each independent, each accountable.
            </p>
          </div>

          <div className="grid gap-8 md:gap-6 md:grid-cols-3 relative">
            {LAYERS.map((l, i) => (
              <div key={l.name} className="relative">
                <div
                  className="group relative h-full rounded-sm border border-gold/20 bg-white/[0.03] p-8 pt-10 backdrop-blur-sm transition-all hover:border-gold/60 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)]"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    aria-hidden
                    style={{ background: `linear-gradient(90deg, transparent, ${l.color}, transparent)` }}
                  />
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-navy shadow-[0_8px_24px_-8px_rgba(212,175,55,0.6)]"
                    >
                      <l.icon size={22} strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <span className="font-display text-3xl tabular-nums leading-none" style={{ color: `${l.color}55` }}>
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl mb-3" style={{ color: l.color }}>
                    {l.name}
                  </h3>
                  <p className="text-sm text-ivory/70 leading-relaxed mb-6">{l.body}</p>
                  <ul className="flex flex-wrap gap-2">
                    {l.chips.map((c) => (
                      <li
                        key={c}
                        className="label-caps text-[0.6rem] text-ivory/70 border border-ivory/15 rounded-full px-3 py-1"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < LAYERS.length - 1 && (
                  <div
                    aria-hidden
                    className="md:absolute md:top-1/2 md:-right-4 md:-translate-y-1/2 flex justify-center py-2 md:py-0 text-gold/60"
                  >
                    <ChevronDown className="md:-rotate-90" size={20} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-xs md:text-sm text-pewter">
            Constitution v1.0 · 2026 · Reviewed annually by the Council.
          </p>
        </div>
      </section>

      {/* PRINCIPLES STRIP */}
      <section className="bg-midnight text-ivory py-14 border-y border-gold/20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {PRINCIPLES.map((p) => (
              <div key={p.label} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold">
                  <p.icon size={18} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <p className="label-caps text-xs text-ivory/80">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOARD INTEREST */}
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
        <div className="relative mx-auto max-w-6xl px-6 grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <div>
            <p className="label-caps text-gold mb-4">Founding Board — Register Interest</p>
            <h2 className="font-display text-4xl md:text-5xl text-navy leading-tight mb-6">
              Help shape the institution.
            </h2>
            <div className="gold-rule my-6 w-24" />
            <p className="text-lg text-stone leading-relaxed mb-8">
              PRSC is seating its founding governing body. Senior industry leaders may submit a statement of interest for the Council's consideration.
            </p>
            <ul className="space-y-4 text-stone">
              {[
                { t: "Senior industry standing", d: "Executive or peer-recognized authority in partnership, sponsorship, or adjacent markets." },
                { t: "Fixed-term commitment", d: "Council seats serve defined terms with published rotation cadence." },
                { t: "Peer-nominated selection", d: "Statements of interest are reviewed by the founding secretariat and existing Council members." },
              ].map((it) => (
                <li key={it.t} className="flex gap-4">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" aria-hidden />
                  <div>
                    <p className="font-medium text-navy">{it.t}</p>
                    <p className="text-sm text-stone/85 mt-0.5">{it.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-sm border border-navy/10 bg-white/80 backdrop-blur-sm p-6 md:p-10 shadow-[0_30px_80px_-40px_rgba(10,19,34,0.35)]">
            <BoardInterestForm />
          </div>
        </div>
      </section>

      <ContinueReading
        links={[
          { to: "/the-standard", label: "The Standard" },
          { to: "/readiness-vanguard", label: "The Readiness Vanguard" },
          { to: "/request-briefing", label: "Request a Briefing" },
        ]}
      />
    </>
  );
}
