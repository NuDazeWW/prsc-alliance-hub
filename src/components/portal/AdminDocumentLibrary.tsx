import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { createMemberDocument, listDocumentsForAdmin } from "@/lib/portal.functions";
import { grantRestrictedToCleared, updateDocumentGovernance } from "@/lib/governance.functions";
import { userFacingError } from "@/lib/user-facing-error";

const BUCKET = "member-documents";
type UploadType = { key: string; label: string; title: string; stage: number; classification: string; prep: boolean; needsPermission?: boolean };
const UPLOAD_TYPES: UploadType[] = [
  { key: "protocol", label: "Forum Protocol", title: "Readiness Vanguard Coordination Forum Participation Protocol", stage: 1, classification: "confidential_forum", prep: true },
  { key: "pre_read", label: "Forum Pre-Read", title: "Readiness Vanguard Coordination Forum Executive Pre-Read", stage: 1, classification: "confidential_forum", prep: true },
  { key: "agenda", label: "Forum agenda (members see it after clearance)", title: "Readiness Vanguard Coordination Forum Inaugural Strategic Agenda", stage: 5, classification: "confidential_forum", prep: false },
  { key: "restricted_brief", label: "Restricted strategy brief (cleared members only)", title: "Restricted Jared/NASCAR Vanguard Strategy Brief", stage: 5, classification: "restricted_opportunity", prep: false, needsPermission: true },
];
const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "-");
const ROLE_LABEL: Record<string, string> = {
  addendum: "Confidentiality Addendum", protocol: "Forum Protocol", pre_read: "Pre-Read", conflict: "Conflict / Recusal",
  agenda: "Forum agenda", restricted_brief: "Restricted strategy brief", secretariat_controls: "Secretariat controls", facilitator_run_of_show: "Run of show",
};
const CLASS_LABEL: Record<string, string> = {
  general_orientation: "General", confidential_forum: "Confidential Forum", restricted_opportunity: "Restricted", entity_confidential: "Entity confidential", secretariat_only: "Secretariat only",
};

