import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { render } from "@react-email/render";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Clock3,
  Eye,
  FileText,
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
  nudgeMember,
  setMemberAccess,
  setMemberPackageStatus,
  updateInquiry,
} from "@/lib/portal.functions";
import { draftWhyYou, draftWhyYouPreview } from "@/lib/why-you-draft.functions";
import {
  deleteEmailTemplate,
  deleteEmailHistory,
  getEmailCenter,
  saveEmailTemplate,
  sendMemberEmail,
  type EmailSend,
  type EmailTemplate,
} from "@/lib/portal-email.functions";
import { applyTokens, buildMemberTokens, parseSignatures, renderBrandedEmail } from "@/lib/branded-email";
import { PortalShell, type PortalNotification } from "@/components/portal/PortalShell";
import { AdminMemberDocuments } from "@/components/portal/AdminMemberDocuments";
import { isPreviewHost } from "@/routes/_authenticated/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InviteEmail, capitalizeInviteName, inviteEntityCopy } from "@/lib/email-templates/invite";
import { INVITE_EMAIL_PREVIEW_URL, INVITE_EMAIL_REPLY_TO, INVITE_EMAIL_SUBJECT, INVITE_ROLE_LABELS } from "@/lib/invite-email-config";
import { sendInviteEmailTest, type InviteEmailReview } from "@/lib/portal-invite-email.functions";
import { PORTAL_EXPERIENCE_QUESTIONS, PORTAL_PERMISSION_LABELS, PORTAL_PROFILE_STAGES, PORTAL_VISIBILITY_PERMISSIONS } from "@/lib/portal-profile-fields";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administrator Center | PRSC" },
      { name: "description", content: "Private administrator center for member access, profiles, and inquiries." },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { property: "og:title", content: "Administrator Center | PRSC" },
      { property: "og:description", content: "Private administrator center for member access, profiles, and inquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

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
      signatures: "Shirley Johnson|Founder, Partnership Readiness Standards Council / Decision Intelligence Systems",
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
      signatures: "Shirley Johnson, Founder & CEO\nBobbie Laurel, Co-Founder & Chief Operations Officer\nDave Nussbaum, Chief Information Officer",
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

type MemberRow = {
  first_name: string; last_name: string; email: string; organization: string;
  title: string; entity: "prsc" | "dis" | "both"; role: "board_member" | "advisor" | "prsc_board_dis_advisor" | "prsc_advisor_dis_board"; why_you: string;
};
type StagedRow = MemberRow & { linkedin_url: string; background: string };

const emptyInvite: InviteEmailReview = {
  first_name: "",
  last_name: "",
  email: "",
  organization: "",
  title: "",
  entity: "prsc",
  role: "board_member",
  why_you: "",
};

const LIST_HEADERS = "first_name,last_name,email,organization,title,entity,role,linkedin_url,background,why_you";
const LIST_TEMPLATE = `${LIST_HEADERS}\nJane,Doe,jane@example.com,Example Group,Managing Partner,both,prsc_board_dis_advisor,https://www.linkedin.com/in/janedoe,"Paste their LinkedIn About and Experience text here. Leave why_you blank to have it drafted.",\n`;

function splitCsvLine(line: string) {
  const out: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else value += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(value); value = ""; }
    else value += ch;
  }
  out.push(value);
  return out.map((v) => v.trim());
}

// Split CSV into records, keeping line breaks inside quoted cells (pasted LinkedIn text often has them).
function splitCsvRecords(text: string) {
  const records: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of text.replace(/\r\n?/g, "\n")) {
    if (ch === '"') quoted = !quoted;
    if (ch === "\n" && !quoted) { records.push(cur); cur = ""; } else cur += ch;
  }
  records.push(cur);
  return records.filter((l) => l.trim().length > 0);
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
}

