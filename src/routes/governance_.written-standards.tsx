import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CANONICAL = "https://prscstandards.com/governance/written-standards";

export const Route = createFileRoute("/governance_/written-standards")({
  head: () => ({
    meta: [
      { title: "Written Standards Document — PRSC" },
      {
        name: "description",
        content:
          "The published criteria governing the use and administration of the Readiness Certified™ mark, issued by the Partnership Readiness Standards Council. Version 1.0.",
      },
      { property: "og:title", content: "Written Standards Document — PRSC" },
      {
        property: "og:description",
        content:
          "The published criteria governing the Readiness Certified™ mark. Version 1.0, Effective July 22, 2026.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Written Standards Document — PRSC" },
      {
        name: "twitter:description",
        content:
          "The published criteria governing the Readiness Certified™ mark. Version 1.0.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: WrittenStandardsPage,
});

type Section = {
  id: string;
  num: string;
  title: string;
  body: JSX.Element;
};

const SECTIONS: Section[] = [
  {
    id: "s1",
    num: "Section 1",
    title: "What the Mark Certifies",
    body: (
      <>
        <p>
          The Mark certifies that the authorized user has undergone a formal assessment by the
          Certifier and has achieved a minimum PRSC Readiness Score&trade; of 70 out of 100,
          demonstrating institutional capability across six dimensions:
        </p>
        <ul className="mt-5 space-y-3 list-disc pl-6 marker:text-gold">
          <li>
            <span className="font-semibold text-[#0A1322]">Audience Intelligence.</span> The entity
            knows its audience through verifiable data.
          </li>
          <li>
            <span className="font-semibold text-[#0A1322]">Measurement Capability.</span> The entity
            can prove its audience creates commercial value.
          </li>
          <li>
            <span className="font-semibold text-[#0A1322]">Strategic Positioning Readiness&trade;.</span>{" "}
            The entity clearly defines its value proposition and competitive differentiation.
          </li>
          <li>
            <span className="font-semibold text-[#0A1322]">Asset Architecture.</span> The entity has
            structured its commercial inventory for market execution.
          </li>
          <li>
            <span className="font-semibold text-[#0A1322]">Operational Readiness.</span> The entity
            possesses the infrastructure to service a partnership.
          </li>
          <li>
            <span className="font-semibold text-[#0A1322]">Commercial Architecture.</span> The entity
            maintains a pricing and packaging model aligned with market standards.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "s2",
    num: "Section 2",
    title: "Who May Use the Mark",
    body: (
      <>
        <p>
          The Mark may be used by any commercial entity operating within the sports, entertainment,
          or partnership ecosystem (including teams, leagues, properties, agencies, and brands)
          that:
        </p>
        <ul className="mt-5 space-y-3 list-disc pl-6 marker:text-gold">
          <li>Submits the required verifiable data to the Certifier&rsquo;s assessment platform.</li>
          <li>
            Achieves the minimum required PRSC Readiness Score&trade; as determined by the
            Certifier&rsquo;s proprietary methodology.
          </li>
          <li>Executes a written Certification Mark License Agreement with the Certifier.</li>
          <li>Maintains its score through an annual re-certification process.</li>
        </ul>
      </>
    ),
  },
  {
    id: "s3",
    num: "Section 3",
    title: "Method of Evaluation",
    body: (
      <p>
        Compliance with the standards is evaluated through a quantitative scoring process. The
        applicant submits operational, financial, and audience data through the Evidence
        Portal&trade;. This data is processed by the Readiness Engine&trade; &mdash; a proprietary
        scoring methodology governed by the Certifier&rsquo;s independent Methodology Committee.
        The evaluation is objective, data-driven, and uniformly applied to all applicants within
        their respective vertical categories.
      </p>
    ),
  },
  {
    id: "s4",
    num: "Section 4",
    title: "Impartiality and Non-Discrimination",
    body: (
      <p>
        The Certifier administers the certification program even-handedly. The Certifier does not
        discriminate among applicants who meet the published criteria. The Certifier is
        structurally independent and does not condition certification on the purchase of any
        consulting, advisory, or matchmaking services from the Certifier or its affiliates. Any
        entity that meets the objective scoring threshold and agrees to the standard licensing
        terms shall be granted the right to use the Mark.
      </p>
    ),
  },
  {
    id: "s5",
    num: "Section 5",
    title: "Control and Enforcement",
    body: (
      <p>
        The Certifier exercises legitimate control over the use of the Mark. The Certifier monitors
        use of the Mark in the marketplace. If an authorized user&rsquo;s PRSC Readiness
        Score&trade; falls below the required threshold during the annual re-certification, or if
        the user applies the Mark to unauthorized goods or services, the Certifier shall revoke the
        license and require immediate cessation of the Mark&rsquo;s use. The Certifier reserves the
        right to pursue legal action against unauthorized use or infringement.
      </p>
    ),
  },
];

function WrittenStandardsPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

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
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
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
                Written Standards Document
              </h1>
              <p className="mt-5 italic text-lg md:text-xl text-white/60 max-w-2xl">
                The published criteria governing the use and administration of the Readiness
                Certified&trade; mark.
              </p>
              <p className="mt-6 text-xs tracking-[0.14em] uppercase text-gold">
                Version 1.0 &nbsp;&middot;&nbsp; Effective July 22, 2026 &nbsp;&middot;&nbsp; Public
                Document
              </p>
            </div>
            <a
              href="#download"
              className="hidden shrink-0 inline-flex items-center rounded-sm border border-gold px-5 py-2.5 text-xs tracking-[0.18em] uppercase text-gold hover:bg-gold hover:text-navy transition-colors self-start"
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
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`inline-block pb-1 border-b-2 transition-colors ${
                    activeId === s.id
                      ? "text-gold border-gold"
                      : "text-white/70 border-transparent hover:text-white"
                  }`}
                >
                  {s.num} &mdash; {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Sections */}
      {SECTIONS.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className={i % 2 === 0 ? "bg-white" : "bg-[#F5F5F0]"}
        >
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 scroll-mt-32">
            <p className="label-caps text-gold text-xs tracking-[0.18em] mb-3">{s.num}</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[#0A1322] leading-tight">
              {s.title}
            </h2>
            <div className="mt-8 text-[17px] leading-[1.75] text-neutral-800 space-y-5">
              {s.body}
            </div>
          </div>
        </section>
      ))}

      {/* Closing */}
      <section className="bg-[#0A1322] text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center space-y-5">
          <Link
            to="/governance"
            className="block text-gold text-sm tracking-[0.14em] uppercase hover:underline"
          >
            &larr; Return to Governance Overview
          </Link>
          <Link
            to="/standard-v1"
            className="block text-gold text-sm tracking-[0.14em] uppercase hover:underline"
          >
            Read the PRSC Readiness Standard &rarr;
          </Link>
        </div>
      </section>

      {/* Footer band */}
      <footer className="bg-[#0A1322] border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-white/50 space-y-1">
          <p>&copy; 2026 Partnership Readiness Standards Council, LLC. All rights reserved.</p>
          <p>Version 1.0 &nbsp;&middot;&nbsp; Effective July 22, 2026</p>
        </div>
      </footer>
    </div>
  );
}
