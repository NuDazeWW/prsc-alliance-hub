import { createFileRoute, Link } from "@tanstack/react-router";
import { trackDownload } from "@/lib/track-download";

const CANONICAL = "https://prscstandards.com/standard-v1";

export const Route = createFileRoute("/standard-v1")({
  head: () => ({
    meta: [
      { title: "The PRSC Readiness Standard™ v1.0 — Full Document" },
      {
        name: "description",
        content:
          "The full text of the PRSC Readiness Standard™ v1.0 — the independent framework for measuring commercial readiness across partnership-driven ecosystems. Effective July 22, 2026.",
      },
      { property: "og:title", content: "The PRSC Readiness Standard™ v1.0 — Full Document" },
      {
        property: "og:description",
        content:
          "The full text of the PRSC Readiness Standard™ v1.0 — the independent framework for measuring commercial readiness in partnership-driven ecosystems.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The PRSC Readiness Standard™ v1.0" },
      {
        name: "twitter:description",
        content: "The full text of the PRSC Readiness Standard™ v1.0 — effective July 22, 2026.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://prscstandards.com/" },
            { "@type": "ListItem", position: 2, name: "The Standard", item: "https://prscstandards.com/the-standard" },
            { "@type": "ListItem", position: 3, name: "Standard v1.0", item: CANONICAL },
          ],
        }),
      },
    ],
  }),
  component: StandardV1Page,
});

const SECTIONS: Array<{ id: string; label: string }> = [
  { id: "purpose", label: "Purpose" },
  { id: "scope", label: "Scope" },
  { id: "dimensions", label: "The Six Dimensions" },
  { id: "scoring", label: "Scoring" },
  { id: "drift", label: "Readiness Drift" },
  { id: "evidence", label: "Evidence Standard" },
  { id: "version-governance", label: "Version Governance" },
  { id: "not-published", label: "What Is Not Published" },
  { id: "governance", label: "Governance" },
  { id: "contact", label: "Contact" },
];

const ENTITIES: Array<[string, string, string]> = [
  ["Teams & Racing Entities", "Supply-side — primary commercial asset", "PRSC Readiness Score™"],
  ["Drivers & Athletes", "Supply-side — individual commercial asset", "PRSC Readiness Score™"],
  ["Series & Sanctioning Bodies", "Supply-side — ecosystem infrastructure", "PRSC Readiness Score™"],
  ["Brands & Sponsors", "Demand-side — capital and activation partner", "Partnership Readiness Score™"],
  ["Agencies", "Intermediary — advisory and activation", "Partnership Readiness Score™"],
  ["Strategic Investors", "Capital — equity or structured investment", "Investment Readiness Score™"],
];

