import { createFileRoute } from "@tanstack/react-router";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/data/faq";
import { FaqSearch } from "@/components/site/FaqSearch";

const CANONICAL = "https://prscstandards.com/faq";

function slug(c: string) {
  return c
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — PRSC Readiness Score™ Questions Answered" },
      {
        name: "description",
        content:
          "100 answers about the PRSC Readiness Score™: how it is calculated, what it means for sponsorship, data privacy, governance, cost, and how to get started.",
      },
      { property: "og:title", content: "PRSC Readiness Score™ — Frequently Asked Questions" },
      {
        property: "og:description",
        content:
          "How the PRSC Readiness Score™ works, what it measures, who governs it, and what it costs.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PRSC Readiness Score™ — FAQ" },
      {
        name: "twitter:description",
        content: "100 answers about the PRSC Readiness Score™ and the PRSC Readiness Standard™.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://prscstandards.com/",
              },
              { "@type": "ListItem", position: 2, name: "FAQ", item: CANONICAL },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((i) => ({
              "@type": "Question",
              name: i.question,
              acceptedAnswer: { "@type": "Answer", text: i.answer },
            })),
          },
        ]),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="bg-white pt-16">
      <section className="bg-[#0A1322] text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <p className="label-caps text-gold text-xs tracking-[0.2em] mb-5">
            Frequently Asked Questions
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.08] text-white">
            Everything about the PRSC Readiness Score&trade;
          </h1>
          <div className="gold-rule my-7 w-24" />
          <p className="text-lg text-white/70 max-w-3xl leading-relaxed">
            One hundred answers covering how the Score is built, what it measures, how your data is
            handled, who governs the Standard, and what it costs.
          </p>
          <nav aria-label="FAQ categories" className="mt-8 flex flex-wrap gap-2">
            {FAQ_CATEGORIES.map((c) => (
              <a
                key={c}
                href={`#${slug(c)}`}
                className="rounded-full border border-white/20 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-gold hover:text-gold"
              >
                {c}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 md:py-20">
        <div className="mb-14 rounded-sm border border-navy/10 bg-ivory h-[70vh] overflow-hidden">
          <FaqSearch source="page" />
        </div>

        {FAQ_CATEGORIES.map((c) => (
          <div key={c} id={slug(c)} className="scroll-mt-24 mb-12">
            <h2 className="font-display text-2xl md:text-3xl text-navy">{c}</h2>
            <div className="gold-rule my-5 w-16" />
            <dl>
              {FAQ_ITEMS.filter((i) => i.category === c).map((i) => (
                <div key={i.id} className="border-b border-navy/10 py-5">
                  <dt className="font-medium text-navy leading-snug">{i.question}</dt>
                  <dd className="mt-2 text-stone leading-relaxed text-[0.95rem]">{i.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    </div>
  );
}
