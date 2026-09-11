import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PRSCReadinessGauge } from "@/components/site/PRSCReadinessGauge";
import { ReadinessExplainer } from "@/components/site/ReadinessExplainer";

import { ContinueReading } from "@/components/site/ContinueReading";
import { Building2, Briefcase, Landmark, ArrowRight, ShieldCheck, Scale, GraduationCap, LineChart } from "lucide-react";
import prscCrest from "@/assets/prsc-logo-only.png.asset.json";
import { getRequestHost } from "@/lib/portal.functions";

const CANONICAL = "https://prscstandards.com/";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { isPortalDomain } = await getRequestHost();
    if (isPortalDomain) throw redirect({ to: "/auth", search: { redirect: "/portal", mode: undefined } });
  },
  head: () => ({
    meta: [
      { title: "Partnership Readiness Standards Council (PRSC) | Readiness Score" },
      {
        name: "description",
        content:
          "Partnership Readiness Standards Council (PRSC) is the independent standards body behind the PRSC Readiness Score — an authoritative, evidence-based framework for the global sponsorship market.",
      },
      {
        name: "keywords",
        content:
          "Partnership Readiness Standards Council, PRSC, PRSC Readiness Score, Readiness Score, partnership readiness, sponsorship standard, independent standards body",
      },
      { property: "og:title", content: "Partnership Readiness Standards Council (PRSC) | Readiness Score" },
      {
        property: "og:description",
        content:
          "Partnership Readiness Standards Council (PRSC) is the independent standards body behind the PRSC Readiness Score — an authoritative, evidence-based framework for the global sponsorship market.",
      },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Partnership Readiness Standards Council (PRSC) | Readiness Score" },
      {
        name: "twitter:description",
        content:
          "The independent standards body behind the PRSC Readiness Score for the global sponsorship market.",
      },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "preload", as: "image", href: prscCrest.url, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": CANONICAL + "#webpage",
          url: CANONICAL,
          name: "Partnership Readiness Standards Council — PRSC Readiness Score",
          description:
            "The Partnership Readiness Standards Council (PRSC) governs the independent, evidence-based PRSC Readiness Score for the global sponsorship market.",
          isPartOf: { "@id": "https://prscstandards.com/#website" },
          about: { "@id": "https://prscstandards.com/#organization" },
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: `https://prscstandards.com${prscCrest.url}`,
          },
          inLanguage: "en-US",
        }),
      },
    ],
  }),
  component: HomePage,
});

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Independent Standards Body" },
  { icon: Scale, label: "Neutral Governance" },
  { icon: GraduationCap, label: "Free Readiness Score™" },
  { icon: LineChart, label: "Evidence-Based Methodology" },
];