function parseMemberList(text: string): { rows: StagedRow[]; errors: string[] } {
  const lines = splitCsvRecords(text);
  const errors: string[] = [];
  if (lines.length < 2) return { rows: [], errors: ["The file needs a header row and at least one member."] };

  const headers = splitCsvLine(lines[0]).map(normalizeKey);
  const alias: Record<string, string> = {
    first: "first_name", firstname: "first_name", last: "last_name", lastname: "last_name",
    email_address: "email", company: "organization", org: "organization",
    designation: "entity", entity_designation: "entity", why: "why_you", why_they_were_chosen: "why_you",
    linkedin: "linkedin_url", linkedin_profile: "linkedin_url",
    bio: "background", about: "background", experience: "background", linkedin_bio: "background", linkedin_background: "background",
  };
  const keys = headers.map((h) => alias[h] ?? h);
  const required = ["first_name", "last_name", "email", "organization", "entity", "role"];
  const missing = required.filter((r) => !keys.includes(r));
  if (missing.length) return { rows: [], errors: [`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`] };

  const rows: StagedRow[] = [];
  lines.slice(1).forEach((line, index) => {
    const cells = splitCsvLine(line);
    const record: Record<string, string> = {};
    keys.forEach((k, i) => { record[k] = cells[i] ?? ""; });
    const label = `Row ${index + 2}`;

    const entityRaw = record["entity"]?.toLowerCase();
    const entity = entityRaw === "prsc" || entityRaw === "dis" || entityRaw === "both" ? entityRaw : null;
    const roleRaw = record["role"]?.toLowerCase().replace(/[\s-]+/g, "_");
    const mixed: Record<string, MemberRow["role"]> = {
      prsc_board_dis_advisor: "prsc_board_dis_advisor", prsc_board_member_dis_advisor: "prsc_board_dis_advisor", "prsc_board_+_dis_advisor": "prsc_board_dis_advisor",
      prsc_advisor_dis_board: "prsc_advisor_dis_board", prsc_advisor_dis_board_member: "prsc_advisor_dis_board", "prsc_advisor_+_dis_board": "prsc_advisor_dis_board",
    };
    const role = roleRaw === "advisor" ? "advisor" : roleRaw === "board_member" || roleRaw === "board" ? "board_member" : roleRaw ? mixed[roleRaw] ?? null : null;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(record["email"] ?? "")) return errors.push(`${label}: a valid email is required.`);
    if (!record["first_name"] || !record["last_name"]) return errors.push(`${label}: first and last name are required.`);
    if (!record["organization"]) return errors.push(`${label}: organization is required.`);
    if (!entity) return errors.push(`${label}: designation must be PRSC, DIS, or Both.`);
    if (!role) return errors.push(`${label}: role must be board_member, advisor, prsc_board_dis_advisor, or prsc_advisor_dis_board.`);
    if (role.startsWith("prsc_") && entity !== "both") return errors.push(`${label}: mixed PRSC/DIS roles require designation Both.`);
    const why = (record["why_you"] ?? "").trim();
    const background = (record["background"] ?? "").trim().slice(0, 8000);

    rows.push({
      first_name: record["first_name"], last_name: record["last_name"], email: record["email"],
      organization: record["organization"], title: record["title"] ?? "",
      entity, role, why_you: why,
      linkedin_url: (record["linkedin_url"] ?? "").slice(0, 300), background,
    });
  });

  return { rows, errors };
}

