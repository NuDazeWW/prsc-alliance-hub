import { createFileRoute } from "@tanstack/react-router";
import { BoardInterestForm } from "@/components/forms/PrscForms";
import { ContinueReading } from "@/components/site/ContinueReading";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Governance — Governed by the Market. Built for the Market." },
      { name: "description", content: "PRSC is a market-governed standards body. Read our governance architecture and register interest in the founding board." },
      { property: "og:title", content: "Governance — Partnership Readiness Standards Council" },
      { property: "og:description", content: "A neutral, non-commercial, market-governed standards body for the global partnership industry." },
    ],
  }),
  component: GovernancePage,
});

const LAYERS = [
  { name: "Governing Body", color: "#D4AF37", body: "The Council itself. Sets the constitution, approves methodology versions, and safeguards independence. Composed of senior industry leaders serving fixed terms." },
  { name: "Methodology Committee", color: "#8C6E3B", body: "Practitioners and researchers who develop, peer-review, and version the Standard. Publishes changes, rationale, and calibration data." },
  { name: "Advisory Network", color: "#CBB89A", body: "Rotating advisors from properties, brands, media, academia, and government. Ensures the Standard evolves with the market it serves." },
];

function GovernancePage() {
  return (
    <>
      <section className="relative bg-navy text-ivory pt-36 pb-24 md:pt-44 md:pb-32">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="label-caps text-gold mb-6">Governance</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">
            Governed by the Market.<br />Built for the Market.
          </h1>
          <div className="gold-rule my-8 mx-auto w-24" />
          <p className="text-xl text-ivory/75 max-w-3xl mx-auto leading-relaxed">
            PRSC is a neutral standards body — independent of any single property, brand, agency, or platform. Its authority comes from the market it serves and the rigor of the Standard it maintains.
          </p>
        </div>
      </section>

      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <p className="label-caps text-gold mb-4">Why We Built This</p>
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-8">A market that moves $100B+ deserves an institution.</h2>
          <div className="space-y-5 text-lg text-stone leading-relaxed">
            <p>Every mature market has a standards body — for accounting, for credit, for security, for measurement. Partnership and sponsorship, uniquely, do not.</p>
            <p>PRSC exists to fill that gap: to build the durable, non-commercial infrastructure the industry has always lacked, so capital can be deployed with the confidence that mature markets require.</p>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="bg-navy text-ivory py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="label-caps text-gold mb-4">The Architecture</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">Three layers. One institution.</h2>
          </div>
          <div className="space-y-6">
            {LAYERS.map((l, i) => (
              <div key={l.name} className="grid gap-6 md:grid-cols-[220px_1fr] items-center rounded-sm border border-ivory/10 bg-ivory/[0.02] p-8">
                <div className="flex items-center gap-4">
                  <div className="font-display text-5xl tabular-nums" style={{ color: l.color }}>{String(i + 1).padStart(2, "0")}</div>
                  <div className="h-14 w-1" style={{ backgroundColor: l.color }} />
                </div>
                <div>
                  <h3 className="font-display text-2xl mb-2" style={{ color: l.color }}>{l.name}</h3>
                  <p className="text-ivory/75 leading-relaxed">{l.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOARD INTEREST */}
      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <p className="label-caps text-gold mb-4">Founding Board — Register Interest</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">Help shape the institution.</h2>
            <div className="gold-rule my-6 mx-auto w-24" />
            <p className="text-lg text-stone max-w-2xl mx-auto">
              PRSC is seating its founding governing body. Senior industry leaders may submit a statement of interest for the Council's consideration.
            </p>
          </div>
          <BoardInterestForm />
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
