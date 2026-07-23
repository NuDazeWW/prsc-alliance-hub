import { createFileRoute } from "@tanstack/react-router";
import { Award, TrendingUp, Landmark } from "lucide-react";
import { VanguardInterestForm } from "@/components/forms/PrscForms";
import { ContinueReading } from "@/components/site/ContinueReading";
import paddock from "@/assets/prsc-paddock.jpg.asset.json";

const CANONICAL = "https://prscstandards.com/readiness-vanguard";
const OG_IMAGE = `https://prscstandards.com${paddock.url}`;

export const Route = createFileRoute("/readiness-vanguard")({
  head: () => ({
    meta: [
      { title: "The Readiness Vanguard — PRSC" },
      { name: "description", content: "The Readiness Vanguard is the founding cohort of organizations helping define the era of professionalized sponsorship. Limited seats." },
      { property: "og:title", content: "The Readiness Vanguard — PRSC" },
      { property: "og:description", content: "A limited founding cohort of organizations. The credential, the benchmark, the legacy." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "PRSC", item: "https://prscstandards.com/" },
            { "@type": "ListItem", position: 2, name: "The Readiness Vanguard", item: CANONICAL },
          ],
        }),
      },
    ],
  }),
  component: VanguardPage,
});

const FEATURES = [
  { icon: Award, title: "The Credential", body: "Vanguard members carry the PRSC founding-cohort designation — a permanent mark of leadership in a market moving toward disciplined, evidence-based partnership." },
  { icon: TrendingUp, title: "The Benchmark", body: "Full Readiness Score™ assessment. Peer-relative benchmarks. Diagnostic guidance across all six dimensions — the fastest path to commercial clarity." },
  { icon: Landmark, title: "The Legacy", body: "Vanguard organizations shape the calibration data behind the Standard itself. Their partnership defines what the industry will call ready for a generation." },
];

function VanguardPage() {
  return (
    <>
      <section className="relative text-ivory pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden">
        <img
          src={paddock.url}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,19,34,0.65)" }} aria-hidden />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(212,175,55,0.6), transparent 40%), radial-gradient(circle at 75% 60%, rgba(212,175,55,0.4), transparent 40%)" }} />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="label-caps text-gold mb-6">The Readiness Vanguard</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.02]">
            Be among the first organizations ever issued an independent<br /><span className="text-gold">PRSC Readiness Score™</span>
          </h1>
          <div className="gold-rule my-8 mx-auto w-24" />
          <p className="text-xl text-ivory/75 max-w-3xl mx-auto leading-relaxed">
            The Readiness Vanguard is the founding group of rights holders in sport to receive an independent PRSC Readiness Score™. It costs nothing. The score is yours.
          </p>
          <p className="mt-6 text-lg text-ivory/70 max-w-3xl mx-auto leading-relaxed">
            The Readiness Vanguard is open to teams, drivers, series, and venues across motorsport and emerging competitive sports — the markets where the gap between commercial potential and commercial proof is widest, and where the Standard will have the most immediate impact.
          </p>
        </div>
      </section>

      {/* THREE-COL FEATURE */}
      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 grid gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-sm border border-navy/10 bg-card p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold mb-6">
                <f.icon size={22} strokeWidth={1.4} />
              </div>
              <h3 className="font-display text-3xl text-navy mb-4">{f.title}</h3>
              <p className="text-stone leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCARCITY CTA */}
      <section className="bg-midnight text-ivory py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="label-caps text-gold mb-4">Founding Cohort — Limited</p>
          <h2 className="font-display text-3xl md:text-4xl leading-tight">
            The Vanguard is capped. Every seat carries permanent standing.
          </h2>
          <p className="mt-4 text-ivory/70">Applications reviewed on a rolling basis by the Council.</p>
        </div>
      </section>

      {/* FORM */}
      <section className="bg-ivory text-navy py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <p className="label-caps text-gold mb-4">Apply</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">Register your organization for consideration.</h2>
            <div className="gold-rule my-6 mx-auto w-24" />
          </div>
          <VanguardInterestForm />
        </div>
      </section>

      <ContinueReading
        links={[
          { to: "/the-standard", label: "PRSC Readiness Score" },
          { to: "/governance", label: "Governance" },
          { to: "/request-briefing", label: "Request a Briefing" },
        ]}
      />
    </>
  );
}