function downloadListTemplate() {
  const url = URL.createObjectURL(new Blob([LIST_TEMPLATE], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "prsc-member-list-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Admin() {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setHasSession(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);
  // Test mode only when viewing an unsigned builder preview; signed-in admins always run real actions.
  const preview = isPreviewHost() && !hasSession;
  const overview = useQuery({
    queryKey: ["portal-admin"],
    queryFn: () => (preview ? Promise.resolve(demoOverview) : getAdminOverview()),
    retry: false,
  });
  const email = useQuery({
    queryKey: ["portal-admin-email"],
    queryFn: () => (preview ? Promise.resolve(demoEmailCenter) : getEmailCenter()),
    retry: false,
  });

  const [status, setStatus] = useState("");
  const [inviteDraft, setInviteDraft] = useState<InviteEmailReview>(emptyInvite);
  const [aiLinkedin, setAiLinkedin] = useState("");
  const [aiBackground, setAiBackground] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const runAiDraft = async () => {
    if (aiDrafting) return;
    setAiDrafting(true); setAiStatus("");
    try {
      const { draft: text } = await (preview ? draftWhyYouPreview : draftWhyYou)({ data: {
        first_name: inviteDraft.first_name, last_name: inviteDraft.last_name, organization: inviteDraft.organization,
        title: inviteDraft.title, entity: inviteDraft.entity, role: inviteDraft.role,
        linkedin_url: aiLinkedin, background: aiBackground,
      } });
      setInviteDraft((d) => ({ ...d, why_you: text }));
      setAiStatus("Draft added below. Review and edit before sending.");
    } catch (err) {
      setAiStatus((err as Error).message || "The draft could not be created.");
    } finally { setAiDrafting(false); }
  };
  const [invitePreviewOpen, setInvitePreviewOpen] = useState(false);
  const [invitePreviewHtml, setInvitePreviewHtml] = useState("");
  const [inviteTestStatus, setInviteTestStatus] = useState("");
  const [inviteTestSending, setInviteTestSending] = useState(false);
  const inviteFormRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
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

  async function onMemberList(file: File) {
    setImportResults([]);
    setImportStatus("");
    const { rows, errors } = parseMemberList(await file.text());
    setImportRows(rows);
    setImportErrors(errors);
    setImportStatus(
      rows.length
        ? `${rows.length} member${rows.length === 1 ? "" : "s"} ready from ${file.name}.`
        : `No usable rows found in ${file.name}.`,
    );
  }

  function updateImportRow(i: number, patch: Partial<StagedRow>) {
    setImportRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function draftNote(r: StagedRow) {
    const { draft: text } = await (preview ? draftWhyYouPreview : draftWhyYou)({ data: {
      first_name: r.first_name, last_name: r.last_name, organization: r.organization, title: r.title,
      entity: r.entity, role: r.role, linkedin_url: r.linkedin_url, background: r.background,
    } });
    return text;
  }

  async function draftRow(i: number) {
    const r = importRows[i];
    setRowDrafting(r.email);
    try { updateImportRow(i, { why_you: await draftNote(r) }); }
    catch (err) { setBatchProgress(`${r.first_name}: ${(err as Error).message}`); }
    finally { setRowDrafting(""); }
  }

  async function draftAllNotes() {
    const targets = importRows.map((r, i) => ({ r, i })).filter(({ r }) => r.why_you.trim().length < 20);
    setBatchDrafting(true);
    let done = 0, failed = 0;
    for (const { r, i } of targets) {
      setBatchProgress(`Drafting note ${done + failed + 1} of ${targets.length} for ${r.first_name} ${r.last_name}…`);
      try { const text = await draftNote(r); updateImportRow(i, { why_you: text }); done += 1; }
      catch (err) {
        failed += 1;
        if (/credits|Too many/.test((err as Error).message)) { setBatchProgress((err as Error).message); break; }
      }
    }
    setBatchDrafting(false);
    setBatchProgress(`${done} note${done === 1 ? "" : "s"} drafted${failed ? `, ${failed} failed — use Draft with AI to retry` : ""}. Review each before sending.`);
  }

  async function runImport() {
    if (!importRows.length) return;
    if (preview) {
      setImportStatus("Preview mode: the list uploads once you are signed in.");
      return;
    }
    setImporting(true);
    try {
      const rows: MemberRow[] = importRows.map(({ linkedin_url: _l, background: _b, ...rest }) => rest);
      const res = await importPortalMembers({ data: { rows, send_invitations: sendOnImport } });
      setImportResults(res.results);
      setImportStatus(`${res.added} added${res.failed ? `, ${res.failed} could not be added` : ""}.`);
      setImportRows([]);
      if (listRef.current) listRef.current.value = "";
      await overview.refetch();
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "The list could not be uploaded.");
    } finally {
      setImporting(false);
    }
  }

  function clearImport() {
    setImportRows([]);
    setImportErrors([]);
    setImportResults([]);
    setImportStatus("");
    if (listRef.current) listRef.current.value = "";
  }

  const detail = useQuery({
    queryKey: ["portal-admin-member", detailId],
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
      setMemberBusy(error instanceof Error ? error.message : "Could not update access.");
    }
  }

  async function changePackage(id: string, value: string) {
    if (preview) return setMemberBusy("Preview mode: package changes are available once you are signed in.");
    try {
      await setMemberPackageStatus({ data: { member_id: id, package_status: value as any } });
      setMemberBusy("Package status updated.");
      await overview.refetch();
    } catch (error) {
      setMemberBusy(error instanceof Error ? error.message : "Could not update the package status.");
    }
  }

  async function removeSelectedMembers() {
    if (selectedMemberIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedMemberIds.length} selected member record${selectedMemberIds.length === 1 ? "" : "s"} and all associated test data? This cannot be undone.`)) return;
    if (preview) return setMemberBusy("Preview mode: member deletion is available once you are signed in.");
    try {
      for (const memberId of selectedMemberIds) {
        await deletePortalMember({ data: { member_id: memberId } });
      }
      setRecipients((current) => current.filter((memberId) => !selectedMemberIds.includes(memberId)));
      if (detailId && selectedMemberIds.includes(detailId)) setDetailId(null);
      setSelectedMemberIds([]);
      setSelectedEmailIds([]);
      setMemberBusy(`${selectedMemberIds.length} selected member record${selectedMemberIds.length === 1 ? " was" : "s were"} deleted.`);
      await Promise.all([overview.refetch(), email.refetch()]);
    } catch (error) {
      setMemberBusy(error instanceof Error ? error.message : "Could not delete the selected members.");
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
      setMemberBusy(error instanceof Error ? error.message : "Could not delete the selected email records.");
    }
  }

  async function saveInquiry(id: string, status: "open" | "resolved", notes: string) {
    if (preview) return setMemberBusy("Preview mode: inquiry updates are available once you are signed in.");
    try {
      await updateInquiry({ data: { id, status, admin_notes: notes } });
      setMemberBusy(status === "resolved" ? "Inquiry marked resolved." : "Inquiry reopened.");
      await overview.refetch();
    } catch (error) {
      setMemberBusy(error instanceof Error ? error.message : "Could not update the inquiry.");
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
          href: "#inquiries",
        });
      }
    }
    for (const m of members) {
      if (m.package_status === "awaiting_profile") {
        items.push({
          id: `prof-${m.id}`,
          label: `${m.first_name} ${m.last_name} has not completed a profile`,
          detail: (sendsByMember.get(m.id)?.length ?? 0) === 0 ? "No email sent yet — send a prompt" : "Send a reminder",
          href: "#email-center",
        });
      }
      if (m.package_status === "profile_received") {
        items.push({
          id: `pkg-${m.id}`,
          label: `${m.first_name} ${m.last_name} submitted a profile`,
          detail: "Package preparation can begin",
          href: "#tracker",
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
          href: "#tracker",
        });
      }
    }
    return items;
  }, [overview.data, members, sends, sendsByMember]);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (preview) {
      setStatus("Preview mode: invitation validated but not sent. Invites send on the live admin page.");
      return;
    }
    try {
      await invitePortalMember({ data: inviteDraft });
      setStatus("Invitation sent.");
      form.reset();
      setInviteDraft(emptyInvite);
      await overview.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invitation failed.");
    }
  }

  async function openInvitePreview() {
    const form = inviteFormRef.current;
    if (!form?.reportValidity()) return;
    setStatus("");
    setInviteTestStatus("");
    try {
      const html = await render(
        <InviteEmail
          confirmationUrl={INVITE_EMAIL_PREVIEW_URL}
          firstName={inviteDraft.first_name}
          recipientEmail={inviteDraft.email}
          entity={inviteDraft.entity}
          roleLabel={INVITE_ROLE_LABELS[inviteDraft.role]}
          copy={inviteTemplate}
        />,
      );
      setInvitePreviewHtml(html);
      setInvitePreviewOpen(true);
    } catch {
      setStatus("The invitation preview could not be prepared.");
    }
  }

  async function sendInviteTest() {
    if (preview) {
      setInviteTestStatus("Test delivery is available after signing in on the live admin page.");
      return;
    }
    setInviteTestSending(true);
    setInviteTestStatus("");
    try {
      const result = await sendInviteEmailTest({ data: inviteDraft });
      setInviteTestStatus(`Test sent to ${result.sentTo}. No member was created.`);
    } catch (error) {
      setInviteTestStatus(error instanceof Error ? error.message : "The invitation test could not be sent.");
    } finally {
      setInviteTestSending(false);
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
    setDraft((d) => ({
      ...d,
      name: d.name || file.name.replace(/\.[^.]+$/, ""),
      body: stripped,
    }));
    setEmailStatus(`Loaded content from ${file.name}. Review it before sending.`);
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
      const message = error instanceof Error ? error.message : "Could not save the template.";
      setEmailStatus(message);

    }
  }

  async function removeTemplate(id: string) {
    if (preview) return;
    try {
      await deleteEmailTemplate({ data: { id } });
      if (draft.id === id) setDraft(emptyDraft);
      await email.refetch();
    } catch (error) {
      setEmailStatus(error instanceof Error ? error.message : "Could not remove the template.");
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
    setSending(true);
    try {
      const res = await sendMemberEmail({
        data: {
          template_id: draft.id || null,
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
        },
      });
      const failed = res.results.filter((r) => r.status !== "sent").length;
      setEmailStatus(failed ? `${res.results.length - failed} sent, ${failed} failed.` : `Sent to ${res.results.length} member(s).`);
      setRecipients([]);
      await email.refetch();
    } catch (error) {
      setEmailStatus(error instanceof Error ? error.message : "Sending failed.");
    } finally {
      setSending(false);
    }
  }

  const previewMember = members.find((m) => m.id === recipients[0]) ?? members[0];
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
        roleLabel={INVITE_ROLE_LABELS[m?.role as keyof typeof INVITE_ROLE_LABELS] ?? "Advisor"}
        copy={draft}
      />,
    ).then((html) => alive && setInviteComposeHtml(html));
    return () => {
      alive = false;
    };
  }, [editingInvite, draft, previewMember]);

  const previewHtml = editingInvite && inviteComposeHtml ? inviteComposeHtml : renderBrandedEmail({
    subject: applyTokens(draft.subject || "Subject line", tokens),
    eyebrow: applyTokens(draft.eyebrow, tokens),
    heading: applyTokens(draft.heading, tokens),
    body: applyTokens(draft.body || "Your email content will appear here.", tokens),
    ctaLabel: draft.cta_label || null,
    ctaUrl: draft.cta_url || null,
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
  const stageOf = (m: any) => {
    const p = profilesById.get(m.id);
    const prog = docProgress[m.id];
    if (m.status === "revoked") return { key: "revoked", label: "Access revoked", detail: "", tone: "border-red-400/35 text-red-300/85", nudge: false, progress: 0 };
    if (!m.first_access_at && !p) return { key: "invited", label: "Invited", detail: "Hasn't signed in yet", tone: "border-ivory/25 text-ivory/70", nudge: true, progress: 0 };
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
      setMemberBusy((err as Error).message || "The reminder could not be sent.");
    } finally { setNudging(""); }
  };
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const date = (v: string | null | undefined) => (v ? new Date(v).toISOString().slice(0, 10) : "");
    const header = ["First name", "Last name", "Email", "Organization", "Title", "Company", "Role", "Access", "Stage", "Invited", "Last sign-in", "Profile submitted", "Documents done", "Documents total", "Documents completed",
      "Preferred name", "Professional role", "Current organization", "Preferred email", "Preferred phone",
      ...PORTAL_EXPERIENCE_QUESTIONS, ...PORTAL_VISIBILITY_PERMISSIONS, "Restrictions", "Restriction details", "Final notes", "Questions"];
    const rows = filteredMembers.map((m: any) => {
      const p = profilesById.get(m.id) ?? {};
      const prog = docProgress[m.id];
      const ans = p.experience_answers ?? {};
      const vis = p.visibility_instructions ?? {};
      return [m.first_name, m.last_name, m.email, m.organization, m.title, String(m.entity).toUpperCase(), INVITE_ROLE_LABELS[m.role as keyof typeof INVITE_ROLE_LABELS] ?? m.role, m.status, stageOf(m).label,
        date(m.invited_at), date(m.last_access_at), date(p.submitted_at), prog?.done ?? "", prog?.total ?? "", date(m.documents_completed_at),
        p.preferred_name, p.professional_role, p.current_organization, p.preferred_email, p.preferred_phone,
        ...PORTAL_EXPERIENCE_QUESTIONS.map((_, i) => ans[`q${i + 1}`] ?? ""),
        ...PORTAL_VISIBILITY_PERMISSIONS.map((_, i) => PORTAL_PERMISSION_LABELS[vis[`p${i + 1}`]] ?? ""),
        p.restriction_status, p.restriction_details, p.final_notes, p.questions].map(esc).join(",");
    });
    const blob = new Blob(["\ufeff" + [header.map(esc).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PortalShell
      admin
      notifications={notifications}
      stats={[
        { label: "Members", value: d.members.length },
        { label: "Open inquiries", value: d.inquiries.filter((x: any) => x.status === "open").length },
        { label: "Email templates", value: templates.length },
        { label: "Recent events", value: d.activity.length },
      ]}
    >
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 border-b border-gold/20 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase text-gold">Administration</p>
            <h1 className="mt-3 font-display text-5xl">Private center</h1>
          </div>
          <p className="text-base text-ivory/45">Member access, submissions, and inquiries</p>
        </div>

        <div className="mt-10 grid items-start gap-6 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-8">
            <section className="border border-gold/20 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MailPlus className="h-5 w-5 text-gold" />
                  <h2 className="font-display text-3xl">Invite a member</h2>
                </div>
                <InfoTip
                  title="Invite a member"
                  body="Add a board member or advisor here. Before sending their first welcome email, explain why this person was chosen. That private, personalized message appears prominently in their welcome center. Choose PRSC, DIS, or Both — their portal language adapts to the designation."
                />
              </div>
              <form ref={inviteFormRef} onSubmit={invite} className="mt-7 grid gap-4 sm:grid-cols-2">
                <Input name="first_name" value={inviteDraft.first_name} onChange={(e) => setInviteDraft({ ...inviteDraft, first_name: e.target.value })} placeholder="First name" required className="text-base" />
                <Input name="last_name" value={inviteDraft.last_name} onChange={(e) => setInviteDraft({ ...inviteDraft, last_name: e.target.value })} placeholder="Last name" required className="text-base" />
                <Input name="email" type="email" value={inviteDraft.email} onChange={(e) => setInviteDraft({ ...inviteDraft, email: e.target.value })} placeholder="Email" required className="text-base" />
                <Input name="organization" value={inviteDraft.organization} onChange={(e) => setInviteDraft({ ...inviteDraft, organization: e.target.value })} placeholder="Organization" required className="text-base" />
                <Input name="title" value={inviteDraft.title} onChange={(e) => setInviteDraft({ ...inviteDraft, title: e.target.value })} placeholder="Title" required className="text-base" />
                <select name="entity" value={inviteDraft.entity} onChange={(e) => { const entity = e.target.value as InviteEmailReview["entity"]; setInviteDraft({ ...inviteDraft, entity, role: entity !== "both" && inviteDraft.role.startsWith("prsc_") ? "board_member" : inviteDraft.role }); }} required className="h-9 w-full min-w-0 rounded-md border border-input bg-navy px-3 text-base">
                  <option value="prsc">PRSC</option>
                  <option value="dis">DIS</option>
                  <option value="both">Both</option>
                </select>
                <select name="role" value={inviteDraft.role} onChange={(e) => { const role = e.target.value as InviteEmailReview["role"]; setInviteDraft({ ...inviteDraft, role, entity: role.startsWith("prsc_") ? "both" : inviteDraft.entity }); }} required className="h-9 w-full min-w-0 rounded-md border border-input bg-navy px-3 text-base">
                  <option value="board_member">Board member</option>
                  <option value="advisor">Advisor</option>
                  <option value="prsc_board_dis_advisor">PRSC Board member + DIS Advisor</option>
                  <option value="prsc_advisor_dis_board">PRSC Advisor + DIS Board member</option>
                </select>
                <div className="grid gap-3 border border-gold/20 p-4 sm:col-span-2">
                  <span className="text-base font-medium text-ivory/90">Draft “Why You” with AI (optional)</span>
                  <span className="text-sm leading-6 text-ivory/55">Fill in their name, title, and organization above, then click Draft with AI — the “Why this candidate was chosen” field fills in for you to review. For a more personal note, optionally paste their LinkedIn About and Experience text below.</span>
                  <Input value={aiLinkedin} onChange={(e) => setAiLinkedin(e.target.value)} placeholder="LinkedIn profile link (optional)" className="text-base" />
                  <Textarea value={aiBackground} onChange={(e) => setAiBackground(e.target.value)} placeholder="Optional: paste their LinkedIn About and Experience text for a more personal note" className="min-h-28 text-base" />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" disabled={aiDrafting} className="rounded-none text-base" onClick={() => void runAiDraft()}>
                      {aiDrafting ? "Drafting…" : "Draft with AI"}
                    </Button>
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
                <Button type="submit" className="rounded-none bg-gold text-base font-semibold text-navy opacity-100 hover:bg-gold/85 hover:text-navy focus-visible:bg-gold/85 active:bg-gold/75">Send invitation</Button>
                {status && <p className="text-base text-ivory/60 sm:col-span-2">{status}</p>}
              </form>
            </section>

            <section className="border border-gold/20 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-gold" />
                  <h2 className="font-display text-3xl">Upload a member list</h2>
                </div>
                <InfoTip
                  title="Upload a member list"
                  body="Add many board members and advisors at once from a spreadsheet saved as CSV. Background text is optional — the AI can draft from name, title, and organization. Leave why_you blank — then click Generate AI notes for all. Review and edit each note, then add everyone and send all invitations in one click."
                />
              </div>

              <p className="mt-5 text-base leading-7 text-ivory/60">
                One row per person: first name, last name, email, organization, title, designation (PRSC, DIS, or Both),
                role (board_member, advisor, or for Both: prsc_board_dis_advisor / prsc_advisor_dis_board), LinkedIn URL, LinkedIn background, and an optional “why you” note — leave
                it blank to have it drafted for you.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" className="rounded-none text-base" onClick={downloadListTemplate}>
                  Download template
                </Button>
                <Button type="button" variant="outline" className="rounded-none text-base" onClick={() => listRef.current?.click()}>
                  Choose file
                </Button>
                <input
                  ref={listRef}
                  type="file"
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

              {importRows.length > 0 && (
                <div className="mt-6 space-y-4">
                  {importRows.map((r, i) => (
                    <div key={r.email} className="border border-gold/15 p-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
                        <span className="font-medium">{r.first_name} {r.last_name}</span>
                        <span className="text-ivory/60">{r.email}</span>
                        <span className="text-ivory/60">{[r.title, r.organization].filter(Boolean).join(", ")}</span>
                        <span className="uppercase text-gold">{r.entity}</span>
                        <span className="text-ivory/60">{INVITE_ROLE_LABELS[r.role]}</span>
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

              {importRows.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2.5 text-base text-ivory/75">
                    <input
                      type="checkbox"
                      checked={sendOnImport}
                      onChange={(e) => setSendOnImport(e.target.checked)}
                      className="h-4 w-4 accent-[hsl(var(--gold))]"
                    />
                    Send welcome invitations now
                  </label>
                  <Button type="button" disabled={importing || batchDrafting || importRows.some((r) => r.why_you.trim().length < 20)} className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={runImport}>
                    {importing ? "Uploading…" : `${sendOnImport ? "Add & invite" : "Add"} ${importRows.length} member${importRows.length === 1 ? "" : "s"}`}
                  </Button>
                  <Button type="button" variant="ghost" className="rounded-none text-base text-ivory/60" onClick={clearImport}>
                    <Trash2 className="mr-2 h-4 w-4" /> Discard
                  </Button>
                </div>
              )}

              {importStatus && <p className="mt-5 text-base text-ivory/60">{importStatus}</p>}

              {importResults.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-base">
                  {importResults.map((r) => (
                    <li key={r.email} className={r.ok ? "text-ivory/60" : "text-amber-300/80"}>
                      {r.email} — {r.message}
                    </li>
                  ))}
                </ul>
              )}
            </section>


            {/* Template sidebar — constrained to the same column width as the invite panel */}
            <aside className="border border-gold/20">
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
                        setEmailStatus(`Editing “${t.name}”.`);
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
                  setDraft(emptyDraft);
                  setEmailStatus("New template started.");
                }}
                className="flex w-full items-center justify-center gap-2 border-t border-gold/15 px-5 py-3 text-base text-gold transition-colors hover:bg-gold/10"
              >
                <Plus className="h-4 w-4" /> New template
              </button>
            </aside>
          </div>

          <div className="min-w-0">
            <section id="email-center" className="border border-gold/20 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Send className="h-5 w-5 text-gold" />
                  <h2 className="font-display text-3xl">Compose &amp; send</h2>
                  <InfoTip
                    title="Compose & send"
                    body="Write or edit an email here. Upload Content loads a .txt, .md, or .html file into the body. Use {{first_name}}, {{full_name}}, {{entity}}, {{role}}, and similar tokens — they personalize automatically per recipient. View in Template shows the exact branded email before anything is sent. Select recipients below, then Save Template to keep it or Send to deliver it. Members who already received the loaded template are flagged to prevent duplicates."
                  />
                </div>
                <div className="flex items-center gap-2">
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
                  <Button type="button" className="rounded-none border border-gold/40 bg-transparent text-base text-ivory hover:bg-gold/10 hover:text-gold" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload content
                  </Button>
                  <Button type="button" className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={() => setPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" /> View in template
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Template name" className="text-base" />
                <Input
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Short description (optional)"
                  className="text-base"
                />
                <Input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Subject line"
                  className="text-base sm:col-span-2"
                />
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

              <p className="mt-3 text-sm text-ivory/40">
                Personalize with {"{{first_name}}"}, {"{{last_name}}"}, {"{{full_name}}"}, {"{{organization}}"}, {"{{title}}"}, {"{{entity}}"}, {"{{entity_full}}"}, {"{{role}}"}, {"{{role_label}}"}, {"{{package_label}}"}.
              </p>

              <div className="mt-6 border-t border-gold/15 pt-5">
                <p className="text-xs uppercase tracking-[0.18em] text-gold">Recipients</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {members.map((m) => {
                    const already = draft.id
                      ? (sendsByMember.get(m.id) ?? []).some((s) => s.template_id === draft.id && s.status === "sent")
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

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="rounded-none border border-ivory/20 bg-transparent text-base text-ivory/70 hover:border-gold/40 hover:text-gold"
                  onClick={() => {
                    setDraft(emptyDraft);
                    setEmailStatus("");
                    setRecipients([]);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Discard
                </Button>
                <Button type="button" className="rounded-none border border-gold/40 bg-transparent text-base text-ivory hover:bg-gold/10 hover:text-gold" onClick={saveDraft}>
                  Save template
                </Button>
                <Button type="button" disabled={sending} className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={send}>
                  {sending ? "Sending…" : `Send to ${recipients.length || 0} member(s)`}
                </Button>
                {emailStatus && <p className="text-base text-ivory/60">{emailStatus}</p>}
              </div>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-8 xl:col-span-2">
            <section className="border border-gold/20 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="tracker" className="font-display text-3xl">
                  Members
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
                    <Trash2 className="h-3.5 w-3.5" /> Delete selected members ({selectedMemberIds.length})
                  </Button>
                  <InfoTip
                    title="Members"
                    body="Select only the member or individual email records you want to remove, then use the matching Delete selected action. Member deletion also removes that person’s associated test data."
                  />
                </div>
              </div>

              <div className="mt-5 border border-gold/25 bg-ivory/[.03] p-4 sm:p-5">
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
              </div>

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

              <div className="mt-3 overflow-x-auto border border-gold/20">
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
                    const all = sendsByMember.get(m.id) ?? [];
                    const list = all.filter((s) => s.status === "sent");
                    const failed = all.filter((s) => s.status !== "sent");
                    const revoked = m.status === "revoked";
                    return (
                      <tr key={m.id} className="border-t border-ivory/10 align-top">
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <label className="flex cursor-pointer items-start pt-1">
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
                              <span className={`mt-1 inline-block text-xs uppercase tracking-[0.14em] ${revoked ? "text-red-300/80" : "text-ivory/40"}`}>
                                Access: {m.status}
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="uppercase">{m.entity}</td>
                        <td className="py-4 pr-3">
                          <span className={`inline-block border px-2 py-1 text-xs uppercase tracking-[0.12em] ${st.tone}`}>{st.label}</span>
                          {st.detail && <span className="mt-1 block text-sm text-ivory/55">{st.detail}</span>}
                          {st.progress && (
                            <span className="mt-2 block h-1.5 w-28 bg-ivory/10"><span className="block h-full bg-gold" style={{ width: `${st.progress}%` }} /></span>
                          )}
                        </td>
                        <td className="py-4 pr-3">
                          <select
                            value={m.package_status}
                            onChange={(e) => void changePackage(m.id, e.target.value)}
                            className="h-9 w-full min-w-[150px] rounded-md border border-input bg-navy px-2 text-sm"
                          >
                            <option value="awaiting_profile">Awaiting profile</option>
                            <option value="in_preparation">In preparation</option>
                            <option value="profile_received">Profile received</option>
                            <option value="package_ready">Package ready</option>
                          </select>
                        </td>
                        <td className="py-4 pr-4">
                          {all.length === 0 ? (
                            <span className="text-ivory/40">None yet</span>
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
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailId(m.id)}
                              className="flex items-center gap-1.5 border border-gold/40 px-2.5 py-1.5 text-sm text-gold transition-colors hover:bg-gold/10"
                            >
                              <Eye className="h-3.5 w-3.5" /> View profile
                            </button>
                            {st.nudge && !revoked && (
                              <button
                                type="button"
                                disabled={nudging === m.id}
                                onClick={() => void nudge(m)}
                                className="flex items-center gap-1.5 border border-gold/40 px-2.5 py-1.5 text-sm text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                              >
                                <Send className="h-3.5 w-3.5" /> {nudging === m.id ? "Sending…" : "Nudge now"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void changeAccess(m.id, revoked ? "active" : "revoked")}
                              className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-sm transition-colors ${
                                revoked
                                  ? "border-ivory/25 text-ivory/70 hover:border-gold/40 hover:text-gold"
                                  : "border-red-400/35 text-red-300/85 hover:bg-red-400/10"
                              }`}
                            >
                              {revoked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                              {revoked ? "Reactivate" : "Revoke access"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              {memberBusy && <p className="mt-3 text-base text-ivory/60">{memberBusy}</p>}
            </section>

            <section className="border border-gold/20 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <h2 id="inquiries" className="font-display text-3xl">
                  Recent inquiries
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
            </section>

            <section className="border border-gold/20 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <h2 id="activity-log" className="font-display text-3xl">Activity log</h2>
                <InfoTip title="Activity log" body="A dated record of key steps: invitations, profile submissions, documents released, signatures, BoldSign check-offs, signed copies sent, and reminders you sent. Kept for your records in case anything is ever questioned." />
              </div>
              <div className="mt-5 max-h-[28rem] overflow-y-auto border border-gold/15">
                {d.activity.filter((a: any) => a.event_type).length === 0 ? (
                  <p className="p-4 text-base text-ivory/45">No activity recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-ivory/10">
                    {d.activity.filter((a: any) => a.event_type).map((a: any) => {
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
            </section>
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
              <button type="button" aria-label="Close profile" onClick={() => setDetailId(null)} className="text-ivory/60 hover:text-gold">
                <X className="h-5 w-5" />
              </button>
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
                      <section className="border border-gold/20 bg-ivory/[.025] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-gold">Journey status</p>
                            <h3 className="mt-2 font-display text-3xl">{profileState}</h3>
                            <p className="mt-1 text-sm text-ivory/50">{stage ? `Stage ${stage} of 5 · ${PORTAL_PROFILE_STAGES[stage - 1]}` : "No profile answers saved yet"}</p>
                          </div>
                          <span className="border border-gold/30 px-3 py-2 text-xs uppercase tracking-[0.14em] text-gold">{member.package_status.replaceAll("_", " ")}</span>
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
                  <Block label="Experience">
                    {PORTAL_EXPERIENCE_QUESTIONS.map((question, index) => <Field key={question} label={question} value={detail.data.profile?.experience_answers?.[`q${index + 1}`]} />)}
                  </Block>
                  <Block label="Visibility instructions">
                    {PORTAL_VISIBILITY_PERMISSIONS.map((permission, index) => {
                      const answer = detail.data.profile?.visibility_instructions?.[`p${index + 1}`];
                      return <Field key={permission} label={permission} value={answer ? PORTAL_PERMISSION_LABELS[answer] ?? answer : undefined} />;
                    })}
                  </Block>
                  <Block label="Restrictions">
                    <Field label="Status" value={detail.data.profile.restriction_status} />
                    <Field label="Details" value={detail.data.profile.restriction_details} />
                  </Block>
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

            <div className="grid gap-px bg-gold/15 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-navy px-5 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-gold">Greeting</p>
                <p className="mt-1 text-base text-ivory">Welcome, {capitalizeInviteName(inviteDraft.first_name)}!</p>
              </div>
              <div className="bg-navy px-5 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-gold">Company &amp; role</p>
                <p className="mt-1 text-base text-ivory">{inviteEntityCopy[inviteDraft.entity].short} · {INVITE_ROLE_LABELS[inviteDraft.role]}</p>
              </div>
              <div className="bg-navy px-5 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-gold">Logos shown</p>
                <p className="mt-1 text-base text-ivory">{inviteDraft.entity === "both" ? "PRSC + DIS" : inviteDraft.entity.toUpperCase()}</p>
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
              <p className="mb-3 text-sm text-ivory/50">The access button is disabled in this preview. A test goes to the email entered above and does not create an account. Use Send invitation for a working link.</p>
              <div className="flex flex-wrap items-center justify-end gap-3">
                {inviteTestStatus && <p aria-live="polite" className="mr-auto text-base text-ivory/70">{inviteTestStatus}</p>}
                <Button type="button" className="rounded-none border border-gold/40 bg-transparent text-base text-ivory hover:bg-gold/10 hover:text-gold" onClick={() => setInvitePreviewOpen(false)}>Keep editing</Button>
                <Button type="button" disabled={inviteTestSending || preview} className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={() => void sendInviteTest()}>
                  <Send className="mr-2 h-4 w-4" /> {inviteTestSending ? "Sending test…" : "Send test to this email"}
                </Button>
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
              <button type="button" aria-label="Close preview" onClick={() => setPreviewOpen(false)} className="text-ivory/60 hover:text-gold">
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe title="Email preview" srcDoc={previewHtml} className="h-full w-full flex-1 bg-white" />
            <div className="flex items-center justify-end gap-3 border-t border-gold/20 px-5 py-3">
              <Button type="button" className="rounded-none border border-gold/40 bg-transparent text-base text-ivory hover:bg-gold/10 hover:text-gold" onClick={() => setPreviewOpen(false)}>
                Keep editing
              </Button>
              <Button type="button" className="rounded-none bg-gold text-base text-navy hover:bg-gold-light hover:text-navy" onClick={saveDraft}>
                Save template
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
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