const DIMENSIONS: Array<{ n: string; title: string; body: string[]; evaluated: string }> = [
  {
    n: "Dimension 1",
    title: "Signal Strength™",
    body: [
      "Signal Strength measures the clarity, consistency, and accessibility of an entity's commercial value. It asks a fundamental question: can the market see you clearly enough to act on what you offer?",
      "An entity with high Signal Strength has a coherent commercial narrative, consistent messaging across channels, and a value proposition that is easy for potential partners to discover, understand, and engage with. An entity with low Signal Strength may have genuine commercial value that the market cannot perceive or act upon — a condition the Standard calls Decision Visibility™ gap.",
    ],
    evaluated:
      "Signal Strength evaluates four areas: the coherence of the commercial narrative, the consistency of messaging across platforms and touchpoints, the accessibility of the entity to potential partners, and the relevance of the signal to current market demand. Full construct definitions are provided in the scored Readiness Report.",
  },
  {
    n: "Dimension 2",
    title: "Audience Value™",
    body: [
      "Audience Value measures the commercial utility, engagement depth, and portability of the audiences an entity influences. It asks: how much commercial leverage does your audience actually provide?",
      "An entity with high Audience Value commands audiences that are demographically aligned with commercial partners' targets, deeply engaged rather than passively following, and demonstrably capable of driving commercial outcomes — purchases, conversions, brand affinity shifts. Critically, the Standard measures Audience Portability™ — the degree to which an entity can transfer audience attention to a commercial partner, independent of organizational affiliation. Reach without portability is a limited commercial asset.",
    ],
    evaluated:
      "Audience Value evaluates four areas: audience scale and demographic composition, engagement depth and community participation, proven commercial utility, and audience portability. Full construct definitions are provided in the scored Readiness Report.",
  },
  {
    n: "Dimension 3",
    title: "Platform Identity™",
    body: [
      "Platform Identity measures how clearly and credibly an entity defines its identity, value proposition, and differentiation within the ecosystem. It asks: do you know who you are, and does the market agree?",
      "An entity with high Platform Identity has a clear sense of purpose, a compelling and differentiated value proposition, and a well-defined role within the broader ecosystem. Partners can articulate why they chose this entity over alternatives. An entity with low Platform Identity may be commercially capable but undifferentiated — interchangeable with competitors in the market's perception, which limits pricing power and partnership quality.",
    ],
    evaluated:
      "Platform Identity evaluates four areas: organizational identity and purpose, value proposition clarity, competitive differentiation, and role clarity within the ecosystem. Full construct definitions are provided in the scored Readiness Report.",
  },
  {
    n: "Dimension 4",
    title: "Activation Capability™",
    body: [
      "Activation Capability measures the operational readiness to execute partnerships and convert commercial potential into measurable outcomes. It asks: can you actually deliver what you promise?",
      "The Standard explicitly distinguishes between past activation activity and future activation capability. An entity may have a strong track record of past activations but lack the infrastructure, processes, or resources to scale. Conversely, an entity may have strong infrastructure but limited execution history. Both dimensions matter. High Activation Capability means an entity can respond quickly to emerging opportunities, fulfill partnership commitments consistently, and generate measurable results from activation efforts.",
    ],
    evaluated:
      "Activation Capability evaluates four areas: activation infrastructure and systems, activation readiness and response speed, delivery consistency and fulfillment history, and outcome generation. Full construct definitions are provided in the scored Readiness Report.",
  },
  {
    n: "Dimension 5",
    title: "Measurement Confidence™",
    body: [
      "Measurement Confidence measures the reliability, integrity, and decision-making usefulness of the information an entity uses to evaluate its own performance. It asks: can you prove what you claim?",
      "This dimension evaluates trust in data rather than reporting volume. An entity can produce extensive reports while having low Measurement Confidence if those reports are based on inconsistent data, lack governance, or cannot be translated into actionable decisions. High Measurement Confidence means an entity's performance data is accurate, governed, and decision-ready — enabling partners to rely on it for investment and renewal decisions.",
    ],
    evaluated:
      "Measurement Confidence evaluates four areas: measurement infrastructure and technical capability, measurement integrity and data governance, decision intelligence and insight translation, and evidence-based improvement. Full construct definitions are provided in the scored Readiness Report.",
  },
  {
    n: "Dimension 6",
    title: "Relationship Strength™",
    body: [
      "Relationship Strength measures the quality, trust, durability, and reciprocity of an entity's stakeholder relationships. It asks: do your partners stay, and do they grow with you?",
      "The Standard evaluates relational capability and retention rather than network size. An entity with a large number of short-term or transactional relationships scores lower than an entity with a smaller number of deep, durable, and mutually valuable partnerships. High Relationship Strength is characterized by stakeholder trust, consistent reliability, the creation of mutual value, and the compounding returns of long-term engagements — the relationships that renew, expand, and refer.",
    ],
    evaluated:
      "Relationship Strength evaluates four areas: relationship trust and organizational reputation, reliability and professionalism, reciprocity and mutual value creation, and relationship durability and partner retention. Full construct definitions are provided in the scored Readiness Report.",
  },
];

