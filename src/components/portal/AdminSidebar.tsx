import { userFacingError } from "@/lib/user-facing-error";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, BookOpen, CalendarDays, ChevronDown, ClipboardList, Eye, EyeOff, FilePlus, FileText, History, KeyRound, Landmark, LayoutDashboard, LogOut, MailPlus, MessageSquare, Send, ShieldCheck, ShieldPlus, Trash2, Upload, UserPlus, Users } from "lucide-react";
import { announceAdminNav } from "@/lib/admin-nav";
import { AdminGuide } from "@/components/portal/AdminGuide";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PrscMark } from "@/components/site/PrscMark";
import { useSidebarCollapse } from "@/components/portal/PortalShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAdmin, listAdmins, removeAdmin, type AdminAccount } from "@/lib/admin-accounts.functions";
import { passwordChangeAttributes } from "@/lib/password-change";

type Item = { label: string; to: "/admin" | "/admin/send"; hash?: string; icon: React.ComponentType<{ className?: string }> };
type Group = { heading?: string; items: Item[] };
const GROUPS: Group[] = [
  { items: [{ label: "Overview", to: "/admin", icon: LayoutDashboard }] },
  { heading: "People", items: [
    { label: "Members", to: "/admin", hash: "tracker", icon: Users },
    { label: "Invite a member", to: "/admin/send", hash: "invite", icon: UserPlus },
    { label: "Upload a member list", to: "/admin", hash: "upload", icon: Upload },
    { label: "Leadership team", to: "/admin", hash: "leadership", icon: Landmark },
  ] },
  { heading: "Communications", items: [
    { label: "Compose & send", to: "/admin/send", hash: "email-compose", icon: Send },
    { label: "Email templates", to: "/admin/send", hash: "email-templates", icon: FileText },
    { label: "Create a template", to: "/admin/send", hash: "new-template", icon: FilePlus },
    { label: "Forum emails", to: "/admin/send", hash: "forum-communications", icon: MailPlus },
    { label: "Sent log", to: "/admin/send", hash: "sent-log", icon: History },
  ] },
  { heading: "Questionnaires", items: [
    { label: "Executive questions", to: "/admin/send", hash: "question-register", icon: ClipboardList },
  ] },
  { heading: "Documents & releases", items: [
    { label: "All documents", to: "/admin", hash: "library", icon: FileText },
    { label: "Member documents", to: "/admin", hash: "documents", icon: FilePlus },
    { label: "Release review", to: "/admin", hash: "release-review", icon: ShieldCheck },
  ] },
  { heading: "Everything else", items: [
    { label: "Meetings", to: "/admin", hash: "meetings", icon: CalendarDays },
    { label: "Inquiries", to: "/admin", hash: "inquiries", icon: MessageSquare },
    { label: "Activity log", to: "/admin", hash: "activity-log", icon: Activity },
  ] },
];

export function AdminSidebar({ page, onNavigate }: { page: "overview" | "send"; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("Administrator");
  const [dialog, setDialog] = useState<null | "password" | "admins">(null);
  const collapse = useSidebarCollapse();
  const [active_, setActive] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const collapsed = collapse?.collapsed ?? false;

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const meta = (data.user?.user_metadata ?? {}) as Record<string, string>;
      const full = [meta.first_name, meta.last_name].filter(Boolean).join(" ");
      setName(full || data.user?.email?.split("@")[0] || "Administrator");
    });
  }, []);
  const initials = name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "A";

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: "/admin", mode: undefined, email: undefined, passwordCreated: undefined }, replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      {!collapsed && <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Administration</p>}
      <DropdownMenu>
        <DropdownMenuTrigger
          title={collapsed ? name : undefined}
          className={`mt-4 flex w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-gold ${collapsed ? "justify-center" : "items-center gap-3"}`}
        >
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-gold/60 font-display text-lg text-ivory ${collapsed ? "transition-colors hover:border-gold hover:bg-gold/10" : ""}`}>{initials}</span>
          {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-lg text-ivory">{name}</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Admin</span>
          </span>
          )}
          {!collapsed && <ChevronDown className="h-4 w-4 text-gold" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 border-gold/30 bg-navy-deep text-ivory">
          <DropdownMenuItem onSelect={() => setDialog("password")}><KeyRound className="mr-2 h-4 w-4 text-gold" /> Change password</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("admins")}><ShieldPlus className="mr-2 h-4 w-4 text-gold" /> Manage administrators</DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gold/20" />
          <DropdownMenuItem onSelect={() => void signOut()}><LogOut className="mr-2 h-4 w-4 text-gold" /> Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav aria-label="Admin sections" className="mt-6 border-t border-gold/15 pt-2">
        {GROUPS.map((g, gi) => (
          <div key={gi} className={g.heading ? "mt-3" : ""}>
            {g.heading && !collapsed && <p className="px-0 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-ivory/45">{g.heading}</p>}
            {g.items.map((it) => {
              const key = `${it.to}#${it.hash ?? ""}`;
              const active = active_ === key || (!active_ && !it.hash && it.to === (page === "send" ? "/admin/send" : "/admin") && it.label === "Overview");
              const Icon = it.icon;
              return (
                <Link
                  key={it.label}
                  to={it.to}
                  hash={it.hash}
                  onClick={() => { setActive(key); announceAdminNav(); onNavigate?.(); }}
                  title={collapsed ? it.label : undefined}
                  aria-label={collapsed ? it.label : undefined}
                  className={`border-l-[3px] py-2.5 text-[15px] transition-colors ${collapsed ? "-mx-4 flex justify-center" : "-mx-5 flex items-center gap-3 px-5"} ${active ? "border-gold bg-gold/10 text-gold" : "border-transparent text-ivory/80 hover:bg-gold/5 hover:text-gold"}`}
                >
                  <Icon className="h-[18px] w-[18px]" /> {!collapsed && it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-gold/15 pt-5">
        {!collapsed && <p className="text-[11px] uppercase tracking-[0.24em] text-ivory/45">Need help?</p>}
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          title={collapsed ? "Admin guide" : undefined}
          aria-label={collapsed ? "Admin guide" : undefined}
          className={`text-left text-ivory/80 hover:text-gold ${collapsed ? "mt-4 flex w-full justify-center" : "mt-3 flex items-start gap-3"}`}
        >
          <BookOpen className={`${collapsed ? "h-6 w-6" : "mt-0.5 h-6 w-6"} text-gold`} />
          {!collapsed && <span><span className="block text-[15px]">Admin guide</span><span className="block text-sm text-ivory/55">How to do everything here</span></span>}
        </button>
      </div>

      <AdminGuide open={guideOpen} onOpenChange={setGuideOpen} />
      <ChangePasswordDialog open={dialog === "password"} onClose={() => setDialog(null)} />
      <ManageAdminsDialog open={dialog === "admins"} onClose={() => setDialog(null)} />
    </div>
  );
}

