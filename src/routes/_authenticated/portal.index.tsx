import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  BarChart3,
  Cog,
  FileText,
  Flag,
  Globe,
  Home,
  LockKeyhole,
  Mail,
  MessageSquare,
  ScrollText,
  Share2,
  Shield,
  Target,
  Users,
} from "lucide-react";

import { getMyHeadshotUrl, getPortalSession } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal/PortalShell";
import { isPreviewHost } from "@/routes/_authenticated/route";
import heroRoad from "@/assets/portal-hero-road.jpg";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({
    meta: [
      { title: "Private Board & Advisor Center | PRSC" },
      { name: "description", content: "Confidential PRSC and DIS board and advisor briefing center." },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { property: "og:title", content: "Private Board & Advisor Center | PRSC" },
      { property: "og:description", content: "Confidential PRSC and DIS board and advisor briefing center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalHome,
});

const entityLabel = { prsc: "PRSC", dis: "DIS", both: "PRSC / DIS" } as const;

const demoMember = {
  id: "demo",
  user_id: "demo",
  first_name: "Alex",
  last_name: "Smith",
  professional_name: "Alex",
  title: "Selected Advisor",
  organization: "",
  email: "alex@example.com",
  role: "advisor" as const,
  entity: "both" as const,
  status: "active" as const,
  package_status: "in_preparation" as const,
  why_you:
    "We've been intentional about who we invite into this next chapter. You were selected because of your unique experience, judgment, and relationships, and the value you can bring as we build the market infrastructure for Partnership Readiness.",
  invited_at: "",
  first_access_at: "",
  last_access_at: "",
  created_at: "",
  updated_at: "",
};

function PortalHome() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-session"],
    queryFn: () => isPreviewHost() ? Promise.resolve(null) : getPortalSession(),
    retry: false,
  });

  const headshot = useQuery({
    queryKey: ["my-headshot"],
    queryFn: () => getMyHeadshotUrl().catch(() => null),
    retry: false,
    enabled: Boolean(data?.member),
  });
  const navigate = useNavigate();
  const [panel, setPanel] = useState<"prsc" | "dis" | "next" | "questions" | null>(null);
  useEffect(() => {
    if (data?.isAdmin) navigate({ to: "/admin", replace: true });
  }, [data, navigate]);

  if (isLoading)
    return (
      <PortalShell>
        <div className="flex min-h-[70vh] items-center justify-center text-gold">Opening your private center…</div>
      </PortalShell>
    );

  let member = data?.member;
  if ((error || !member) && isPreviewHost()) member = demoMember;
  if (!member)
    return (
      <PortalShell>
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <LockKeyhole className="mx-auto h-8 w-8 text-gold" />
          <h1 className="mt-5 font-display text-4xl">Access unavailable</h1>
          <p className="mt-4 text-ivory/60">Please contact info@readinessterminal.com for assistance.</p>
        </div>
      </PortalShell>
    );

  const m = member;
  const name = m.professional_name || m.first_name;
  const initials = `${(m.first_name || "").charAt(0)}${(m.last_name || "").charAt(0)}`.toUpperCase();
  const showPrsc = m.entity !== "dis";
  const showDis = m.entity !== "prsc";
  const entityWord = entityLabel[m.entity];
  const profileComplete = data?.hasProfile ?? false;
  const packageReady = m.package_status === "package_ready";


  const sideNav = [
    { label: "Overview", href: "#overview", icon: Home, active: true, onSelect: undefined as (() => void) | undefined },
    { label: "Your Role", href: "#role", icon: Users, active: false, onSelect: undefined },
    { label: "What Happens Next", href: "#next", icon: Flag, active: false, onSelect: () => setPanel("next") },
    ...(showPrsc ? [{ label: "Refresh on PRSC", href: "#prsc", icon: ScrollText, active: false, onSelect: () => setPanel("prsc") }] : []),
    ...(showDis ? [{ label: "Learn about DIS", href: "#dis", icon: FileText, active: false, onSelect: () => setPanel("dis") }] : []),
    { label: "Questions", href: "#questions", icon: MessageSquare, active: false, onSelect: () => setPanel("questions") },
  ];



  return (
    <PortalShell memberName={name}>
      <div className="grid w-full lg:grid-cols-[20%_80%]">
        {/* Sidebar */}
        <aside className="border-b border-gold/15 px-7 py-7 lg:border-b-0 lg:border-r lg:px-0 lg:pb-14 lg:pt-0">
          <div className="lg:px-[12.5%] lg:pt-[clamp(1.5rem,2vw,2.25rem)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80">Your Welcome Center</p>
            <div className="mt-5 flex items-center gap-5 lg:mt-0 lg:block">
              {headshot.data?.url ? (
                <img
                  src={headshot.data.url}
                  alt={`${name} ${m.last_name}`}
                  className="aspect-square w-[clamp(64px,5vw,88px)] rounded-full border border-gold/55 object-cover lg:mt-4"
                />
              ) : (
                <span className="grid aspect-square w-[clamp(64px,5vw,88px)] shrink-0 place-items-center rounded-full border border-gold/55 font-display text-xl text-gold lg:mt-4">

                  {initials}
                </span>
              )}
              <div>
                <h2 className="font-display text-[clamp(1.2rem,1.35vw,1.55rem)] leading-tight lg:mt-4">
                  {name} {m.last_name}
                </h2>
                <p className="mt-2 text-[14px] leading-5 text-ivory/65">{m.title || (m.role === "advisor" ? "Selected Advisor" : "Board Member")}</p>
                <p className="text-[14px] leading-5 text-ivory/65">{entityWord}</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-2 lg:block">
            {sideNav.map((item) => {
              const cls = `grid min-h-14 w-full grid-cols-[20px_minmax(0,1fr)] items-center gap-3 py-3 pr-2 text-left text-[12px] transition-colors sm:text-[14px] lg:grid-cols-[24px_minmax(0,1fr)] lg:gap-4 lg:px-[12.5%] ${
                item.active
                  ? "border-l-2 border-gold bg-ivory/[.055] text-gold"
                  : "border-l-2 border-transparent text-ivory/60 hover:bg-ivory/[.025] hover:text-gold"
              }`;
              const inner = (
                <>
                  <item.icon className={`h-[19px] w-[19px] shrink-0 ${item.active ? "text-gold" : "text-ivory/45"}`} />
                  {item.label}
                </>
              );
              return item.onSelect ? (
                <button key={item.label} type="button" onClick={item.onSelect} className={cls}>
                  {inner}
                </button>
              ) : (
                <a key={item.label} href={item.href} className={cls}>
                  {inner}
                </a>
              );
            })}
          </nav>

          <div className="lg:px-[12.5%]">
            <div className="my-6 h-px bg-gold/20" />

            <div className="border border-gold/20 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-[clamp(1.15rem,1.5vw,1.75rem)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Your Next Step</p>
              <h3 className="mt-2 font-display text-[clamp(1.15rem,1.3vw,1.5rem)] leading-snug">Board/Advisor Package</h3>
              <p className="mt-3 flex items-center gap-2 text-[13px] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_7px_var(--color-gold)]" />
                <span className="uppercase tracking-wider text-ivory/55">Status:</span>
                <span>{m.package_status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              </p>
              <p className="mt-3 text-[13px] leading-6 text-ivory/60">
                {profileComplete
                  ? "Your profile is complete. We're preparing your individualized materials and will be in touch when your package is ready."
                  : "Completing your profile unlocks your individualized package."}
              </p>
            </div>

            <div className="my-6 h-px bg-gold/20" />

            <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Need help?</p>
            <p className="mt-3 text-[14px] text-ivory/65">We're here for you.</p>
            <Link to="/portal/questions" className="mt-5 flex min-h-10 items-center gap-3 text-[14px] text-ivory/80 hover:text-gold">
              <Mail className="h-4 w-4 text-gold" /> Send a message
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 pb-5">
          {/* Hero */}
          <section id="overview" className="relative overflow-hidden px-7 pb-7 pt-9 sm:px-10 lg:px-[3.5%] lg:pb-3 lg:pt-[clamp(1.75rem,2.4vw,3rem)]">
            <img
              src={heroRoad}
              alt=""
              width={1280}
              height={960}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-[64%_48%] opacity-25 [mask-image:linear-gradient(to_right,transparent_0%,black_45%,black_82%,transparent_100%)] lg:w-[62%] lg:object-[60%_48%] lg:opacity-80 lg:[mask-image:linear-gradient(to_right,transparent_0%,black_38%,black_82%,transparent_100%)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-navy)_0%,var(--color-navy)_38%,transparent_68%),linear-gradient(to_top,var(--color-navy)_0%,transparent_28%)]" />
            <div className="relative grid gap-10 lg:grid-cols-[62%_38%]">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Private Board &amp; Advisor Center</p>
                <h1 className="mt-3 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-[clamp(4.5rem,5.1vw,6rem)]">Welcome, {name}.</h1>
                <p className="mt-1 font-display text-2xl leading-tight text-ivory/85 sm:text-3xl lg:whitespace-nowrap lg:text-[clamp(2rem,2.45vw,2.85rem)]">To the future of Partnership Readiness.</p>
                <div className="mt-5 h-px w-12 bg-gold" />
                <p className="mt-5 max-w-[46rem] text-[15px] leading-[1.65] text-ivory/72">
                  PRSC and Decision Intelligence Systems have reached an important inflection point. The foundation is built, the
                  platform is advancing, and DIS has officially entered investor prospecting.
                </p>
                <p className="mt-4 max-w-[46rem] text-[15px] leading-[1.65] text-ivory/72">
                  You were selected to join us because we believe your experience, perspective, and credibility can contribute
                  meaningfully to what we're building.
                </p>
                <Link
                  to="/portal/profile"
                  className="cta-glow mt-[22px] inline-flex min-h-14 w-full max-w-[300px] items-center justify-between gap-6 rounded-full px-7 py-4 text-[19px] font-semibold transition-all"
                >
                  <span className="relative z-10 flex w-full items-center justify-between gap-6">
                    {profileComplete ? "Review Your Profile" : "Complete Your Profile"} <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <p className="mt-3 text-[17px] text-ivory/52">
                  {profileComplete
                    ? "Your profile is on file — your package is being prepared."
                    : (
                      <>
                        Approx. 7–10 minutes  •  Your Submission is Private.
                        <br />
                        Completing your profile unlocks your individualized package
                      </>
                    )}
                </p>
              </div>
              <div className="relative hidden flex-col justify-between pb-2 pt-8 lg:flex">
                <div className="absolute right-[4%] top-2">
                  <p className="text-[12px] uppercase leading-[2.15] tracking-[0.42em] text-ivory/90">
                    A higher
                    <br />
                    standard
                    <br />
                    for a stronger
                    <br />
                    industry.
                  </p>
                  <div className="mt-6 h-px w-11 bg-gold" />
                </div>
                <p className="absolute bottom-3 right-[4%] text-[9px] uppercase tracking-[0.22em] text-ivory/55">
                  People <span className="text-gold/60">/</span> Data <span className="text-gold/60">/</span> Discipline{" "}
                  <span className="text-gold/60">/</span> Opportunity
                </p>
              </div>
            </div>
          </section>

          {/* Why you */}
          <section id="role" className="px-7 pb-3 sm:px-10 lg:px-[2.5%]">
            <div className="grid items-center gap-5 border border-gold/25 bg-[linear-gradient(135deg,var(--color-midnight),var(--color-navy))] p-5 lg:grid-cols-[2fr_1fr] lg:gap-6 lg:p-[clamp(1rem,1.5vw,1.5rem)]">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Why You</p>
                <h2 className="mt-1.5 font-display text-[clamp(2rem,2.5vw,2.8rem)] leading-tight">{name}, Your Perspective Matters.</h2>
                <p className="mt-2 max-w-[50rem] text-[15px] leading-7 text-ivory/70">{m.why_you}</p>
                <div className="mt-3 h-px w-16 bg-gold" />
                <Link to="/portal/questions" className="mt-3 inline-flex items-center gap-3 text-[14px] text-ivory/85 hover:text-gold">
                  Read More <ArrowRight className="h-4 w-4 text-gold" />
                </Link>
              </div>
              <div className="relative flex flex-col justify-center overflow-hidden border-gold/20 py-1 lg:border-l lg:pl-[8%]">
                <blockquote className="font-display text-[20px] italic leading-snug text-gold lg:text-[24px]">
                  “Independent standards create stronger markets.”
                </blockquote>
                <p className="mt-3 text-[10px] uppercase leading-[2] tracking-[0.24em] text-ivory/60">
                  Better data.
                  <br />
                  Brighter opportunities.
                </p>
              </div>
            </div>
          </section>

          <div className="pb-4 lg:pb-5" />
        </main>
      </div>

      <Dialog open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
        <DialogContent className="max-h-[86vh] w-[min(94vw,980px)] max-w-none overflow-y-auto border-gold/30 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-8 text-ivory shadow-2xl lg:p-[clamp(2rem,2.7vw,3.25rem)]">
          {panel === "prsc" && (
            <div className="relative">
              <img
                src={heroRoad}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover object-[60%_40%] opacity-45 [mask-image:linear-gradient(to_right,transparent_0%,black_45%,black_88%,transparent_100%)] lg:block"
              />
              <div className="relative grid gap-8 lg:grid-cols-[58%_42%]">
                <div className="min-w-0">
                  <DialogHeader className="space-y-0 text-left">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gold">About PRSC</p>
                    <DialogTitle className="mt-4 font-display text-[clamp(2rem,2.6vw,2.9rem)] font-normal leading-[1.1]">
                      Partnership Readiness Standards Council (PRSC)
                    </DialogTitle>
                  </DialogHeader>
                  <p className="mt-5 max-w-[34rem] text-[17px] leading-[1.5] text-gold">
                    PRSC is the independent standards body creating the first common language for commercial partnership
                    readiness in motorsport.
                  </p>
                  <p className="mt-5 max-w-[34rem] text-[14px] leading-[1.6] text-ivory/70">
                    Today, teams, drivers, brands, agencies, and series make sponsorship decisions using fragmented
                    information, personal relationships, and inconsistent measures of value.
                  </p>
                  <p className="mt-4 max-w-[34rem] text-[14px] leading-[1.6] text-ivory/70">
                    PRSC changes that by governing the PRSC Readiness Standard™—the methodology behind the PRSC Readiness
                    Score™, which evaluates whether an organization can clearly communicate, deliver, and prove commercial
                    value to a partner.
                  </p>
                  <p className="mt-4 max-w-[34rem] text-[14px] leading-[1.6] text-ivory/70">
                    PRSC's independence is central: it does not sell sponsorship, broker deals, or benefit from who is
                    chosen. Its role is to make the market more credible, comparable, and accountable. Board and advisor
                    participation helps ensure that this standard is trusted, practical, and built to serve the entire
                    ecosystem—not any single commercial interest.
                  </p>
                  <a
                    href="https://www.prscstandards.com/the-standard"
                    target="_blank"
                    rel="noreferrer"
                    className="cta-glow-outline mt-7 inline-flex items-center gap-4 rounded-full px-7 py-3.5 text-[15px] transition-all"
                  >
                    <span className="relative z-10 flex items-center gap-4">
                      Explore PRSC <ArrowRight className="h-4 w-4" />
                    </span>
                  </a>
                </div>
                <div className="flex flex-col justify-center gap-6">
                  {[
                    { icon: Shield, label: "Independent\nGovernance" },
                    { icon: BarChart3, label: "Objective\nMethodology" },
                    { icon: Users, label: "Market\nComparability" },
                    { icon: Globe, label: "A Stronger\nEcosystem" },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center gap-5">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/55">
                        <p.icon className="h-[19px] w-[19px] text-gold" />
                      </span>
                      <span className="whitespace-pre-line text-[11px] uppercase leading-[1.9] tracking-[0.24em] text-ivory/85">
                        {p.label}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 h-px w-12 bg-gold" />
                  <p className="font-display text-[21px] italic leading-[1.45] text-gold">
                    A more credible,
                    <br />
                    comparable, and accountable
                    <br />
                    partnership market.
                  </p>
                  <div className="h-px w-12 bg-gold" />
                </div>
              </div>
            </div>
          )}

          {panel === "dis" && (
            <div className="grid gap-8 lg:grid-cols-[58%_42%]">
              <div className="min-w-0">
                <DialogHeader className="space-y-0 text-left">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gold">About DIS</p>
                  <DialogTitle className="mt-4 font-display text-[clamp(2rem,2.6vw,2.9rem)] font-normal leading-[1.1]">
                    Decision Intelligence Systems (DIS)
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-5 max-w-[34rem] text-[17px] leading-[1.5] text-gold">
                  DIS is the company building the technology and intelligence infrastructure that makes the PRSC standard
                  useful at scale.
                </p>
                <p className="mt-5 max-w-[34rem] text-[14px] leading-[1.6] text-ivory/70">
                  Through the Readiness Terminal™, DIS turns verified evidence and the PRSC Readiness Score™ into practical
                  tools: Commercial Strength Reports™, benchmark intelligence, and clearer decision support for teams,
                  brands, agencies, series, and investors.
                </p>
                <p className="mt-4 max-w-[34rem] text-[14px] leading-[1.6] text-ivory/70">
                  The opportunity is significant because motorsport has real partnership capital and sophisticated
                  performance data, but no shared commercial reference point. DIS is building the platform and data asset
                  that fills that gap—starting with motorsport, where the problem is acute, and expanding as the benchmark
                  becomes more valuable.
                </p>
                <p className="mt-4 max-w-[34rem] text-[14px] leading-[1.6] text-ivory/70">
                  Advisors and board members are joining at the moment the category is being established: helping shape the
                  first credible standard, the first benchmark, and the intelligence platform that can make better
                  partnership decisions possible across the market.
                </p>
                <button
                  type="button"
                  onClick={() => setPanel("next")}
                  className="cta-glow-outline mt-7 inline-flex items-center gap-4 rounded-full px-7 py-3.5 text-[15px] transition-all"
                >
                  <span className="relative z-10 flex items-center gap-4">
                    Learn about DIS <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </div>
              <div className="flex flex-col justify-center gap-8">
                <div className="flex flex-wrap items-start gap-x-2 gap-y-5">
                  {[
                    { icon: FileText, label: "Evidence" },
                    { icon: Cog, label: "Readiness\nEngine™" },
                    { icon: BarChart3, label: "Readiness\nScore™" },
                    { icon: Share2, label: "Benchmark\nIntelligence" },
                    { icon: Target, label: "Better\nDecisions" },
                  ].map((s, i) => (
                    <span key={s.label} className="flex items-start gap-2">
                      <span className="flex w-[76px] flex-col items-center gap-3 text-center">
                        <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/55">
                          <s.icon className="h-[18px] w-[18px] text-gold" />
                        </span>
                        <span className="whitespace-pre-line text-[9px] uppercase leading-[1.6] tracking-[0.18em] text-ivory/80">
                          {s.label}
                        </span>
                      </span>
                      {i < 4 && <ArrowRight className="mt-3.5 h-3.5 w-3.5 shrink-0 text-gold/70" />}
                    </span>
                  ))}
                </div>
                <div className="h-px w-12 bg-gold" />
                <p className="font-display text-[21px] italic leading-[1.45] text-gold">
                  From evidence to intelligence.
                  <br />A stronger partnership economy.
                </p>
              </div>
            </div>
          )}


          {panel === "next" && (
            <>
              <DialogHeader className="space-y-0 text-left">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">What Happens Next</p>
                <DialogTitle className="mt-4 font-display text-[34px] font-normal leading-tight">A short, deliberate sequence.</DialogTitle>
              </DialogHeader>
              <div className="mt-8 grid gap-8 md:grid-cols-3">
                {[
                  { n: "01", t: "Complete your profile", c: "A private submission that shapes your individualized materials." },
                  { n: "02", t: "Package preparation", c: "We prepare your board or advisor package with the details you provide." },
                  { n: "03", t: "Formal package", c: "Your individualized package follows separately, with all formal terms." },
                ].map((s) => (
                  <div key={s.n} className="border-t border-gold/40 pt-5">
                    <p className="font-display text-sm text-gold">{s.n}</p>
                    <h3 className="mt-2 font-display text-xl">{s.t}</h3>
                    <p className="mt-3 text-[14px] leading-6 text-ivory/55">{s.c}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {panel === "questions" && (
            <>
              <DialogHeader className="space-y-0 text-left">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Questions</p>
                <DialogTitle className="mt-3 font-display text-[30px] font-normal leading-tight">Share a private question.</DialogTitle>
              </DialogHeader>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-ivory/60">
                Anything you'd like to discuss, at any time. Your message comes directly to us.
              </p>
              <Link
                to="/portal/questions"
                onClick={() => setPanel(null)}
                className="cta-glow-outline mt-7 inline-flex shrink-0 items-center gap-3 rounded-full px-7 py-4 text-[15px] transition-all"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Open a private inquiry <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
