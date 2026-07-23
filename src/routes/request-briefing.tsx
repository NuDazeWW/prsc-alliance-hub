import { createFileRoute } from "@tanstack/react-router";
import { BriefingForm } from "@/components/forms/PrscForms";
import { ContinueReading } from "@/components/site/ContinueReading";

const CANONICAL = "https://prscstandards.com/request-briefing";

export const Route = createFileRoute("/request-briefing")({
  head: () => ({
    meta: [
      { title: "Request a Briefing — PRSC" },
      { name: "description", content: "Request a private briefing on the PRSC Readiness Standard, methodology, and how it applies to your organization." },
      { property: "og:title", content: "Request a Briefing — PRSC" },
      { property: "og:description", content: "Private briefings for organizations, brands, investors, and industry leaders." },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": CANONICAL + "#webpage",
            url: CANONICAL,
            name: "Request a Briefing — PRSC",
            description:
              "Request a private briefing on the PRSC Readiness Standard, methodology, and how it applies to your organization.",
            isPartOf: { "@id": "https://prscstandards.com/#website" },
            about: { "@id": "https://prscstandards.com/#organization" },
            inLanguage: "en-US",
            breadcrumb: { "@id": CANONICAL + "#breadcrumb" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": CANONICAL + "#breadcrumb",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "PRSC", item: "https://prscstandards.com/" },
              { "@type": "ListItem", position: 2, name: "Request a Briefing", item: CANONICAL },
            ],
          },
        ]),
      },
    ],
  }),
  component: BriefingPage,
});

function BriefingPage() {
  return (
    <>
      <section className="bg-ivory text-navy pt-36 pb-16 md:pt-44 md:pb-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="label-caps text-stone mb-6">Request a Briefing</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] text-navy">
            A private conversation<br />about the Standard.
          </h1>
          <div className="my-8 mx-auto w-24 h-px" style={{ background: "linear-gradient(90deg, transparent, #8C6E3B 30%, #8C6E3B 70%, transparent)" }} />
          <p className="text-lg text-stone max-w-2xl mx-auto leading-relaxed">
            Briefings are held with the Council on request — for organizations evaluating readiness, for brands and investors evaluating partnership decisions, and for industry leaders shaping the market.
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
          { to: "/the-standard", label: "PRSC Readiness Score" },
          { to: "/governance", label: "Governance" },
          { to: "/readiness-vanguard", label: "The Readiness Vanguard" },
        ]}
      />
    </>
  );
}