const TIERS: Array<[string, string, string]> = [
  [
    "85 – 100",
    "Readiness Leader",
    "Demonstrates exceptional commercial readiness across most or all dimensions. Positioned to command premium partnerships and anchor-level relationships.",
  ],
  [
    "70 – 84",
    "Readiness Ready",
    "Demonstrates strong commercial readiness with identifiable areas for improvement. Competitive for mid-to-upper tier partnerships. Improvement in lagging dimensions will drive meaningful score gains.",
  ],
  [
    "55 – 69",
    "Readiness Developing",
    "Demonstrates foundational commercial capability with material gaps in one or more dimensions. Partnerships are achievable but commercial friction is limiting performance and pricing.",
  ],
  [
    "40 – 54",
    "Readiness Emerging",
    "Demonstrates early-stage commercial readiness. Significant investment in specific dimensions required before competitive partnership positioning is achievable.",
  ],
  [
    "0 – 39",
    "Readiness Early Stage",
    "Foundational commercial infrastructure is not yet in place. The Readiness Report will identify the specific dimensions and constructs that require priority attention.",
  ],
];

const COMMITMENTS: Array<[string, string]> = [
  [
    "Version Numbers.",
    "Every published version of the Standard carries a version number (e.g., v1.0, v1.1, v2.0). Minor updates that clarify language without changing the scoring architecture increment the minor version number. Substantive changes to the dimensions, constructs, or scoring philosophy increment the major version number.",
  ],
  [
    "Effective Dates.",
    "Every version carries an effective date. Scores issued under a prior version are identified by the version under which they were generated.",
  ],
  [
    "Archived Versions.",
    "All prior versions of the Standard are archived and remain publicly accessible. The Council does not delete or revise prior published versions.",
  ],
  [
    "Change Summaries.",
    "Substantive changes are accompanied by a published summary describing what changed, why it changed, and how entities previously scored under the prior version should interpret the change.",
  ],
  [
    "Advance Notice.",
    "Substantive changes are announced with reasonable advance notice before the new version becomes effective, except for emergency corrections required to address material errors.",
  ],
];

const NOT_PUBLISHED: string[] = [
  "The dimensional weighting models — the relative weights assigned to each of the six dimensions in the composite score calculation.",
  "The audience-specific calibration logic — the adjustments applied to generate contextually relevant scores for different entity types.",
  "The construct scoring formulas — the algorithms that translate observable indicators into construct scores and dimensional scores.",
  "The evidence weighting methodology — the specific logic used to classify and weight evidence by source, recency, and verifiability.",
  "The benchmark calibration models — the statistical models used to generate quartile rankings and tier-specific benchmarks.",
  "The Readiness Drift™ calculation methodology — the specific algorithms used to calculate variance from optimal benchmark scores.",
  "The Architecture Priority Signals™ recommendation logic — the prioritization engine that ranks interventions by their potential impact.",
];

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="my-8 border-l-4 border-gold bg-[#FDF6E3] px-6 py-6 md:px-8 md:py-7 rounded-sm"
      style={{ boxShadow: "0 2px 12px -6px rgba(10,19,34,0.15)" }}
    >
      <p className="font-display italic text-lg md:text-xl leading-relaxed text-[#1A1A1A]">
        {children}
      </p>
    </blockquote>
  );
}

function SectionHeading({ id, num, title }: { id: string; num: string; title: string }) {
  return (
    <div className="mb-6 pt-4" id={id} style={{ scrollMarginTop: "140px" }}>
      <p className="label-caps text-gold text-xs mb-2">Section {num}</p>
      <h2 className="font-display text-3xl md:text-4xl text-navy leading-tight">{title}</h2>
      <div className="mt-4 h-px w-16 bg-gold" />
    </div>
  );
}