function PasswordInput({ value, onChange, label, auto }: { value: string; onChange: (v: string) => void; label: string; auto: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block text-xs uppercase text-ivory/60">
      {label}
      <span className="relative mt-2 block">
        <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={auto} required className="h-11 border-ivory/20 bg-transparent pr-11 normal-case text-ivory" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-2.5 text-ivory/60 hover:text-gold">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  );
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const reset = () => { setNext(""); setConfirm(""); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let attributes: { password: string };
    try { attributes = passwordChangeAttributes(next, confirm); }
    catch (error) { return toast.error(userFacingError(error, "Check the new password")); }
    setBusy(true);
    const { error } = await supabase.auth.updateUser(attributes);
    setBusy(false);
    if (error) return toast.error(userFacingError(error, "Could not update your password. Please try again."));
    toast.success("Password updated");
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="border-gold/30 bg-navy-deep text-ivory">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Change password</DialogTitle>
          <DialogDescription className="text-ivory/60">Choose a new password (at least 12 characters).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <PasswordInput label="New password" value={next} onChange={setNext} auto="new-password" />
          <PasswordInput label="Confirm new password" value={confirm} onChange={setConfirm} auto="new-password" />
          <Button disabled={busy} className="w-full rounded-none bg-gold text-navy hover:bg-gold/90">{busy ? "Saving…" : "Update password"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageAdminsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try { setAdmins((await listAdmins()).admins); } catch (e) { toast.error(userFacingError(e, "Could not load administrators")); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (open) void load(); }, [open]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await addAdmin({ data: form });
      toast.success(r.invited ? `Invitation sent to ${form.email}` : `${form.email} is now an administrator`);
      setForm({ first_name: "", last_name: "", email: "" });
      await load();
    } catch (err) { toast.error(userFacingError(err, "Could not add administrator")); }
    finally { setBusy(false); }
  }

  async function remove(a: AdminAccount) {
    if (!confirm(`Remove administrator access for ${a.email}?`)) return;
    try { await removeAdmin({ data: { user_id: a.user_id } }); toast.success("Administrator removed"); await load(); }
    catch (err) { toast.error(userFacingError(err, "Could not remove administrator")); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg border-gold/30 bg-navy-deep text-ivory">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Administrators</DialogTitle>
          <DialogDescription className="text-ivory/60">People who can open this Private center. New administrators get an email to set their own password.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-ivory/10 border border-gold/20">
          {loading && <li className="p-3 text-sm text-ivory/50">Loading…</li>}
          {!loading && admins.map((a) => (
            <li key={a.user_id} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0">
                <span className="block truncate text-sm text-ivory">{a.name ?? a.email}{a.is_you && <span className="ml-2 text-[10px] uppercase text-gold">You</span>}</span>
                {a.name && <span className="block truncate text-xs text-ivory/50">{a.email}</span>}
              </span>
              {!a.is_you && admins.length > 1 && (
                <button type="button" onClick={() => void remove(a)} aria-label={`Remove ${a.email}`} className="grid h-8 w-8 place-items-center border border-ivory/15 text-ivory/60 hover:border-gold hover:text-gold">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="mt-2 grid gap-3 sm:grid-cols-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold sm:col-span-2">Add an administrator</p>
          <Input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="border-ivory/20 text-ivory" />
          <Input placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="border-ivory/20 text-ivory" />
          <Input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border-ivory/20 text-ivory sm:col-span-2" />
          <Button disabled={busy} className="rounded-none bg-gold text-navy hover:bg-gold/90 sm:col-span-2">{busy ? "Sending…" : "Add administrator"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
