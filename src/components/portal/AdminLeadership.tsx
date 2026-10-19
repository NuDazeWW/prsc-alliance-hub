import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Save, Trash2, Upload } from "lucide-react";
import { useStoredFlag } from "@/hooks/use-stored-flag";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteLeader,
  getLeadershipTeam,
  reorderLeaders,
  saveLeader,
  saveLeadershipSettings,
  type LeaderRow,
} from "@/lib/leadership.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Draft = { id?: string; name: string; title: string; bio: string; member_id: string | null; visible: boolean; sort_order: number; photo_path: string | null; photo_url?: string | null };

const blank = (order: number): Draft => ({ name: "", title: "", bio: "", member_id: null, visible: true, sort_order: order, photo_path: null });

export function AdminLeadership() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["leadership-team"], queryFn: () => getLeadershipTeam(), retry: false });
  const members = useQuery({
    queryKey: ["leadership-member-options"],
    queryFn: async () => {
      const { data } = await supabase.from("portal_members").select("id, first_name, last_name").neq("status", "revoked").order("last_name");
      return data ?? [];
    },
  });
  const [settings, setSettings] = useState({ eyebrow: "", heading: "", subtext: "" });
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useStoredFlag("admin.leadershipCollapsed");

  useEffect(() => {
    if (q.data?.settings) setSettings(q.data.settings);
  }, [q.data?.settings]);

  const team = q.data?.team ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["leadership-team"] });

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    if (!editing) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Please choose an image under 5 MB");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `team/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("leadership-photos").upload(path, file, { upsert: false });
    if (error) return toast.error(error.message);
    setEditing({ ...editing, photo_path: path, photo_url: URL.createObjectURL(file) });
  }

  function move(index: number, dir: -1 | 1) {
    const ids = team.map((t) => t.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    void run(() => reorderLeaders({ data: { ids } }), "Order updated");
  }

  const toDraft = (t: LeaderRow): Draft => ({
    id: t.id, name: t.name, title: t.title, bio: t.own_bio ?? "", member_id: t.member_id, visible: t.visible,
    sort_order: t.sort_order, photo_path: t.photo_path, photo_url: t.photo_url,
  });

  return (
    <section id="leadership" className={`border border-gold/20 p-6 sm:p-8 ${collapsed ? "[&>*:not(:first-child)]:hidden" : ""}`}>
      <button type="button" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} className="flex w-full items-start justify-between gap-3 text-left">
        <span>
          <span className="block text-[10px] uppercase tracking-[0.24em] text-gold">Welcome Center</span>
          <span className="mt-2 block font-display text-3xl">Leadership Team</span>
          {collapsed && <span className="mt-1 block text-sm text-ivory/50">{rows.length} people · Click to expand</span>}
        </span>
        {collapsed ? <ChevronDown className="mt-2 h-5 w-5 text-gold" /> : <ChevronUp className="mt-2 h-5 w-5 text-gold" />}
      </button>
      <p className="mt-2 text-sm text-ivory/60">
        Edit the "Our Leadership Team" panel members see. Link a person to a portal member and their profile photo and bio fill in
        automatically; anything you type here takes priority.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="text-xs uppercase text-ivory/55">Small label<Input value={settings.eyebrow} onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })} className="mt-2 border-ivory/20 text-ivory" /></label>
        <label className="text-xs uppercase text-ivory/55">Heading<Input value={settings.heading} onChange={(e) => setSettings({ ...settings, heading: e.target.value })} className="mt-2 border-ivory/20 text-ivory" /></label>
        <label className="text-xs uppercase text-ivory/55 sm:col-span-2">Subtext<Textarea value={settings.subtext} onChange={(e) => setSettings({ ...settings, subtext: e.target.value })} className="mt-2 min-h-16 border-ivory/20 normal-case text-ivory" /></label>
      </div>
      <Button disabled={busy} onClick={() => run(() => saveLeadershipSettings({ data: settings }), "Panel text saved")} className="mt-3 bg-gold text-navy hover:bg-gold/90">
        <Save className="mr-2 h-4 w-4" /> Save panel text
      </Button>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h3 className="font-display text-xl">People ({team.length})</h3>
        <Button variant="outline" onClick={() => setEditing(blank(team.length + 1))} className="border-gold/40 bg-transparent text-gold hover:bg-gold hover:text-navy">
          <Plus className="mr-2 h-4 w-4" /> Add person
        </Button>
      </div>

      <ul className="mt-4 space-y-2">
        {team.map((t, i) => (
          <li key={t.id} className={`flex flex-wrap items-center gap-3 border border-ivory/15 p-2 ${t.visible ? "" : "opacity-50"}`}>
            {t.photo_url ? <img src={t.photo_url} alt="" className="h-12 w-12 object-cover" /> : <span className="h-12 w-12 bg-ivory/5" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ivory">{t.name} {t.is_placeholder && <span className="ml-2 text-[10px] uppercase text-gold/70">sample</span>}</p>
              <p className="truncate text-xs text-ivory/50">{t.title}{t.member_id ? " · linked to member" : ""}</p>
            </div>
            <div className="flex gap-1">
              <IconBtn label="Move up" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></IconBtn>
              <IconBtn label="Move down" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></IconBtn>
              <IconBtn label={t.visible ? "Hide" : "Show"} onClick={() => run(() => saveLeader({ data: { ...toDraft(t), bio: t.own_bio, visible: !t.visible } }), t.visible ? "Hidden" : "Shown")}>
                {t.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </IconBtn>
              <Button size="sm" variant="outline" onClick={() => setEditing(toDraft(t))} className="border-gold/40 bg-transparent text-gold hover:bg-gold hover:text-navy">Edit</Button>
              <IconBtn label="Remove" onClick={() => { if (confirm(`Remove ${t.name}?`)) void run(() => deleteLeader({ data: { id: t.id } }), "Removed"); }}>
                <Trash2 className="h-4 w-4" />
              </IconBtn>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="mt-6 border border-gold/30 bg-navy-deep/50 p-5">
          <h4 className="font-display text-lg">{editing.id ? "Edit person" : "Add person"}</h4>
          <div className="mt-4 flex items-center gap-4">
            {editing.photo_url ? <img src={editing.photo_url} alt="" className="h-16 w-16 object-cover" /> : <span className="grid h-16 w-16 place-items-center bg-ivory/5 text-gold"><Upload className="h-5 w-5" /></span>}
            <label className="cursor-pointer text-sm text-gold underline">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); e.target.value = ""; }} />
            </label>
            {editing.photo_path && <button type="button" onClick={() => setEditing({ ...editing, photo_path: null, photo_url: null })} className="text-xs text-ivory/50 hover:text-gold">Remove photo</button>}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs uppercase text-ivory/55">Name<Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-2 border-ivory/20 text-ivory" /></label>
            <label className="text-xs uppercase text-ivory/55">Role / title<Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="mt-2 border-ivory/20 text-ivory" /></label>
            <label className="text-xs uppercase text-ivory/55 sm:col-span-2">
              Linked portal member (optional)
              <select value={editing.member_id ?? ""} onChange={(e) => setEditing({ ...editing, member_id: e.target.value || null })} className="mt-2 h-10 w-full border border-ivory/20 bg-navy-deep px-3 text-sm normal-case text-ivory">
                <option value="">Not linked</option>
                {(members.data ?? []).map((m: any) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </label>
            <label className="text-xs uppercase text-ivory/55 sm:col-span-2">Bio (leave blank to use the member's own profile bio)<Textarea value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} className="mt-2 min-h-28 border-ivory/20 normal-case text-ivory" /></label>
            <label className="flex items-center gap-2 text-sm text-ivory/70"><input type="checkbox" checked={editing.visible} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} className="accent-gold" /> Visible to members</label>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              disabled={busy || !editing.name.trim()}
              onClick={() => {
                const { photo_url: _u, ...d } = editing;
                void run(() => saveLeader({ data: { ...d, bio: d.bio.trim() || null } }), "Saved").then(() => setEditing(null));
              }}
              className="bg-gold text-navy hover:bg-gold/90"
            >
              <Save className="mr-2 h-4 w-4" /> Save person
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)} className="text-ivory">Cancel</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid h-9 w-9 place-items-center border border-ivory/15 text-ivory/60 hover:border-gold hover:text-gold">
      {children}
    </button>
  );
}
