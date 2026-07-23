import { createFileRoute, Link } from "@tanstack/react-router";
import { CertificationNotifyForm } from "@/components/forms/PrscForms";

const CANONICAL = "https://prscstandards.com/certification";

export const Route = createFileRoute("/certification")({
  head: () => ({
    meta: [
      { title: "Readiness Certified™ — Partnership Readiness Standards Council" },
      {
        name: "description",
        content:
          "The Readiness Certified™ mark is issued by the Partnership Readiness Standards Council to entities that meet the published threshold on the PRSC Readiness Score™ — and maintain it.",
      },
      { property: "og:title", content: "Readiness Certified™ — PRSC" },
      {
        property: "og:description",
        content:
          "What it means to be Readiness Certified™ — a standards-based designation earned, not purchased.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Readiness Certified™ — PRSC" },
      {
        name: "twitter:description",
        content:
          "A standards-based designation issued by PRSC to entities that meet the published Readiness threshold.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: CertificationPage,
});

const ELIGIBLE = [
  { label: "Teams", body: "Signals institutional readiness to service partnership commitments at scale." },
  { label: "Drivers", body: "Signals a personal-brand infrastructure a sponsor can measure and rely on." },
  { label: "Series & Leagues", body: "Signals a governed commercial platform partners can activate against." },
  { label: "Brands", body: "Signals a partnership organization equipped to buy, measure, and renew with rigor." },
  { label: "Agencies", body: "Signals an advisory practice operating to a published, independent standard." },
  { label: "Investors", body: "Signals underwriting and portfolio oversight aligned to the market's readiness standard." },
];

function CertificationPage() {
  return (
    <div className="bg-white pt-16">
      {/* SECTION 1 — Hero */}
      <section className="bg-[#0A1322] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center">
          <p className="label-caps text-gold text-xs tracking-[0.2em] mb-5">
            Readiness Certified&trade;
          </p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-white">
            What It Means to Be Certified
          </h1>
          <div className="gold-rule my-8 mx-auto w-24" />
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            The Readiness Certified&trade; mark is issued by the Partnership Readiness Standards
            Council to entities that meet the published threshold on the PRSC Readiness Score&trade;
            &mdash; and maintain it.
          </p>
        </div>
      </section>

      {/* SECTION 2 — What Certification Is */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <h2 className="font-display text-3xl md:text-5xl text-[#0A1322] leading-tight">
            Certification Is Earned. Not Purchased.
          </h2>
          <div className="gold-rule my-8 w-24" />
          <div className="space-y-5 text-[17px] leading-[1.75] text-neutral-800">
            <p>
              The Readiness Certified&trade; mark is not a membership badge or a sponsorship tier.
              It is a standards-based designation issued only to entities that have submitted
              evidence through the Evidence Portal&trade;, received a PRSC Readiness Score&trade;
              at or above the published certification threshold, and entered into a written
              Certification License Agreement with the Council.
            </p>
            <p>
              Certification is re-evaluated annually. An entity that no longer meets the threshold
              loses the right to display the mark. The Council monitors usage and enforces the mark.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Who Is Eligible */}
      <section className="bg-[#F5F5F0]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl md:text-5xl text-[#0A1322] leading-tight">
              Who Is Eligible
            </h2>
            <div className="gold-rule my-8 w-24" />
            <p className="text-lg text-stone leading-relaxed mb-12">
              Certification is designed for every entity type that participates in the partnership
              market.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ELIGIBLE.map((e) => (
              <li
                key={e.label}
                className="rounded-sm bg-[#0A1322] border border-gold/60 p-6 md:p-7 shadow-[0_20px_50px_-30px_rgba(10,19,34,0.5)]"
              >
                <p className="font-display text-xl text-white mb-3">{e.label}</p>
                <p className="text-sm text-white/70 leading-relaxed">{e.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 4 — The Criteria */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <h2 className="font-display text-3xl md:text-5xl text-[#0A1322] leading-tight">
            The Certification Criteria
          </h2>
          <div className="gold-rule my-8 w-24" />
          <p className="text-[17px] leading-[1.75] text-neutral-800 mb-10">
            The full certification criteria &mdash; including the scoring threshold, evidence
            requirements, and mark usage rules &mdash; are published in the PRSC Written Standards
            Document.
          </p>
          <Link
            to="/governance/written-standards"
            className="inline-flex items-center rounded-sm bg-gold px-6 py-3 text-sm tracking-[0.14em] uppercase text-navy hover:bg-antique transition-colors"
          >
            Read the Written Standards Document &rarr;
          </Link>
        </div>
      </section>

      {/* SECTION 5 — Stay Informed */}
      <section className="bg-[#0A1322] text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-white leading-tight">
            Certification Opens with the Vanguard
          </h2>
          <div className="gold-rule my-8 mx-auto w-24" />
          <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto">
            The first cohort of Readiness Certified&trade; entities will be drawn from the
            Readiness Vanguard&trade; program. Certification is not yet open to the general market.
            If you want to be notified when certification criteria and applications open, register
            below.
          </p>
          <CertificationNotifyForm />
          <p className="mt-6 text-xs italic text-white/50">
            No spam. One email when certification opens. That is all.
          </p>
        </div>
      </section>
    </div>
  );
}
