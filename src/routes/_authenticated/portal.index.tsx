import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { OrientationHub } from "@/components/portal/OrientationHub";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  Cog,
  Download,
  FileSignature,
  FileText,
  Globe,
  Home,
  Lock,
  LockKeyhole,
  PenLine,
  ScrollText,
  Share2,
  Shield,

  Target,
  Users,
} from "lucide-react";

import { MemberDocuments } from "@/components/portal/MemberDocuments";
import { MemberMeetings } from "@/components/portal/MemberMeetings";
import { LeadershipTeam } from "@/components/portal/LeadershipTeam";
import { getMyMeetings } from "@/lib/meetings.functions";
import { getMyDocuments, getMyHeadshotUrl, getPortalSession } from "@/lib/portal.functions";
import { INVITE_ROLE_LABELS } from "@/lib/invite-email-config";
import { StatusTimeline } from "@/components/portal/StatusTimeline";
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
  validateSearch: (search: Record<string, unknown>): { asMember?: string } =>
    typeof search.asMember === "string" ? { asMember: search.asMember } : {},
  component: PortalHome,
});

const entityLabel = { prsc: "PRSC", dis: "DIS", both: "PRSC / DIS" } as const;

const capacityLabel = (role: string) =>
  INVITE_ROLE_LABELS[role as keyof typeof INVITE_ROLE_LABELS] ?? "Board Member";

