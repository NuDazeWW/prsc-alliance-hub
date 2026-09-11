import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Flag,
  Home,
  LockKeyhole,
  Mail,
  MessageSquare,
  ScrollText,
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
    queryFn: () => getPortalSession().catch(() => null),
    retry: false,
  });

  const headshot = useQuery({
    queryKey: ["my-headshot"],
    queryFn: () => getMyHeadshotUrl().catch(() => null),
    retry: false,
    enabled: Boolean(data?.member),
  });
  const navigate = useNavigate();
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

  const topNav = [
    { label: "Overview", href: "#overview" },
    ...(showPrsc ? [{ label: "PRSC", href: "#prsc" }] : []),
    ...(showDis ? [{ label: "DIS", href: "#dis" }] : []),
    { label: "Your Role", href: "#role" },
    { label: "Questions", href: "#questions" },
  ];

  const sideNav = [
    { label: "Overview", href: "#overview", icon: Home, active: true },
    ...(showPrsc ? [{ label: "About PRSC", href: "#prsc", icon: ScrollText, active: false }] : []),
    ...(showDis ? [{ label: "About DIS", href: "#dis", icon: FileText, active: false }] : []),
    { label: "Your Role", href: "#role", icon: Users, active: false },
    { label: "What Happens Next", href: "#next", icon: Flag, active: false },
    { label: "Questions", href: "#questions", icon: MessageSquare, active: false },
  ];

  const cards = [
    ...(showPrsc
      ? [
          {
            icon: ScrollText,
            eyebrow: "PRSC",
            title: "The Standard",
            copy: "An independent, evidence-based framework for measuring commercial readiness in sports.",
            cta: "Refresh on PRSC",
            href: "#prsc",
          },
        ]
      : []),
    ...(showDis
      ? [
          {
            icon: BarChart3,
            eyebrow: "DIS",
            title: "The Intelligence Platform",
            copy: "Building the technology that turns the standard into actionable market intelligence.",
            cta: "Learn about DIS",
            href: "#dis",
          },
        ]
      : []),
    {
      icon: Target,
      eyebrow: "Why Now",
      title: "The Inflection Point",
      copy: "Governance, methodology, and technology are converging as DIS enters investor prospecting.",
      cta: "See What's Next",
      href: "#next",
    },
  ];

  return (
    <PortalShell nav={topNav} memberName={name}>
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
            {sideNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`grid min-h-14 grid-cols-[20px_minmax(0,1fr)] items-center gap-3 py-3 pr-2 text-[12px] transition-colors sm:text-[14px] lg:grid-cols-[24px_minmax(0,1fr)] lg:gap-4 lg:px-[12.5%] ${
                  item.active
                    ? "border-l-2 border-gold bg-ivory/[.055] text-gold"
                    : "border-l-2 border-transparent text-ivory/60 hover:bg-ivory/[.025] hover:text-gold"
                }`}
              >
                <item.icon className={`h-[19px] w-[19px] shrink-0 ${item.active ? "text-gold" : "text-ivory/45"}`} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="lg:px-[12.5%]">
            <div className="my-6 h-px bg-gold/20" />

            <div className="border border-gold/20 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-[clamp(1.15rem,1.5vw,1.75rem)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Your Next Step</p>
              <h3 className="mt-2 font-display text-[clamp(1.15rem,1.3vw,1.5rem)] leading-snug">Board/Advisor Package</h3>
              <p className="mt-3 flex items-center gap-2 text-[13px] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_7px_var(--color-gold)]" />
                {m.package_status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-ivory/60">
                {profileComplete
                  ? "Your profile is complete. We're preparing your individualized materials and will be in touch when your package is ready."
                  : "Complete your profile to move on to the next step — this unlocks your individualized package."}
              </p>
              {!packageReady && (
                <Link
                  to="/portal/profile"
                  className="mt-4 flex min-h-12 w-full items-center justify-between gap-3 bg-gold px-4 py-3 text-[18px] font-semibold whitespace-nowrap text-navy shadow-[inset_0_1px_0_var(--color-gold-light)] transition-colors hover:bg-gold-light"
                >
                  {profileComplete ? "Review Your Profile" : "Complete Your Profile"} <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              )}
              {!profileComplete && (
                <p className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-ivory/45">
                  <LockKeyhole className="mt-[2px] h-3.5 w-3.5 shrink-0" />
                  <span>
                    Private submission
                    <br />
                    Approx. 7–10 minutes
                  </span>
                </p>
              )}
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
          <section id="overview" className="relative overflow-hidden px-7 pb-7 pt-9 sm:px-10 lg:px-[3.5%] lg:pb-8 lg:pt-[clamp(1.75rem,2.4vw,3rem)]">
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
                  className="mt-[22px] inline-flex min-h-14 w-full max-w-[300px] items-center justify-between gap-6 bg-gold px-7 py-4 text-[19px] font-semibold text-navy shadow-[inset_0_1px_0_var(--color-gold-light)] transition-colors hover:bg-gold-light"
                >
                  Complete Your Profile <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-[17px] text-ivory/52">

                  5 – 7 minutes &nbsp;•&nbsp; Needed to prepare your individualized advisor package
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

          {/* Cards */}
          <section className="grid gap-5 px-7 pb-5 sm:px-10 md:grid-cols-3 lg:px-[2.5%]">
            {cards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="group flex flex-col border border-gold/25 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] px-[clamp(1.5rem,2vw,2.25rem)] py-[22px] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-gold)_8%,transparent)] transition-colors hover:border-gold/50"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/55">
                  <card.icon className="h-[22px] w-[22px] text-gold" />
                </span>
                <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-gold">{card.eyebrow}</p>
                <h2 className="mt-2 font-display text-[clamp(1.65rem,2vw,2.25rem)] leading-[1.08]">{card.title}</h2>
                <p className="mt-3 text-[14px] leading-6 text-ivory/65">{card.copy}</p>
                <span className="mt-auto flex items-center gap-3 pt-5 text-[13px] text-gold">

                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </section>

          {/* Why you */}
          <section id="role" className="px-7 pb-5 sm:px-10 lg:px-[2.5%]">
            <div className="grid gap-10 border border-gold/25 bg-[linear-gradient(135deg,var(--color-midnight),var(--color-navy))] p-8 lg:min-h-[250px] lg:grid-cols-[2fr_1fr] lg:p-[clamp(2rem,2.7vw,3.25rem)]">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Why You</p>
                <h2 className="mt-4 font-display text-[clamp(2rem,2.5vw,2.8rem)] leading-tight">Your Perspective Matters.</h2>
                <p className="mt-5 max-w-[50rem] text-[15px] leading-7 text-ivory/70">{m.why_you}</p>
                <div className="mt-7 h-px w-16 bg-gold" />
                <Link to="/portal/questions" className="mt-6 inline-flex items-center gap-3 text-[14px] text-ivory/85 hover:text-gold">
                  Read More <ArrowRight className="h-4 w-4 text-gold" />
                </Link>
              </div>
              <div className="relative flex flex-col justify-center overflow-hidden border-gold/20 py-2 lg:border-l lg:pl-[14%] before:absolute before:left-[7%] before:top-1/2 before:h-40 before:w-40 before:-translate-y-1/2 before:rounded-full before:border before:border-gold/10 after:absolute after:left-[10%] after:top-1/2 after:h-32 after:w-32 after:-translate-y-1/2 after:rounded-full after:border after:border-gold/10">
                <blockquote className="font-display text-[26px] italic leading-snug text-gold">
                  “Independent standards create stronger markets.”
                </blockquote>
                <p className="mt-7 text-[10px] uppercase leading-[2] tracking-[0.24em] text-ivory/60">
                  Better data.
                  <br />
                  Brighter opportunities.
                </p>
              </div>
            </div>
          </section>

          {/* Entity sections */}
          {showPrsc && (
            <section id="prsc" className="px-7 pb-5 sm:px-10 lg:px-[2.5%]">
              <div className="border border-gold/20 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-8 lg:p-[clamp(2rem,2.7vw,3.25rem)]">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">PRSC</p>
                <h2 className="mt-4 font-display text-[34px]">A standard built for trust.</h2>
                <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {["Independent", "Objective", "Comparable", "Governed"].map((x) => (
                    <div key={x} className="border-t border-gold/40 pt-5">
                      <h3 className="font-display text-xl">{x}</h3>
                      <p className="mt-3 text-[14px] leading-6 text-ivory/55">
                        A disciplined foundation for evidence-based partnership readiness.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {showDis && (
            <section id="dis" className="px-7 pb-5 sm:px-10 lg:px-[2.5%]">
              <div className="border border-gold/20 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-8 lg:p-[clamp(2rem,2.7vw,3.25rem)]">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">DIS · Readiness Terminal™</p>
                <h2 className="mt-4 max-w-3xl font-display text-[34px]">From evidence to decision intelligence.</h2>
                <div className="mt-8 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-ivory/65">
                  {["Evidence", "Readiness engine", "Readiness score", "Benchmarks", "Decision intelligence"].map((x, i) => (
                    <span key={x} className="flex items-center gap-3">
                      <span className="border border-gold/30 px-4 py-3">{x}</span>
                      {i < 4 && <ArrowRight className="h-3 w-3 text-gold" />}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* What happens next */}
          <section id="next" className="px-7 pb-5 sm:px-10 lg:px-[2.5%]">
            <div className="border border-gold/20 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-8 lg:p-[clamp(2rem,2.7vw,3.25rem)]">
              <p className="text-[10px] uppercase tracking-[0.24em] text-gold">What Happens Next</p>
              <h2 className="mt-4 font-display text-[34px]">A short, deliberate sequence.</h2>
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
            </div>
          </section>

          {/* Questions */}
          <section id="questions" className="px-7 pb-16 sm:px-10 lg:px-[2.5%] lg:pb-20">
            <div className="flex flex-col gap-6 border border-gold/20 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-8 sm:flex-row sm:items-center sm:justify-between lg:p-[clamp(2rem,2.7vw,3.25rem)]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Questions</p>
                <h2 className="mt-3 font-display text-[30px]">Share a private question.</h2>
                <p className="mt-3 max-w-xl text-[15px] leading-7 text-ivory/60">
                  Anything you'd like to discuss, at any time. Your message comes directly to us.
                </p>
              </div>
              <Link
                to="/portal/questions"
                className="inline-flex shrink-0 items-center gap-3 border border-gold px-7 py-4 text-[15px] text-gold transition-colors hover:bg-gold hover:text-navy"
              >
                Open a private inquiry <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </PortalShell>
  );
}
