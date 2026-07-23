import { createFileRoute } from "@tanstack/react-router";

const CANONICAL = "https://prscstandards.com/certification";

export const Route = createFileRoute("/certification")({
  head: () => ({
    meta: [
      { title: "Certification — PRSC" },
      {
        name: "description",
        content:
          "PRSC Certification criteria and application process — launching Q4 2026. The independent readiness certification for partnership-driven ecosystems.",
      },
      { property: "og:title", content: "Certification — PRSC" },
      {
        property: "og:description",
        content:
          "PRSC Certification criteria and application process — launching Q4 2026.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Certification — PRSC" },
      {
        name: "twitter:description",
        content: "Certification criteria and application process — launching Q4 2026.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: CertificationPage,
});

function CertificationPage() {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-navy px-6 py-24">
      <div className="max-w-2xl text-center">
        <p className="label-caps text-gold mb-6">PRSC Certification</p>
        <h1 className="font-display text-5xl md:text-7xl text-ivory leading-tight mb-8">
          Coming Soon
        </h1>
        <div className="mx-auto h-px w-20 bg-gold mb-8" />
        <p className="text-lg md:text-xl text-gold leading-relaxed">
          Certification criteria and application process — launching Q4 2026.
        </p>
      </div>
    </section>
  );
}
