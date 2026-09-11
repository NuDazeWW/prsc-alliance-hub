import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, CircleHelp, FileText, Landmark, LockKeyhole, Scale } from "lucide-react";
import { getPortalSession } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: "Private Board & Advisor Center | PRSC" }, { name: "description", content: "Confidential PRSC and DIS board and advisor briefing center." }, { name: "robots", content: "noindex,nofollow,noarchive" }, { property: "og:title", content: "Private Board & Advisor Center | PRSC" }, { property: "og:description", content: "Confidential PRSC and DIS board and advisor briefing center." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PortalHome,
});
const entityLabel = { prsc: "PRSC", dis: "DIS", both: "PRSC + DIS" } as const;
function PortalHome() {
  const { data, isLoading, error } = useQuery({ queryKey: ["portal-session"], queryFn: () => getPortalSession() });
  if (isLoading) return <PortalShell><div className="flex min-h-[70vh] items-center justify-center text-gold">Opening your private center…</div></PortalShell>;
  if (error || !data?.member) return <PortalShell><div className="mx-auto max-w-xl px-6 py-24 text-center"><LockKeyhole className="mx-auto h-8 w-8 text-gold"/><h1 className="mt-5 font-display text-4xl">Access unavailable</h1><p className="mt-4 text-ivory/60">Please contact info@readinessterminal.com for assistance.</p></div></PortalShell>;
  const m = data.member; const name = m.professional_name || m.first_name;
  const cards = [
    ...(m.entity !== "dis" ? [{ icon: Scale, eyebrow: "The standard", title: "PRSC", copy: "The independent framework establishing how partnership readiness is defined, measured, and governed.", anchor: "prsc" }] : []),
    ...(m.entity !== "prsc" ? [{ icon: Landmark, eyebrow: "Decision intelligence", title: "DIS", copy: "The operating system translating evidence into readiness intelligence for leaders and investors.", anchor: "dis" }] : []),
    { icon: BookOpen, eyebrow: "Your contribution", title: "Why now", copy: "A market moving from subjective claims toward credible, comparable evidence requires experienced stewards.", anchor: "role" },
  ];
  return <PortalShell>
    <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[285px_1fr]">
      <aside className="border-b border-gold/20 bg-ivory/[.025] p-7 lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r lg:p-9">
        <p className="text-[10px] uppercase text-gold">Welcome center</p><h2 className="mt-3 font-display text-3xl">{name} {m.last_name}</h2><p className="mt-1 text-sm text-ivory/50">{m.title || (m.role === "advisor" ? "Advisor" : "Board Member")}</p><p className="text-sm text-ivory/50">{m.organization}</p>
        <div className="my-8 h-px bg-gold/20"/><p className="text-[10px] uppercase text-ivory/45">Designation</p><p className="mt-2 text-sm text-gold">{entityLabel[m.entity]}</p><p className="mt-7 text-[10px] uppercase text-ivory/45">Package status</p><p className="mt-2 flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-gold" />{m.package_status.replaceAll("_", " ")}</p>
        <Button asChild className="mt-8 w-full rounded-none bg-gold text-navy hover:bg-gold-light"><Link to="/portal/profile"><FileText className="mr-2 h-4 w-4"/>Open private profile</Link></Button>
        <nav className="mt-9 space-y-3 text-sm text-ivory/55"><a href="#overview" className="block hover:text-gold">Overview</a>{m.entity !== "dis" && <a href="#prsc" className="block hover:text-gold">PRSC</a>}{m.entity !== "prsc" && <a href="#dis" className="block hover:text-gold">DIS</a>}<a href="#role" className="block hover:text-gold">Your role</a><a href="#questions" className="block hover:text-gold">Questions</a></nav>
      </aside>
      <main>
        <section id="overview" className="border-b border-gold/15 px-7 py-16 sm:px-12 lg:px-16 lg:py-24"><p className="text-xs uppercase text-gold">Welcome, {name}</p><h1 className="mt-5 max-w-4xl font-display text-5xl leading-none sm:text-7xl">Welcome to what’s next.</h1><p className="mt-8 max-w-3xl text-lg leading-8 text-ivory/65">This center is your private briefing environment for the work ahead—why it matters, how {entityLabel[m.entity]} is taking shape, and where your perspective will be most valuable.</p></section>
        <section className="grid border-b border-gold/15 md:grid-cols-3">{cards.map((card) => <a key={card.title} href={`#${card.anchor}`} className="group border-b border-gold/15 p-8 last:border-0 md:border-b-0 md:border-r md:last:border-r-0 lg:p-10"><card.icon className="h-6 w-6 text-gold"/><p className="mt-10 text-[10px] uppercase text-gold">{card.eyebrow}</p><h2 className="mt-3 font-display text-4xl">{card.title}</h2><p className="mt-5 text-sm leading-6 text-ivory/55">{card.copy}</p><ArrowRight className="mt-8 h-4 w-4 transition-transform group-hover:translate-x-2"/></a>)}</section>
        {m.entity !== "dis" && <section id="prsc" className="border-b border-gold/15 px-7 py-16 sm:px-12 lg:px-16 lg:py-24"><p className="text-xs uppercase text-gold">PRSC</p><h2 className="mt-4 font-display text-5xl">A standard built for trust.</h2><div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{["Independent","Objective","Comparable","Governed"].map((x) => <div key={x} className="border-t border-gold/40 pt-5"><h3 className="font-display text-2xl">{x}</h3><p className="mt-3 text-sm leading-6 text-ivory/55">A disciplined foundation for evidence-based partnership readiness.</p></div>)}</div></section>}
        {m.entity !== "prsc" && <section id="dis" className="border-b border-gold/15 px-7 py-16 sm:px-12 lg:px-16 lg:py-24"><p className="text-xs uppercase text-gold">DIS · Readiness Terminal™</p><h2 className="mt-4 max-w-3xl font-display text-5xl">From evidence to decision intelligence.</h2><div className="mt-10 flex flex-wrap items-center gap-3 text-xs uppercase text-ivory/65">{["Evidence","Readiness engine","Readiness score","Benchmarks","Decision intelligence"].map((x,i)=><span key={x} className="flex items-center gap-3"><span className="border border-gold/30 px-4 py-3">{x}</span>{i<4&&<ArrowRight className="h-3 w-3 text-gold"/>}</span>)}</div></section>}
        <section id="role" className="border-b border-gold/15 px-7 py-16 sm:px-12 lg:px-16 lg:py-24"><p className="text-xs uppercase text-gold">Your role · Why you</p><blockquote className="mt-6 max-w-4xl font-display text-3xl leading-tight sm:text-5xl">“{m.why_you}”</blockquote><p className="mt-8 max-w-2xl text-sm leading-7 text-ivory/55">Your perspective will help pressure-test the work, sharpen its relevance, and strengthen its credibility. Formal terms and any legal provisions will be provided separately in your individualized package.</p></section>
        <section id="questions" className="px-7 py-16 sm:px-12 lg:px-16 lg:py-24"><CircleHelp className="h-7 w-7 text-gold"/><h2 className="mt-5 font-display text-5xl">Your perspective matters.</h2><p className="mt-5 max-w-2xl text-ivory/60">Share a private question or point for discussion at any time.</p><Button asChild variant="outline" className="mt-8 rounded-none border-gold text-gold hover:bg-gold hover:text-navy"><Link to="/portal/questions">Open a private inquiry</Link></Button></section>
      </main>
    </div>
  </PortalShell>;
}
