import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { getMyDocuments, getPortalSession } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal/summary")({
  head: () => ({
    meta: [
      { title: "Your Completion Summary — Private Welcome Center" },
      { name: "description", content: "A record of the documents you signed and acknowledged in your private Welcome Center." },
      { property: "og:title", content: "Your Completion Summary" },
      { property: "og:description", content: "A record of your signed and acknowledged documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const session = useQuery({ queryKey: ["portal-session"], queryFn: () => getPortalSession(), retry: false });
  const docs = useQuery({ queryKey: ["my-documents"], queryFn: () => getMyDocuments().catch(() => null), retry: false });
  const m: any = (session.data as any)?.member;
  const list = docs.data?.documents ?? [];
  const byDoc = new Map((docs.data?.completions ?? []).map((c: any) => [c.document_id, c]));
  const name = m ? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() : "";

  return (
    <main className="min-h-screen bg-navy px-4 py-10 text-ivory print:bg-background print:text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to="/portal" className="inline-flex items-center gap-2 text-base text-gold hover:text-ivory">
            <ArrowLeft className="h-4 w-4" /> Return to Welcome Center
          </Link>
          <Button type="button" onClick={() => window.print()} className="gap-2 text-base">
            <Printer className="h-4 w-4" /> Print or save as PDF
          </Button>
        </div>
        <p className="mt-10 text-xs uppercase tracking-[0.2em] text-gold">Completion summary</p>
        <h1 className="mt-3 font-display text-4xl">{name || "Your documents"}</h1>
        <p className="mt-3 text-base text-ivory/65 print:text-foreground">
          A record of every document you completed in your private Welcome Center. Generated {new Date().toLocaleString()}.
        </p>
        <p className="mt-3 text-base text-ivory/65 print:hidden">
          This page is a printable record only. To read, sign or continue a document, open{" "}
          <Link to="/portal" hash="documents" className="text-gold underline underline-offset-4 hover:text-ivory">Your Personal Documents</Link>.
        </p>
        {docs.isLoading && <p className="mt-8 text-base text-gold">Loading…</p>}
        {!docs.isLoading && list.length === 0 && <p className="mt-8 text-base text-ivory/60">No documents have been released to you yet.</p>}
        <ul className="mt-8 divide-y divide-gold/15 border border-gold/25">
          {list.map((d: any) => {
            const c: any = byDoc.get(d.id);
            return (
              <li key={d.id} className="p-5">
                <p className="text-lg">{d.title}</p>
                <p className="mt-1 text-base text-ivory/60 print:text-foreground">
                  {!c
                    ? "Not completed yet"
                    : c.kind === "signed"
                      ? `Signed by ${c.signed_name} (initials “${c.initials}”) on ${new Date(c.acknowledged_at).toLocaleString()}`
                      : c.kind === "external_confirmed"
                        ? `Signed in BoldSign — confirmed ${new Date(c.acknowledged_at).toLocaleDateString()}`
                        : `Read and acknowledged (initials “${c.initials}”) on ${new Date(c.acknowledged_at).toLocaleString()}`}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-sm text-ivory/45 print:text-foreground">Questions? Email info@readinessterminal.com.</p>
      </div>
    </main>
  );
}
