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
  const { data, isLoading, error } = useQuery({ queryKey: ["portal-session"], queryFn: () => getPortalSession(), retry: false });
  const headshot = useQuery({ queryKey: ["my-headshot"], queryFn: () => getMyHeadshotUrl(), retry: false });
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
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[248px_1fr]">
        {/* Sidebar */}
        <aside className="border-b border-gold/15 px-7 py-9 lg:border-b-0 lg:border-r lg:px-0 lg:pb-16">
          <div className="lg:px-7">
            <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Your Welcome Center</p>
            {headshot.data?.url ? (
              <img
                src={headshot.data.url}
                alt={`${name} ${m.last_name}`}
                className="mt-7 h-14 w-14 rounded-full border border-gold/40 object-cover"
              />
            ) : (
              <span className="mt-7 grid h-14 w-14 place-items-center rounded-full border border-gold/40 font-display text-lg text-gold">
                {initials}
              </span>
            )}
            <h2 className="mt-4 font-display text-xl">
              {name} {m.last_name}
            </h2>
            <p className="mt-1 text-sm text-ivory/55">{m.title || (m.role === "advisor" ? "Selected Advisor" : "Board Member")}</p>
            <p className="text-sm text-ivory/55">{entityWord}</p>
          </div>

          <nav className="mt-8">
            {sideNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 py-3 text-sm transition-colors lg:px-7 ${
                  item.active
                    ? "border-l-2 border-gold bg-ivory/[.04] text-ivory lg:pl-[26px]"
                    : "border-l-2 border-transparent text-ivory/60 hover:text-gold lg:pl-[26px]"
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${item.active ? "text-gold" : "text-ivory/45"}`} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="lg:px-7">
            <div className="my-8 h-px bg-gold/15" />
            <div className="border border-gold/20 bg-ivory/[.02] p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Your Next Step</p>
              <h3 className="mt-3 font-display text-lg">Board/Advisor Package</h3>
              <p className="mt-3 flex items-center gap-2 text-sm text-gold">
                <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_var(--color-gold)]" />
                {m.package_status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-ivory/55">
                We need a few details from you before your individualized materials are finalized.
              </p>
              <Link
                to="/portal/profile"
                className="mt-5 block bg-gold px-4 py-3 text-center text-sm font-medium text-navy transition-colors hover:bg-gold-light"
              >
                Complete Your Profile
              </Link>
              <p className="mt-4 flex items-start gap-2 text-[12px] leading-5 text-ivory/45">
                <LockKeyhole className="mt-[2px] h-3.5 w-3.5 shrink-0" />
                <span>
                  Private submission
                  <br />
                  Approx. 7–10 minutes
                </span>
              </p>
            </div>

            <div className="my-8 h-px bg-gold/15" />
            <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Need help?</p>
            <p className="mt-3 text-sm text-ivory/60">We're here for you.</p>
            <Link to="/portal/questions" className="mt-4 flex items-center gap-3 text-sm text-ivory/75 hover:text-gold">
              <Mail className="h-4 w-4 text-gold" /> Send a message
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          {/* Hero */}
          <section id="overview" className="relative overflow-hidden px-7 pb-14 pt-14 sm:px-10 lg:px-12 lg:pb-16 lg:pt-16">
            <img
              src={heroRoad}
              alt=""
              width={1280}
              height={960}
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 hidden h-full w-[52%] object-cover opacity-55 [mask-image:linear-gradient(to_right,transparent,black_55%)] lg:block"
            />
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Private Board &amp; Advisor Center</p>
                <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-6xl">Welcome, {name}.</h1>
                <p className="mt-3 font-display text-2xl text-ivory/85 sm:text-3xl">To the future of Partnership Readiness.</p>
                <div className="mt-7 h-px w-16 bg-gold" />
                <p className="mt-7 max-w-xl text-[15px] leading-7 text-ivory/70">
                  PRSC and Decision Intelligence Systems have reached an important inflection point. The foundation is built, the
                  platform is advancing, and DIS has officially entered investor prospecting.
                </p>
                <p className="mt-5 max-w-xl text-[15px] leading-7 text-ivory/70">
                  You were selected to join us because we believe your experience, perspective, and credibility can contribute
                  meaningfully to what we're building.
                </p>
                <Link
                  to="/portal/profile"
                  className="mt-9 inline-flex items-center gap-4 bg-gold px-7 py-4 text-[15px] font-medium text-navy transition-colors hover:bg-gold-light"
                >
                  Complete Your Profile <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-5 text-[13px] text-ivory/50">
                  5 – 7 minutes &nbsp;•&nbsp; Needed to prepare your individualized advisor package
                </p>
              </div>
              <div className="relative hidden flex-col justify-between lg:flex">
                <div>
                  <p className="font-display text-[13px] uppercase leading-[2.1] tracking-[0.32em] text-ivory/90">
                    A higher
                    <br />
                    standard
                    <br />
                    for a stronger
                    <br />
                    industry.
                  </p>
                  <div className="mt-6 h-px w-10 bg-gold" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ivory/55">
                  People <span className="text-gold/60">/</span> Data <span className="text-gold/60">/</span> Discipline{" "}
                  <span className="text-gold/60">/</span> Opportunity
                </p>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section className="grid gap-6 px-7 pb-6 sm:px-10 md:grid-cols-3 lg:px-12">
            {cards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="group flex flex-col border border-gold/20 bg-ivory/[.02] p-7 transition-colors hover:border-gold/50"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40">
                  <card.icon className="h-5 w-5 text-gold" />
                </span>
                <p className="mt-8 text-[10px] uppercase tracking-[0.24em] text-gold">{card.eyebrow}</p>
                <h2 className="mt-3 font-display text-[26px] leading-tight">{card.title}</h2>
                <p className="mt-4 text-[14px] leading-6 text-ivory/60">{card.copy}</p>
                <span className="mt-8 flex items-center gap-3 text-[13px] text-gold">
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </section>

          {/* Why you */}
          <section id="role" className="px-7 pb-6 sm:px-10 lg:px-12">
            <div className="grid gap-10 border border-gold/20 bg-ivory/[.02] p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-11">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Why You</p>
                <h2 className="mt-4 font-display text-[34px] leading-tight">Your Perspective Matters.</h2>
                <p className="mt-5 max-w-2xl text-[15px] leading-7 text-ivory/70">{m.why_you}</p>
                <div className="mt-7 h-px w-16 bg-gold" />
                <Link to="/portal/questions" className="mt-6 inline-flex items-center gap-3 text-[14px] text-ivory/85 hover:text-gold">
                  Read More <ArrowRight className="h-4 w-4 text-gold" />
                </Link>
              </div>
              <div className="border-gold/20 lg:border-l lg:pl-11">
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
            <section id="prsc" className="px-7 pb-6 sm:px-10 lg:px-12">
              <div className="border border-gold/20 bg-ivory/[.02] p-8 lg:p-11">
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
            <section id="dis" className="px-7 pb-6 sm:px-10 lg:px-12">
              <div className="border border-gold/20 bg-ivory/[.02] p-8 lg:p-11">
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
          <section id="next" className="px-7 pb-6 sm:px-10 lg:px-12">
            <div className="border border-gold/20 bg-ivory/[.02] p-8 lg:p-11">
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
          <section id="questions" className="px-7 pb-16 sm:px-10 lg:px-12">
            <div className="flex flex-col gap-6 border border-gold/20 bg-ivory/[.02] p-8 sm:flex-row sm:items-center sm:justify-between lg:p-11">
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