function StandardV1Page() {
  return (
    <div className="bg-[#F5F5F0] text-[#1A1A1A]">
      {/* HEADER BAND */}
      <header className="bg-navy text-ivory">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="max-w-3xl">
              <p className="label-caps text-gold text-xs mb-4">
                Partnership Readiness Standards Council
              </p>
              <h1 className="font-display text-4xl md:text-6xl leading-tight text-ivory mb-5">
                The PRSC Readiness Standard™
              </h1>
              <p className="italic text-lg md:text-xl text-ivory/70 max-w-2xl leading-relaxed">
                A Framework for Measuring Commercial Readiness in Partnership-Driven Ecosystems
              </p>
              <p className="mt-6 text-xs tracking-[0.18em] uppercase text-gold">
                Version 1.0 · Effective July 22, 2026 · Public Document
              </p>
            </div>
            <div className="shrink-0 md:pt-2">
              <a
                href="/downloads/prsc-readiness-standard-v1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackDownload(
                    "prsc-readiness-standard-v1.pdf",
                    "/downloads/prsc-readiness-standard-v1.pdf",
                    "Readiness Standard v1 — Download PDF",
                  )
                }
                className="inline-flex items-center gap-2 rounded-sm border border-gold bg-transparent px-5 py-3 text-xs tracking-[0.18em] uppercase text-gold hover:bg-gold hover:text-navy transition-colors"
              >
                Download PDF
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* STICKY ANCHOR NAV */}
      <nav
        aria-label="Standard sections"
        className="sticky top-[56px] md:top-[64px] z-40 bg-navy text-ivory border-b border-gold/20 shadow-[0_2px_10px_-6px_rgba(0,0,0,0.6)]"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <ul className="flex gap-1 md:gap-2 overflow-x-auto whitespace-nowrap py-3 text-[11px] md:text-[12px] tracking-[0.14em] uppercase scrollbar-none">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-block px-3 py-1.5 text-ivory/75 hover:text-gold border-b-2 border-transparent hover:border-gold/70 transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="mx-auto max-w-4xl px-6 py-16 md:py-20 space-y-20 text-[15.5px] md:text-[16.5px] leading-[1.75]">
        {/* SECTION 1 */}
        <section>
          <SectionHeading id="purpose" num="1" title="Purpose and Governing Philosophy" />
          <p className="mb-5">
            The PRSC Readiness Standard™ (the "Standard") is the foundational methodology of the
            Partnership Readiness Standards Council ("PRSC" or the "Council"). It defines what
            commercial readiness means, how it is measured, and how scores are interpreted for
            entities operating within sponsorship, partnership, and investment-driven ecosystems.
          </p>
          <p className="mb-5">
            The Standard exists because the partnership economy has a measurement problem. Billions
            of dollars are committed annually to sponsorships and strategic alliances based on
            fragmented data, historical assumptions, and relationship-driven intuition. There is no
            shared language for commercial readiness — no standardized framework that tells a brand
            whether a team is actually prepared to deliver commercial value, or tells a team
            precisely where its commercial architecture is failing. The result is misaligned
            capital, underperforming partnerships, and a persistent gap between what partnerships
            cost and what they return.
          </p>
          <p className="mb-5">
            The Standard is designed to close that gap. It provides a common, rigorous, and
            independently governed framework that transforms observable commercial signals into
            structured readiness intelligence — enabling supply-side entities to understand their
            commercial maturity, demand-side entities to make better allocation decisions, and the
            broader ecosystem to operate with greater confidence and accountability.
          </p>
          <PullQuote>
            "The Standard's governing objective is to maximize the long-term enterprise value of the
            partnership ecosystem by establishing readiness measurement as trusted market
            infrastructure. Independent governance, rigorous methodology, and consistent application
            are design mechanisms — they exist because they build the market trust required for
            broad adoption and durable commercial outcomes."
          </PullQuote>
          <p>
            The Council publishes the Standard — its definitions, scoring philosophy, version
            history, and interpretation guidance — so that all ecosystem participants can understand
            what is being measured and why. The Council does not publish the Readiness Engine™, the
            proprietary intelligence system that applies the Standard. The weights, calibration
            logic, scoring formulas, and algorithmic architecture of the Engine are held as
            permanent trade secrets. This division — publish the Standard, protect the Engine — is
            the same principle that governs every credible ratings and standards body. Credibility
            and defensibility coexist.
          </p>
        </section>

        {/* SECTION 2 */}
        <section>
          <SectionHeading id="scope" num="2" title="Scope and Applicability" />
          <p className="mb-8">
            The Standard is designed to evaluate commercial readiness across the full range of
            entities that participate in partnership-driven ecosystems. The Standard applies to,
            but is not limited to, the following entity types:
          </p>
          <div className="overflow-x-auto rounded-sm border border-navy/10 bg-white shadow-sm">
            <table className="w-full text-sm md:text-[15px] border-collapse">
              <thead>
                <tr className="bg-navy text-ivory">
                  <th className="text-left px-4 py-3 font-semibold tracking-wide">Entity Type</th>
                  <th className="text-left px-4 py-3 font-semibold tracking-wide">Ecosystem Role</th>
                  <th className="text-left px-4 py-3 font-semibold tracking-wide">
                    Score Type Generated
                  </th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map(([entity, role, score], i) => (
                  <tr key={entity} className={i % 2 === 0 ? "bg-white" : "bg-[#F5F8FC]"}>
                    <td className="px-4 py-3 font-semibold text-navy align-top">{entity}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] align-top">{role}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] align-top">{score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8">
            The Standard applies a single universal architecture — the six Readiness Dimensions™ —
            to all entity types. The Readiness Engine™ applies audience-specific calibration models
            to generate contextually relevant scores for each entity type from that shared
            architecture. This means the Standard is consistent across the ecosystem while the
            scores it generates are specific to the role and context of each entity being evaluated.
          </p>
        </section>

        {/* SECTION 3 */}
        <section>
          <SectionHeading id="dimensions" num="3" title="The Six Readiness Dimensions™" />
          <p className="mb-5">
            The Standard evaluates commercial readiness across six universal dimensions. Each
            dimension measures a distinct and essential component of an entity's ability to create,
            capture, and sustain commercial value in a partnership-driven ecosystem. Together, the
            six dimensions constitute a complete picture of commercial readiness — no single
            dimension is sufficient on its own, and weakness in any dimension creates commercial
            friction that limits the performance of the others.
          </p>
          <p className="mb-10">
            Each dimension is scored on a scale of 0–100. A composite PRSC Readiness Score™ is
            derived from the six dimensional scores using the Readiness Engine™. Dimensional scores
            and the composite score are provided to evaluated entities in their scored Readiness
            Report. Benchmark comparisons are provided where the Readiness Benchmark Database™
            contains sufficient data for the entity's tier and category.
          </p>
          <div className="space-y-6">
            {DIMENSIONS.map((d) => (
              <article
                key={d.title}
                className="rounded-sm border-l-4 border-gold bg-white px-6 md:px-8 py-6 md:py-7 shadow-[0_2px_14px_-6px_rgba(10,19,34,0.12)]"
              >
                <p className="label-caps text-gold text-[10px] mb-2">{d.n}</p>
                <h3 className="font-display text-2xl md:text-[26px] text-navy font-semibold mb-4">
                  {d.title}
                </h3>
                {d.body.map((p, i) => (
                  <p key={i} className="mb-4 text-[#1A1A1A]">
                    {p}
                  </p>
                ))}
                <p className="mt-3 italic text-[13.5px] md:text-[14px] text-stone/90 leading-relaxed">
                  {d.evaluated}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 4 */}
        <section>
          <SectionHeading id="scoring" num="4" title="Scoring Philosophy" />
          <p className="mb-5">
            A PRSC Readiness Score™ is a point-in-time measure of an entity's commercial readiness
            across the six dimensions. It is not a ranking, a rating of financial creditworthiness,
            or a guarantee of commercial outcomes. It is a structured, evidence-based assessment of
            how prepared an entity is to create, capture, and sustain commercial value in its
            current state.
          </p>
          <p className="mb-5">
            Scores are expressed on a 0–100 scale for each dimension and as a composite. The
            composite score is derived from the six dimensional scores using the Readiness Engine™.
            The Engine applies audience-specific weighting models calibrated to the entity type
            being evaluated — the weighting applied to a team differs from the weighting applied to
            a brand, because the commercial priorities of each role differ. The specific weights
            and calibration logic are not published; they are held as trade secrets of the Council.
          </p>
          <p className="mb-8">
            Scores are interpreted in context. A score of 72 means different things for a regional
            touring car team and a top-tier international series. The Readiness Benchmark Database™
            provides the contextual layer — quartile rankings and tier-specific benchmarks that
            allow an entity to understand its score relative to comparable entities in the
            ecosystem. Benchmark comparisons are provided where the Database contains sufficient
            data for the entity's tier and category.
          </p>
          <div className="overflow-x-auto rounded-sm border border-navy/10 bg-white shadow-sm">
            <table className="w-full text-sm md:text-[15px] border-collapse">
              <thead>
                <tr className="bg-navy text-ivory">
                  <th className="text-center px-4 py-3 font-semibold tracking-wide w-32">
                    Score Range
                  </th>
                  <th className="text-left px-4 py-3 font-semibold tracking-wide">
                    Readiness Tier
                  </th>
                  <th className="text-left px-4 py-3 font-semibold tracking-wide">
                    Interpretation
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map(([range, tier, interp], i) => (
                  <tr key={range} className={i % 2 === 0 ? "bg-white" : "bg-[#F5F8FC]"}>
                    <td className="px-4 py-4 font-bold text-center text-navy align-top tabular-nums">
                      {range}
                    </td>
                    <td className="px-4 py-4 font-semibold text-navy align-top">{tier}</td>
                    <td className="px-4 py-4 text-[#1A1A1A] align-top font-normal">{interp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8">
            Score tiers are reference points, not thresholds for participation. Any entity may
            participate in the Readiness Vanguard™ program regardless of their current score. The
            purpose of the score is to identify where commercial readiness is strong, where it is
            constrained, and what specific improvements will generate the greatest commercial
            return.
          </p>
        </section>

        {/* SECTION 5 */}
        <section>
          <SectionHeading id="drift" num="5" title="Readiness Drift™" />
          <p className="mb-5">
            A score has limited value without directional context. The Standard includes a
            Readiness Drift™ framework that quantifies the variance between an entity's current
            dimensional scores and the optimal benchmark scores required for commercial success in
            their specific ecosystem tier.
          </p>
          <p className="mb-5">
            Readiness Drift identifies the specific dimensions where an entity is falling behind
            its benchmark — and by how much. It also identifies the dimensions where an entity is
            performing above benchmark, which represents a competitive advantage to be protected
            and leveraged. The Drift analysis generates Architecture Priority Signals™ — a
            prioritized set of actionable interventions ranked by their potential to increase the
            overall Readiness Score and reduce commercial friction.
          </p>
          <p>
            Readiness Drift is provided in the scored Readiness Report. It is not a separate
            product — it is the interpretive layer that transforms a score into a roadmap.
          </p>
        </section>

        {/* SECTION 6 */}
        <section>
          <SectionHeading id="evidence" num="6" title="The Evidence Standard" />
          <p className="mb-5">
            The PRSC Readiness Score™ is an evidence-based score. It is not based on self-reported
            claims, survey responses, or subjective assessments. It is based on verifiable evidence
            submitted through the PRSC Evidence Portal™ and, where applicable, third-party data
            sourced by the Readiness Engine™.
          </p>
          <p className="mb-5">
            Evidence is classified by source, recency, and verifiability before it is applied to
            the scoring architecture. Evidence submitted by the entity being scored is weighted
            differently from third-party verified data. More recent evidence is weighted more
            heavily than historical data. Evidence that can be independently verified is weighted
            more heavily than evidence that cannot.
          </p>
          <p>
            This evidence classification logic is a core feature of the Standard's integrity. It
            means that a score cannot be inflated by submitting volume without substance. The
            Engine is designed to reward genuine commercial readiness, not the appearance of it.
          </p>
          <PullQuote>
            "The Standard measures what is actually true about an entity's commercial readiness —
            not what the entity believes to be true, and not what the entity wishes were true.
            Evidence quality determines score quality."
          </PullQuote>
        </section>

        {/* SECTION 7 */}
        <section>
          <SectionHeading id="version-governance" num="7" title="Version Governance" />
          <p className="mb-5">
            The Standard is a living document. It will evolve as the partnership ecosystem evolves,
            as new data sources become available, and as the Council's understanding of commercial
            readiness deepens. All changes to the Standard are governed by the Council's Governing
            Body and Methodology Committee under the methodology change governance process
            established in the PRSC Operating Agreement.
          </p>
          <p className="mb-8">The Council commits to the following version governance principles:</p>
          <dl className="space-y-5 pl-4 md:pl-6 border-l border-navy/10">
            {COMMITMENTS.map(([term, def]) => (
              <div key={term}>
                <dt className="font-semibold text-navy inline">{term}</dt>{" "}
                <dd className="inline text-[#1A1A1A]">{def}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* SECTION 8 */}
        <section>
          <SectionHeading id="not-published" num="8" title="What Is Not Published" />
          <p className="mb-6">
            The Council is committed to transparency about what the Standard measures and how
            scores are interpreted. The Council is equally committed to protecting the proprietary
            intelligence architecture that makes the Standard valuable. The following components of
            the Readiness Engine™ are held as permanent trade secrets and are not published,
            disclosed, or licensed in any form:
          </p>
          <ul className="space-y-3 mb-6">
            {NOT_PUBLISHED.map((item) => (
              <li key={item} className="relative pl-6">
                <span
                  aria-hidden
                  className="absolute left-0 top-[0.65em] h-1.5 w-1.5 rounded-full bg-gold"
                />
                <span className="text-[#1A1A1A]">{item}</span>
              </li>
            ))}
          </ul>
          <p className="italic text-[14.5px] text-stone/90 leading-relaxed">
            This is not a limitation on transparency — it is the design of a credible standards
            body. The Standard tells you what is measured and what it means. The Engine determines
            how it is measured. Every credible ratings and standards organization in the world
            operates on this principle. Publishing the Engine would not make scores more credible —
            it would make them gameable.
          </p>
        </section>

        {/* SECTION 9 */}
        <section>
          <SectionHeading id="governance" num="9" title="Governance and Independence" />
          <p className="mb-5">
            The Standard is governed by the Partnership Readiness Standards Council, an
            independent standards body organized as a Delaware limited liability company. The
            Council's Governing Body holds exclusive authority over what the Standard measures, how
            it evolves, and when it changes. No commercial party — including Decision Intelligence
            Systems, Inc. ("DIS"), the Council's exclusive technology operator — has authority to
            direct methodology decisions.
          </p>
          <p className="mb-5">
            The Council and DIS are affiliated organizations with distinct responsibilities. The
            Council governs the Standard independently. DIS licenses the Standard and operates the
            Readiness Terminal™ and Evidence Portal™ under an arm's-length licensing agreement.
            Governance safeguards — including the Conflict Prohibition, the Revenue Firewall, and
            the Founder Recusal Protocol — are published in the Council's Governance &
            Market-Trust Charter and are binding under the Council's Operating Agreement.
          </p>
          <p>
            The Council publishes an Annual Governance Statement covering board composition,
            conflicts disclosed, methodology versions, and the Revenue Firewall Certification. The
            Annual Governance Statement is available on the Council's website.
          </p>
        </section>

        {/* SECTION 10 */}
        <section>
          <SectionHeading id="contact" num="10" title="Contact and Further Information" />
          <p className="mb-5">
            Questions about the Standard, the scoring process, or the Readiness Vanguard™ program
            may be directed to the Council through the contact information published on the
            Council's website at{" "}
            <a href="/" className="text-navy underline decoration-gold/60 hover:decoration-gold">
              prscstandards.com
            </a>
            . To request a scored Readiness Assessment, visit the Evidence Portal™ at{" "}
            <a
              href="https://readinessterminal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline decoration-gold/60 hover:decoration-gold"
            >
              readinessterminal.com
            </a>{" "}
            or submit a{" "}
            <Link
              to="/request-briefing"
              className="font-semibold text-gold hover:text-bronze underline decoration-gold/50 hover:decoration-bronze"
            >
              Request a Briefing
            </Link>{" "}
            inquiry through the Council's website.
          </p>
        </section>
      </main>

      {/* DOCUMENT FOOTER BAND */}
      <footer className="bg-navy text-ivory/70">
        <div className="mx-auto max-w-4xl px-6 py-10 text-center text-[12.5px] leading-relaxed space-y-2">
          <p>© 2026 Partnership Readiness Standards Council, LLC. All rights reserved.</p>
          <p className="text-ivory/55">
            PRSC Readiness Standard™, Readiness Engine™, Readiness Terminal™, Readiness Certified™,
            and all related marks are trademarks of Partnership Readiness Standards Council, LLC.
          </p>
          <p className="text-gold tracking-[0.14em] uppercase text-[11px] pt-2">
            Version 1.0 · Effective July 22, 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
