import { createFileRoute } from "@tanstack/react-router";
import { BriefingForm } from "@/components/forms/PrscForms";
import { ContinueReading } from "@/components/site/ContinueReading";

export const Route = createFileRoute("/request-briefing")({
  head: () => ({
    meta: [
      { title: "Request a Briefing — PRSC" },
      { name: "description", content: "Request a private briefing on the PRSC Readiness Standard, methodology, and how it applies to your organization." },
      { property: "og:title", content: "Request a Briefing — PRSC" },
      { property: "og:description", content: "Private briefings for properties, brands, investors, and industry leaders." },
    ],
  }),
  component: BriefingPage,
});

function BriefingPage() {
  return (
    <>
      <section className="bg-navy text-ivory pt-36 pb-16 md:pt-44 md:pb-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="label-caps text-gold mb-6">Request a Briefing</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">
            A private conversation<br />about the Standard.
          </h1>
          <div className="gold-rule my-8 mx-auto w-24" />
          <p className="text-lg text-ivory/75 max-w-2xl mx-auto leading-relaxed">
            Briefings are held with the Council on request — for properties evaluating readiness, for brands and investors evaluating partnership decisions, and for industry leaders shaping the market.
          </p>
        </div>
      </section>

      <section className="bg-ivory text-navy py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-sm border border-navy/10 bg-card p-8 md:p-12">
            <BriefingForm />
          </div>
          <p className="mt-6 text-center text-xs text-stone/60">
            Submissions are received directly by the Council and answered within two business days.
          </p>
        </div>
      </section>

      <ContinueReading
        links={[
          { to: "/the-standard", label: "The Standard" },
          { to: "/governance", label: "Governance" },
          { to: "/readiness-vanguard", label: "The Readiness Vanguard" },
        ]}
      />
    </>
  );
}