function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-navy text-ivory overflow-hidden flex items-center" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(212,175,55,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            WebkitMaskImage:
              "radial-gradient(ellipse 45% 60% at 75% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 45% 60% at 75% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl w-full px-6 grid gap-14 lg:grid-cols-2 items-center">
          <div className="max-w-xl">

            <div className="inline-block">
              <img
                src={prscCrest.url}
                alt="PRSC crest"
                className="h-[200px] md:h-[240px] w-auto mx-auto mb-4 block"
              />
              <p className="label-caps text-gold text-[11px] tracking-[0.1em] font-semibold uppercase text-center">
                Partnership Readiness Standards Council™
              </p>
            </div>
            <h1 className="mt-6 font-display text-[1.85rem] leading-[1.08] md:text-[2.25rem] lg:text-[2.55rem] text-ivory font-medium">
              The independent body governing commercial readiness in sport.
            </h1>
            <p className="mt-8 text-lg text-ivory/60 max-w-lg leading-relaxed font-light">
              An authoritative, evidence-based framework that brings clarity, discipline, and trust to a $100B+ market — governed independently, adopted globally.
            </p>
            <p
              className="mt-4 font-display italic font-semibold text-[16px] md:text-[17px] leading-relaxed max-w-lg"
              style={{ color: "#CBB89A" }}
            >
              The Standard is being established first within motorsport — a market where commercial relationships are highly visible, financially consequential, and historically unmeasured.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                to="/request-briefing"
                className="group inline-flex items-center gap-2 label-caps text-[0.75rem] font-semibold tracking-wider text-gold border-b border-transparent hover:border-gold transition-all pb-1"
                style={{ textShadow: "0 0 12px rgba(212,175,55,0.35)" }}
              >
                <span className="shimmer-link">Request a Briefing</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/the-standard"
                className="group inline-flex items-center gap-2 label-caps text-[0.7rem] font-medium tracking-wider text-ivory border-b border-transparent hover:border-gold transition-all pb-1"
              >
                <span className="shimmer-link">PRSC Readiness Score</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative w-full flex flex-col items-center justify-center px-6 lg:-translate-x-4 lg:-translate-y-6"
          >
            <PRSCReadinessGauge />
            <p className="mt-6 mb-8 lg:mb-14 max-w-[22rem] text-center font-semibold text-ivory text-base md:text-lg lg:-translate-x-2">
              The PRSC Readiness Score™ is always free and independently governed.
            </p>
          </motion.div>
          <div className="lg:col-span-2 grid grid-cols-2 md:flex md:items-center md:justify-between gap-x-4 gap-y-3 w-full">
            {TRUST_BADGES.map((b) => (
              <span key={b.label} className="flex items-center gap-x-2 min-w-0">
                <b.icon size={14} strokeWidth={1.5} className="text-emerald shrink-0" aria-hidden />
                <span className="label-caps text-[0.6rem] md:text-[0.65rem] tracking-wider text-pewter uppercase truncate">
                  {b.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* THE MARKET IS BROKEN */}
      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="label-caps text-gold mb-6">The Case for a Standard</p>
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            The market is broken.<br />
            <span className="text-stone/80">We built the standard to fix it.</span>
          </h2>
          <div className="gold-rule my-10 mx-auto w-24" />
          <div className="space-y-5 text-lg leading-relaxed text-stone">
            <p>
              The global sponsorship and partnership industry — worth more than $100 billion annually — operates without a shared definition of value. Organizations self-assess. Brands guess. Measurement is inconsistent, opaque, and rarely comparable.
            </p>
            <p>
              The result: capital is misallocated, credible organizations are undervalued, and the market cannot function with the discipline it deserves.
            </p>
            <p className="text-navy font-medium">
              PRSC™ exists to fix that — with a single, independent, evidence-based standard.
            </p>
          </div>
        </div>
      </section>

      <ReadinessExplainer />


      {/* PATHWAY CARDS */}
      <section className="bg-[#F2EFE6] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 grid gap-8 md:grid-cols-3">
          <PathwayCard
            icon={Building2}
            eyebrow="For Teams, Drivers & Rights Holders"
            title="Prove your value."
            body="Receive a free, independent Readiness Score™. Understand exactly where you stand — and where to invest to command premium partnerships."
            to="/readiness-vanguard"
            cta="Join the Readiness Vanguard"
          />
          <PathwayCard
            icon={Briefcase}
            eyebrow="For Sponsors, Brands & Investors"
            title="Deploy capital with confidence."
            body="Evaluate partnerships against a single, independent benchmark. Reduce risk. Sharpen ROI. Move faster."
            to="/the-standard"
            cta="PRSC Readiness Score"
          />
          <PathwayCard
            icon={Landmark}
            eyebrow="For Governance"
            title="Shape the market."
            body="A neutral, market-governed body building the durable infrastructure the industry has always lacked."
            to="/governance"
            cta="Read our Governance"
          />
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="bg-midnight text-ivory py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="label-caps text-gold mb-4">Ready to Move</p>
          <h2 className="font-display text-3xl md:text-4xl leading-tight">
            The Standard is here. The market is waiting.
          </h2>
          <p className="mt-4 text-ivory/70 max-w-2xl mx-auto">
            The Readiness Vanguard is limited to the first organizations who help define the era of professionalized sponsorship.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/readiness-vanguard" className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3.5 label-caps text-[0.7rem] text-navy hover:bg-antique transition-colors">
              Join the Vanguard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <ContinueReading
        links={[
          { to: "/the-standard", label: "PRSC Readiness Score" },
          { to: "/governance", label: "Governance" },
          { to: "/readiness-vanguard", label: "The Readiness Vanguard" },
        ]}
      />
    </>
  );
}

function PathwayCard({ icon: Icon, eyebrow, title, body, to, cta }: {
  icon: typeof Building2; eyebrow: string; title: string; body: string; to: string; cta: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col rounded-sm border border-navy/10 bg-card p-8 transition-all hover:border-gold hover:shadow-[0_20px_50px_-25px_rgba(10,19,34,0.35)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold mb-6">
        <Icon size={22} strokeWidth={1.4} />
      </div>
      <p className="label-caps text-gold text-[0.65rem] mb-3">{eyebrow}</p>
      <h3 className="font-display text-2xl text-navy mb-3">{title}</h3>
      <p className="text-stone/80 text-sm leading-relaxed mb-6">{body}</p>
      <span className="mt-auto label-caps text-[0.65rem] text-navy group-hover:text-gold inline-flex items-center gap-2">
        {cta} <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
