import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CANONICAL = "https://prscstandards.com/governance/charter";

export const Route = createFileRoute("/governance_/charter")({
  head: () => ({
    meta: [
      { title: "Governance & Market-Trust Charter — PRSC" },
      {
        name: "description",
        content:
          "The foundational commitments that govern the Partnership Readiness Standards Council's independence, methodology, and accountability. Version 1.0.",
      },
      { property: "og:title", content: "Governance & Market-Trust Charter — PRSC" },
      {
        property: "og:description",
        content:
          "Foundational commitments governing PRSC's independence, methodology, and accountability. Public document, Version 1.0.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Governance & Market-Trust Charter — PRSC" },
      {
        name: "twitter:description",
        content: "PRSC's binding governance charter — Version 1.0, Effective July 22, 2026.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: CharterPage,
});

type Article = {
  id: string;
  eyebrow: string;
  title: string;
  provisions: { num: string; heading: string; body: string }[];
  intro?: string;
};

const articles: Article[] = [
  {
    id: "article-i",
    eyebrow: "Article I",
    title: "Foundational Principles & Independence",
    provisions: [
      {
        num: "1.1",
        heading: "Governance Integrity.",
        body: "Authority over what the Standard measures, how it is weighted, and when it changes rests exclusively with the Council's Governing Body and Methodology Committee, exercised in a fiduciary governance capacity. This authority shall not be delegated to, or captured by, any commercial party, rated entity, or technology licensee.",
      },
      {
        num: "1.2",
        heading: "Commercial Separation.",
        body: "To preserve its neutrality as an independent referee, the Council shall take no outside investment from rated entities and shall charge no deal, matchmaking, or success fees. The Council's revenue shall be strictly limited to subscriptions, certification fees, benchmark data licensing, and related information services.",
      },
      {
        num: "1.3",
        heading: "Affiliation & Licensing Transparency.",
        body: "The Council is affiliated with Decision Intelligence Systems, Inc. (\u201CDIS\u201D), which serves as the exclusive technology operator and licensee of the Readiness Terminal\u2122. The Council and DIS are distinct organizations with distinct responsibilities. The Council governs the Standard independently; DIS operationalizes it under an arm's-length licensing agreement. The Council retains the right to terminate the DIS license if DIS materially breaches the independence requirements set forth in this Charter. DIS has no authority to modify the Standard or the scoring methodology.",
      },
      {
        num: "1.4",
        heading: "Publish the Standard, Protect the Engine.",
        body: "The Council commits to publishing the Standard \u2014 including what is measured, why it matters, definitions, scoring philosophy, interpretation guidance, and version history. The Council shall protect the Readiness Engine\u2122 \u2014 including specific weights, calibration formulas, model tuning, thresholds, and statistical adjustments \u2014 as a permanent trade secret to prevent gaming of the Standard and preserve its statistical validity.",
      },
    ],
  },
  {
    id: "article-ii",
    eyebrow: "Article II",
    title: "The Governing Body",
    provisions: [
      {
        num: "2.1",
        heading: "Authority.",
        body: "The Governing Body is the legal and fiduciary authority of the Council. It is responsible for protecting the independence of the Standard, approving changes to this Charter, overseeing the integrity of the scoring methodology, and ensuring the Council fulfills its mandate as an independent standards body.",
      },
      {
        num: "2.2",
        heading: "Composition.",
        body: "The Governing Body shall consist of five (5) voting seats, deliberately structured to balance the constituencies the Council serves: (a) Founder / Chair Seat; (b) Independent Standards Seat (methodology and governance expertise); (c) Supply-Side Seat (operator representing rated entities); (d) Demand-Side Seat (brand or investor representing capital allocators); and (e) Independent Governance Seat (legal or compliance expertise, serving as the structural firewall).",
      },
      {
        num: "2.3",
        heading: "The Path to Independence (Milestone Triggers).",
        body: "At launch, the Founder shall serve as Chair and sole voting member while the methodology is established. The Council publicly commits to seating the independent voting members upon the achievement of specific institutional milestones: (a) Milestone 1: Two (2) of the four independent seats shall be filled and granted voting authority upon the achievement of 15 of 25 Readiness Vanguard\u2122 slots filled; (b) Milestone 2: The remaining two (2) independent seats shall be filled and granted voting authority prior to the Council's first institutional anchor mandate or priced institutional financing.",
      },
      {
        num: "2.4",
        heading: "The Conflict Prohibition.",
        body: "No member of the Governing Body may hold a financial interest in any entity that is currently rated by the Council, or in NuDaze Worldwide, or in DIS. Any member who acquires such an interest must disclose it within thirty (30) days and recuse themselves from all votes touching that entity. Failure to disclose is grounds for immediate removal.",
      },
      {
        num: "2.5",
        heading: "The Founder Recusal Protocol.",
        body: "The Founder/Chair shall recuse from any vote that involves a commercial relationship between the Council and NuDaze Worldwide, DIS, or NicoleIsNine Holdings. A designated Independent Governance Seat member shall chair such votes.",
      },
    ],
  },
  {
    id: "article-iii",
    eyebrow: "Article III",
    title: "The Methodology Committee",
    provisions: [
      {
        num: "3.1",
        heading: "Authority.",
        body: "The Methodology Committee is the technical authority of the Council. It owns the PRSC Readiness Standard \u2014 including the published methodology, the scoring framework, the six dimensions, and the calibration profiles. The Committee determines what the score means and how it is calculated at the framework level.",
      },
      {
        num: "3.2",
        heading: "Composition & Appointment.",
        body: "The Methodology Committee shall consist of five to seven (5\u20137) members, appointed by the Governing Body, serving staggered two-year terms. The Committee shall include a Committee Chair, a Supply-Side Domain Expert, a Demand-Side Domain Expert, a Data Science/Measurement Expert, and Independent Methodology Experts from adjacent scoring domains.",
      },
      {
        num: "3.3",
        heading: "Scope of Decision-Making.",
        body: "The Methodology Committee has the authority to review and approve changes to the published Standard, validate the scoring dimensions, and commission independent audits of the scoring framework. The Committee does not access the trade-secret calibration weights (the Readiness Engine\u2122), does not make decisions regarding individual scores, and shall have no commercial relationship with rated entities.",
      },
    ],
  },
  {
    id: "article-iv",
    eyebrow: "Article IV",
    title: "Methodology Change Governance",
    provisions: [
      {
        num: "4.1",
        heading: "Evolution of the Standard.",
        body: "The Standard is designed to evolve. Changes to the methodology shall be reviewed and approved by the Methodology Committee and published with clear version history.",
      },
      {
        num: "4.2",
        heading: "Public Change Commitments.",
        body: "For any material change to the Standard, the Council commits to publishing: (a) the new version number; (b) the effective date; (c) a summary of substantive changes; and (d) reasonable advance notice and implementation guidance (except in the case of emergency statistical corrections). The Council shall maintain a public archive of prior versions of the Standard.",
      },
    ],
  },
  {
    id: "article-v",
    eyebrow: "Article V",
    title: "Certification Mark Impartiality",
    provisions: [
      {
        num: "5.1",
        heading: "Even-Handed Administration.",
        body: "The Council's certification program, including the issuance of the Readiness Certified\u2122 mark, shall be administered even-handedly and without discrimination among qualified applicants. The criteria for certification shall be published and applied consistently.",
      },
      {
        num: "5.2",
        heading: "No Arbitrary Denial.",
        body: "No entity shall be denied certification for reasons unrelated to the published criteria. The Council shall not use certification as a mechanism to enforce commercial compliance or to punish entities for engaging with competitors of DIS.",
      },
    ],
  },
  {
    id: "article-vi",
    eyebrow: "Article VI",
    title: "Amendments & Accountability",
    provisions: [
      {
        num: "6.1",
        heading: "The No-Capture Lock.",
        body: "The foundational principles of independence, the conflict rules, and the commercial separation requirements set forth in this Charter cannot be set aside, waived, or amended by any commercial party or licensee. These provisions are locked structural protections.",
      },
      {
        num: "6.2",
        heading: "Amendment Process.",
        body: "This Charter is intentionally difficult to alter. Any amendment to this Charter requires the affirmative approval of the Governing Body, a documented rationale, public notice, and a stated effective date.",
      },
      {
        num: "6.3",
        heading: "The Annual Governance Statement.",
        body: "To ensure proportional accountability, the Council shall publish an Annual Governance Statement detailing: (a) the current composition of the Governing Body and Methodology Committee; (b) any conflicts disclosed and recusal actions taken during the year; (c) a summary of methodology versions published and amendments adopted; (d) the number of entities scored in the preceding year; (e) any material changes to the DIS licensing arrangement; and (f) the Revenue Firewall Certification: an affirmative declaration by the Governing Body that no revenue received by the Council in the preceding year was tied to the outcome of any commercial deal involving a rated entity.",
      },
    ],
  },
];

function CharterPage() {
  const [activeId, setActiveId] = useState<string>(articles[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    articles.forEach((a) => {
      const el = document.getElementById(a.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white pt-16">
      {/* Header band */}
      <header className="bg-[#0A1322] text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="max-w-3xl">
              <p className="label-caps text-gold text-xs tracking-[0.18em] mb-4">
                Partnership Readiness Standards Council
              </p>
              <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight text-white">
                Governance &amp; Market-Trust Charter
              </h1>
              <p className="mt-5 italic text-lg md:text-xl text-white/60 max-w-2xl">
                The foundational commitments that govern the Council's independence,
                methodology, and accountability.
              </p>
              <p className="mt-6 text-xs tracking-[0.14em] uppercase text-gold">
                Version 1.0 &nbsp;·&nbsp; Effective July 22, 2026 &nbsp;·&nbsp; Public Document
              </p>
            </div>
            <a
              href="#download"
              className="shrink-0 inline-flex items-center rounded-sm border border-gold px-5 py-2.5 text-xs tracking-[0.18em] uppercase text-gold hover:bg-gold hover:text-navy transition-colors self-start"
            >
              Download PDF
            </a>
          </div>
        </div>
      </header>

      {/* Sticky anchor nav */}
      <nav className="sticky top-16 z-30 bg-[#0A1322] border-y border-white/10 shadow-md">
        <div className="mx-auto max-w-5xl px-6">
          <ul className="flex gap-6 overflow-x-auto py-3 text-xs md:text-sm whitespace-nowrap scrollbar-hide">
            {articles.map((a) => (
              <li key={a.id}>
                <a
                  href={`#${a.id}`}
                  className={`inline-block pb-1 border-b-2 transition-colors ${
                    activeId === a.id
                      ? "text-gold border-gold"
                      : "text-white/70 border-transparent hover:text-white"
                  }`}
                >
                  {a.eyebrow} &mdash; {a.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Articles */}
      {articles.map((a, i) => (
        <section
          key={a.id}
          id={a.id}
          className={i % 2 === 0 ? "bg-white" : "bg-[#F5F5F0]"}
        >
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 scroll-mt-32">
            <p className="label-caps text-gold text-xs tracking-[0.18em] mb-3">
              {a.eyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[#0A1322] leading-tight">
              {a.title}
            </h2>
            <div className="mt-8 space-y-6 text-[17px] leading-[1.75] text-neutral-800">
              {a.provisions.map((p) => (
                <p key={p.num}>
                  <span className="font-bold text-[#0A1322]">
                    {p.num} {p.heading}
                  </span>{" "}
                  {p.body}
                </p>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Closing */}
      <section className="bg-[#0A1322] text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-lg md:text-xl leading-relaxed text-white">
            These commitments are binding on the Governing Body, the Methodology Committee,
            and all affiliated commercial entities. They are published in full as a permanent
            public record.
          </p>
          <div className="mt-8">
            <Link
              to="/governance"
              className="text-gold text-sm tracking-[0.14em] uppercase hover:underline"
            >
              &larr; Return to Governance Overview
            </Link>
          </div>
        </div>
      </section>

      {/* Footer band */}
      <footer className="bg-[#0A1322] border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-white/50 space-y-1">
          <p>© 2026 Partnership Readiness Standards Council, LLC. All rights reserved.</p>
          <p>Version 1.0 &nbsp;·&nbsp; Effective July 22, 2026</p>
        </div>
      </footer>
    </div>
  );
}
