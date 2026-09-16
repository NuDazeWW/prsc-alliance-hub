import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  createMemberDocument,
  deleteMemberDocument,
  listDocumentsForAdmin,
} from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DOCUMENT_BUCKET = "member-documents";

type Props = { memberId: string; memberName: string; preview: boolean };

export function AdminMemberDocuments({ memberId, memberName, preview }: Props) {
  const docs = useQuery({
    queryKey: ["admin-documents", memberId],
    enabled: !preview,
    retry: false,
    queryFn: () => listDocumentsForAdmin({ data: { member_id: memberId } }),
  });

  const [scope, setScope] = useState<"member" | "all">("member");
  const [category, setCategory] = useState<"sign" | "read">("sign");
  const [action, setAction] = useState<"docusign" | "download" | "acknowledge">("docusign");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setUrl("");
    setFile(null);
  }

  async function submit() {
    if (preview) return setStatus("Preview mode: uploads are available once you are signed in.");
    if (!title.trim()) return setStatus("Add a document title.");
    if (!url.trim() && !file) return setStatus("Add a signing link or choose a file to upload.");
    setBusy(true);
    setStatus("");
    try {
      let filePath: string | null = null;
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${scope === "all" ? "shared" : memberId}/${crypto.randomUUID()}-${safe}`;
        const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, { upsert: false });
        if (error) throw error;
        filePath = path;
      }
      await createMemberDocument({
        data: {
          member_id: scope === "all" ? null : memberId,
          category,
          action,
          title: title.trim(),
          description: description.trim(),
          external_url: url.trim() || null,
          file_path: filePath,
        },
      });
      reset();
      setStatus("Document added.");
      await docs.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The document could not be added.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (preview) return setStatus("Preview mode: removal is available once you are signed in.");
    try {
      await deleteMemberDocument({ data: { id } });
      await docs.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The document could not be removed.");
    }
  }

  const list = docs.data?.documents ?? [];
  const acks = docs.data?.acknowledgements ?? [];
  const selectCls =
    "h-10 w-full border border-gold/25 bg-navy-deep px-3 text-base text-ivory outline-none focus:border-gold";

  return (
    <section className="border border-gold/20 bg-ivory/[.02] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Documents for {memberName}</p>
      <p className="mt-2 text-base leading-6 text-ivory/60">
        Post a document for this member only, or for everyone. Sign-and-return documents open in DocuSign. Read-and-retain
        documents can be downloaded, or set to view-and-initial so the member confirms they read it.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-base text-ivory/70">
          Applies to
          <select value={scope} onChange={(e) => setScope(e.target.value as "member" | "all")} className={`mt-1 ${selectCls}`}>
            <option value="member">This member only</option>
            <option value="all">All members</option>
          </select>
        </label>
        <label className="text-base text-ivory/70">
          Type
          <select
            value={category}
            onChange={(e) => {
              const value = e.target.value as "sign" | "read";
              setCategory(value);
              setAction(value === "sign" ? "docusign" : "download");
            }}
            className={`mt-1 ${selectCls}`}
          >
            <option value="sign">Sign and return</option>
            <option value="read">Read and retain</option>
          </select>
        </label>
        <label className="text-base text-ivory/70">
          How the member completes it
          <select value={action} onChange={(e) => setAction(e.target.value as typeof action)} className={`mt-1 ${selectCls}`}>
            {category === "sign" ? (
              <>
                <option value="docusign">Sign electronically in DocuSign</option>
                <option value="download">Open the file</option>
              </>
            ) : (
              <>
                <option value="download">Download and retain</option>
                <option value="acknowledge">View and initial</option>
              </>
            )}
          </select>
        </label>
        <label className="text-base text-ivory/70">
          Title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Advisor Appointment Agreement" className="mt-1 text-base" />
        </label>
        <label className="text-base text-ivory/70 sm:col-span-2">
          Short description
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What this document is for."
            className="mt-1 text-base"
          />
        </label>
        <label className="text-base text-ivory/70">
          DocuSign or external link
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mt-1 text-base" />
        </label>
        <label className="text-base text-ivory/70">
          Or upload a file
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-base text-ivory/70 file:mr-3 file:border file:border-gold/30 file:bg-transparent file:px-3 file:py-2 file:text-base file:text-gold"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={submit} disabled={busy} className="gap-2 text-base">
          <Upload className="h-4 w-4" /> {busy ? "Adding…" : "Add document"}
        </Button>
        {status && <span className="text-base text-gold">{status}</span>}
      </div>

      <div className="mt-6 space-y-3">
        {docs.isLoading && <p className="text-base text-gold">Loading documents…</p>}
        {!docs.isLoading && list.length === 0 && (
          <p className="text-base text-ivory/50">No documents have been posted yet.</p>
        )}
        {list.map((d) => {
          const ack = acks.find((a: any) => a.document_id === d.id && a.member_id === memberId);
          return (
            <div key={d.id} className="flex items-start justify-between gap-4 border border-gold/15 bg-navy-deep/40 p-4">
              <div className="min-w-0">
                <p className="text-base text-ivory">{d.title}</p>
                <p className="mt-1 text-base text-ivory/55">
                  {d.category === "sign" ? "Sign and return" : "Read and retain"} ·{" "}
                  {d.action === "docusign" ? "DocuSign" : d.action === "acknowledge" ? "View and initial" : "Download"} ·{" "}
                  {d.member_id ? "This member" : "All members"}
                </p>
                {ack && (
                  <p className="mt-1 text-base text-gold">
                    Initialed “{ack.initials}” on {new Date(ack.acknowledged_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Remove ${d.title}`}
                onClick={() => remove(d.id)}
                className="shrink-0 text-ivory/50 transition-colors hover:text-gold"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
