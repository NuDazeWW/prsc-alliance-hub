import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { listDocumentsForAdmin } from "@/lib/portal.functions";
import { grantRestrictedToCleared } from "@/lib/governance.functions";
import { userFacingError } from "@/lib/user-facing-error";

const BUCKET = "member-documents";
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
  const names = useMemo(() => new Map(members.map((m) => [m.id, `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()])), [members]);
  const docs = ((q.data as any)?.documents ?? []) as any[];
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  const rows = docs.filter((d) => (showOld || !d.superseded_at) && terms.every((t) => `${d.title} ${d.version_label ?? ""} ${ROLE_LABEL[d.forum_role ?? ""] ?? ""} ${CLASS_LABEL[d.classification ?? ""] ?? ""}`.toLowerCase().includes(t)));

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
