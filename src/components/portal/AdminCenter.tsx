import { csvCell } from "@/lib/csv";
import { isForumCleared, packageReadyOptionLabel, packageStatusLabel } from "@/lib/package-status";
import { userFacingError } from "@/lib/user-facing-error";
import { freshInviteGovernance, normalizedRecipient } from "@/lib/invitation-evidence";
import { getInvitationNda, saveInvitationNdaVerification } from "@/lib/invitation-nda.functions";
import { invitationNdaFormValues, clearInvitationNdaConfirmation } from "@/lib/invitation-nda-form";
import { normalizedNdaReference } from "@/lib/invitation-nda";
import { parseMemberList, MEMBER_LIST_TEMPLATE, type MemberImportRow } from "@/lib/member-import";
import { requiredInvitationNdaEntity, intendedDesignationSchema, readIntendedDesignation, intendedDesignationLabel, projectIntendedDesignation } from "@/lib/intended-designation";
import { IntendedDesignationFields } from "@/components/portal/IntendedDesignationFields";
import { useStoredFlag } from "@/hooks/use-stored-flag";
import { openAdminCard, useAccordion, useAdminTarget } from "@/lib/admin-nav";
import { SYSTEM_EMAIL_DEFAULTS } from "@/lib/system-email-defaults";
import { isInvitationEmailName } from "@/lib/email-log-name";
import { AdminSentLog } from "@/components/portal/AdminSentLog";
import { invitationWasSent, NOT_INVITED_DETAIL, NOT_INVITED_LABEL } from "@/lib/invitation-state";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { AdminLeadership } from "@/components/portal/AdminLeadership";
import { AdminSidebar } from "@/components/portal/AdminSidebar";
import heroRoad from "@/assets/portal-hero-road.jpg";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { render } from "@react-email/render";
import { AdminForumCommunications } from "@/components/portal/AdminForumCommunications";
import { AdminQuestionRegister } from "@/components/portal/AdminQuestionRegister";
import { AdminDocumentLibrary } from "@/components/portal/AdminDocumentLibrary";
import { AdminReleaseReview } from "@/components/portal/AdminReleaseReview";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Mail,
  CalendarDays,
  CheckCircle2,
  Download,
  Clock3,
  Eye,
  FileText,
  History,
  Info,
  MailPlus,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  getAdminOverview,
  getMemberDetail,
  importPortalMembers,
  invitePortalMember,
  deletePortalMember,
  purgePortalMember,
  nudgeMember,
  setMemberAccess,
  setMemberPackageStatus,
  updateInquiry,
  saveMemberInvitationNotes,
} from "@/lib/portal.functions";
import { draftWhyYou, draftWhyYouPreview } from "@/lib/why-you-draft.functions";
import {
  deleteEmailTemplate,
  deleteEmailHistory,
  getEmailCenter,
  resetEmailTemplate,
  saveEmailTemplate,
  sendMemberEmail,
  sendTestEmail,
  sendTestInvitation,
  type EmailSend,
  type EmailTemplate,
} from "@/lib/portal-email.functions";
import { applyTokens, buildMemberTokens, parseSignatures, renderBrandedEmail } from "@/lib/branded-email";
import { PortalShell, type PortalNotification } from "@/components/portal/PortalShell";
import { AdminMemberDocuments } from "@/components/portal/AdminMemberDocuments";
import { isPreviewHost } from "@/routes/_authenticated/route";
import { AdminMeetings } from "@/components/portal/AdminMeetings";
import { listAdminPolls } from "@/lib/meetings.functions";
import { MeetingSetupForm } from "@/components/portal/MeetingSetupForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { meetingTypeLabel, meetingBlockText, pollFitsMember } from "@/lib/meeting-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InviteEmail, capitalizeInviteName } from "@/lib/email-templates/invite";
import { roleCombinationTier } from "@/lib/governance";
import { INVITE_EMAIL_PREVIEW_URL, INVITE_EMAIL_REPLY_TO, INVITE_EMAIL_SUBJECT } from "@/lib/invite-email-config";
import { memberRoleLabel, memberDesignation, memberCandidateLabel } from "@/lib/member-role-labels";
import { STAGES, type JourneyStatus } from "@/lib/journey";
import type { InviteEmailReview } from "@/lib/portal-invite-email.functions";
import { MemberDetailsEditor } from "@/components/portal/MemberDetailsEditor";
import { AdminForumInvitationBatch } from "@/components/portal/AdminForumInvitationBatch";
import {
  communicationReadoutRows,
  fitReadoutRows,
  hasCommunicationPreferences,
  hasFitAnswers,
  LEGACY_PORTAL_EXPERIENCE_QUESTIONS,
  LEGACY_PORTAL_VISIBILITY_PERMISSIONS,
  PORTAL_COMMUNICATION_VERSION,
  PORTAL_FIT_VERSION,
  PORTAL_PERMISSION_LABELS,
  PORTAL_PROFILE_STAGES,
} from "@/lib/portal-profile-fields";

const FIT_EXPORT_LABELS = fitReadoutRows({ version: PORTAL_FIT_VERSION }).map((row) => row.label);
const COMMUNICATION_EXPORT_LABELS = communicationReadoutRows({ version: PORTAL_COMMUNICATION_VERSION }).map((row) => row.label);

const demoOverview: any = {
  members: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      first_name: "Alex",
      last_name: "Morgan",
      email: "alex.morgan@example.com",
      organization: "Northline Partners",
      entity: "both",
      role: "advisor",
      is_candidate: true,
      intended_designation: { version: 1, kind: "forum_invitee", entity: "none", roles: [], other_text: "", committee: "undetermined" },
      linkedin_url: "https://www.linkedin.com/in/alex-morgan-example/",
      why_you: "",
      updated_at: new Date().toISOString(),
      status: "active",
      package_status: "in_preparation",
      last_access_at: new Date().toISOString(),
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      first_name: "Dana",
      last_name: "Reyes",
      email: "dana.reyes@example.com",
      organization: "Harbor Sports Group",
      entity: "prsc",
      role: "board_member",
      status: "invited",
      package_status: "awaiting_profile",
      last_access_at: null,
    },
  ],
  inquiries: [
    { id: "q1", member_id: "11111111-1111-4111-8111-111111111111", subject: "Preview inquiry", message: "Sample content shown only while previewing.", status: "open" },
  ],
  activity: [{ id: "a1" }],
};

const demoMemberDetail: any = {
  member: demoOverview.members[0],
  profile: {
    current_stage: 3,
    preferred_name: "Alex",
    professional_role: "Strategic Advisor",
    current_organization: "Northline Partners",
    preferred_email: "alex.morgan@example.com",
    preferred_phone: "+1 212 555 0140",
    bio: "Strategic advisor with experience in partnership strategy and operating models.",
    experience_answers: { q1: "Partnership strategy, operating models, and investor readiness." },
    visibility_instructions: { p1: "yes", p2: "discuss", p3: "no" },
    restriction_status: "no",
    restriction_details: "",
    final_notes: "",
    questions: "",
    contact_requested: false,
    submitted_at: null,
    updated_at: new Date().toISOString(),
  },
  headshotUrl: null,
  journey: {
    activity: [{ id: "demo-activity", event_type: "inquiry_submitted", metadata: {}, created_at: new Date().toISOString() }],
    inquiries: [{ id: "q1", subject: "Preview inquiry", status: "open", created_at: new Date().toISOString() }],
    documentCount: 0,
    acknowledgedDocumentCount: 0,
  },
};

const demoEmailCenter: { templates: EmailTemplate[]; sends: EmailSend[] } = {
  templates: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      system_key: "invite",
      name: "Invitation (sent automatically)",
      subject: "PRSC & DIS | Board & Advisor Center",
      description: "Sent automatically when you invite a member. Tokens: {{first_name}}, {{entity_full}}, {{entity}}, {{role}}.",
      eyebrow: "Private invitation",
      heading: "Welcome, {{first_name}}!",
      body: "It's been a while since we spoke!\n\nYou're receiving this invitation because we aligned on your role at {{entity_full}} as a {{role}}.\n\nA great deal has happened behind the scenes. We've reached an important next stage—including DIS officially entering investor prospecting—and we're excited to reconnect and bring you into what comes next.\n\nWe've created a private {{entity}} Board & Advisor Welcome Center where you can quickly:\n\n• Get reacquainted with {{entity}} and see where we are today\n• Review why we're excited to have you involved\n• Provide a few details we need to prepare your individualized Board/Advisor package\n• Send us any questions before your formal materials are delivered\n\nWe're excited to reconnect and officially welcome you into this next chapter.",
      cta_label: "Access Your Private Welcome Center →",
      cta_url: null,
      cta_subtext: "After you click the button, you'll create your own private password on the secure invitation page. No password will be sent by email. Once your password is set, you'll enter the Welcome Center immediately.",
      signatures: "Shirley Johnson",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Welcome & Access",
      subject: "Welcome to the future of Partnership Readiness, {{first_name}}",
      description: "Sent with the first invitation to the Private Board & Advisor Center",
      eyebrow: "Welcome & Access",
      heading: "Welcome, {{first_name}}.",
      body: "Welcome to the future of Partnership Readiness.\n\nWe’re building something special at {{entity_full}}, and we’re thrilled to have you as part of what comes next.\n\nWe’re pleased to share an important milestone: DIS has officially moved into investor prospecting.\n\nAs a {{role_label}}, your experience, perspective, and guidance will play an important role in our future success. Within the next 8–10 business days, you’ll receive your {{package_label}} package outlining your role, commitment, opportunity, and other key details for your review and alignment.\n\nWe know—it’s been a while since we’ve connected! Click below for a quick update on where we are, why we’re excited to partner with you, and to submit a few pre-package details or any questions you may have.\n\nIt’s been an exciting—and at times challenging—journey to get here. We’re looking forward to this next chapter and to disrupting the brand partnership industry together.",
      cta_label: "Welcome aboard",
      cta_url: "https://access.prscstandards.org/portal",
      cta_subtext: "Your private invitation link will let you create your own password securely.",
      signatures: "Shirley Johnson",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  sends: [
    {
      id: "s1",
      member_id: "11111111-1111-4111-8111-111111111111",
      template_id: "33333333-3333-4333-8333-333333333333",
      template_name: "Welcome & Access",
      subject: "Your private PRSC welcome center is open, Alex",
      recipient_email: "alex.morgan@example.com",
      status: "sent",
      created_at: new Date().toISOString(),
    },
  ],
};

const emptyDraft = {
  id: "" as string,
  name: "",
  subject: "",
  description: "",
  eyebrow: "Private Communication",
  heading: "",
  body: "",
  cta_label: "",
  cta_url: "",
  cta_subtext: "",
  signatures: "",
};

type Draft = typeof emptyDraft;

type MemberRow = Omit<MemberImportRow, "linkedin_url" | "background">;
type StagedRow = MemberImportRow;

const emptyInvite: InviteEmailReview = {
  first_name: "",
  last_name: "",
  email: "",
  organization: "",
  title: "",
  entity: "prsc",
  role: "advisor",
  why_you: "",
  is_methodology_committee: false,
  participates_in_forum: true,
  is_candidate: true,
  intended_designation: { version: 1, kind: "forum_invitee", entity: "none", roles: [], other_text: "", committee: "undetermined" },
};