const selectedLabel = (role: string) =>
  role === "advisor" ? "Selected Advisor" : role === "board_member" ? "Board Member" : capacityLabel(role);

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
  const { asMember } = Route.useSearch();
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-session", asMember ?? null],
    queryFn: () => isPreviewHost() && !asMember ? Promise.resolve(null) : getPortalSession({ data: { asMemberId: asMember } }),
    retry: false,
  });

  const headshot = useQuery({
    queryKey: ["my-headshot", asMember ?? null],
    queryFn: () => getMyHeadshotUrl({ data: { asMemberId: asMember } }).catch(() => null),
    retry: false,
    enabled: Boolean(data?.member),
  });
  const documents = useQuery({
    queryKey: ["my-documents", asMember ?? null],
    queryFn: () => getMyDocuments({ data: { asMemberId: asMember } }).catch(() => null),
    retry: false,
    enabled: Boolean(data?.member && data?.hasProfile),
  });
  const meetings = useQuery({
    queryKey: ["my-meetings", asMember ?? null],
    queryFn: () => getMyMeetings({ data: { asMemberId: asMember } }).catch(() => null),
    retry: false,
    enabled: Boolean(data?.member),
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<"role" | "hub" | "documents" | "questions" | "meetings" | null>(null);
  useEffect(() => {
    if (data?.isAdmin && !data?.viewingAs) navigate({ to: "/admin", replace: true });
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
  // Every member can read about both organizations, regardless of designation.
  const showPrsc = true;
  const showDis = true;
  const entityWord = entityLabel[m.entity];
  const profileComplete = data?.hasProfile ?? false;
  const packageReady = m.package_status === "package_ready";
  const myDocs = documents.data?.documents ?? [];
  const documentsReleased = myDocs.length > 0;
  const signDocs = myDocs.filter((d) => d.category === "sign");
  const readDocs = myDocs.filter((d) => d.category === "read");
  const acknowledged = new Set(documents.data?.acknowledged ?? []);
  const signLeft = signDocs.filter((d) => !acknowledged.has(d.id)).length;
  const readLeft = readDocs.filter((d) => !acknowledged.has(d.id)).length;
  const allDone = documentsReleased && signLeft + readLeft === 0;
  const docSummary = allDone
    ? `All ${myDocs.length} documents complete — thank you.`
    : `${myDocs.length - signLeft - readLeft} of ${myDocs.length} complete · ${[signLeft ? `${signLeft} to sign` : "", readLeft ? `${readLeft} to acknowledge` : ""].filter(Boolean).join(", ")}`;


  const sideNav = [
    { label: "Overview", href: "#overview", icon: Home, active: true, onSelect: undefined as (() => void) | undefined },
    { label: "Your Documents", href: "#documents", icon: profileComplete ? FileSignature : Lock, active: false, onSelect: () => setPanel("documents") },
    { label: "Meetings", href: "#meetings", icon: CalendarDays, active: false, onSelect: () => document.getElementById("meetings")?.scrollIntoView({ behavior: "smooth" }) },
    { label: "The Orientation Hub", href: "#hub", icon: ScrollText, active: false, onSelect: () => setPanel("hub") },
  ];




  const viewingBanner = data?.viewingAs ? (
    <div className="sticky top-0 z-[70] flex flex-wrap items-center justify-center gap-3 border-b border-gold/40 bg-navy-deep px-4 py-2 text-sm text-ivory">
      <span>Viewing the Welcome Center as <strong className="text-gold">{m.first_name} {m.last_name}</strong> · read-only admin view</span>
      <Link to="/admin" className="rounded-full border border-gold/60 px-3 py-1 text-xs uppercase tracking-[0.14em] text-gold hover:bg-gold hover:text-navy-deep">Return to Admin</Link>
    </div>
  ) : null;

  return (
    <>
    {viewingBanner}
    <PortalShell
      memberName={name}
      memberProgress={
        <div className="min-w-0 lg:min-w-[620px]">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <p className="whitespace-nowrap text-[9px] uppercase tracking-[0.18em] text-gold">Your Next Step</p>
              <span className="h-3 w-px bg-gold/25" />
              <p className="truncate text-[11px] text-ivory/55">
                {profileComplete
                  ? documentsReleased
                    ? docSummary
                    : "Your profile is received; your documents are being prepared."
                  : "Complete your private profile to begin."}
              </p>
            </div>
            {profileComplete && documentsReleased && (allDone ? (
              <Link to="/portal/summary" className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-gold hover:text-ivory">
                View your summary
              </Link>
            ) : (
              <button type="button" onClick={() => setPanel("documents")} className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-gold hover:text-ivory">
                Review documents
              </button>
            ))}
          </div>
          <StatusTimeline
            horizontal
            profileComplete={profileComplete}
            packageStatus={m.package_status}
            documentsReleased={documentsReleased}
            allAcknowledged={documentsReleased && myDocs.filter((d) => d.action !== "boldsign" && d.action !== "docusign").every((d) => acknowledged.has(d.id))}
          />
        </div>
      }
    >
      <div className="grid w-full lg:grid-cols-[20%_80%]">
        {/* Sidebar */}
        <aside className="order-2 border-b border-gold/15 px-7 lg:order-none py-7 lg:border-b-0 lg:border-r lg:px-0 lg:pb-14 lg:pt-0">
          <div className="lg:px-[12.5%] lg:pt-[clamp(1.5rem,2vw,2.25rem)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80">Your Welcome Center</p>
            <div className="mt-5 flex items-center gap-4">
              {headshot.data?.url ? (
                <img
                  src={headshot.data.url}
                  alt={`${name} ${m.last_name}`}
                  className="aspect-square w-[64px] shrink-0 rounded-full border border-gold/55 object-cover"
                />
              ) : (
                <span className="grid aspect-square w-[64px] shrink-0 place-items-center rounded-full border border-gold/55 font-display text-xl text-gold">
                  {initials}
                </span>
              )}
              <h2 className="min-w-0 font-display text-[clamp(1.15rem,1.3vw,1.5rem)] leading-tight">
                {name} {m.last_name}
              </h2>
            </div>
            <div className="mt-4 flex flex-col items-start gap-2 border-t border-gold/15 pt-4">
              {profileComplete && (
                <Link to="/portal/profile" className="inline-flex items-center gap-2 text-[13px] font-medium text-gold transition-colors hover:text-ivory">
                  <PenLine className="h-3.5 w-3.5" /> Update Private Profile
                </Link>
              )}
              <button
                type="button"
                onClick={() => setPanel("role")}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-gold transition-colors hover:text-ivory"
              >
                Role Details <ArrowRight className="h-3.5 w-3.5" />
              </button>
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

            <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Need help?</p>
            <p className="mt-3 text-[14px] text-ivory/65">We're here for you.</p>
            <Link to="/portal/questions" className="mt-5 flex min-h-10 items-center gap-3 text-[14px] text-ivory/80 hover:text-gold">
              <LockKeyhole className="h-4 w-4 text-gold" /> Questions? Send a Message
            </Link>

          </div>
        </aside>

        {/* Main */}
        <main className="order-1 flex min-w-0 flex-col justify-between pb-2 lg:order-none">
          {(() => {
            const pendingMeetings = (meetings.data?.polls ?? []).filter((p: any) => p.status === "open" && p.my_responses.length === 0).length;
            const items: { label: string; onClick: () => void }[] = [];
            if (documentsReleased && !allDone) items.push({ label: `${signLeft + readLeft} document${signLeft + readLeft === 1 ? "" : "s"} need${signLeft + readLeft === 1 ? "s" : ""} your attention`, onClick: () => setPanel("documents") });
            if (pendingMeetings) items.push({ label: `${pendingMeetings} meeting${pendingMeetings === 1 ? "" : "s"} awaiting your availability`, onClick: () => document.getElementById("meetings")?.scrollIntoView({ behavior: "smooth" }) });
            if (!items.length) return null;
            return (
              <div className="mx-7 mt-6 flex flex-col gap-2 border border-gold/40 bg-gold/[.07] px-5 py-4 sm:mx-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:mx-[3.5%]">
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold">Action needed</span>
                {items.map((it) => (
                  <button key={it.label} type="button" onClick={it.onClick} className="text-left text-sm text-ivory underline decoration-gold/50 underline-offset-4 hover:text-gold">
                    {it.label} →
                  </button>
                ))}
              </div>
            );
          })()}
          {/* Hero banner */}
          <section id="overview" className="px-5 pt-5 sm:px-7 lg:px-[1.5%] lg:pt-[1.25%]">
            <div className="relative overflow-hidden border border-gold/15 bg-navy-deep">
              <img
                src={heroRoad}
                alt=""
                width={1280}
                height={960}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-[60%_55%] opacity-40 lg:w-[78%] lg:opacity-90 [mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)]"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-navy-deep)_0%,var(--color-navy-deep)_22%,transparent_60%)]" />
              <div className="relative grid gap-6 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-[clamp(1.5rem,2.2vw,2.5rem)] lg:py-[clamp(2.5rem,3.4vw,4rem)]">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Private Board &amp; Advisor Center</p>
                  <h1 className="mt-3 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-[clamp(3.5rem,4.2vw,5rem)]">Welcome, {name}.</h1>
                  <p className="mt-1 font-display text-2xl leading-tight text-ivory/85 sm:text-3xl lg:text-[clamp(1.75rem,2vw,2.4rem)]">To the future of Partnership Readiness.</p>
                </div>
                <div className="hidden lg:block">
                  <p className="text-[11px] uppercase leading-[2.15] tracking-[0.36em] text-ivory/90">
                    A higher
                    <br />
                    standard
                    <br />
                    for a stronger
                    <br />
                    industry.
                  </p>
                  <div className="mt-4 h-px w-11 bg-gold" />
                </div>
              </div>
            </div>
          </section>

          {/* Intro + Why you */}
          <div className="grid gap-5 px-5 pb-5 pt-5 sm:px-7 lg:grid-cols-2 lg:gap-[1.25%] lg:px-[1.5%] lg:pt-[1.25%]">
            <section className="flex flex-col justify-center border border-gold/25 bg-[linear-gradient(135deg,var(--color-midnight),var(--color-navy))] p-6 sm:p-8">
              <p className="text-[15px] leading-[1.65] text-ivory/72">
                PRSC and Decision Intelligence Systems have reached an important inflection point. The foundation is built, the
                platform is advancing, and DIS has officially entered investor prospecting.
              </p>
              <p className="mt-4 text-[15px] leading-[1.65] text-ivory/72">
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
              <p className="mt-3 text-[15px] text-ivory/52">
                {profileComplete
                  ? "Your profile is on file — your package is being prepared."
                  : (
                    <>
                      Approx. 7–10 minutes  •  Your Submission is Private.
                      <br />
                      Completing your profile unlocks your individualized package.
                    </>
                  )}
              </p>
            </section>

            <section id="role" className="grid items-stretch gap-6 border border-gold/25 bg-[linear-gradient(135deg,var(--color-midnight),var(--color-navy))] p-6 sm:p-8 xl:grid-cols-[1.6fr_1fr]">
              <div className="flex min-w-0 flex-col justify-center">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
                  Why You <span className="mx-2 text-gold/40">|</span>
                  <span className="text-ivory/70">{m.title || selectedLabel(m.role)}</span>
                  <span className="mx-2 text-gold/40">·</span>
                  <span className="text-ivory/70">{entityWord}</span>
                </p>
                <h2 className="mt-4 font-display text-[clamp(1.75rem,2vw,2.3rem)] leading-tight">{name}, Your Perspective Matters.</h2>
                <p className="mt-5 text-[15px] leading-7 text-ivory/75">{m.why_you}</p>
                <div className="mt-6 h-px w-16 bg-gold" />
              </div>
              <div className="flex flex-col justify-center border-gold/20 xl:border-l xl:pl-6">
                <blockquote className="font-display text-[20px] italic leading-snug text-gold">
                  “Independent standards create stronger markets.”
                </blockquote>
                <p className="mt-3 text-[10px] uppercase leading-[2] tracking-[0.24em] text-ivory/60">
                  Better data.
                  <br />
                  Brighter opportunities.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Meetings + Leadership */}
      <div className="grid gap-5 border-t border-gold/10 px-5 py-6 sm:px-7 lg:grid-cols-[64%_1fr] lg:gap-[1.25%] lg:px-[7%] lg:py-[1.25%]">
        <section id="meetings" className="scroll-mt-6 border border-gold/25 bg-[linear-gradient(135deg,var(--color-midnight),var(--color-navy))] p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Meetings &amp; Calendar</p>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,2.2vw,2.4rem)] leading-tight">Your meeting calendar</h2>
          <p className="mt-2 text-sm text-ivory/60">Mark your availability for proposed dates, check confirmed meetings, and add them to your calendar.</p>
          <div className="mt-6">
            <MemberMeetings asMemberId={asMember} hideIntro />
          </div>
        </section>
        <section id="team" className="min-w-0">
          <LeadershipTeam />
        </section>
      </div>

      <Dialog open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
        <DialogContent className="max-h-[86vh] w-[min(94vw,980px)] max-w-none overflow-y-auto border-gold/30 bg-[linear-gradient(145deg,var(--color-midnight),var(--color-navy))] p-8 text-ivory shadow-2xl lg:p-[clamp(2rem,2.7vw,3.25rem)]">
          {panel === "meetings" && (
            <div>
              <DialogHeader className="space-y-0 text-left">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Meetings &amp; Briefings</p>
                <DialogTitle className="mt-4 font-display text-[clamp(2rem,2.6vw,2.9rem)] font-normal leading-[1.1]">
                  Your meeting calendar
                </DialogTitle>
              </DialogHeader>
              <div className="mt-8">
                <MemberMeetings />
              </div>
            </div>
          )}
          {panel === "role" && (
            <div className="grid gap-9 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
              <div className="min-w-0">
                <DialogHeader className="space-y-0 text-left">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Role Details</p>
                  <DialogTitle className="mt-4 font-display text-[clamp(2.25rem,3vw,3.4rem)] font-normal leading-[1.05]">
                    {name} {m.last_name}
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-5 font-display text-[clamp(1.35rem,1.8vw,2rem)] leading-tight text-gold">
                  {m.title || selectedLabel(m.role)}
                </p>
                {m.organization && (
                  <p className="mt-3 text-[16px] leading-7 text-ivory/70">{m.organization}</p>
                )}
                <p className="mt-7 max-w-[36rem] text-[15px] leading-7 text-ivory/65">
                  Your role details reflect the information provided when your private center access was created. Your
                  individualized package will provide the formal terms and complete scope of your role.
                </p>
              </div>
              <div className="border-t border-gold/20 pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-1">
                <dl className="space-y-7">
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Designation</dt>
                    <dd className="mt-2 font-display text-2xl text-ivory">{entityWord}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Capacity</dt>
                    <dd className="mt-2 font-display text-2xl text-ivory">
                      {capacityLabel(m.role)}
                    </dd>
                  </div>
                  {m.organization && (
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Organization</dt>
                      <dd className="mt-2 text-[16px] leading-7 text-ivory/80">{m.organization}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {panel === "hub" && <OrientationHub onClose={() => setPanel(null)} onOpenDocuments={() => setPanel("documents")} />}

          {panel === "documents" && (
            <>
              <DialogHeader className="space-y-0 text-left">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Your Documents</p>
                <DialogTitle className="mt-4 font-display text-[clamp(2rem,2.6vw,2.9rem)] font-normal leading-tight">
                  Documents to sign and return. Documents to read and retain.
                </DialogTitle>
              </DialogHeader>

              {!profileComplete ? (
                <div className="mt-8 border border-gold/25 bg-ivory/[.03] p-8 text-center">
                  <Lock className="mx-auto h-7 w-7 text-gold" />
                  <h3 className="mt-5 font-display text-[24px] leading-snug">Available after your profile is complete.</h3>
                  <p className="mx-auto mt-4 max-w-[34rem] text-[15px] leading-7 text-ivory/65">
                    Your documents are prepared individually. Once your profile is on file, the documents to sign and return
                    and the documents to read and retain will appear here.
                  </p>
                  <Link
                    to="/portal/profile"
                    onClick={() => setPanel(null)}
                    className="cta-glow mt-7 inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-[16px] font-semibold transition-all"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Complete Your Profile <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </div>
              ) : (
                <>
                  {documentsReleased ? (
                    <MemberDocuments documents={myDocs as any} completions={documents.data?.completions ?? []} />
                  ) : (
                    <div className="mt-8 border border-gold/25 bg-ivory/[.03] p-8 text-center"><FileText className="mx-auto h-7 w-7 text-gold"/><h3 className="mt-5 font-display text-[24px] leading-snug">Your documents are being prepared.</h3><p className="mx-auto mt-4 max-w-[34rem] text-[15px] leading-7 text-ivory/65">Your profile has been received. We will email you as soon as your individualized Board/Advisor documents are ready here.</p></div>
                  )}
                </>
              )}
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
    </>
  );
}