/** Every document in the portal in one list, with who it is for and a way to open it. */
export function AdminDocumentLibrary({ members, preview }: { members: { id: string; first_name: string | null; last_name: string | null }[]; preview?: boolean }) {
  const q = useQuery({ queryKey: ["admin-document-library"], queryFn: () => listDocumentsForAdmin({ data: {} }), enabled: !preview });
  const [search, setSearch] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [msg, setMsg] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [typeKey, setTypeKey] = useState(UPLOAD_TYPES[0].key);
  const [title, setTitle] = useState(UPLOAD_TYPES[0].title);
  const [version, setVersion] = useState("");
  const [permission, setPermission] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const upType = UPLOAD_TYPES.find((t) => t.key === typeKey)!;
  const names = useMemo(() => new Map(members.map((m) => [m.id, `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()])), [members]);
  const docs = ((q.data as any)?.documents ?? []) as any[];
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  const rows = docs.filter((d) => (showOld || !d.superseded_at) && terms.every((t) => `${d.title} ${d.version_label ?? ""} ${ROLE_LABEL[d.forum_role ?? ""] ?? ""} ${CLASS_LABEL[d.classification ?? ""] ?? ""}`.toLowerCase().includes(t)));

  async function upload(f: File) {
    if (!/\.pdf$/i.test(f.name)) throw new Error("Choose a PDF file.");
    const path = `shared/${crypto.randomUUID()}-${safeName(f.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { upsert: false });
    if (error) throw error;
    return path;
  }
  async function addDocument() {
    if (!file) return setMsg("Choose the PDF to upload.");
    if (!title.trim()) return setMsg("Give the document a title.");
    if (upType.needsPermission && !permission.trim()) return setMsg("Record who gave permission to share this document.");
    setBusy(true); setMsg("");
    try {
      const path = await upload(file);
      const current = docs.find((d) => d.forum_role === upType.key && !d.superseded_at && !d.member_id);
      await createMemberDocument({ data: {
        member_id: null, category: "read", action: "acknowledge", title: title.trim(), description: "",
        file_path: path, journey_stage: upType.stage, journey_track: "shared", classification: upType.classification as any,
        is_forum_prep: upType.prep, version_label: version.trim() || null, forum_role: upType.key as any,
        supersedes_id: current?.id ?? null, third_party_permission: upType.needsPermission ? permission.trim() : undefined,
      } });
      setMsg(current ? `Added. The earlier "${current.title}" is now marked replaced.${upType.needsPermission ? " Use Grant to all cleared members on the new one." : ""}` : `Added.${upType.needsPermission ? " Use Grant to all cleared members so cleared members can open it." : ""}`);
      setFile(null); setVersion(""); setPermission(""); setAddOpen(false);
      await q.refetch();
    } catch (e) { setMsg(userFacingError(e, "The document could not be added.")); }
    finally { setBusy(false); }
  }
  async function replaceFile(d: any, f: File | undefined) {
    if (!f) return;
    if (!confirm(`Replace the PDF for "${d.title}"? Members see the new file straight away.`)) return;
    try {
      const path = await upload(f);
      await updateDocumentGovernance({ data: { document_id: d.id, file_path: path } });
      setMsg(`File replaced for ${d.title}.`);
      await q.refetch();
    } catch (e) { setMsg(userFacingError(e, "The file could not be replaced.")); }
  }
  async function open(d: any) {
    if (d.external_url && !d.file_path) return void window.open(d.external_url, "_blank", "noopener");
    if (!d.file_path) return setMsg("This document has no file attached yet.");
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.file_path, 300);
    if (error || !data?.signedUrl) return setMsg(userFacingError(error, "The file could not be opened."));
    window.open(data.signedUrl, "_blank", "noopener");
  }
  async function grantAll(d: any) {
    try {
      const r = await grantRestrictedToCleared({ data: { document_id: d.id, dry_run: true } });
      if (!r.count) return setMsg("Everyone cleared for the Forum already has access.");
      if (!confirm(`Give ${r.count} cleared member${r.count === 1 ? "" : "s"} access to "${d.title}"? No email is sent.`)) return;
      const done = await grantRestrictedToCleared({ data: { document_id: d.id } });
      setMsg(`Access granted to ${done.granted} member${done.granted === 1 ? "" : "s"}.`);
      toast.success("Access granted.");
    } catch (e) { setMsg(userFacingError(e, "Could not grant access.")); }
  }

  if (preview) return <p className="border border-gold/15 p-5 text-base text-ivory/55">The document library shows on the live admin page.</p>;
  return (
    <div>
      <p className="text-base text-ivory/60">Every document loaded in the portal. Open a person's own Documents card to add, replace or release one.</p>
      <div className="mt-4">
        <Button type="button" onClick={() => setAddOpen(!addOpen)}><Upload className="mr-2 h-4 w-4" />{addOpen ? "Close" : "Upload a document"}</Button>
      </div>
      {addOpen && (
        <div className="mt-4 space-y-4 border border-gold/30 p-5">
          <label className="block text-sm text-ivory/70">What is it?
            <select value={typeKey} onChange={(e) => { const t = UPLOAD_TYPES.find((x) => x.key === e.target.value)!; setTypeKey(t.key); setTitle(t.title); }} className="mt-1 h-11 w-full border border-input bg-navy px-3 text-base text-ivory">
              {UPLOAD_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="block text-sm text-ivory/70">Title<Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></label>
          <label className="block text-sm text-ivory/70">Version (optional, for example v1.5)<Input value={version} onChange={(e) => setVersion(e.target.value)} className="mt-1" /></label>
          {upType.needsPermission && <label className="block text-sm text-ivory/70">Who gave permission to share this? (required)<Input value={permission} onChange={(e) => setPermission(e.target.value)} className="mt-1" placeholder="For example: Jared Odrick, by email on Oct 30" /></label>}
          <label className="block text-sm text-ivory/70">PDF file<input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-base text-ivory" /></label>
          <p className="text-sm text-ivory/55">It is added for all members. If a current {upType.label.split(" (")[0].toLowerCase()} already exists, it is marked replaced.</p>
          <Button type="button" disabled={busy} onClick={() => void addDocument()}>{busy ? "Uploading…" : "Add document"}</Button>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gold" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, version or type" aria-label="Search documents" className="h-11 pl-10" />
        </div>
        <label className="flex items-center gap-2 text-sm text-ivory/70"><input type="checkbox" checked={showOld} onChange={(e) => setShowOld(e.target.checked)} /> Show replaced versions</label>
      </div>
      {q.isLoading && <p className="mt-4 text-ivory/60">Loading…</p>}
      <div className="mt-4 divide-y divide-gold/15 border border-gold/20">
        {rows.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-serif text-lg text-ivory">{d.title}{d.version_label ? <span className="text-ivory/50"> · {d.version_label}</span> : null}</p>
              <p className="mt-1 text-sm text-ivory/60">
                {ROLE_LABEL[d.forum_role ?? ""] ?? CLASS_LABEL[d.classification ?? ""] ?? "Document"} · {d.member_id ? `Only ${names.get(d.member_id) || "one member"}` : "All members"}
                {d.superseded_at ? " · Replaced" : ""}{d.file_path || d.external_url ? "" : " · No file attached"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {d.classification === "restricted_opportunity" && !d.superseded_at && <Button type="button" size="sm" variant="outline" onClick={() => void grantAll(d)}>Grant to all cleared members</Button>}
              {!d.superseded_at && (
                <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm text-ivory hover:bg-gold/10">
                  <Upload className="mr-2 h-4 w-4" />Replace file
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { void replaceFile(d, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => void open(d)}><ExternalLink className="mr-2 h-4 w-4" />Open</Button>
            </div>
          </div>
        ))}
        {!rows.length && !q.isLoading && <p className="p-4 text-ivory/60">No documents match.</p>}
      </div>
      {msg && <p className="mt-3 text-sm text-gold" role="status">{msg}</p>}
    </div>
  );
}