/** Opens an email's HTML in its own browser tab so it can be judged at full size, like an inbox would show it. */
function popOutEmail(html: string) {
  if (!html) return;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

/** An admin card that starts folded (caret at the top right) and remembers what you opened. */
function CollapseCard({ id, group, hashes, domId = true, className, title, children }: { id: string; group?: string; hashes?: string[]; domId?: boolean; className: string; title?: string; children: React.ReactNode }) {
  const [open, setCardOpen] = useAccordion(id, group ?? id);
  const collapsed = !open;
  const setCollapsed = (v: boolean) => setCardOpen(!v);
  useAdminTarget(hashes ?? [id], () => setCollapsed(false));
  return (
    <section id={domId ? id : undefined} className={`${className} relative scroll-mt-24 pr-14 sm:pr-16 ${collapsed ? "[&>*:not(:first-child):not([data-collapse-toggle])]:hidden" : ""}`}>
      {title && <h2 className="font-display text-3xl">{title}</h2>}
      {children}
      <button type="button" data-collapse-toggle onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} aria-label={collapsed ? "Expand section" : "Collapse section"} className="absolute right-3 top-6 z-10 grid h-9 w-9 place-items-center rounded-full border border-gold/30 text-gold hover:bg-gold/10 sm:right-4 sm:top-8">
        {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </section>
  );
}

function downloadListTemplate() {
  const url = URL.createObjectURL(new Blob([MEMBER_LIST_TEMPLATE], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "prsc-member-list-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type InviteGov = ReturnType<typeof freshInviteGovernance>;
/** A new recipient always starts without an administrator attestation. */
const EMPTY_INVITE_GOV: InviteGov = freshInviteGovernance();

export function AdminCenter({ page }: { page: "overview" | "send" }) {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setHasSession(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);
  // Test mode only when viewing an unsigned builder preview; signed-in admins always run real actions.
  const preview = isPreviewHost() && !hasSession;
  const overview = useQuery({
    queryKey: ["portal-admin", preview],
    queryFn: () => (preview ? Promise.resolve(demoOverview) : getAdminOverview()),
    retry: false,
  });
  const email = useQuery({
    queryKey: ["portal-admin-email", preview],
    queryFn: () => (preview ? Promise.resolve(demoEmailCenter) : getEmailCenter()),
    retry: false,
  });

  const polls = useQuery({
    queryKey: ["portal-admin-polls", preview],
    queryFn: () => (preview ? Promise.resolve({ polls: [] as any[] }) : listAdminPolls()),
    retry: false,
  });
  const openPolls: any[] = (polls.data?.polls ?? []).filter((p: any) => p.status === "open");
  const [invitePollId, setInvitePollId] = useState("");
  const [inviteGov, setInviteGov] = useState(EMPTY_INVITE_GOV);
  const [inviteCandidateId, setInviteCandidateId] = useState("");
  const [inviteNda, setInviteNda] = useState<Awaited<ReturnType<typeof getInvitationNda>> | null>(null);
  const [inviteNdaReviewId, setInviteNdaReviewId] = useState("");
  const [inviteNdaLoading, setInviteNdaLoading] = useState(false);
  const [inviteNdaSaving, setInviteNdaSaving] = useState(false);
  const [inviteNdaMessage, setInviteNdaMessage] = useState("");
  const inviteNdaGeneration = useRef(0);
  const [inviteOpen, setInviteOpen] = useAccordion("invite");
  const inviteCollapsed = !inviteOpen;
  const setInviteCollapsed = (v: boolean) => setInviteOpen(!v);
  const [sentLogOpen, setSentLogOpen] = useAccordion("sent-log");
  const [recipientsOpen, setRecipientsOpen] = useStoredFlag("admin.recipientsOpen.v3", false);
  const [membersOpen, setMembersOpen] = useAccordion("members");
  const membersCollapsed = !membersOpen;
  const setMembersCollapsed = (v: boolean) => setMembersOpen(!v);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  useEffect(() => {
    if (page === "send" && window.location.hash === "#sent-log") setSentLogOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  const PLACE: Record<"overview" | "send", Record<number, string>> = {
    overview: {
      1: "self-start order-1 lg:col-start-1 lg:row-start-1 lg:row-span-2",
      2: "self-start order-2 lg:col-start-1 lg:row-start-3 lg:row-span-2",
      5: "self-start order-3 lg:col-start-2 lg:row-start-1",
      6: "self-start order-4 lg:col-start-2 lg:row-start-2",
      3: "self-start order-5 lg:col-start-2 lg:row-start-3",
      4: "self-start order-6 lg:col-start-2 lg:row-start-4",
    },
    send: { 1: "order-1", 2: "order-3", 3: "order-4", 4: "order-6" },
  };
  const S = (on: "overview" | "send", order: number) => (page === on ? PLACE[on][order] ?? "" : "hidden");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [composePollId, setComposePollId] = useState("");
  const [previewAsId, setPreviewAsId] = useState("");
  const [docsMemberId, setDocsMemberId] = useState("");
  const blockFor = (id: string) => {
    const p = openPolls.find((x) => x.id === id);
    return p ? meetingBlockText(p, p.slots ?? []) : null;
  };
  const [meetingDialog, setMeetingDialog] = useState<null | "invite" | "compose">(null);
  const attachComposeBlock = (block: string | null) => {
    if (!block) return;
    setDraft((d) => ({
      ...d,
      body: d.body.includes(block) ? d.body : `${d.body.trim()}${d.body.trim() ? "\n\n" : ""}${block}`,
      cta_label: d.cta_label || "Share Your Availability",
      cta_url: d.cta_url || "https://access.prscstandards.org/portal#meetings",
    }));
    setEmailStatus("Meeting dates added to the email. Recipients will be added to this meeting when you send.");
  };
  const onMeetingCreated = async (pollId: string) => {
    const target = meetingDialog;
    setMeetingDialog(null);
    const res = await polls.refetch();
    const p = (res.data?.polls ?? []).find((x: any) => x.id === pollId);
    if (target === "invite") setInvitePollId(pollId);
    if (target === "compose") {
      setComposePollId(pollId);
      attachComposeBlock(p ? meetingBlockText(p, p.slots ?? []) : null);
    }
  };
  const invitePollBlock = blockFor(invitePollId);
  const composePollBlock = blockFor(composePollId);
  const [status, setStatus] = useState("");
  const [inviteDraft, setInviteDraft] = useState<InviteEmailReview>(emptyInvite);
  const inviteIntended = inviteDraft.intended_designation ?? readIntendedDesignation(inviteDraft);
  const [aiLinkedin, setAiLinkedin] = useState("");
  const [aiBackground, setAiBackground] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const aiInputVersion = useRef("");
  aiInputVersion.current = JSON.stringify([inviteDraft, aiLinkedin, aiBackground]);
  const [savingInviteNotes, setSavingInviteNotes] = useState(false);
  const runAiDraft = async () => {
    if (aiDrafting) return;
    const generation = inviteNdaGeneration.current;
    const inputVersion = aiInputVersion.current;
    setAiDrafting(true); setAiStatus("");
    try {
      const { draft: text, source } = await (preview ? draftWhyYouPreview : draftWhyYou)({ data: {
        first_name: inviteDraft.first_name, last_name: inviteDraft.last_name, organization: inviteDraft.organization,
        title: inviteDraft.title, entity: inviteDraft.entity, role: inviteDraft.role, is_candidate: !!inviteDraft.is_candidate,
        intended_designation: inviteIntended,
        linkedin_url: aiLinkedin, background: aiBackground,
      } });
      if (generation !== inviteNdaGeneration.current) return;
      if (inputVersion !== aiInputVersion.current) { setAiStatus("The recipient details changed while drafting. Generate a new draft for the current details."); return; }
      setInviteDraft((d) => ({ ...d, why_you: text }));
      setAiStatus(source.kind === "administrator_background" ? "Drafted from the background you supplied. Review and edit before sending." : "Draft added from the supplied details and profile-link reference. Review and edit before sending.");
    } catch (err) {
      if (generation === inviteNdaGeneration.current) setAiStatus(userFacingError(err, "The draft could not be created."));
    } finally { if (generation === inviteNdaGeneration.current) setAiDrafting(false); }
  };
  async function saveInviteNotes() {
    if (!inviteCandidateId || !inviteNda || savingInviteNotes) return;
    if (preview) return setAiStatus("Sign in to save this member’s note without sending an invitation.");
    const generation = inviteNdaGeneration.current;
    setSavingInviteNotes(true); setAiStatus("");
    try {
      const saved = await saveMemberInvitationNotes({ data: { member_id: inviteCandidateId, expected_updated_at: inviteNda.member.updated_at, why_you: inviteDraft.why_you, linkedin_url: aiLinkedin || null } });
      if (generation !== inviteNdaGeneration.current) return;
      setInviteNda((current) => current ? { ...current, member: { ...current.member, updated_at: saved.updated_at } } : current);
      setAiStatus("Note and LinkedIn link saved. No invitation was sent.");
      void overview.refetch();
    } catch (error) {
      if (generation === inviteNdaGeneration.current) setAiStatus(userFacingError(error, "The invitation note could not be saved."));
    } finally { if (generation === inviteNdaGeneration.current) setSavingInviteNotes(false); }
  }
  const [invitePreviewOpen, setInvitePreviewOpen] = useState(false);
  const [invitePreviewHtml, setInvitePreviewHtml] = useState("");
  const inviteFormRef = useRef<HTMLFormElement>(null);
  function resetInvitation() {
    inviteNdaGeneration.current += 1;
    setInviteCandidateId(""); setInviteNda(null); setInviteNdaReviewId(""); setInviteNdaLoading(false); setInviteNdaSaving(false); setInviteNdaMessage("");
    setInviteDraft({ ...emptyInvite }); setInviteGov(freshInviteGovernance()); setInvitePollId("");
    setInvitePreviewOpen(false); setInvitePreviewHtml(""); setAiLinkedin(""); setAiBackground(""); setAiStatus(""); setAiDrafting(false); setSavingInviteNotes(false);
    inviteFormRef.current?.reset();
  }
  function invalidateInviteNda() {
    setInviteGov((current) => clearInvitationNdaConfirmation(current));
    setInviteNdaReviewId(""); setInviteNdaMessage("");
  }
  function editInviteNda(patch: Partial<InviteGov>) {
    setInviteGov((current) => clearInvitationNdaConfirmation({ ...current, ...patch }));
    setInviteNdaReviewId(""); setInviteNdaMessage("");
  }
  async function selectInviteCandidate(id: string) {
    const generation = ++inviteNdaGeneration.current;
    setInviteCandidateId(id); setInviteNda(null); setInviteNdaReviewId(""); setInviteNdaMessage("");
    setInviteGov(freshInviteGovernance()); setInviteDraft({ ...emptyInvite }); setInvitePollId("");
    setInvitePreviewOpen(false); setInvitePreviewHtml(""); setAiLinkedin(""); setAiBackground(""); setAiStatus(""); setAiDrafting(false); setSavingInviteNotes(false);
    setInviteNdaSaving(false); setInviteNdaLoading(Boolean(id));
    if (!id) return;
    const candidate = (overview.data?.members ?? []).find((m: any) => m.id === id);
    if (candidate) {
      setInviteDraft({ ...emptyInvite, ...Object.fromEntries(Object.keys(emptyInvite).filter((key) => candidate[key] != null).map((key) => [key, candidate[key]])), intended_designation: readIntendedDesignation(candidate) });
      setAiLinkedin(candidate.linkedin_url ?? "");
    }
    try {
      if (preview) throw new Error("Open the signed-in admin page to load this candidate’s stored NDA record.");
      const detail = await getInvitationNda({ data: { member_id: id } });
      if (generation !== inviteNdaGeneration.current) return;
      setInviteNda(detail);
      setInviteDraft((current) => ({ ...current, first_name: detail.member.first_name, last_name: detail.member.last_name, email: detail.member.email, intended_designation: detail.member.intended_designation ?? current.intended_designation }));
      setInviteGov(invitationNdaFormValues(detail.member, detail.evidenceOptions));
    } catch (error) {
      if (generation === inviteNdaGeneration.current) setInviteNdaMessage(userFacingError(error, "Could not load this candidate’s NDA record."));
    } finally {
      if (generation === inviteNdaGeneration.current) setInviteNdaLoading(false);
    }
  }
  /** One-checkbox path for an existing member: records the administrator's verification with sensible defaults. */
  async function quickConfirmNda(checked: boolean) {
    if (!checked) { setInviteGov((current) => clearInvitationNdaConfirmation(current)); setInviteNdaReviewId(""); setInviteNdaMessage(""); return; }
    if (!inviteNda) return;
    const required = requiredInvitationNdaEntity({ ...(inviteNda.member as any), intended_designation: inviteDraft.intended_designation });
    const over: Partial<InviteGov> = {
      nda_reference: inviteGov.nda_reference.trim().length >= 3 ? inviteGov.nda_reference : "Signed NDA on file, confirmed by administrator",
      nda_entities: (inviteGov.nda_entities || required) as InviteGov["nda_entities"],
      nda_scope: inviteGov.nda_scope.trim().length >= 3 ? inviteGov.nda_scope : "Strategic Forum materials and discussions",
      nda_confirmed: true, nda_recipient_email: normalizedRecipient(inviteDraft.email),
    };
    setInviteGov((current) => ({ ...current, ...over }));
    await saveInviteNda(over);
  }
  async function saveInviteNda(over: Partial<InviteGov> = {}) {
    const gov = { ...inviteGov, ...over };
    if (!inviteNda || !inviteCandidateId || !gov.nda_confirmed || !gov.nda_entities) return;
    const generation = inviteNdaGeneration.current;
    setInviteNdaSaving(true); setInviteNdaMessage("");
    try {
      const result = await saveInvitationNdaVerification({ data: { member_id: inviteCandidateId, expected_updated_at: inviteNda.member.updated_at,
        reference: gov.nda_reference, entities: gov.nda_entities as "prsc" | "dis" | "both", scope: gov.nda_scope, confirmed: true } });
      if (generation !== inviteNdaGeneration.current) return;
      setInviteNda(result); setInviteNdaReviewId(result.reviewId);
      setInviteGov((current) => ({ ...current, nda_reference: result.member.nda_reference ?? "", nda_entities: result.member.nda_entities ?? "", nda_scope: result.member.nda_scope ?? "", nda_confirmed: true, nda_recipient_email: normalizedRecipient(result.member.email) }));
      setInviteNdaMessage(result.verificationPreserved ? "Review saved. The stored verification date and reviewer were retained." : "Correction and administrator verification saved to this candidate’s record.");
      void overview.refetch();
    } catch (error) {
      if (generation === inviteNdaGeneration.current) { setInviteNdaReviewId(""); setInviteNdaMessage(userFacingError(error, "Could not save the NDA review.")); }
    } finally { if (generation === inviteNdaGeneration.current) setInviteNdaSaving(false); }
  }
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [emailMode, setEmailMode] = useState<"compose" | "template">("compose");
  const isTemplateMode = emailMode === "template";
  const [composeFromId, setComposeFromId] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [demoTemplates, setDemoTemplates] = useState<EmailTemplate[] | null>(null);
  const [inviteComposeHtml, setInviteComposeHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [memberBusy, setMemberBusy] = useState("");
  const [nudging, setNudging] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [inquiryDraft, setInquiryDraft] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<StagedRow[]>([]);
  const [batchDrafting, setBatchDrafting] = useState(false);
  const [batchProgress, setBatchProgress] = useState("");
  const [rowDrafting, setRowDrafting] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState("");
  const [importResults, setImportResults] = useState<{ email: string; ok: boolean; message: string }[]>([]);
  const [sendOnImport, setSendOnImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const importGeneration = useRef(0);
  const importInFlight = useRef(false);

  async function onMemberList(file: File) {
    const generation = ++importGeneration.current;
    setImportRows([]);
    setImportErrors([]);
    setImportResults([]);
    setImportStatus("");
    setBatchDrafting(false); setBatchProgress(""); setRowDrafting("");
    if (!/\.csv$/i.test(file.name)) { setImportRows([]); setImportErrors(["Save the member list as CSV UTF-8 using the downloaded template. Excel workbooks are not imported by this uploader."]); setImportStatus("No members were staged or added."); return; }
    try {
      const text = await file.text();
      if (generation !== importGeneration.current) return;
      const { rows, errors } = parseMemberList(text);
      setImportRows(rows);
      setImportErrors(errors);
      setImportStatus(
        rows.length
          ? `${rows.length} member${rows.length === 1 ? "" : "s"} staged in this browser from ${file.name}. Review the rows, then use Add members to save them.`
          : `No usable rows found in ${file.name}.`,
      );
    } catch (error) {
      if (generation !== importGeneration.current) return;
      setImportErrors([userFacingError(error, "Could not read this file. Choose the CSV again.")]);
      setImportStatus("No members were staged or added.");
    }
  }

  function updateImportRow(i: number, patch: Partial<StagedRow>, generation = importGeneration.current, expectedEmail?: string) {
    setImportRows((rows) => generation !== importGeneration.current ? rows : rows.map((r, idx) => (idx === i && (!expectedEmail || normalizedRecipient(r.email) === normalizedRecipient(expectedEmail)) ? { ...r, ...patch } : r)));
  }

  async function draftNote(r: StagedRow) {
    const { draft: text } = await (preview ? draftWhyYouPreview : draftWhyYou)({ data: {
      first_name: r.first_name, last_name: r.last_name, organization: r.organization, title: r.title,
      entity: r.entity, role: r.role, is_candidate: r.is_candidate, intended_designation: r.intended_designation, linkedin_url: r.linkedin_url, background: r.background,
    } });
    return text;
  }

  async function draftRow(i: number) {
    const generation = importGeneration.current;
    const r = importRows[i];
    if (!r) return;
    setRowDrafting(r.email);
    try {
      const text = await draftNote(r);
      if (generation === importGeneration.current) updateImportRow(i, { why_you: text }, generation, r.email);
    } catch (err) {
      if (generation === importGeneration.current) setBatchProgress(`${r.first_name}: ${userFacingError(err, "The draft could not be created.")}`);
    } finally {
      if (generation === importGeneration.current) setRowDrafting((current) => current === r.email ? "" : current);
    }
  }

  async function draftAllNotes() {
    const generation = importGeneration.current;
    const targets = importRows.map((r, i) => ({ r, i })).filter(({ r }) => r.why_you.trim().length < 20);
    setBatchDrafting(true);
    let done = 0, failed = 0;
    try {
      for (const { r, i } of targets) {
        if (generation !== importGeneration.current) return;
        setBatchProgress(`Drafting note ${done + failed + 1} of ${targets.length} for ${r.first_name} ${r.last_name}…`);
        try {
          const text = await draftNote(r);
          if (generation !== importGeneration.current) return;
          updateImportRow(i, { why_you: text }, generation, r.email); done += 1;
        } catch (err) {
          if (generation !== importGeneration.current) return;
          failed += 1;
          if (/credits|Too many/.test((err as Error)?.message ?? "")) { setBatchProgress(userFacingError(err, "Drafting is temporarily unavailable. Please try again later.")); break; }
        }
      }
      if (generation === importGeneration.current) setBatchProgress(`${done} note${done === 1 ? "" : "s"} drafted${failed ? `, ${failed} failed — use Draft with AI to retry` : ""}. Review each before sending.`);
    } finally {
      if (generation === importGeneration.current) setBatchDrafting(false);
    }
  }

  async function runImport() {
    if (!importRows.length || importInFlight.current) return;
    const generation = importGeneration.current;
    if (preview) {
      setImportStatus("Preview mode: the list uploads once you are signed in.");
      return;
    }
    importInFlight.current = true;
    setImporting(true);
    try {
      const rows = importRows.map(({ background: _b, ...rest }) => rest);
      const res = await importPortalMembers({ data: { rows, send_invitations: sendOnImport } });
      if (generation === importGeneration.current) {
        importGeneration.current += 1;
        setImportResults(res.results);
        setImportStatus(`${res.added} added${res.failed ? `, ${res.failed} could not be added` : ""}.`);
        setImportRows([]);
        setBatchDrafting(false); setBatchProgress(""); setRowDrafting("");
        if (listRef.current) listRef.current.value = "";
      }
      await overview.refetch();
    } catch (error) {
      if (generation === importGeneration.current) setImportStatus(userFacingError(error, "The list could not be uploaded."));
    } finally {
      importInFlight.current = false;
      setImporting(false);
    }
  }

  function clearImport() {
    importGeneration.current += 1;
    setImportRows([]);
    setImportErrors([]);
    setImportResults([]);
    setImportStatus("");
    setBatchDrafting(false); setBatchProgress(""); setRowDrafting("");
    if (listRef.current) listRef.current.value = "";
  }

  const detail = useQuery({
    queryKey: ["portal-admin-member", detailId, preview],
    enabled: Boolean(detailId),
    retry: false,
    queryFn: () => {
      if (!detailId) throw new Error("Select a member to view their profile.");
      return preview ? Promise.resolve(demoMemberDetail) : getMemberDetail({ data: { member_id: detailId } });
    },
  });

  async function changeAccess(id: string, status: "active" | "revoked") {
    if (preview) return setMemberBusy("Preview mode: access changes are available once you are signed in.");
    try {
      await setMemberAccess({ data: { member_id: id, status } });
      setMemberBusy(status === "revoked" ? "Access revoked." : "Access restored.");
      await overview.refetch();
    } catch (error) {
      setMemberBusy(userFacingError(error, "Could not update access."));
    }
  }

  async function changePackage(id: string, value: string) {
    if (preview) return setMemberBusy("Preview mode: package changes are available once you are signed in.");
    try {
      await setMemberPackageStatus({ data: { member_id: id, package_status: value as any } });
      setMemberBusy("Package status updated.");
      await overview.refetch();
    } catch (error) {
      setMemberBusy(userFacingError(error, "Could not update the package status."));
    }
  }

  async function purgeMember(m: { id: string; email: string; first_name?: string; last_name?: string }) {
    if (preview) return setMemberBusy("Preview mode: permanent deletion is available once you are signed in.");
    const typed = window.prompt(`Permanently delete ${[m.first_name, m.last_name].filter(Boolean).join(" ")} (${m.email})?\n\nTheir account, profile, documents, answers and email history are erased. A private snapshot is kept. This cannot be undone.\n\nType their email address to confirm:`);
    if (typed === null) return;
    try {
      let acknowledge = false;
      try {
        await purgePortalMember({ data: { member_id: m.id, confirm_email: typed } });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const found = /SIGNED_RECORDS:(\d+)/.exec(msg);
        if (!found) throw error;
        if (!window.confirm(`This member has ${found[1]} completed signed record${found[1] === "1" ? "" : "s"}. Deleting them removes those records from the portal (the signed PDF files stay in storage, and a snapshot is kept). Delete anyway?`)) return;
        acknowledge = true;
        await purgePortalMember({ data: { member_id: m.id, confirm_email: typed, acknowledge_signed_records: true } });
      }
      void acknowledge;
      if (detailId === m.id) setDetailId(null);
      setSelectedMemberIds((c) => c.filter((x) => x !== m.id));
      setMemberBusy("Member permanently deleted. A private snapshot was kept.");
      await Promise.all([overview.refetch(), email.refetch()]);
    } catch (error) {
      setMemberBusy(userFacingError(error, "Could not delete the member."));
    }
  }

  async function removeSelectedMembers() {
    if (selectedMemberIds.length === 0) return;
    if (!window.confirm(`Revoke access for ${selectedMemberIds.length} selected member${selectedMemberIds.length === 1 ? "" : "s"}? Documents, signatures and history will be retained.`)) return;
    if (preview) return setMemberBusy("Preview mode: member deletion is available once you are signed in.");
    try {
      for (const memberId of selectedMemberIds) {
        await deletePortalMember({ data: { member_id: memberId } });
      }
      setRecipients((current) => current.filter((memberId) => !selectedMemberIds.includes(memberId)));
      if (detailId && selectedMemberIds.includes(detailId)) setDetailId(null);
      setSelectedMemberIds([]);
      setSelectedEmailIds([]);
      setMemberBusy(`${selectedMemberIds.length} selected member${selectedMemberIds.length === 1 ? " was" : "s were"} revoked; records retained.`);
      await Promise.all([overview.refetch(), email.refetch()]);
    } catch (error) {
      setMemberBusy(userFacingError(error, "Could not delete the selected members."));
    }
  }

  async function removeSelectedEmailHistory() {
    if (selectedEmailIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedEmailIds.length} selected email record${selectedEmailIds.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    if (preview) return setMemberBusy("Preview mode: email-history deletion is available once you are signed in.");
    try {
      const count = selectedEmailIds.length;
      await deleteEmailHistory({ data: { send_ids: selectedEmailIds } });
      setSelectedEmailIds([]);
      setMemberBusy(`${count} selected email record${count === 1 ? " was" : "s were"} deleted.`);
      await email.refetch();
    } catch (error) {
      setMemberBusy(userFacingError(error, "Could not delete the selected email records."));
    }
  }

  async function saveInquiry(id: string, status: "open" | "resolved", notes: string) {
    if (preview) return setMemberBusy("Preview mode: inquiry updates are available once you are signed in.");
    try {
      await updateInquiry({ data: { id, status, admin_notes: notes } });
      setMemberBusy(status === "resolved" ? "Inquiry marked resolved." : "Inquiry reopened.");
      await overview.refetch();
    } catch (error) {
      setMemberBusy(userFacingError(error, "Could not update the inquiry."));
    }
  }

  const members: any[] = overview.data?.members ?? [];
  const templates: EmailTemplate[] = (preview && demoTemplates) || email.data?.templates || [];
  const inviteTemplate = templates.find((t) => t.system_key === "invite") ?? null;
  const editingInvite = !!inviteTemplate && draft.id === inviteTemplate.id;
  const sends: EmailSend[] = email.data?.sends ?? [];

  const sendsByMember = useMemo(() => {
    const map = new Map<string, EmailSend[]>();
    for (const s of sends) {
      const list = map.get(s.member_id) ?? [];
      list.push(s);
      map.set(s.member_id, list);
    }
    return map;
  }, [sends]);

  const notifications: PortalNotification[] = useMemo(() => {
    const items: PortalNotification[] = [];
    for (const q of overview.data?.inquiries ?? []) {
      if (q.status === "open") {
        const m = members.find((x) => x.id === q.member_id);
        items.push({
          id: `inq-${q.id}`,
          label: `New question${m ? ` from ${m.first_name} ${m.last_name}` : ""}`,
          detail: q.subject,
          href: "/admin#inquiries",
        });
      }
    }
    for (const m of members) {
      if (m.package_status === "awaiting_profile") {
        items.push({
          id: `prof-${m.id}`,
          label: `${m.first_name} ${m.last_name} has not completed a profile`,
          detail: (sendsByMember.get(m.id)?.length ?? 0) === 0 ? "No email sent yet — send a prompt" : "Send a reminder",
          href: "/admin/send#email-center",
        });
      }
      if (m.package_status === "profile_received") {
        items.push({
          id: `pkg-${m.id}`,
          label: `${m.first_name} ${m.last_name} submitted a profile`,
          detail: "Package preparation can begin",
          href: "/admin#tracker",
        });
      }
    }
    for (const s of sends) {
      if (s.status !== "sent") {
        const m = members.find((x) => x.id === s.member_id);
        items.unshift({
          id: `fail-${s.id}`,
          label: `Email failed to ${m ? `${m.first_name} ${m.last_name}` : s.recipient_email}`,
          detail: `“${s.template_name}” was not delivered — resend required`,
          href: "/admin#tracker",
        });
      }
    }
    return items;
  }, [overview.data, members, sends, sendsByMember]);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const generation = inviteNdaGeneration.current;
    if (preview) {
      setStatus("Preview mode: invitation validated but not sent. Invites send on the live admin page.");
      return;
    }
    try {
      intendedDesignationSchema.parse(inviteIntended);
      const needsReview = !inviteDraft.is_candidate && roleCombinationTier(inviteDraft.entity, inviteDraft.role, inviteDraft.is_methodology_committee ?? false).tier === "review";
      if (inviteCandidateId && (!inviteNdaReviewId || !inviteGov.nda_confirmed || inviteNdaLoading || inviteNdaSaving)) throw new Error("Review and save this candidate’s NDA verification before proceeding.");
      await invitePortalMember({ data: { ...inviteDraft, linkedin_url: aiLinkedin || null, poll_id: invitePollId || null,
        selected_member_id: inviteCandidateId || undefined, nda_review_id: inviteCandidateId ? inviteNdaReviewId : undefined,
        nda_confirmed: inviteGov.nda_confirmed, nda_recipient_email: inviteGov.nda_recipient_email, nda_reference: inviteGov.nda_reference, nda_entities: inviteGov.nda_entities || undefined, nda_scope: inviteGov.nda_scope,
        role_review: needsReview ? { decision: "approved", notes: inviteGov.review_notes, prsc_scope: inviteGov.prsc_scope, dis_scope: inviteGov.dis_scope, conflict_controls: inviteGov.conflict_controls } : undefined } });
      void polls.refetch();
      if (generation !== inviteNdaGeneration.current) { void overview.refetch(); return; }
      setStatus(invitePollId ? "Invitation sent with the meeting dates attached." : "Invitation sent.");
      setInvitePollId("");
      resetInvitation();
      await overview.refetch();
    } catch (error) {
      if (generation === inviteNdaGeneration.current) setStatus(userFacingError(error, "Invitation failed."));
    }
  }

  async function saveWithoutInviting() {
    const d0 = inviteDraft as any;
    if (!d0.first_name?.trim() || !d0.last_name?.trim() || !/^\S+@\S+\.\S+$/.test(d0.email?.trim() ?? "")) return setStatus("Enter a first name, last name and valid email to save to the member list.");
    if (preview) return setStatus("Preview mode: saving to the roster works on the live admin page.");
    try {
      intendedDesignationSchema.parse(inviteIntended);
      const d = inviteDraft as any;
      const res = await importPortalMembers({ data: { send_invitations: false, rows: [{
        email: d.email, first_name: d.first_name, last_name: d.last_name, organization: d.organization ?? "", title: d.title ?? "",
        entity: d.entity, role: d.role, why_you: d.why_you ?? "", linkedin_url: aiLinkedin || null,
        is_methodology_committee: d.is_methodology_committee, participates_in_forum: d.participates_in_forum, is_candidate: d.is_candidate,
        intended_designation: d.intended_designation ?? inviteIntended,
      }] } });
      const r = res.results[0];
      if (!r?.ok) throw new Error(r?.message ?? "Could not be saved");
      setStatus("Saved to the member list. No invitation was sent.");
      resetInvitation();
      await overview.refetch();
    } catch (error) {
      setStatus(userFacingError(error, "The member could not be saved."));
    }
  }

  async function openInvitePreview() {
    const form = inviteFormRef.current;
    if (!form?.reportValidity()) return;
    const generation = inviteNdaGeneration.current;
    setStatus("");
    try {
      const html = await render(
        <InviteEmail
          confirmationUrl={INVITE_EMAIL_PREVIEW_URL}
          firstName={inviteDraft.first_name}
          recipientEmail={inviteDraft.email}
          entity={inviteDraft.entity}
          roleLabel={memberCandidateLabel(inviteDraft.role, inviteDraft.entity, !!inviteDraft.is_candidate)}
          copy={inviteTemplate}
          meetingBlock={invitePollBlock}
          whyYou={inviteDraft.why_you}
        />,
      );
      if (generation !== inviteNdaGeneration.current) return;
      setInvitePreviewHtml(html);
      setInvitePreviewOpen(true);
    } catch {
      if (generation === inviteNdaGeneration.current) setStatus("The invitation preview could not be prepared.");
    }
  }


  async function onUpload(file: File) {
    const text = await file.text();
    const stripped = /\.html?$/i.test(file.name)
      ? text
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      : text.trim();
    if (emailMode === "template") {
      const name = file.name.replace(/\.[^.]+$/, "");
      setDraft({ ...emptyDraft, name, subject: name, body: stripped });
      setEmailStatus(`Loaded ${file.name} as a new template. Review it, then Save to template library.`);
      return;
    }
    setDraft((d) => ({ ...d, body: stripped }));
    setEmailStatus(`Loaded text from ${file.name}. Review it before sending.`);
  }

  async function saveDraft() {
    if (!draft.name.trim() || !draft.subject.trim() || !draft.body.trim()) {
      setEmailStatus("A template needs a name, subject line, and content.");
      return;
    }
    if (preview) {
      const now = new Date().toISOString();
      const id = draft.id || crypto.randomUUID();
      const base = templates.find((t) => t.id === id);
      const next: EmailTemplate = { ...(base ?? { created_at: now, system_key: null }), ...draft, id, updated_at: now } as EmailTemplate;
      setDemoTemplates(base ? templates.map((t) => (t.id === id ? next : t)) : [...templates, next]);
      setDraft((d) => ({ ...d, id }));
      setEmailStatus(`“${draft.name}” saved (preview only — changes save permanently on the live admin page).`);
      setPreviewOpen(false);
      return;
    }
    try {
      const res = await saveEmailTemplate({ data: { ...draft, id: draft.id || undefined } });
      setDraft((d) => ({ ...d, id: res.id }));
      setEmailStatus(`“${draft.name}” saved.`);
      setPreviewOpen(false);
      await email.refetch();
    } catch (error) {
      const message = userFacingError(error, "Could not save the template.");
      setEmailStatus(message);

    }
  }

  async function resetDraft() {
    if (!draft.id) return;
    if (!confirm("Restore the original wording for this automatic email?")) return;
    if (preview) { setEmailStatus("Preview mode: resetting works on the live admin page."); return; }
    try {
      const { template } = await resetEmailTemplate({ data: { id: draft.id } });
      setDraft((d) => ({ ...d, ...template }));
      setEmailStatus("Original wording restored.");
      await email.refetch();
    } catch (error) {
      setEmailStatus(userFacingError(error, "Could not reset the template."));
    }
  }

  async function removeTemplate(id: string) {
    if (preview) return;
    try {
      await deleteEmailTemplate({ data: { id } });
      if (draft.id === id) setDraft(emptyDraft);
      await email.refetch();
    } catch (error) {
      setEmailStatus(userFacingError(error, "Could not remove the template."));
    }
  }

  const [testTo, setTestTo] = useState("");
  const [inviteTestTo, setInviteTestTo] = useState("");
  const [inviteTestStatus, setInviteTestStatus] = useState("");
  async function sendInviteTest() {
    const to = inviteTestTo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return setInviteTestStatus("Enter a valid email address.");
    if (preview) return setInviteTestStatus("Preview mode: sending is available once you are signed in.");
    if (!confirm(`Send a test copy of this invitation to ${to} only? The button in it is inactive and the subject starts with [TEST].`)) return;
    setInviteTestStatus("Sending…");
    try {
      await sendTestInvitation({ data: { to, subject: INVITE_EMAIL_SUBJECT, html: invitePreviewHtml } });
      setInviteTestStatus(`Test sent to ${to}.`);
    } catch (error) {
      setInviteTestStatus(userFacingError(error, "The test could not be sent."));
    }
  }

  const [recipientFilter, setRecipientFilter] = useState("");
  async function sendTest() {
    const to = testTo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return setEmailStatus("Enter a valid email address for the test.");
    if (!draft.subject.trim() || !draft.body.trim()) return setEmailStatus("Add a subject line and content before sending a test.");
    if (preview) return setEmailStatus("Preview mode: sending is available once you are signed in.");
    if (editingInvite) {
      // The invitation is its own full-design email, not the plain layout: send exactly what the preview shows.
      if (!inviteComposeHtml) return setEmailStatus("The invitation preview is still loading. Try again in a moment.");
      if (!confirm(`Send a test of the full invitation to ${to} only? It shows the preview member's details, the button is inactive, and the subject is “${INVITE_EMAIL_SUBJECT}” with [TEST] in front.`)) return;
      setSending(true);
      try {
        await sendTestInvitation({ data: { to, subject: INVITE_EMAIL_SUBJECT, html: inviteComposeHtml } });
        setEmailStatus(`Test invitation sent to ${to}.`);
      } catch (error) {
        setEmailStatus(userFacingError(error, "The test could not be sent."));
      } finally {
        setSending(false);
      }
      return;
    }
    if (!confirm(`Send a test of "${draft.subject}" to ${to} only? Merge fields use sample values and the subject starts with [TEST].`)) return;
    setSending(true);
    try {
      await sendTestEmail({ data: { to, subject: draft.subject, eyebrow: draft.eyebrow, heading: draft.heading, body: draft.body, cta_label: draft.cta_label, cta_url: draft.cta_url, cta_subtext: draft.cta_subtext, signatures: draft.signatures } });
      setEmailStatus(`Test sent to ${to}.`);
    } catch (error) {
      setEmailStatus(userFacingError(error, "The test could not be sent."));
    } finally {
      setSending(false);
    }
  }

  async function send() {
    if (recipients.length === 0) {
      setEmailStatus("Select at least one recipient.");
      return;
    }
    if (!draft.subject.trim() || !draft.body.trim()) {
      setEmailStatus("Add a subject line and content before sending.");
      return;
    }
    if (preview) {
      setEmailStatus("Preview mode: sending is available once you are signed in.");
      return;
    }
    const names = members.filter((m) => recipients.includes(m.id)).map((m) => `${m.first_name} ${m.last_name} <${m.email}>`);
    if (!confirm(`Send "${draft.subject}" to ${names.length} member${names.length === 1 ? "" : "s"}?\n\n${names.slice(0, 8).join("\n")}${names.length > 8 ? `\n…and ${names.length - 8} more` : ""}`)) return;
    setSending(true);
    try {
      const res = await sendMemberEmail({
        data: {
          template_id: composeFromId || null,
          member_ids: recipients,
          name: draft.name || draft.subject,
          subject: draft.subject,
          eyebrow: draft.eyebrow,
          heading: draft.heading,
          body: draft.body,
          cta_label: draft.cta_label,
          cta_url: draft.cta_url,
          cta_subtext: draft.cta_subtext,
          signatures: draft.signatures,
          poll_id: composePollId || null,
        },
      });
      setComposePollId("");
      void polls.refetch();
      const failed = res.results.filter((r) => r.status !== "sent").length;
      setEmailStatus(failed ? `${res.results.length - failed} sent, ${failed} failed.` : `Sent to ${res.results.length} member(s).`);
      setRecipients([]);
      setDraft(emptyDraft);
      setComposeFromId("");
      await email.refetch();
    } catch (error) {
      setEmailStatus(userFacingError(error, "Sending failed."));
    } finally {
      setSending(false);
    }
  }

  // Choosing someone in "Invite a member" makes the live preview show that person.
  useEffect(() => { if (inviteCandidateId) setPreviewAsId(inviteCandidateId); }, [inviteCandidateId]);
  const previewMember = members.find((m) => m.id === previewAsId) ?? members.find((m) => m.id === recipients[0]) ?? members[0];
  const tokens = previewMember ? buildMemberTokens(previewMember) : {};
  useEffect(() => {
    if (!editingInvite) return;
    let alive = true;
    const m = previewMember;
    const entity = (["prsc", "dis", "both"].includes(m?.entity) ? m.entity : "both") as "prsc" | "dis" | "both";
    render(
      <InviteEmail
        confirmationUrl={INVITE_EMAIL_PREVIEW_URL}
        firstName={m?.first_name ?? "Shirley"}
        recipientEmail={m?.email ?? "member@example.com"}
        entity={entity}
        roleLabel={memberCandidateLabel(m?.role ?? "advisor", entity, !!m?.is_candidate)}
        copy={draft}
        meetingBlock={composePollBlock}
        whyYou={m?.why_you}
      />,
    ).then((html) => alive && setInviteComposeHtml(html));
    return () => {
      alive = false;
    };
  }, [editingInvite, draft, previewMember, composePollBlock]);

  const previewHtml = editingInvite && inviteComposeHtml ? inviteComposeHtml : renderBrandedEmail({
    subject: applyTokens(draft.subject || "Subject line", tokens),
    eyebrow: applyTokens(draft.eyebrow, tokens),
    heading: applyTokens(draft.heading, tokens),
    body: applyTokens(draft.body || "Your email content will appear here.", tokens),
    ctaLabel: draft.cta_label || null,
    // Automatic emails (e.g. the invitation) carry a per-recipient link, so the
    // stored URL is empty; the preview shows the button with the portal address.
    ctaUrl: draft.cta_url || (draft.cta_label ? "https://access.prscstandards.org/portal" : null),
    ctaSubtext: applyTokens(draft.cta_subtext, tokens) || null,
    signatures: parseSignatures(draft.signatures),
  });

  if (overview.isLoading)
    return (
      <PortalShell admin>
        <div className="p-20 text-center text-gold">Opening administrator center…</div>
      </PortalShell>
    );
  if (overview.error || !overview.data)
    return (
      <PortalShell admin>
        <div className="p-20 text-center">
          <h1 className="font-display text-4xl">Administrator access required</h1>
        </div>
      </PortalShell>
    );

  const d = overview.data;
  const profilesById = new Map<string, any>(((d as any).profiles ?? []).map((p: any) => [p.member_id, p]));
  const docProgress: Record<string, { total: number; done: number }> = (d as any).docProgress ?? {};
  const journeys: Record<string, JourneyStatus> = d.journeys ?? {};
  const stageOf = (m: any) => {
    const p = profilesById.get(m.id);
    const prog = docProgress[m.id];
    if (m.status === "revoked") return { key: "revoked", label: "Access revoked", detail: "", tone: "border-red-400/35 text-red-300/85", nudge: false, progress: 0 };
    if (!m.first_access_at && !p) {
      // A saved roster entry is stored as "invited" before anything is sent; only show "Invited" once an invitation really went out.
      const sentCount = (sendsByMember.get(m.id) ?? []).filter((s) => s.status === "sent" && isInvitationEmailName(s.template_name)).length;
      if (m.invitation_known && !invitationWasSent({ auth_invited_at: m.auth_invited_at, emails_sent: sentCount })) {
        return { key: "not_invited", label: NOT_INVITED_LABEL, detail: NOT_INVITED_DETAIL, tone: "border-gold/30 text-gold/80", nudge: false, progress: 0 };
      }
      return { key: "invited", label: "Invited", detail: "Hasn't signed in yet", tone: "border-ivory/25 text-ivory/70", nudge: true, progress: 0 };
    }
    if (!p?.submitted_at) return { key: "in_progress", label: "Profile in progress", detail: p ? `Step ${Math.min(p.current_stage ?? 1, 4)} of 4` : "Not started", tone: "border-gold/40 text-gold", nudge: true, progress: p ? Math.round((Math.min(p.current_stage ?? 1, 4) / 4) * 100) : 0 };
    if (!m.documents_released_at) return { key: "submitted", label: "Profile submitted", detail: "Ready for documents", tone: "border-gold/60 text-gold", nudge: false, progress: 0 };
    if (m.documents_completed_at) return { key: "complete", label: "Complete", detail: prog ? `${prog.done} of ${prog.total} documents` : "", tone: "border-gold bg-gold/15 text-gold", nudge: false, progress: 100 };
    return { key: "documents", label: "Documents open", detail: prog ? `${prog.done} of ${prog.total} complete` : "Released", tone: "border-gold/40 text-gold", nudge: true, progress: prog && prog.total ? Math.round((prog.done / prog.total) * 100) : 0 };
  };
  const q = memberSearch.trim().toLowerCase();
  const filteredMembers = d.members.filter((m: any) => {
    if (filterEntity && m.entity !== filterEntity) return false;
    if (filterRole) {
      const roles = m.role === "prsc_board_dis_advisor" || m.role === "prsc_advisor_dis_board" ? ["board_member", "advisor"] : [m.role];
      if (!roles.includes(filterRole)) return false;
    }
    if (filterStage && stageOf(m).key !== filterStage) return false;
    if (q && ![m.first_name, m.last_name, m.email, m.organization].join(" ").toLowerCase().includes(q)) return false;
    return true;
  });
  const nudge = async (m: any) => {
    if (preview) { setMemberBusy("Preview mode: Nudge now sends from the live admin page."); return; }
    if (!confirm(`Send ${m.first_name} ${m.last_name} a reminder email now?`)) return;
    setNudging(m.id);
    try {
      const r = await nudgeMember({ data: { member_id: m.id } });
      setMemberBusy(`Reminder sent to ${m.first_name} (${r.kind}).`);
      await overview.refetch();
    } catch (err) {
      setMemberBusy(userFacingError(err, "The reminder could not be sent."));
    } finally { setNudging(""); }
  };
  const exportCsv = () => {
    const esc = csvCell;
    const date = (v: string | null | undefined) => (v ? new Date(v).toISOString().slice(0, 10) : "");
    const header = ["First name", "Last name", "Email", "Organization", "Title", "Company", "Role", "Access", "Stage", "Invited", "Last sign-in", "Profile submitted", "Documents done", "Documents total", "Documents completed",
      "Preferred name", "Professional role", "Current organization", "Preferred email", "Preferred phone", "Short bio",
      ...FIT_EXPORT_LABELS.map((label) => `Where You Fit — ${label}`),
      ...COMMUNICATION_EXPORT_LABELS.map((label) => `Profile & communication preferences — ${label}`),
      ...LEGACY_PORTAL_EXPERIENCE_QUESTIONS.map((label) => `Previous experience response — ${label}`),
      ...LEGACY_PORTAL_VISIBILITY_PERMISSIONS.map((label) => `Previous visibility permission — ${label}`),
      "Previous restrictions", "Previous restriction details", "Final notes", "Questions", "Contact requested"];
    const rows = filteredMembers.map((m: any) => {
      const p = profilesById.get(m.id) ?? {};
      const prog = docProgress[m.id];
      const ans = p.experience_answers ?? {};
      const vis = p.visibility_instructions ?? {};
      const fitValues = new Map(hasFitAnswers(ans) ? fitReadoutRows(ans).map(({ label, value }) => [label, value]) : []);
      const communicationValues = new Map(hasCommunicationPreferences(vis) ? communicationReadoutRows(vis).map(({ label, value }) => [label, value]) : []);
      return [m.first_name, m.last_name, m.email, m.organization, m.title, m.is_candidate ? "None" : String(m.entity).toUpperCase(), memberDesignation(m as any), m.status, stageOf(m).label,
        date(m.invited_at), date(m.last_access_at), date(p.submitted_at), prog?.done ?? "", prog?.total ?? "", date(m.documents_completed_at),
        p.preferred_name, p.professional_role, p.current_organization, p.preferred_email, p.preferred_phone, p.bio,
        ...FIT_EXPORT_LABELS.map((label) => fitValues.get(label) ?? ""),
        ...COMMUNICATION_EXPORT_LABELS.map((label) => communicationValues.get(label) ?? ""),
        ...LEGACY_PORTAL_EXPERIENCE_QUESTIONS.map((_, i) => ans[`q${i + 1}`] ?? ""),
        ...LEGACY_PORTAL_VISIBILITY_PERMISSIONS.map((_, i) => PORTAL_PERMISSION_LABELS[vis[`p${i + 1}`]] ?? ""),
        p.restriction_status, p.restriction_details, p.final_notes, p.questions, p.contact_requested ? "Yes" : "No"].map(esc).join(",");
    });
    const blob = new Blob(["\ufeff" + [header.map(esc).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Members", value: d.members.length, icon: Users, note: "Total members", href: "#tracker", to: "/admin", hash: "tracker" },
    { label: "Open inquiries", value: d.inquiries.filter((x: any) => x.status === "open").length, icon: MessageSquare, note: "New inquiries", href: "/admin#inquiries", to: "/admin", hash: "inquiries" },
    { label: "Communications", value: templates.length, icon: Mail, note: "Saved templates", href: "#email-compose", to: "/admin/send", hash: "email-compose" },
    { label: "Recent events", value: d.activity.length, icon: CalendarDays, note: "Recent activity", href: "/admin#activity-log", to: "/admin", hash: "activity-log" },
  ];

  // Left-bar links open the matching card (or email mode) and scroll to it.
  useAdminTarget(["tracker"], () => setMembersCollapsed(false));
  useAdminTarget(["invite"], () => setInviteCollapsed(false));
  useAdminTarget(["sent-log"], () => setSentLogOpen(true));
  useAdminTarget(["email-compose"], () => { setEmailMode("compose"); setDraft(emptyDraft); setComposeFromId(""); setEmailStatus(""); });
  useAdminTarget(["email-templates"], () => { setEmailMode("template"); setDraft(emptyDraft); setComposeFromId(""); setEmailStatus("Open Saved email templates to pick one, upload one, or start a new one."); });
  useAdminTarget(["new-template"], () => { setEmailMode("template"); setDraft(emptyDraft); setComposeFromId(""); setEmailStatus("Starting a new template. Give it a name, subject and wording below."); });

  const importConfirmBar = importRows.length > 0 ? (
    <div className="mt-6 border border-gold/40 bg-gold/5 p-4">
      <p className="text-base text-ivory">
        {importRows.length} member{importRows.length === 1 ? "" : "s"} staged in this browser. <span className="text-gold">Nothing is saved until you click {sendOnImport ? "Add & invite" : "Add"}.</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2.5 text-base text-ivory/75">
                    <input
                      type="checkbox"
                      checked={sendOnImport}
                      onChange={(e) => setSendOnImport(e.target.checked)}
                      className="h-4 w-4 accent-[hsl(var(--gold))]"
                    />
                    Send welcome invitations now
                  </label>
                  <Button type="button" disabled={importing || batchDrafting || (sendOnImport && importRows.some((r) => r.why_you.trim().length < 20))} className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={runImport}>
                    {importing ? "Uploading…" : `${sendOnImport ? "Add & invite" : "Add"} ${importRows.length} member${importRows.length === 1 ? "" : "s"}`}
                  </Button>
                  <Button type="button" variant="ghost" disabled={importing} className="rounded-none text-base text-ivory/60" onClick={clearImport}>
                    <Trash2 className="mr-2 h-4 w-4" /> Discard
                  </Button>
                </div>
    </div>
  ) : null;

  return (
    <>
    <PortalShell
      admin
      notifications={notifications}
      stats={statCards.map(({ label, value, icon, to, hash }) => ({ label, value, icon, to, hash }))}
      sidebar={<AdminSidebar page={page} />}
    >
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative -mx-4 -mt-10 overflow-hidden border-b border-gold/20 px-4 pb-6 pt-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <img src={heroRoad} alt="" aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[60%] object-cover opacity-80 md:block [mask-image:linear-gradient(90deg,transparent,black_35%)]" />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold">Administration</p>
              <h1 className="mt-2 font-display text-5xl sm:text-6xl">Private center</h1>
              <p className="mt-2 font-display text-lg text-ivory/70 sm:text-xl">
                {page === "overview" ? "Manage your members, meetings, and communications in one place." : "Member access, communications, and inquiries."}
              </p>
            </div>
            <div className="hidden text-right md:block">
              <p className="max-w-[12rem] text-left text-xs uppercase leading-6 tracking-[0.32em] text-ivory/90">A higher standard for a stronger industry.</p>
              <span className="mt-3 block h-[2px] w-14 bg-gold" />
            </div>
          </div>
        </div>
        <div className={`mt-6 grid gap-5 ${page === "overview" ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : "grid-cols-1"}`}>
          {page === "send" && <div className="order-2"><AdminForumInvitationBatch members={members} preview={preview} onSaved={() => { void overview.refetch(); void email.refetch(); }} /></div>}
          {page === "send" && <div className="order-5"><AdminSentLog sends={sends} members={members} open={sentLogOpen} onOpenChange={setSentLogOpen} /></div>}
          <div className="contents">
            <section className={`${S("send",1)} admin-card p-6 sm:p-8 ${inviteCollapsed ? "[&>*:not(:first-child)]:hidden" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => { resetInvitation(); setInviteCollapsed(!inviteCollapsed); }} aria-expanded={!inviteCollapsed} className="flex items-center gap-3 text-left">
                  <MailPlus className="h-7 w-7 text-gold" />
                  <h2 id="invite" className="scroll-mt-20 font-display text-3xl">Invite a member</h2>
                  {inviteCollapsed && <span className="text-sm text-ivory/50">Click to expand</span>}
                  {inviteCollapsed ? <ChevronDown className="h-5 w-5 text-gold" /> : <ChevronUp className="h-5 w-5 text-gold" />}
                </button>
                <InfoTip
                  title="Invite a member"
                  body="Forum Invitees can enter the Forum journey with entity None. Prepare and review their private Why You note and recipient-specific NDA before sending. PRSC/DIS role choices can be recorded later."
                />
              </div>
              <form ref={inviteFormRef} onSubmit={invite} className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="border border-gold/40 bg-gold/[.06] p-4 sm:col-span-2" data-testid="invite-email-name">
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">Email that will be sent</p>
                  <p className="mt-1 text-base text-ivory">{SYSTEM_EMAIL_DEFAULTS.invite.name.replace(/ \(sent automatically\)$/, "")}</p>
                  <p className="mt-1 text-sm text-ivory/60">Subject: {INVITE_EMAIL_SUBJECT}</p>
                  <p className="mt-1 text-sm text-ivory/50">Goes only to the person chosen below, when you press Send invitation. Use Preview invitation at the bottom to see it first.</p>
                </div>
                <label className="text-base text-ivory/80 sm:col-span-2">Existing candidate / member
                  <select value={inviteCandidateId} onChange={(event) => void selectInviteCandidate(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-navy px-3 text-base">
                    <option value="">Choose an existing individual, or enter a new recipient below…</option>
                    {members.filter((m) => m.status !== "revoked").map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} · {m.email}</option>)}
                  </select>
                </label>
                <Input name="first_name" aria-label="First name" readOnly={Boolean(inviteCandidateId)} value={inviteDraft.first_name} onChange={(e) => { invalidateInviteNda(); setInviteDraft({ ...inviteDraft, first_name: e.target.value }); }} placeholder="First name" required className="text-base" />
                <Input name="last_name" aria-label="Last name" readOnly={Boolean(inviteCandidateId)} value={inviteDraft.last_name} onChange={(e) => { invalidateInviteNda(); setInviteDraft({ ...inviteDraft, last_name: e.target.value }); }} placeholder="Last name" required className="text-base" />
                <Input name="email" aria-label="Invitation email" readOnly={Boolean(inviteCandidateId)} type="email" value={inviteDraft.email} onChange={(e) => { if (normalizedRecipient(e.target.value) !== normalizedRecipient(inviteDraft.email)) { setInviteGov(freshInviteGovernance()); setInvitePreviewHtml(""); setInvitePreviewOpen(false); } setInviteDraft({ ...inviteDraft, email: e.target.value }); }} placeholder="Email" required className="text-base" />
                {inviteCandidateId && <p className="text-sm text-ivory/55 sm:col-span-2">Name and email come from the selected record. Use Edit member details if they need correction.</p>}
                <p className="text-sm uppercase tracking-[0.16em] text-gold/80 sm:col-span-2">Current position <span className="normal-case tracking-normal text-ivory/45">— optional</span></p>
                <Input name="organization" value={inviteDraft.organization} onChange={(e) => setInviteDraft({ ...inviteDraft, organization: e.target.value })} placeholder="Current company / organization (optional)" aria-label="Current company or organization (optional)" className="text-base" />
                <Input name="title" value={inviteDraft.title} onChange={(e) => setInviteDraft({ ...inviteDraft, title: e.target.value })} placeholder="Current professional title (optional)" aria-label="Current professional title (optional)" className="text-base" />
                <div className="border border-gold/30 p-4 sm:col-span-2">
                  <IntendedDesignationFields value={inviteIntended} disabled={Boolean(inviteCandidateId) || inviteNdaLoading || inviteNdaSaving} onChange={(value) => {
                    invalidateInviteNda();
                    const parsed = intendedDesignationSchema.safeParse(value);
                    const projection = parsed.success ? projectIntendedDesignation(parsed.data) : null;
                    setInviteDraft((current) => ({ ...current, ...(projection ? { entity: projection.entity, role: projection.role, is_candidate: projection.is_candidate, is_methodology_committee: projection.is_methodology_committee } : {}), intended_designation: value }));
                  }} />
                  {inviteCandidateId && <p className="mt-3 text-sm text-ivory/60">Use Edit intended designation in the member record to change these selections, then reload this recipient’s details.</p>}
                </div>
                {(() => {
                  const dup = members.find((m) => m.email?.toLowerCase() === inviteDraft.email.trim().toLowerCase());
                  return !inviteCandidateId && dup && inviteDraft.email.trim() ? (
                    <p className="border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 sm:col-span-2">
                      {dup.first_name} {dup.last_name} is already a member with this email. Select this existing member before proceeding so their saved identity, NDA and appointment history are retained.
                    </p>
                  ) : null;
                })()}
                {!inviteDraft.is_candidate && (
                <label className="flex cursor-pointer items-center gap-3 border border-gold/20 px-4 py-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={inviteDraft.participates_in_forum ?? true}
                    disabled={inviteNdaLoading || inviteNdaSaving} onChange={(e) => { invalidateInviteNda(); setInviteDraft({ ...inviteDraft, participates_in_forum: e.target.checked }); }}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  <span className="text-base text-ivory/85">Participates in Readiness Vanguard Forum <span className="text-ivory/45">— uncheck to skip Stage 1 and use a 4-stage journey</span></span>
                </label>
                )}
                <div className="grid gap-3 border border-gold/30 p-4 sm:col-span-2 sm:grid-cols-3">
                  <span className="text-base font-medium text-ivory/90 sm:col-span-3">NDA verification (required before inviting)</span>
                  {inviteCandidateId && <div className="text-sm text-ivory/65 sm:col-span-3" aria-live="polite">
                    <p className="text-gold">{inviteNdaLoading ? "Loading this candidate’s NDA…" : inviteNdaReviewId && !inviteNda?.eligibilityProblem ? "Administrator review saved" : "Needs Verification"}</p>
                    {inviteNda?.member.nda_verified_at && <p>Stored verification: {new Date(inviteNda.member.nda_verified_at).toLocaleString()} · Reviewer: {inviteNda.member.nda_verified_by || "Not recorded"}</p>}
                    {inviteNda?.eligibilityProblem && <p>{inviteNda.eligibilityProblem}</p>}
                    {inviteNda && !inviteNda.member.nda_verified_at && !inviteNda.evidenceOptions.length && <p>Check the box below to confirm this person has signed the NDA.</p>}
                  </div>}
                  {!inviteCandidateId && !!inviteNda?.evidenceOptions.length && <label className="text-sm text-ivory/70 sm:col-span-3">Stored NDA evidence
                    <select className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-3 text-base" disabled={inviteNdaLoading || inviteNdaSaving} value={inviteNda.evidenceOptions.some((record) => normalizedNdaReference(record.reference) === normalizedNdaReference(inviteGov.nda_reference)) ? normalizedNdaReference(inviteGov.nda_reference) : ""} onChange={(event) => { const record = inviteNda.evidenceOptions.find((option) => option.reference === event.target.value); if (record) editInviteNda({ nda_reference: record.reference, nda_entities: record.entities as InviteGov["nda_entities"], nda_scope: record.scope }); }}>
                      <option value="">Choose existing evidence, or correct the fields below…</option>
                      {inviteNda.evidenceOptions.map((record) => <option key={record.reference} value={record.reference}>{record.reference} · verified {new Date(record.verified_at).toLocaleDateString()} · {record.reviewer_id}</option>)}
                    </select>
                  </label>}
{!inviteCandidateId && <>
                  <Input aria-label="NDA reference or storage location" disabled={inviteNdaLoading || inviteNdaSaving} value={inviteGov.nda_reference} onChange={(e) => editInviteNda({ nda_reference: e.target.value })} placeholder="NDA reference or storage location" className="text-base" />
                  <select disabled={inviteNdaLoading || inviteNdaSaving} value={inviteGov.nda_entities} onChange={(e) => editInviteNda({ nda_entities: e.target.value as InviteGov["nda_entities"] })} aria-label="Entities the NDA covers" className="h-9 w-full rounded-md border border-input bg-navy px-3 text-base">
                    <option value="">Choose NDA coverage…</option><option value="prsc">NDA covers PRSC</option><option value="dis">NDA covers DIS</option><option value="both">NDA covers PRSC and DIS</option>
                  </select>
                  <Input aria-label="NDA information-sharing scope" disabled={inviteNdaLoading || inviteNdaSaving} value={inviteGov.nda_scope} onChange={(e) => editInviteNda({ nda_scope: e.target.value })} placeholder="Information-sharing scope" className="text-base" />
</>}
{!inviteCandidateId && <label className="flex items-center gap-3 sm:col-span-3"><input type="checkbox" checked={inviteGov.nda_confirmed} disabled={!inviteDraft.email.trim() || inviteNdaLoading || inviteNdaSaving || Boolean(inviteCandidateId && !inviteNda)} onChange={(e) => { setInviteGov({ ...inviteGov, nda_confirmed: e.target.checked, nda_recipient_email: e.target.checked ? normalizedRecipient(inviteDraft.email) : "" }); if (!e.target.checked) setInviteNdaReviewId(""); }} className="h-4 w-4" /><span className="text-base text-ivory/85">I reviewed the executed NDA and verified that it applies to {inviteDraft.email || "this recipient"} and this intended invitation.</span></label>}
{inviteCandidateId && <label className="flex items-center gap-3 sm:col-span-3"><input type="checkbox" checked={inviteGov.nda_confirmed && Boolean(inviteNdaReviewId)} disabled={inviteNdaLoading || inviteNdaSaving || !inviteNda} onChange={(e) => void quickConfirmNda(e.target.checked)} className="h-4 w-4" /><span className="text-base text-ivory/85">{inviteDraft.first_name || "This person"} has signed the NDA and I have verified it.{inviteNdaSaving && " Saving…"}</span></label>}

                  {inviteNdaMessage && <p role="status" className="text-sm text-gold sm:col-span-3">{inviteNdaMessage}</p>}
                </div>
                {!inviteDraft.is_candidate && roleCombinationTier(inviteDraft.entity, inviteDraft.role, inviteDraft.is_methodology_committee ?? false).tier === "review" && (
                  <div className="grid gap-3 border border-amber-400/40 p-4 sm:col-span-2 sm:grid-cols-2">
                    <span className="text-base font-medium text-amber-200 sm:col-span-2">This cross-entity combination is blocked pending a governance/legal review. Record the review to invite</span>
                    <Textarea value={inviteGov.prsc_scope} onChange={(e) => setInviteGov({ ...inviteGov, prsc_scope: e.target.value })} placeholder="PRSC engagement scope" rows={2} className="text-base" />
                    <Textarea value={inviteGov.dis_scope} onChange={(e) => setInviteGov({ ...inviteGov, dis_scope: e.target.value })} placeholder="DIS engagement scope" rows={2} className="text-base" />
                    <Textarea value={inviteGov.conflict_controls} onChange={(e) => setInviteGov({ ...inviteGov, conflict_controls: e.target.value })} placeholder="Conflict controls applied" rows={2} className="text-base" />
                    <Textarea value={inviteGov.review_notes} onChange={(e) => setInviteGov({ ...inviteGov, review_notes: e.target.value })} placeholder="Review decision notes (governance/legal basis)" rows={2} className="text-base" />
                  </div>
                )}
                {(() => {
                  const fitting = openPolls.filter((p) => pollFitsMember(p.meeting_type, inviteDraft.role, inviteDraft.is_methodology_committee ?? false));
                  return (
                    <div className="grid gap-3 border border-gold/30 bg-gold/[.04] p-4 sm:col-span-2">
                      <span className="flex items-center gap-2 text-base font-medium text-ivory/90"><CalendarDays className="h-4 w-4 text-gold" /> Attach an upcoming meeting (optional)</span>
                      <span className="text-sm leading-6 text-ivory/55">The invitation will list the meeting and its proposed dates, and ask them to mark their availability. The availability card is waiting at the top of their Welcome Center when they first sign in.</span>
                      {fitting.length ? (
                        <select value={invitePollId} onChange={(e) => setInvitePollId(e.target.value)} className="h-10 w-full min-w-0 rounded-md border border-input bg-navy px-3 text-base">
                          <option value="">No meeting attached</option>
                          {fitting.map((p) => (
                            <option key={p.id} value={p.id}>{p.title} — {meetingTypeLabel(p.meeting_type)} · {p.slots?.length ?? 0} proposed time{p.slots?.length === 1 ? "" : "s"}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-amber-200/80">
                          No open meeting fits this role yet. Set one up below and it attaches to this invitation.
                        </span>
                      )}
                      <button type="button" onClick={() => setMeetingDialog("invite")} className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10">
                        <Plus className="h-4 w-4" /> Set Up a New Meeting
                      </button>
                      {invitePollBlock && <pre className="whitespace-pre-wrap border-l-2 border-gold/50 pl-3 font-sans text-sm leading-6 text-ivory/70">{invitePollBlock}</pre>}
                    </div>
                  );
                })()}
                <div className="grid gap-3 border border-gold/20 p-4 sm:col-span-2">
                  <span className="text-base font-medium text-ivory/90">Draft “Why You” with AI (optional)</span>
                  <span className="text-sm leading-6 text-ivory/55">Enter the LinkedIn profile link, then generate and review the Why You note using the same AI drafting action available for a batch. Optional pasted About and Experience text gives the draft more detail.</span>
                  <Input aria-label="LinkedIn profile link" disabled={aiDrafting || savingInviteNotes} value={aiLinkedin} onChange={(e) => setAiLinkedin(e.target.value)} placeholder="LinkedIn profile link" className="text-base" />
                  <Textarea aria-label="Supplied LinkedIn background" disabled={aiDrafting || savingInviteNotes} value={aiBackground} onChange={(e) => setAiBackground(e.target.value)} placeholder="Optional: paste their LinkedIn About and Experience text" className="min-h-28 text-base" />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" disabled={aiDrafting || savingInviteNotes} className="rounded-none text-base" onClick={() => void runAiDraft()}>
                      {aiDrafting ? "Drafting…" : "Generate from AI"}
                    </Button>
                    {inviteCandidateId && <Button type="button" variant="outline" disabled={!inviteNda || aiDrafting || savingInviteNotes || inviteNdaSaving || inviteNdaLoading} onClick={() => void saveInviteNotes()}>{savingInviteNotes ? "Saving note…" : "Save note without sending"}</Button>}
                    {aiStatus && <span className="text-sm text-ivory/60">{aiStatus}</span>}
                  </div>
                </div>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-base font-medium text-ivory/90">Why this candidate was chosen</span>
                  <span className="mb-3 block text-sm leading-6 text-ivory/55">
                    This private message will appear in the member’s “Why You” section when they first enter the center.
                  </span>
                  <Textarea
                    name="why_you"
                    disabled={aiDrafting || savingInviteNotes}
                    value={inviteDraft.why_you}
                    onChange={(e) => setInviteDraft({ ...inviteDraft, why_you: e.target.value })}
                    placeholder="Describe the experience, judgment, perspective, or relationships that led to this invitation."
                    required
                    minLength={20}
                    maxLength={2000}
                    className="min-h-40 text-base"
                  />
                </label>
                <Button type="button" variant="outline" className="rounded-none text-base" onClick={() => void openInvitePreview()}>
                  <Eye className="mr-2 h-4 w-4" /> Preview invitation
                </Button>
                {!inviteCandidateId && <Button type="button" variant="outline" className="rounded-none text-base" onClick={() => void saveWithoutInviting()}>Save without inviting</Button>}
                <Button type="submit" disabled={Boolean(inviteCandidateId && (!inviteNdaReviewId || !inviteGov.nda_confirmed || inviteNda?.eligibilityProblem || inviteNdaLoading || inviteNdaSaving))} className="rounded-none bg-gold text-base font-semibold text-navy opacity-100 hover:bg-gold/85 hover:text-navy focus-visible:bg-gold/85 active:bg-gold/75">Send invitation</Button>
                {status && <p className="text-base text-ivory/60 sm:col-span-2">{status}</p>}
              </form>
            </section>

            <CollapseCard id="upload" className={`${S("overview",6)} admin-card p-6 sm:p-8`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Upload className="h-7 w-7 text-gold" />
                  <h2 className="font-display text-3xl">Upload a member list</h2>
                </div>
                <InfoTip
                  title="Upload a member list"
                  body="Save the roster with Forum Invitee and entity None. LinkedIn links are saved for later batch preparation; Why You can stay blank. Generate and review the notes in Prepare Forum invitations when you are ready to invite. NDA verification remains separate."
                />
              </div>

              <p className="mt-5 text-base leading-7 text-ivory/60">
                Use one row per person. Invitation type is forum_invitee or identified; entity is None, PRSC, DIS, or Both.
                Separate multiple intended roles with semicolons, such as PRSC Board; DIS Advisor. Other requires a description.
                Methodology Committee accepts Yes, No, or Undetermined. Why You can stay blank when saving the roster; LinkedIn links are retained for later AI drafting.
                Selecting a file stages rows in this browser. Add members saves them without sending when the invitation checkbox is off. NDA columns are not imported or verified by this uploader.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" className="rounded-none text-base" onClick={downloadListTemplate}>
                  Download template
                </Button>
                <Button type="button" variant="outline" disabled={importing} className="rounded-none text-base" onClick={() => listRef.current?.click()}>
                  Choose file
                </Button>
                <input
                  ref={listRef}
                  type="file"
                  disabled={importing}
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onMemberList(file);
                  }}
                />
              </div>

              {importRows.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" disabled={batchDrafting || !importRows.some((r) => r.why_you.trim().length < 20)} className="rounded-none text-base" onClick={() => void draftAllNotes()}>
                    {batchDrafting ? "Drafting…" : `Generate AI notes for all (${importRows.filter((r) => r.why_you.trim().length < 20).length})`}
                  </Button>
                  {batchProgress && <span className="text-base text-ivory/60">{batchProgress}</span>}
                </div>
              )}

              {importConfirmBar}

              {importRows.length > 0 && (
                <div className="mt-6 space-y-4">
                  {importRows.map((r, i) => (
                    <div key={r.email} className="border border-gold/15 p-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
                        <span className="font-medium">{r.first_name} {r.last_name}</span>
                        <span className="text-ivory/60">{r.email}</span>
                        <span className="text-ivory/60">{[r.title, r.organization].filter(Boolean).join(", ")}</span>
                        <span className="text-ivory/60">{intendedDesignationLabel(r.intended_designation)}</span>
                        <Button type="button" variant="outline" size="sm" disabled={batchDrafting || rowDrafting === r.email} className="ml-auto rounded-none" onClick={() => void draftRow(i)}>
                          {rowDrafting === r.email ? "Drafting…" : r.why_you.trim() ? "Regenerate" : "Draft with AI"}
                        </Button>
                      </div>
                      <textarea
                        value={r.why_you}
                        onChange={(e) => updateImportRow(i, { why_you: e.target.value })}
                        rows={4}
                        placeholder={"Click Draft with AI to write this note from their name, title, and organization (plus background if provided)."}
                        className="mt-3 w-full border border-ivory/15 bg-transparent p-3 text-base leading-7 text-ivory/85 focus:border-gold/50 focus:outline-none"
                      />
                      {r.why_you.trim().length > 0 && r.why_you.trim().length < 20 && <p className="mt-1 text-sm text-amber-300/80">Needs at least 20 characters.</p>}
                    </div>
                  ))}
                </div>
              )}

              {importErrors.length > 0 && (
                <ul className="mt-5 space-y-1.5 text-base text-amber-300/80">
                  {importErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}

              {importConfirmBar}

              {importStatus && <p className="mt-5 text-base text-ivory/60">{importStatus}</p>}

              {importResults.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-base">
                  {importResults.map((r) => (
                    <li key={r.email} className={r.ok ? "text-ivory/60" : "text-amber-300/80"}>
                      {r.email} — {r.ok ? r.message : userFacingError(r.message, "This member could not be added.")}
                    </li>
                  ))}
                </ul>
              )}
            </CollapseCard>


            {/* Template sidebar — constrained to the same column width as the invite panel */}
            <CollapseCard id="template-list" group="email" title="Saved email templates" className={`${S("send",3)} admin-card p-6 sm:p-8`}>
              <div className="flex items-center justify-between gap-3 border-b border-gold/15 px-5 py-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-gold" />
                  <h3 className="truncate text-[13px] uppercase tracking-[0.16em] text-gold">Email templates</h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-sm text-gold">{templates.length}</span>
                  <InfoTip
                    title="Email templates"
                    body="Every saved template lives here — the badge shows how many exist. Click a template to load it into Compose & Send for editing or sending. “Sent ×” shows how many members have received it. The trash icon deletes a template; sent history is kept. Use New Template to start from scratch."
                  />
                </div>
              </div>
              <ul className="max-h-[320px] overflow-y-auto">
                {templates.length === 0 && <li className="px-5 py-5 text-base text-ivory/45">No templates yet. Upload or write one.</li>}
                {templates.map((t) => (
                  <li key={t.id} className="group flex items-start justify-between gap-3 border-b border-ivory/10 px-5 py-3 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        setDraft({
                          id: t.id,
                          name: t.name,
                          subject: t.subject,
                          description: t.description ?? "",
                          eyebrow: t.eyebrow || "Private Communication",
                          heading: t.heading ?? "",
                          body: t.body,
                          cta_label: t.cta_label ?? "",
                          cta_url: t.cta_url ?? "",
                          cta_subtext: t.cta_subtext ?? "",
                          signatures: t.signatures ?? "",
                        });
                        setEmailMode("template");
                        setEmailStatus(`Editing saved template “${t.name}”. Save to update it in the library.`);
                        openAdminCard("email-center");
                        window.setTimeout(() => document.getElementById("email-center")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-base text-ivory/90 group-hover:text-gold">{t.name}</span>
                      <span className="mt-0.5 block truncate text-sm text-ivory/40">{t.description || t.subject}</span>
                      <span className="mt-1 block text-xs text-ivory/35">
                        Sent {sends.filter((s) => s.template_id === t.id && s.status === "sent").length}×
                      </span>
                    </button>
                    {t.system_key ? (
                      <span className="mt-1 rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-gold">Auto</span>
                    ) : (
                    <button
                      type="button"
                      aria-label={`Remove ${t.name}`}
                      onClick={() => removeTemplate(t.id)}
                      className="mt-1 text-ivory/30 transition-colors hover:text-gold"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setEmailMode("template");
                  setDraft(emptyDraft);
                  setEmailStatus("New template started.");
                  document.getElementById("email-center")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex w-full items-center justify-center gap-2 border-t border-gold/15 px-5 py-3 text-base text-gold transition-colors hover:bg-gold/10"
              >
                <Plus className="h-4 w-4" /> New template
              </button>
            </CollapseCard>
          </div>

          <div className="contents">
            <div className={`${S("overview",5)}`}><AdminLeadership /></div>
            {page === "overview" && !preview && (
              <CollapseCard id="release-review" title="Release review" className="order-last col-span-full admin-card p-6 sm:p-8"><AdminReleaseReview /></CollapseCard>
            )}
            {page === "send" && !preview && (
              <CollapseCard id="question-register" title="Executive questions register" className="order-last col-span-full admin-card p-6 sm:p-8"><AdminQuestionRegister /></CollapseCard>
            )}
            <section id="forum-communications" className={`${page === "send" ? "order-last col-span-full" : "hidden"} admin-card p-6 sm:p-8`}>
              {page === "send" && <AdminForumCommunications />}
            </section>
            <CollapseCard id="email-center" group="email" hashes={["email-compose", "email-templates", "new-template"]} title="Compose & send email" className={`${S("send",2)} admin-card p-6 sm:p-8`}>
              <span id="email-compose" className="block scroll-mt-24" /><span id="email-templates" className="block scroll-mt-24" /><span id="new-template" className="block scroll-mt-24" />
              <div className="mb-6 flex flex-wrap gap-2" role="tablist">
                {([
                  ["compose", "Compose & send"],
                  ["template", "Template library editor"],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={emailMode === mode}
                    onClick={() => {
                      setEmailMode(mode);
                      setDraft(emptyDraft);
                      setComposeFromId("");
                      setEmailStatus(mode === "template" ? "Open Saved email templates to pick one, upload one, or start a new one." : "");
                    }}
                    className={`border px-4 py-2 text-sm uppercase tracking-[0.14em] transition-colors ${emailMode === mode ? "border-gold bg-gold text-navy" : "border-gold/30 text-ivory/70 hover:text-gold"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isTemplateMode ? <FileText className="h-5 w-5 text-gold" /> : <Send className="h-5 w-5 text-gold" />}
                  <h2 className="font-display text-3xl">
                    {isTemplateMode ? (draft.id ? `Editing: ${draft.name || "template"}` : "New template") : <>Compose &amp; send</>}
                  </h2>
                  <InfoTip
                    title={isTemplateMode ? "Template library editor" : "Compose & send"}
                    body={isTemplateMode
                      ? "Edit and save templates in your library. Changes here permanently update the saved template for all future uses. Upload Template loads a .txt, .md, or .html file as a new template. Nothing is sent from this view."
                      : "Write any email from scratch in plain text, or optionally load a saved template as a starting point. Edits here only affect this send — your saved templates stay unchanged. Select recipients below, then Send."}
                  />
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.html,.htm"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Button type="button" className="w-full rounded-none border border-gold/40 bg-transparent text-base text-ivory hover:bg-gold/10 hover:text-gold sm:w-auto" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> {isTemplateMode ? "Upload template" : "Upload text"}
                  </Button>
                  <Button type="button" className="w-full rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy sm:w-auto" onClick={() => setPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" /> View in template
                  </Button>
                </div>
              </div>

              {!isTemplateMode && (
                <label className="mt-6 flex flex-col gap-2 text-base text-ivory/80 sm:flex-row sm:items-center">
                  <span className="shrink-0">Start from a saved template (optional)</span>
                  <select
                    value={composeFromId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setComposeFromId(id);
                      const t = templates.find((x) => x.id === id);
                      if (!t) { setDraft(emptyDraft); return; }
                      setDraft({
                        id: "",
                        name: t.name,
                        subject: t.subject,
                        description: t.description ?? "",
                        eyebrow: t.eyebrow || "Private Communication",
                        heading: t.heading ?? "",
                        body: t.body,
                        cta_label: t.cta_label ?? "",
                        cta_url: t.cta_url ?? "",
                        cta_subtext: t.cta_subtext ?? "",
                        signatures: t.signatures ?? "",
                      });
                      setEmailStatus(`Loaded “${t.name}” as a starting point. Edits here won't change the saved template.`);
                    }}
                    className="h-10 w-full min-w-0 rounded-md border border-input bg-navy px-3 text-base"
                  >
                    <option value="">None — write raw text</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
              )}

              {!isTemplateMode && (
              <div className="mt-6 flex flex-col gap-3 border border-gold/30 bg-gold/[.04] p-4 sm:flex-row sm:items-center">
                <span className="flex shrink-0 items-center gap-2 text-base text-ivory/90"><CalendarDays className="h-4 w-4 text-gold" /> Attach an upcoming meeting</span>
                <select
                  value={composePollId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setComposePollId(id);
                    attachComposeBlock(blockFor(id));
                  }}
                  className="h-10 w-full min-w-0 rounded-md border border-input bg-navy px-3 text-base"
                >
                  <option value="">{openPolls.length ? "Choose a meeting…" : "No open meetings yet — set one up"}</option>
                  {openPolls.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} — {meetingTypeLabel(p.meeting_type)} · {p.slots?.length ?? 0} times</option>
                  ))}
                </select>
                <button type="button" onClick={() => setMeetingDialog("compose")} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10">
                  <Plus className="h-4 w-4" /> Set Up a New Meeting
                </button>
              </div>
              )}

              {isTemplateMode && draft.id && templates.find((t) => t.id === draft.id)?.system_key && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-gold/25 px-4 py-3 text-sm text-ivory/70">
                  <span>You are editing an automatic email. Saved changes are used for every future send.</span>
                  <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => void resetDraft()}>Reset to original</Button>
                </div>
              )}

              <div className={`mt-6 grid gap-6 ${page === "overview" ? "2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
              <div className="grid content-start gap-4 sm:grid-cols-2">
                {isTemplateMode && (
                  <>
                    <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Template name" className="text-base" />
                    <Input
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder="Short description (optional)"
                      className="text-base"
                    />
                  </>
                )}
                <Input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Subject line"
                  className="text-base sm:col-span-2"
                />
                {editingInvite && <p className="text-sm text-gold sm:col-span-2">The real invitation email always uses the subject “{INVITE_EMAIL_SUBJECT}”. Your wording, button and signature below are used; this subject line is not.</p>}
                <Input value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} placeholder="Eyebrow label" className="text-base" />
                <Input value={draft.heading} onChange={(e) => setDraft({ ...draft, heading: e.target.value })} placeholder="Headline" className="text-base" />
                <Textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="Email content. Separate paragraphs with a blank line."
                  className="min-h-56 text-base sm:col-span-2"
                />
                <Input value={draft.cta_label} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} placeholder="Button label (optional)" className="text-base" />
                <Input value={draft.cta_url} onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })} placeholder="Button link (optional)" className="text-base" />
                <Input
                  value={draft.cta_subtext}
                  onChange={(e) => setDraft({ ...draft, cta_subtext: e.target.value })}
                  placeholder="Note under the button (optional)"
                  className="text-base sm:col-span-2"
                />
                <Textarea
                  value={draft.signatures}
                  onChange={(e) => setDraft({ ...draft, signatures: e.target.value })}
                  placeholder={"Signatures — one per line: Name, Title (rendered in cursive)"}
                  className="min-h-20 text-base sm:col-span-2"
                />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">Live preview</p>
                  <button type="button" onClick={() => popOutEmail(previewHtml)} className="inline-flex items-center gap-1.5 text-sm text-gold underline hover:text-gold-light"><ExternalLink className="h-4 w-4" />Pop out full size</button>
                  <label className="flex items-center gap-2 text-sm text-ivory/60">
                    Preview as
                    <select value={previewMember?.id ?? ""} onChange={(e) => setPreviewAsId(e.target.value)} className="h-8 max-w-[220px] rounded-md border border-input bg-navy px-2 text-sm">
                      {members.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                  </label>
                </div>
                <iframe title="Live email preview" srcDoc={previewHtml} className="h-[720px] w-full border border-gold/20 bg-ivory" />
              </div>
              </div>

              <p className="mt-3 text-sm text-ivory/40">
                Personalize with {"{{first_name}}"}, {"{{last_name}}"}, {"{{full_name}}"}, {"{{organization}}"}, {"{{title}}"}, {"{{entity}}"}, {"{{entity_full}}"}, {"{{role}}"}, {"{{role_label}}"}, {"{{package_label}}"}, {"{{why_you}}"}.
              </p>

              {!isTemplateMode && (
              <div className="mt-6 border-t border-gold/15 pt-5">
                <button type="button" onClick={() => setRecipientsOpen(!recipientsOpen)} aria-expanded={recipientsOpen} className="flex w-full items-center justify-between gap-3 text-left">
                  <span className="text-xs uppercase tracking-[0.18em] text-gold">Recipients <span className="ml-2 normal-case tracking-normal text-ivory/55">{recipients.length} selected of {members.length}</span></span>
                  {recipientsOpen ? <ChevronUp className="h-5 w-5 shrink-0 text-gold" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gold" />}
                </button>
                {recipientsOpen && <Input value={recipientFilter} onChange={(e) => setRecipientFilter(e.target.value)} placeholder="Search by name or email" aria-label="Search recipients" className="mt-3 text-base" />}
                <div className={`mt-3 grid gap-2 sm:grid-cols-2 ${recipientsOpen ? "" : "hidden"}`}>
                  {members.filter((m) => !recipientFilter.trim() || `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(recipientFilter.trim().toLowerCase())).map((m) => {
                    const already = composeFromId
                      ? (sendsByMember.get(m.id) ?? []).some((s) => s.template_id === composeFromId && s.status === "sent")
                      : false;
                    const checked = recipients.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-start gap-3 border p-3 text-base transition-colors ${
                          checked ? "border-gold/60 bg-gold/5" : "border-ivory/12 hover:border-gold/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setRecipients((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)))
                          }
                          className="mt-1 accent-[var(--color-gold)]"
                        />
                        <span className="min-w-0">
                          <span className="block truncate">
                            {m.first_name} {m.last_name}
                          </span>
                          <span className="block truncate text-sm text-ivory/40">{m.email}</span>
                          {already && (
                            <span className="mt-1 flex items-center gap-1.5 text-xs text-amber-300/80">
                              <AlertTriangle className="h-3 w-3" /> Already received this template
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              )}


              {(!isTemplateMode || editingInvite) && (
                <div className="mt-6 border-t border-gold/15 pt-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">Send a test to any address</p>
                  <p className="mt-1 text-sm text-ivory/55">{editingInvite ? "Sends the full-design invitation exactly as the preview above shows it, to one address you type. The button is inactive. Nothing goes to members." : "Sends this draft to one email address you type (not a member), with sample merge values. Nothing goes to members."}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="name@example.com" aria-label="Test email address" className="max-w-sm text-base" />
                    <Button type="button" disabled={sending} variant="outline" className="rounded-none text-base" onClick={sendTest}>{sending ? "Sending…" : "Send test"}</Button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="rounded-none border border-ivory/20 bg-transparent text-base text-ivory/70 hover:border-gold/40 hover:text-gold"
                  onClick={() => {
                    setDraft(emptyDraft);
                    setComposeFromId("");
                    setEmailStatus("");
                    setRecipients([]);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {isTemplateMode ? "Close" : "Clear"}
                </Button>
                {isTemplateMode ? (
                  <Button type="button" className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={saveDraft}>
                    {draft.id ? "Save changes to template" : "Save to template library"}
                  </Button>
                ) : (
                  <Button type="button" disabled={sending} className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={send}>
                    {sending ? "Sending…" : `Send to ${recipients.length || 0} member(s)`}
                  </Button>
                )}
                {emailStatus && <p className="text-base text-ivory/60">{emailStatus}</p>}
              </div>
            </CollapseCard>
          </div>

          <div className="contents">
            <section className={`${page === "send" ? PLACE.send[4] : PLACE.overview[1]} admin-card p-6 sm:p-8 ${membersCollapsed ? "[&>*:not(:first-child)]:hidden" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="tracker" className="flex scroll-mt-28 items-center gap-3 font-display text-3xl">
                  <button type="button" onClick={() => setMembersCollapsed(!membersCollapsed)} aria-expanded={!membersCollapsed} className="flex items-center gap-3 text-left">
                    <Users className="h-7 w-7 text-gold" /> Members
                    <span className="text-base font-normal text-ivory/55">({members.length})</span>
                    {membersCollapsed ? <ChevronDown className="h-5 w-5 text-gold" /> : <ChevronUp className="h-5 w-5 text-gold" />}
                  </button>
                </h2>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={selectedEmailIds.length === 0}
                    className="rounded-none"
                    onClick={() => void removeSelectedEmailHistory()}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete selected emails ({selectedEmailIds.length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={selectedMemberIds.length === 0}
                    className="rounded-none border-red-400/35 text-red-800 hover:bg-red-400/10 hover:text-red-900"
                    onClick={() => void removeSelectedMembers()}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove selected members ({selectedMemberIds.length})
                  </Button>
                  <InfoTip
                    title="Members"
                    body="Select only the member or individual email records you want to remove, then use the matching Delete selected action. Member deletion also removes that person’s associated test data."
                  />
                </div>
              </div>

              <details className="mt-4 border border-gold/25 bg-ivory/[.03] p-4 sm:p-5"><summary className="cursor-pointer text-base text-ivory/80"><strong className="font-medium text-gold">Start by clicking a member&rsquo;s name</strong> — tap for what you can do here</summary><div className="mt-4">
                <p className="flex items-start gap-2.5 text-base leading-relaxed text-ivory/80">
                  <Info className="mt-1 h-4 w-4 shrink-0 text-gold" />
                  <span>
                    <strong className="font-medium text-gold">Start by clicking a member&rsquo;s name.</strong>{" "}
                    That opens their record, where you read what they submitted, add and release documents, and follow every initial, signature and copy request.
                  </span>
                </p>
                <p className="mt-4 border-t border-gold/15 pt-4 text-xs uppercase tracking-[0.18em] text-ivory/45">
                  In this section you can
                </p>
                <ul className="mt-3 grid gap-x-8 gap-y-2.5 text-base leading-snug text-ivory/75 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    "Open a member record — click their name or “View profile”",
                    "Read submitted profile answers and their journey activity",
                    "Add documents, release them, and track initials and signatures",
                    "Set package status from the dropdown in each row",
                    "Revoke or reactivate a member’s sign-in access",
                    "Tick members or individual email records, then delete just those",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div></details>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search name, email or organization" className="min-w-0 text-base" aria-label="Search members" />
                <select aria-label="Filter by company" value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="h-10 w-full min-w-0 border border-input bg-navy px-2 text-base">
                  <option value="">All companies</option><option value="prsc">PRSC</option><option value="dis">DIS</option><option value="both">Both</option>
                </select>
                <select aria-label="Filter by role" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-10 w-full min-w-0 border border-input bg-navy px-2 text-base">
                  <option value="">All roles</option><option value="board_member">Board members</option><option value="advisor">Advisors</option>
                </select>
                <select aria-label="Filter by stage" value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="h-10 w-full min-w-0 border border-input bg-navy px-2 text-base">
                  <option value="">All stages</option>
                  <option value="not_invited">Added — not invited yet</option>
                  <option value="invited">Invited — not signed in</option>
                  <option value="in_progress">Profile in progress</option>
                  <option value="submitted">Profile submitted</option>
                  <option value="documents">Documents open</option>
                  <option value="complete">Complete</option>
                  <option value="revoked">Access revoked</option>
                </select>
                <Button type="button" variant="outline" className="rounded-none" onClick={exportCsv}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              </div>
              <p className="mt-2 text-sm text-ivory/45">Showing {filteredMembers.length} of {members.length} members</p>

              <div className="mt-3 hidden overflow-x-auto border border-gold/20 sm:block">
                <table className="w-full min-w-[760px] text-left text-base">
                <thead className="bg-ivory/5 text-xs uppercase text-gold">
                  <tr>
                    <th className="p-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          aria-label="Select all members"
                          checked={members.length > 0 && selectedMemberIds.length === members.length}
                          onChange={(e) => setSelectedMemberIds(e.target.checked ? members.map((member) => member.id) : [])}
                          className="h-4 w-4 accent-[var(--color-gold)]"
                        />
                        Member
                      </label>
                    </th>
                    <th>Designation</th>
                    <th className="pr-3">Where they are</th>
                    <th>Package status</th>
                    <th>Emails received</th>
                    <th className="pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-ivory/50">No members match these filters.</td></tr>
                  )}
                  {filteredMembers.map((m: any) => {
                    const st = stageOf(m);
                    const journey = journeys[m.id];
                    const forum = m.participates_in_forum !== false;
                    const all = sendsByMember.get(m.id) ?? [];
                    const list = all.filter((s) => s.status === "sent");
                    const failed = all.filter((s) => s.status !== "sent");
                    const revoked = m.status === "revoked";
                    const expanded = expandedRows.includes(m.id);
                    return (
                      <Fragment key={m.id}>
                      <tr className="border-t border-ivory/10 align-middle">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <label className="flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                aria-label={`Select ${m.first_name} ${m.last_name}`}
                                checked={selectedMemberIds.includes(m.id)}
                                onChange={(e) => setSelectedMemberIds((current) => e.target.checked ? [...current, m.id] : current.filter((id) => id !== m.id))}
                                className="h-4 w-4 shrink-0 accent-[var(--color-gold)]"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setDetailId(m.id)}
                              className="text-left underline decoration-gold/30 underline-offset-4 transition-colors hover:text-gold"
                            >
                              <strong className="font-medium">
                                {m.first_name} {m.last_name}
                              </strong>
                              <span className="block text-sm text-ivory/40">{m.email}</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-sm">{memberDesignation(m as any)}{(m as { participates_in_forum?: boolean }).participates_in_forum === false && <span className="ml-2 whitespace-nowrap border border-gold/30 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-gold/80">No Forum</span>}</td>
                        <td className="py-3 pr-3">
                          <span className={`inline-block border px-2 py-1 text-xs uppercase tracking-[0.12em] ${st.tone}`}>{st.label}</span>
                          {journey && (
                            <span className="ml-1.5 inline-block border border-gold/30 px-2 py-1 text-xs text-gold" aria-label="Recipient journey stage">
                              Stage {journey.currentStage - (forum ? 0 : 1)} of {forum ? 5 : 4}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            aria-label={`Package status for ${m.first_name} ${m.last_name}`}
                            value={m.package_status}
                            onChange={(e) => void changePackage(m.id, e.target.value)}
                            className="h-9 w-full min-w-[150px] rounded-md border border-input bg-navy px-2 text-sm"
                          >
                            <option value="awaiting_profile">Awaiting profile</option>
                            <option value="in_preparation">In preparation</option>
                            <option value="profile_received">Profile received</option>
                            <option value="package_ready">{isForumCleared(m as any) && (m as any).participates_in_forum !== false ? "Forum cleared" : packageReadyOptionLabel(m as any)}</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3 text-sm">
                          {all.length === 0 ? (
                            <span className="text-ivory/40">None yet</span>
                          ) : (
                            <span className="text-ivory/75">{list.length} sent{list[0] ? ` · ${new Date(list[0].created_at).toLocaleDateString()}` : ""}</span>
                          )}
                          {failed.length > 0 && (
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-red-300/85">
                              <AlertTriangle className="h-3 w-3" /> {failed.length} failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailId(m.id)}
                              className="flex items-center gap-1.5 border border-gold/40 px-2 py-1 text-xs text-gold transition-colors hover:bg-gold/10"
                            >
                              <Eye className="h-3.5 w-3.5" /> View profile
                            </button>
                            {st.nudge && !revoked && (
                              <button
                                type="button"
                                disabled={nudging === m.id}
                                onClick={() => void nudge(m)}
                                className="flex items-center gap-1.5 border border-gold/40 px-2 py-1 text-xs text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                              >
                                <Send className="h-3.5 w-3.5" /> {nudging === m.id ? "Sending…" : "Nudge"}
                              </button>
                            )}
                            {revoked && (
                              <button type="button" onClick={() => void purgeMember(m as any)} className="flex items-center gap-1.5 border border-red-400/60 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-400/15">
                                <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void changeAccess(m.id, revoked ? "active" : "revoked")}
                              className={`flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors ${
                                revoked
                                  ? "border-ivory/25 text-ivory/70 hover:border-gold/40 hover:text-gold"
                                  : "border-red-400/35 text-red-300/85 hover:bg-red-400/10"
                              }`}
                            >
                              {revoked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                              {revoked ? "Reactivate" : "Revoke"}
                            </button>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-label={`${expanded ? "Hide" : "Show"} details for ${m.first_name} ${m.last_name}`}
                              onClick={() => setExpandedRows((cur) => cur.includes(m.id) ? cur.filter((id) => id !== m.id) : [...cur, m.id])}
                              className="flex items-center gap-1 border border-ivory/20 px-2 py-1 text-xs text-ivory/70 transition-colors hover:border-gold/40 hover:text-gold"
                            >
                              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Details
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-ivory/[.02]">
                          <td colSpan={6} className="px-4 pb-4 pt-1">
                            <div className="grid gap-4 text-sm text-ivory/65 md:grid-cols-2">
                              <div className="space-y-1">
                                <p className="text-xs uppercase tracking-[0.14em] text-ivory/40">Where they are</p>
                                {journey && <p>Stage {journey.currentStage - (forum ? 0 : 1)} of {forum ? 5 : 4} · {STAGES[journey.currentStage - 1]?.label} — {journey.label}</p>}
                                {st.detail && <p>{st.detail}</p>}
                                <p className="text-xs text-ivory/45">Access: {st.key === "not_invited" ? "added, not invited yet" : m.status} · Orientation reviewed: {(m as { orientation_acknowledged_at?: string | null }).orientation_acknowledged_at ? new Date((m as { orientation_acknowledged_at: string }).orientation_acknowledged_at).toLocaleDateString() : "Not yet"}</p>
                                {m.intended_designation && <p className="text-xs text-ivory/55">{intendedDesignationLabel(m as any)}</p>}
                                {st.progress > 0 && (
                                  <span className="mt-2 block h-1.5 w-28 bg-ivory/10"><span className="block h-full bg-gold" style={{ width: `${st.progress}%` }} /></span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-ivory/40">Emails received</p>
                                {all.length === 0 ? (
                                  <p className="mt-1 text-ivory/40">None yet</p>
                                ) : (
                                  <span className="mt-1 flex flex-col gap-2">
                                    {all.map((sendRecord) => (
                                      <label key={sendRecord.id} className="flex cursor-pointer items-start gap-2 border border-gold/20 px-2 py-1.5 text-xs text-ivory/75">
                                        <input
                                          type="checkbox"
                                          aria-label={`Select email ${sendRecord.template_name} to ${m.first_name} ${m.last_name}`}
                                          checked={selectedEmailIds.includes(sendRecord.id)}
                                          onChange={(e) => setSelectedEmailIds((current) => e.target.checked ? [...current, sendRecord.id] : current.filter((id) => id !== sendRecord.id))}
                                          className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-gold)]"
                                        />
                                        {sendRecord.status === "sent" ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-gold" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-300/85" />}
                                        <span>
                                          <span className="block">{sendRecord.template_name}</span>
                                          <span className="block text-ivory/40">{new Date(sendRecord.created_at).toLocaleDateString()}</span>
                                        </span>
                                      </label>
                                    ))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              </div>

              <div className="mt-3 space-y-3 sm:hidden">
                {filteredMembers.length === 0 && (
                  <p className="border border-gold/20 p-4 text-ivory/50">No members match these filters.</p>
                )}
                {filteredMembers.map((m: any) => {
                  const st = stageOf(m);
                  const all = sendsByMember.get(m.id) ?? [];
                  const list = all.filter((s) => s.status === "sent");
                  const failed = all.filter((s) => s.status !== "sent");
                  const revoked = m.status === "revoked";
                  return (
                    <article key={m.id} className="border border-gold/20 p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${m.first_name} ${m.last_name}`}
                          checked={selectedMemberIds.includes(m.id)}
                          onChange={(e) => setSelectedMemberIds((current) => e.target.checked ? [...current, m.id] : current.filter((id) => id !== m.id))}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
                        />
                        <button
                          type="button"
                          onClick={() => setDetailId(m.id)}
                          className="min-w-0 flex-1 text-left underline decoration-gold/30 underline-offset-4 transition-colors hover:text-gold"
                        >
                          <strong className="font-medium">
                            {m.first_name} {m.last_name}
                          </strong>
                          <span className="block break-all text-sm text-ivory/40">{m.email}</span>
                          <span className={`mt-1 inline-block text-xs uppercase tracking-[0.14em] ${revoked ? "text-red-300/80" : "text-ivory/40"}`}>
                            Access: {st.key === "not_invited" ? "added, not invited yet" : m.status}
                          </span>
                        </button>
                        <span className="max-w-[45%] text-right text-xs text-ivory/70">{memberDesignation(m as any)}</span>
                      </div>

                      <div className="mt-3 border-t border-ivory/10 pt-3">
                        <span className={`inline-block border px-2 py-1 text-xs uppercase tracking-[0.12em] ${st.tone}`}>{st.label}</span>
                        {st.detail && <span className="mt-1 block text-sm text-ivory/55">{st.detail}</span>}
                        {st.progress > 0 && (
                          <span className="mt-2 block h-1.5 w-full bg-ivory/10"><span className="block h-full bg-gold" style={{ width: `${st.progress}%` }} /></span>
                        )}
                      </div>

                      <div className="mt-3">
                        <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-ivory/45">Package status</label>
                        <select
                          value={m.package_status}
                          onChange={(e) => void changePackage(m.id, e.target.value)}
                          className="h-10 w-full min-w-0 rounded-md border border-input bg-navy px-2 text-base"
                        >
                          <option value="awaiting_profile">Awaiting profile</option>
                          <option value="in_preparation">In preparation</option>
                          <option value="profile_received">Profile received</option>
                          <option value="package_ready">{isForumCleared(m as any) && (m as any).participates_in_forum !== false ? "Forum cleared" : packageReadyOptionLabel(m as any)}</option>
                        </select>
                      </div>

                      <div className="mt-3">
                        <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-ivory/45">Emails received</label>
                        {all.length === 0 ? (
                          <span className="text-sm text-ivory/40">None yet</span>
                        ) : (
                          <span className="flex flex-col gap-2">
                            {all.map((sendRecord) => (
                              <label key={sendRecord.id} className="flex cursor-pointer items-start gap-2 border border-gold/20 px-2 py-1.5 text-xs text-ivory/75">
                                <input
                                  type="checkbox"
                                  aria-label={`Select email ${sendRecord.template_name} to ${m.first_name} ${m.last_name}`}
                                  checked={selectedEmailIds.includes(sendRecord.id)}
                                  onChange={(e) => setSelectedEmailIds((current) => e.target.checked ? [...current, sendRecord.id] : current.filter((id) => id !== sendRecord.id))}
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-gold)]"
                                />
                                {sendRecord.status === "sent" ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-gold" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-300/85" />}
                                <span>
                                  <span className="block">{sendRecord.template_name}</span>
                                  <span className="block text-ivory/40">{new Date(sendRecord.created_at).toLocaleDateString()}</span>
                                </span>
                              </label>
                            ))}
                          </span>
                        )}
                        {failed.length > 0 && (
                          <span className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300/85">
                            <AlertTriangle className="h-3 w-3" /> {failed.length} failed send{failed.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="mt-1 block text-xs text-ivory/35">
                          Last sent: {list[0] ? new Date(list[0].created_at).toLocaleDateString() : "—"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(m.id)}
                          className="flex items-center justify-center gap-1.5 border border-gold/40 px-2.5 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
                        >
                          <Eye className="h-3.5 w-3.5" /> View profile
                        </button>
                        {st.nudge && !revoked && (
                          <button
                            type="button"
                            disabled={nudging === m.id}
                            onClick={() => void nudge(m)}
                            className="flex items-center justify-center gap-1.5 border border-gold/40 px-2.5 py-2 text-sm text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" /> {nudging === m.id ? "Sending…" : "Nudge now"}
                          </button>
                        )}
                        {revoked && (
                          <button type="button" onClick={() => void purgeMember(m as any)} className="flex items-center justify-center gap-1.5 border border-red-400/60 px-2.5 py-2 text-sm text-red-300 transition-colors hover:bg-red-400/15">
                            <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void changeAccess(m.id, revoked ? "active" : "revoked")}
                          className={`flex items-center justify-center gap-1.5 border px-2.5 py-2 text-sm transition-colors ${
                            revoked
                              ? "border-ivory/25 text-ivory/70 hover:border-gold/40 hover:text-gold"
                              : "border-red-400/35 text-red-300/85 hover:bg-red-400/10"
                          }`}
                        >
                          {revoked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                          {revoked ? "Reactivate" : "Revoke access"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {memberBusy && <p className="mt-3 text-base text-ivory/60">{memberBusy}</p>}
            </section>

            <CollapseCard id="inquiries-card" hashes={["inquiries"]} domId={false} className={`${S("overview",3)} admin-card p-6 sm:p-8`}>
              <div className="flex items-start justify-between gap-3">
                <h2 id="inquiries" className="flex scroll-mt-28 items-center gap-3 font-display text-3xl">
                  <MessageSquare className="h-7 w-7 text-gold" /> Recent inquiries
                </h2>
                <InfoTip
                  title="Recent inquiries"
                  body="Private questions members submit from their portal. New submissions also appear in the notification bell at the top of the page, so you can see at a glance when someone is waiting on a reply."
                />
              </div>
              <div className="mt-5 space-y-3">
              {d.inquiries.length === 0 ? (
                <p className="text-base text-ivory/45">No inquiries yet.</p>
              ) : (
                d.inquiries.slice(0, 8).map((q: any) => {
                  const member = members.find((x) => x.id === q.member_id);
                  const resolved = q.status === "resolved";
                  const notes = inquiryDraft[q.id] ?? q.admin_notes ?? "";
                  return (
                    <article
                      key={q.id}
                      className={`border-l-2 bg-ivory/[.025] p-4 ${resolved ? "border-ivory/25 opacity-75" : "border-gold"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-medium">{q.subject}</p>
                          <p className="mt-0.5 text-sm text-ivory/40">
                            {member ? `${member.first_name} ${member.last_name}` : "Member"} ·{" "}
                            {resolved ? "Resolved" : "Open"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void saveInquiry(q.id, resolved ? "open" : "resolved", notes)}
                          className="flex shrink-0 items-center gap-1.5 border border-gold/40 px-2.5 py-1.5 text-sm text-gold transition-colors hover:bg-gold/10"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> {resolved ? "Reopen" : "Mark resolved"}
                        </button>
                      </div>
                      <p className="mt-2 text-base text-ivory/55">{q.message}</p>
                      <Textarea
                        value={notes}
                        onChange={(e) => setInquiryDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Private note for your records (not visible to the member)"
                        className="mt-3 min-h-20 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => void saveInquiry(q.id, q.status, notes)}
                        className="mt-2 text-sm text-gold transition-colors hover:text-ivory"
                      >
                        Save note
                      </button>
                    </article>
                  );
                })
              )}
              </div>
            </CollapseCard>

            <CollapseCard id="meetings-card" hashes={["meetings"]} domId={false} className={`${S("overview",2)} admin-card p-6 sm:p-8`}>
              <div className="flex items-start justify-between gap-3">
                <h2 id="meetings" className="flex scroll-mt-28 items-center gap-3 font-display text-3xl"><CalendarDays className="h-7 w-7 text-gold" /> Meetings &amp; calendar</h2>
                <InfoTip
                  title="Meetings & calendar"
                  body="Propose a board, advisory, or methodology committee meeting with a few time options. The right members are pre-selected by meeting type — committee meetings go only to Methodology Committee members. Everyone invited gets an email asking for their availability; their answers appear in the grid below. When a time works, click Confirm next to it and each member receives a confirmation email with an add-to-calendar file. Members who haven't answered after two days get an automatic reminder."
                />
              </div>
              <div className="mt-7">
                <AdminMeetings />
              </div>
            </CollapseCard>
            {page === "overview" && (
              <CollapseCard id="library" title="All documents" className="order-8 lg:col-span-2 lg:row-start-6 admin-card p-6 sm:p-8">
                <AdminDocumentLibrary members={members as any} preview={preview} />
              </CollapseCard>
            )}
            <CollapseCard id="documents-card" hashes={["documents"]} domId={false} className={`${page === "overview" ? "order-7 lg:col-span-2 lg:row-start-5" : "hidden"} admin-card p-6 sm:p-8`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="documents" className="flex scroll-mt-28 items-center gap-3 font-display text-3xl"><FileText className="h-7 w-7 text-gold" /> Documents</h2>
                <label className="flex items-center gap-3 text-base text-ivory/70">
                  Member
                  <select
                    value={docsMemberId}
                    onChange={(e) => setDocsMemberId(e.target.value)}
                    className="h-10 min-w-[240px] border border-gold/25 bg-navy-deep px-3 text-base text-ivory outline-none focus:border-gold"
                  >
                    <option value="">Choose a member…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name} · {memberDesignation(m as any)}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-6">
                {docsMemberId ? (
                  <AdminMemberDocuments
                    key={docsMemberId}
                    memberId={docsMemberId}
                    memberName={(() => { const m = members.find((x) => x.id === docsMemberId); return m ? `${m.first_name} ${m.last_name}` : "this member"; })()}
                    preview={preview}
                  />
                ) : (
                  <p className="border border-gold/15 p-5 text-base text-ivory/55">Choose a member to add, release, and track their journey documents and one-off records</p>
                )}
              </div>
            </CollapseCard>
            <CollapseCard id="activity-card" hashes={["activity-log"]} domId={false} className={`${S("overview",4)} admin-card p-6 sm:p-8`}>
              <div className="flex items-start justify-between gap-3">
                <h2 id="activity-log" className="flex scroll-mt-28 items-center gap-3 font-display text-3xl"><Activity className="h-7 w-7 text-gold" /> Activity log</h2>
                <InfoTip title="Activity log" body="A dated record of key steps: invitations, profile submissions, documents released, signatures, BoldSign check-offs, signed copies sent, and reminders you sent. Kept for your records in case anything is ever questioned." />
              </div>
              <div className={`mt-5 overflow-y-auto border border-gold/15 ${showAllActivity ? "max-h-[28rem]" : ""}`}>
                {d.activity.filter((a: any) => a.event_type).length === 0 ? (
                  <p className="p-4 text-base text-ivory/45">No activity recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-ivory/10">
                    {d.activity.filter((a: any) => a.event_type).slice(0, showAllActivity ? undefined : 5).map((a: any) => {
                      const who = members.find((x) => x.id === a.member_id);
                      const byAdmin = a.actor_user_id && who && a.actor_user_id !== who.user_id;
                      return (
                        <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                          <span className="min-w-0 text-base text-ivory/80">
                            {activityLabel(a.event_type)}
                            {a.event_type === "nudge_sent" && a.metadata?.kind ? ` (${a.metadata.kind})` : ""}
                            <span className="text-ivory/45"> · {who ? `${who.first_name} ${who.last_name}` : "Member"}{byAdmin ? " · by admin" : ""}</span>
                          </span>
                          <span className="shrink-0 text-sm text-ivory/45">{new Date(a.created_at).toLocaleString()}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {d.activity.filter((a: any) => a.event_type).length > 5 && (
                <button type="button" onClick={() => setShowAllActivity(!showAllActivity)} className="mt-3 inline-flex items-center gap-2 text-sm text-gold hover:text-ivory">
                  {showAllActivity ? "Show recent only" : "View full activity log"} <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </CollapseCard>
          </div>
        </div>
      </main>

      {detailId && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-navy-deep/85 p-4 backdrop-blur">
          <div className="flex h-full max-h-[90vh] w-full max-w-[860px] flex-col border border-gold/30 bg-navy">
            <div className="flex items-center justify-between border-b border-gold/20 px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">Member journey &amp; profile</p>
                <p className="truncate text-base text-ivory/70">
                  {(() => {
                    const m = members.find((x) => x.id === detailId);
                    return m ? `${m.first_name} ${m.last_name} · ${m.organization}` : "Member";
                  })()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Link to="/portal" search={{ asMember: detailId }} className="rounded-full border border-gold/50 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-navy-deep">
                  View portal as member
                </Link>
                <button type="button" aria-label="Close profile" onClick={() => setDetailId(null)} className="text-ivory/60 hover:text-gold">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
              {detail.isLoading ? (
                <p className="text-base text-gold">Opening profile…</p>
              ) : detail.error || !detail.data ? (
                <p className="text-base text-ivory/55">This profile could not be loaded.</p>
              ) : (
                <div className="space-y-7">
                  {(() => {
                    const member = detail.data.member;
                    const profile = detail.data.profile;
                    const journey = detail.data.journey;
                    const stage = profile?.submitted_at ? 5 : profile?.current_stage ?? 0;
                    const profileState = profile?.submitted_at ? "Submitted" : profile ? "In progress" : "Not started";
                    const openInquiries = journey.inquiries.filter((inquiry: any) => inquiry.status === "open").length;
                    return <>
                      <MemberDetailsEditor key={member.id} member={member as any} preview={preview} onSaved={() => { void overview.refetch(); void detail.refetch(); }} />
                      <section className="border border-gold/20 bg-ivory/[.025] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gold">Journey status</p>
                            <h3 className="mt-2 font-display text-3xl">{profileState}</h3>
                            <p className="mt-1 text-sm text-ivory/50">{stage ? `Stage ${stage} of 5 · ${PORTAL_PROFILE_STAGES[stage - 1]}` : "No profile answers saved yet"}</p>
                          </div>
                          <span className="border border-gold/30 px-3 py-2 text-xs uppercase tracking-[0.14em] text-gold">{packageStatusLabel(member as any)}</span>
                        </div>
                        <dl className="mt-6 grid gap-5 border-t border-gold/15 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                          <Field label="Access" value={member.status} />
                          <Field label="Last visit" value={member.last_access_at ? new Date(member.last_access_at).toLocaleString() : "Not accessed yet"} />
                          <Field label="Documents available" value={String(journey.documentCount)} />
                          <Field label="Documents initialed" value={String(journey.acknowledgedDocumentCount)} />
                          <Field label="Questions sent" value={String(journey.inquiries.length)} />
                          <Field label="Open questions" value={String(openInquiries)} />
                          <Field label="Profile last saved" value={profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : "Not started"} />
                          <Field label="Profile submitted" value={profile?.submitted_at ? new Date(profile.submitted_at).toLocaleString() : "Not submitted"} />
                        </dl>
                      </section>

                      <Block label="Recent journey activity">
                        {journey.activity.length ? journey.activity.slice(0, 8).map((event: any) => (
                          <div key={event.id} className="flex gap-3 border-l border-gold/30 pl-3">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                            <div>
                              <p className="text-base text-ivory/75">{activityLabel(event.event_type)}</p>
                              <p className="mt-1 text-xs text-ivory/40">{new Date(event.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        )) : <p className="text-base text-ivory/50">No recorded activity yet.</p>}
                      </Block>
                    </>;
                  })()}
                  {!detail.data.profile ? (
                    <section className="border border-gold/20 p-6">
                      <p className="text-base text-ivory/55">This member has not started their profile yet. Their saved answers will appear here as they move through each stage.</p>
                    </section>
                  ) : <>
                  {detail.data.headshotUrl && (
                    <img
                      src={detail.data.headshotUrl}
                      alt="Member headshot"
                      className="h-40 w-40 border border-gold/30 object-cover"
                    />
                  )}
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field label="Preferred name" value={detail.data.profile.preferred_name} />
                    <Field label="Professional role" value={detail.data.profile.professional_role} />
                    <Field label="Organization" value={detail.data.profile.current_organization} />
                    <Field label="Preferred email" value={detail.data.profile.preferred_email} />
                    <Field label="Preferred phone" value={detail.data.profile.preferred_phone} />
                    <Field
                      label="Submitted"
                      value={detail.data.profile.submitted_at ? new Date(detail.data.profile.submitted_at).toLocaleString() : "Not submitted yet"}
                    />
                  </dl>
                  <Block label="Short bio">
                    <div className="sm:col-span-2"><Field label="Short bio" value={detail.data.profile.bio} /></div>
                  </Block>
                  <Block label={hasFitAnswers(detail.data.profile.experience_answers) ? "Where You Fit" : "Previous experience responses"}>
                    {fitReadoutRows(detail.data.profile.experience_answers).map(({ label, value }) => <Field key={label} label={label} value={value} />)}
                  </Block>
                  <Block label={hasCommunicationPreferences(detail.data.profile.visibility_instructions) ? "Profile & communication preferences" : "Previous visibility permissions"}>
                    {communicationReadoutRows(detail.data.profile.visibility_instructions).map(({ label, value }) => <Field key={label} label={label} value={value} />)}
                  </Block>
                  {(detail.data.profile.restriction_status || detail.data.profile.restriction_details) && <Block label="Previous restrictions">
                    <Field label="Status" value={detail.data.profile.restriction_status} />
                    <Field label="Details" value={detail.data.profile.restriction_details} />
                  </Block>}
                  <Block label="Notes and questions">
                    <Field label="Final notes" value={detail.data.profile.final_notes} />
                    <Field label="Questions" value={detail.data.profile.questions} />
                    <Field label="Contact requested" value={detail.data.profile.contact_requested ? "Yes" : "No"} />
                  </Block>
                  </>}
                </div>
              )}

              <AdminMemberDocuments
                memberId={detailId}
                memberName={(() => {
                  const m = members.find((x) => x.id === detailId);
                  return m ? `${m.first_name} ${m.last_name}` : "this member";
                })()}
                preview={preview}
              />
            </div>
          </div>
        </div>
      )}

      {invitePreviewOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-navy-deep/90 p-3 backdrop-blur sm:p-6">
          <div className="flex h-full max-h-[94vh] w-full max-w-[980px] flex-col border border-gold/30 bg-navy">
            <div className="flex items-start justify-between gap-5 border-b border-gold/20 px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">Invitation review</p>
                <p className="mt-1 truncate text-base text-ivory/75">{INVITE_EMAIL_SUBJECT}</p>
              </div>
              <Button type="button" size="icon" variant="ghost" aria-label="Close invitation preview" onClick={() => setInvitePreviewOpen(false)} className="shrink-0 text-ivory/60 hover:text-gold">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-gold/20 px-5 py-3 sm:px-7">
              <span className="text-xs uppercase tracking-[0.16em] text-gold">Send a test</span>
              <Input type="email" value={inviteTestTo} onChange={(e) => setInviteTestTo(e.target.value)} placeholder="name@example.com" aria-label="Test email address" className="max-w-xs text-base" />
              <Button type="button" variant="outline" className="rounded-none text-base" onClick={() => void sendInviteTest()}>Send test invitation</Button>
              {inviteTestStatus && <span className="text-sm text-ivory/65">{inviteTestStatus}</span>}
            </div>

            <div className="grid gap-px bg-gold/15 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-navy px-5 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-gold">Greeting</p>
                <p className="mt-1 text-base text-ivory">Welcome, {capitalizeInviteName(inviteDraft.first_name)}!</p>
              </div>
              <div className="bg-navy px-5 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-gold">Company &amp; role</p>
                <p className="mt-1 text-base text-ivory">{memberCandidateLabel(inviteDraft.role, inviteDraft.entity, !!inviteDraft.is_candidate)}</p>
              </div>
              <div className="bg-navy px-5 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-gold">Logos shown</p>
                <p className="mt-1 text-base text-ivory">{inviteDraft.is_candidate || inviteDraft.entity === "both" ? "PRSC + DIS" : inviteDraft.entity.toUpperCase()}</p>
              </div>
              <div className="bg-navy px-5 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-gold">Contact</p>
                <a className="mt-1 block truncate text-base text-gold underline" href={`mailto:${INVITE_EMAIL_REPLY_TO}`}>{INVITE_EMAIL_REPLY_TO}</a>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-ivory p-2 sm:p-4">
              <iframe title="Exact invitation email preview" sandbox="" srcDoc={invitePreviewHtml} className="h-full min-h-[420px] w-full bg-ivory" />
            </div>

            <div className="border-t border-gold/20 px-5 py-4 sm:px-7">
              <p className="mb-3 text-sm text-ivory/50">This is how the invitation will look. Use Send invitation to deliver it with a working access link.</p>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button type="button" className="rounded-none border border-gold/40 bg-transparent text-base text-ivory hover:bg-gold/10 hover:text-gold" onClick={() => popOutEmail(invitePreviewHtml)}><ExternalLink className="mr-2 h-4 w-4" />Pop out full size</Button>
                <Button type="button" className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={() => setInvitePreviewOpen(false)}>Keep editing</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-navy-deep/85 p-4 backdrop-blur">
          <div className="flex h-full max-h-[90vh] w-full max-w-[760px] flex-col border border-gold/30 bg-navy">
            <div className="flex items-center justify-between border-b border-gold/20 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">Branded preview</p>
                <p className="truncate text-base text-ivory/70">{applyTokens(draft.subject || "Subject line", tokens)}</p>
              </div>
              <button type="button" onClick={() => popOutEmail(previewHtml)} className="ml-auto mr-4 inline-flex shrink-0 items-center gap-1.5 text-sm text-gold underline hover:text-gold-light"><ExternalLink className="h-4 w-4" />Pop out</button>
              <button type="button" aria-label="Close preview" onClick={() => setPreviewOpen(false)} className="text-ivory/60 hover:text-gold">
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe title="Email preview" srcDoc={previewHtml} className="h-full w-full flex-1 bg-white" />
            <div className="flex items-center justify-end gap-3 border-t border-gold/20 px-5 py-3">
              <Button type="button" className="rounded-none border border-gold/40 bg-transparent text-base text-ivory hover:bg-gold/10 hover:text-gold" onClick={() => setPreviewOpen(false)}>
                Keep editing
              </Button>
              {isTemplateMode && (
              <Button type="button" className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={saveDraft}>
                Save template
              </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalShell>
    <Dialog open={meetingDialog !== null} onOpenChange={(o) => !o && setMeetingDialog(null)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-gold/30 bg-navy text-ivory">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-ivory">Set Up a New Meeting</DialogTitle>
          <DialogDescription className="text-ivory/60">Save the meeting and it attaches to the email you're working on. Your draft stays as it is.</DialogDescription>
        </DialogHeader>
        {meetingDialog && (
          <MeetingSetupForm
            allowNoInvitees={meetingDialog === "invite"}
            defaultType={meetingDialog === "invite" ? (inviteDraft.role === "methodology_committee" || inviteDraft.is_methodology_committee ? "methodology" : inviteDraft.role === "advisor" ? "advisory" : "board") : "board"}
            submitLabel="Save and attach to this email"
            onCreated={(id) => void onMeetingCreated(id)}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

function InfoTip({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`About: ${title}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="grid h-7 w-7 place-items-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold/10"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-40 w-72 border border-gold/30 bg-navy-deep p-4 shadow-xl shadow-black/40">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">{title}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ivory/70">{body}</p>
        </div>
      )}
    </div>
  );
}


function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.16em] text-gold">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-ivory/75">{value || "—"}</dd>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gold/15 pt-5">
      <p className="text-sm uppercase tracking-[0.18em] text-ivory/45">{label}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function activityLabel(eventType: string) {
  const labels: Record<string, string> = {
    profile_submitted: "Profile submitted",
    inquiry_submitted: "Private question sent",
    access_revoked: "Access revoked",
    member_deleted: "Member permanently deleted",
    meeting_deleted: "Meeting deleted",
    access_restored: "Access restored",
    package_status_changed: "Package status updated",
    document_added: "Document added",
    document_acknowledged: "Document viewed and initialed",
    documents_released: "Documents released",
    boldsign_confirmed: "BoldSign signature confirmed",
    boldsign_unconfirmed: "BoldSign check-off removed",
    signed_copy_sent: "Signed copy emailed",
    nudge_sent: "Reminder sent",
    invited: "Invited",
    invite_resent: "Invitation re-sent",
    accessed: "Signed in",
    profile_saved: "Profile progress saved",
  };
  return labels[eventType] ?? eventType.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
