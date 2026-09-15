import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  Info,
  MailPlus,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  getAdminOverview,
  getMemberDetail,
  invitePortalMember,
  setMemberAccess,
  setMemberPackageStatus,
  updateInquiry,
} from "@/lib/portal.functions";
import {
  deleteEmailTemplate,
  getEmailCenter,
  saveEmailTemplate,
  sendMemberEmail,
  type EmailSend,
  type EmailTemplate,
} from "@/lib/portal-email.functions";
import { applyTokens, buildMemberTokens, parseSignatures, renderBrandedEmail } from "@/lib/branded-email";
import { PortalShell, type PortalNotification } from "@/components/portal/PortalShell";
import { isPreviewHost } from "@/routes/_authenticated/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

const demoEmailCenter: { templates: EmailTemplate[]; sends: EmailSend[] } = {
  templates: [
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
      cta_subtext: "Your password will be sent to this same email upon entry.",
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

function Admin() {
  const preview = isPreviewHost();
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
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [emailStatus, setEmailStatus] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [memberBusy, setMemberBusy] = useState("");
  const [inquiryDraft, setInquiryDraft] = useState<Record<string, string>>({});

  const detail = useQuery({
    queryKey: ["portal-admin-member", detailId],
    enabled: Boolean(detailId) && !preview,
    retry: false,
    queryFn: () => getMemberDetail({ data: { member_id: detailId! } }),
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
  const templates: EmailTemplate[] = email.data?.templates ?? [];
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
    const f = new FormData(form);
    try {
      await invitePortalMember({
        data: {
          email: String(f.get("email")),
          first_name: String(f.get("first_name")),
          last_name: String(f.get("last_name")),
          organization: String(f.get("organization")),
          title: String(f.get("title")),
          entity: String(f.get("entity")) as "prsc" | "dis" | "both",
          role: String(f.get("role")) as "board_member" | "advisor",
          why_you: String(f.get("why_you")),
        },
      });
      setStatus("Invitation sent.");
      form.reset();
      await overview.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invitation failed.");
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
      setEmailStatus("Preview mode: templates are saved once you are signed in.");
      return;
    }
    try {
      const res = await saveEmailTemplate({ data: { ...draft, id: draft.id || undefined } });
      setDraft((d) => ({ ...d, id: res.id }));
      setEmailStatus("Template saved.");
      await email.refetch();
    } catch (error) {
      setEmailStatus(error instanceof Error ? error.message : "Could not save the template.");
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
  const previewHtml = renderBrandedEmail({
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

  return (
    <PortalShell admin notifications={notifications}>
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 border-b border-gold/20 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase text-gold">Administration</p>
            <h1 className="mt-3 font-display text-5xl">Private center</h1>
          </div>
          <p className="text-base text-ivory/45">Member access, submissions, and inquiries</p>
        </div>

        <section className="grid gap-px bg-gold/15 md:grid-cols-4">
          <Stat icon={Users} label="Members" value={d.members.length} />
          <Stat icon={MessageSquare} label="Open inquiries" value={d.inquiries.filter((x: any) => x.status === "open").length} />
          <Stat icon={FileText} label="Email templates" value={templates.length} />
          <Stat icon={Activity} label="Recent events" value={d.activity.length} />
        </section>

        <div className="mt-10 grid items-start gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-8">
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
              <form onSubmit={invite} className="mt-7 grid gap-4 sm:grid-cols-2">
                <Input name="first_name" placeholder="First name" required className="text-base" />
                <Input name="last_name" placeholder="Last name" required className="text-base" />
                <Input name="email" type="email" placeholder="Email" required className="text-base" />
                <Input name="organization" placeholder="Organization" required className="text-base" />
                <Input name="title" placeholder="Title" required className="text-base" />
                <select name="entity" required className="h-9 rounded-md border border-input bg-navy px-3 text-base">
                  <option value="prsc">PRSC</option>
                  <option value="dis">DIS</option>
                  <option value="both">Both</option>
                </select>
                <select name="role" required className="h-9 rounded-md border border-input bg-navy px-3 text-base">
                  <option value="board_member">Board member</option>
                  <option value="advisor">Advisor</option>
                </select>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-base font-medium text-ivory/90">Why this candidate was chosen</span>
                  <span className="mb-3 block text-sm leading-6 text-ivory/55">
                    This private message will appear in the member’s “Why You” section when they first enter the center.
                  </span>
                  <Textarea
                    name="why_you"
                    placeholder="Describe the experience, judgment, perspective, or relationships that led to this invitation."
                    required
                    minLength={20}
                    maxLength={2000}
                    className="min-h-40 text-base"
                  />
                </label>
                <Button className="rounded-none bg-gold text-base text-navy sm:col-span-2">Send invitation</Button>
                {status && <p className="text-base text-ivory/60 sm:col-span-2">{status}</p>}
              </form>
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
                    <button
                      type="button"
                      aria-label={`Remove ${t.name}`}
                      onClick={() => removeTemplate(t.id)}
                      className="mt-1 text-ivory/30 transition-colors hover:text-gold"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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

          <div>
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
                  <Button type="button" className="rounded-none bg-gold text-base text-navy" onClick={() => setPreviewOpen(true)}>
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
                <Button type="button" disabled={sending} className="rounded-none bg-gold text-base text-navy" onClick={send}>
                  {sending ? "Sending…" : `Send to ${recipients.length || 0} member(s)`}
                </Button>
                {emailStatus && <p className="text-base text-ivory/60">{emailStatus}</p>}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-8">
            <section className="border border-gold/20 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <h2 id="tracker" className="font-display text-3xl">
                  Members &amp; email history
                </h2>
                <InfoTip
                  title="Members & email history"
                  body="Every member with their designation, package status, the templates they have received, and the date of the last send. Check this before sending so no one gets the same email twice. A member showing “None yet” has never been emailed from this center."
                />
              </div>
              <div className="mt-5 overflow-x-auto border border-gold/20">
                <table className="w-full min-w-[560px] text-left text-base">
                <thead className="bg-ivory/5 text-xs uppercase text-gold">
                  <tr>
                    <th className="p-4">Member</th>
                    <th>Designation</th>
                    <th>Package status</th>
                    <th>Emails received</th>
                    <th className="pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.members.map((m: any) => {
                    const all = sendsByMember.get(m.id) ?? [];
                    const list = all.filter((s) => s.status === "sent");
                    const failed = all.filter((s) => s.status !== "sent");
                    const revoked = m.status === "revoked";
                    return (
                      <tr key={m.id} className="border-t border-ivory/10 align-top">
                        <td className="p-4">
                          <strong className="font-medium">
                            {m.first_name} {m.last_name}
                          </strong>
                          <span className="block text-sm text-ivory/40">{m.email}</span>
                          <span className={`mt-1 inline-block text-xs uppercase tracking-[0.14em] ${revoked ? "text-red-300/80" : "text-ivory/40"}`}>
                            Access: {m.status}
                          </span>
                        </td>
                        <td className="uppercase">{m.entity}</td>
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
                          {list.length === 0 ? (
                            <span className="text-ivory/40">None yet</span>
                          ) : (
                            <span className="flex flex-wrap gap-1.5">
                              {Array.from(new Set(list.map((s) => s.template_name))).map((name) => (
                                <span key={name} className="flex items-center gap-1 border border-gold/30 px-2 py-0.5 text-xs text-ivory/75">
                                  <CheckCircle2 className="h-3 w-3 text-gold" /> {name}
                                </span>
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
          </div>
        </div>
      </main>

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
              <Button type="button" className="rounded-none bg-gold text-base text-navy" onClick={saveDraft}>
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

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-navy p-7">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-6 font-display text-4xl">{value}</p>
      <p className="mt-1 text-sm uppercase text-ivory/45">{label}</p>
    </div>
  );
}
