import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  createMemberDocument,
  deleteMemberDocument,
  listDocumentsForAdmin,
  releaseMemberDocuments,
  confirmExternalSignature,
  prepareSignedCopy,
  sendSignedCopy,
  setEntityActivation,
  setForumParticipation,
} from "@/lib/portal.functions";
import { STAGES, journeyStatus, lockedDocumentIds, memberTracks } from "@/lib/journey";
import { JOURNEY_PRESETS } from "@/lib/journey-templates";
import { CLASSIFICATIONS, type Classification } from "@/lib/governance";
import { updateDocumentGovernance } from "@/lib/governance.functions";
import { AdminGovernancePanel } from "@/components/portal/AdminGovernancePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DOCUMENT_BUCKET = "member-documents";

type Props = { memberId: string; memberName: string; preview: boolean };

export function AdminMemberDocuments({ memberId, memberName, preview }: Props) {
  const queryClient = useQueryClient();
  const docs = useQuery({
    queryKey: ["admin-documents", memberId],
    enabled: !preview,
    retry: false,
    queryFn: async () => {
      const result = await listDocumentsForAdmin({ data: { member_id: memberId } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portal-admin"] }),
        queryClient.invalidateQueries({ queryKey: ["portal-admin-member", memberId] }),
        queryClient.invalidateQueries({ queryKey: ["leadership-member-options"] }),
        queryClient.invalidateQueries({ queryKey: ["portal-session"] }),
      ]);
      return result;
    },
  });

  const [scope, setScope] = useState<"member" | "all">("member");
  const [category, setCategory] = useState<"sign" | "read">("sign");
  const [action, setAction] = useState<"esign" | "acknowledge" | "boldsign">("esign");
  const [audEntity, setAudEntity] = useState<"" | "prsc" | "dis" | "both">("");
  const [audRole, setAudRole] = useState<"" | "board_member" | "advisor">("");
  const [releasing, setReleasing] = useState(false);
  const [stage, setStage] = useState<"" | "1" | "2" | "3" | "4" | "5">("1");
  const [track, setTrack] = useState<"shared" | "prsc" | "dis">("shared");
  const [sortOrder, setSortOrder] = useState("0");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [classification, setClassification] = useState<Classification>("confidential_forum");
  const [supersedes, setSupersedes] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [permission, setPermission] = useState("");
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
    if (action === "boldsign" ? !url.trim() : !file) return setStatus(action === "boldsign" ? "Add the BoldSign signing link." : "Choose the PDF members will read in the portal.");
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
          audience_entity: scope === "all" && audEntity ? audEntity : null,
          audience_role: scope === "all" && audRole ? audRole : null,
          journey_stage: stage ? Number(stage) : null,
          journey_track: stage === "1" ? "shared" : track,
          sort_order: Number(sortOrder) || 0,
          classification,
          is_forum_prep: stage === "1",
          version_label: versionLabel.trim() || null,
          supersedes_id: supersedes || null,
          third_party_permission: permission.trim() || undefined,
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

  async function release() {
    if (preview) return setStatus("Preview mode: release is available once you are signed in.");
    if (!confirm(`Release ${list.length} document(s) to ${memberName} and email them now?`)) return;
    setReleasing(true);
    try {
      await releaseMemberDocuments({ data: { member_id: memberId } });
      setStatus("Released. The member has been emailed.");
      await docs.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The documents could not be released.");
    } finally {
      setReleasing(false);
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

  const [composer, setComposer] = useState<null | { ackId: string; previewUrl: string | null; to: string; subject: string; body: string; sending: boolean; msg: string }>(null);
  const [working, setWorking] = useState<string>("");
  const requested = new Set<string>((docs.data as any)?.hardCopyRequests ?? []);
  const contact = (docs.data as any)?.contact ?? { email: "", firstName: "" };
  async function toggleExternal(documentId: string, confirmed: boolean) {
    if (preview) return setStatus("Preview mode: check-offs save on the live admin page.");
    setWorking(documentId);
    try { await confirmExternalSignature({ data: { member_id: memberId, document_id: documentId, confirmed } }); await docs.refetch(); }
    catch (e) { setStatus(e instanceof Error ? e.message : "Could not update"); }
    finally { setWorking(""); }
  }
  async function openComposer(ackId: string, docTitle: string) {
    if (preview) return setStatus("Preview mode: signed copies are prepared on the live admin page.");
    setWorking(ackId);
    try {
      const r = await prepareSignedCopy({ data: { ack_id: ackId } });
      const first = contact.firstName || memberName.split(" ")[0] || "there";
      setComposer({
        ackId, previewUrl: r.previewUrl, to: contact.email, sending: false, msg: "",
        subject: `Your signed copy: ${docTitle}`,
        body: `Hi ${first},\n\nAs requested, here is your signed copy of ${docTitle}. It includes a signature certificate showing your name, initials, and the date and time you completed it in the portal.\n\nPlease keep it for your records. If you have any questions, just reply to info@readinessterminal.com.`,
      });
    } catch (e) { setStatus(e instanceof Error ? e.message : "Could not prepare the signed copy"); }
    finally { setWorking(""); }
  }
  async function sendComposer() {
    if (!composer) return;
    setComposer({ ...composer, sending: true, msg: "" });
    try {
      await sendSignedCopy({ data: { ack_id: composer.ackId, to: composer.to, subject: composer.subject, body: composer.body } });
      setComposer(null); setStatus("Signed copy emailed."); await docs.refetch();
    } catch (e) { setComposer({ ...composer, sending: false, msg: e instanceof Error ? e.message : "Could not send" }); }
  }
  const list = docs.data?.documents ?? [];
  const acks = docs.data?.acknowledgements ?? [];
  const entity = docs.data?.entity ?? "prsc";
  const activation = docs.data?.activation ?? { prsc: null, dis: null };
  const doneIds = new Set<string>(acks.filter((a: any) => a.member_id === memberId).map((a: any) => a.document_id));
  const forum = (docs.data as any)?.forum !== false;
  const cleared = (docs.data as any)?.forumCleared === true;
  const active = list.filter((d: any) => !d.superseded_at);
  const journey = journeyStatus(active as any, doneIds, entity, activation, forum, cleared);
  async function setDocGov(id: string, patch: { classification?: Classification; superseded?: boolean }) {
    if (preview) return setStatus("Preview mode: classification is saved on the live admin page.");
    let third_party_permission: string | undefined;
    if (patch.classification === "restricted_opportunity") {
      third_party_permission = prompt("Record the source's permission (source, permitted use, who confirmed it):") ?? "";
      if (!third_party_permission.trim()) return setStatus("Restricted Opportunity needs a recorded source permission.");
    }
    if (patch.superseded && !confirm("Mark as superseded? It leaves active queues; signed copies and history are kept.")) return;
    try { await updateDocumentGovernance({ data: { document_id: id, ...patch, third_party_permission } }); await docs.refetch(); }
    catch (e) { setStatus(e instanceof Error ? e.message : "Could not update"); }
  }
  async function toggleForum(on: boolean) {
    if (preview) return setStatus("Preview mode: Forum participation is changed on the live admin page.");
    try { await setForumParticipation({ data: { member_id: memberId, participates: on } }); await docs.refetch(); }
    catch (e) { setStatus(e instanceof Error ? e.message : "Could not update Forum participation"); }
  }
  const lockedIds = lockedDocumentIds(active as any, doneIds, entity, cleared);
  async function toggleActivation(t: "prsc" | "dis", on: boolean) {
    if (preview) return setStatus("Preview mode: activation is recorded on the live admin page.");
    let appointment_ref: string | undefined;
    if (on) {
      if (!confirm(`Confirm the authorized ${t.toUpperCase()} countersignature has been executed for ${memberName}?`)) return;
      appointment_ref = prompt(`Reference for the ${t.toUpperCase()} appointment action (e.g. board resolution or Master Ops entry):`) ?? "";
      if (!appointment_ref.trim()) return setStatus("Appointment needs a recorded appointment action reference.");
    }
    try { await setEntityActivation({ data: { member_id: memberId, entity: t, activated: on, countersigned: on, appointment_ref } }); await docs.refetch(); }
    catch (e) { setStatus(e instanceof Error ? e.message : "Could not update activation"); }
  }
  function applyPreset(i: string) {
    const p = JOURNEY_PRESETS[Number(i)];
    if (!p) return;
    setStage(String(p.stage) as typeof stage);
    setTrack(p.track);
    setCategory(p.category);
    setAction(p.category === "sign" ? "esign" : "acknowledge");
    setTitle(p.title);
    setDescription(p.description);
  }
  const selectCls =
    "h-10 w-full border border-gold/25 bg-navy-deep px-3 text-base text-ivory outline-none focus:border-gold";

  return (
    <section className="border border-gold/20 bg-ivory/[.02] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Documents for {memberName}</p>
      <p className="mt-2 text-base leading-6 text-ivory/60">
        Add documents for this member only, or for all members (optionally by company and role). Members read every document inside the portal and initial or sign there; BoldSign links are also supported. Nothing is visible to the member until you release it.
      </p>

      <div className="mt-5 border border-gold/25 p-4">
        <p className="text-base text-ivory">Journey status: <span className="text-gold">{journey.label}</span> · Stage {forum ? journey.currentStage : journey.currentStage - 1} of {forum ? 5 : 4}</p>
        <p className="mt-1 text-sm text-ivory/55">The member cannot formally act in a PRSC or DIS role until Stages 2–4 are complete and you record activation. The NDA is a verified prerequisite</p>
        <label className="mt-3 flex items-center gap-2 text-base text-ivory/80">
          <input type="checkbox" className="h-4 w-4" checked={forum} onChange={(e) => toggleForum(e.target.checked)} />
          Participates in Readiness Vanguard Forum{forum ? "" : " · opted out: Stage 1 documents are hidden and the member sees a 4-stage journey"}
        </label>
        <div className="mt-3 flex flex-wrap gap-5">
          {memberTracks(entity).map((t) => (
            <label key={t} className="flex items-center gap-2 text-base text-ivory/80">
              <input type="checkbox" className="h-4 w-4" checked={Boolean(activation[t])} onChange={(e) => toggleActivation(t, e.target.checked)} />
              {t.toUpperCase()} appointed (verified agreements, countersignature & appointment action){activation[t] ? ` · ${new Date(activation[t]!).toLocaleDateString()}` : ""}
            </label>
          ))}
        </div>
      </div>

      <AdminGovernancePanel memberId={memberId} preview={preview} onChange={() => docs.refetch()} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-base text-ivory/70 sm:col-span-2">
          Start from a journey document (optional)
          <select defaultValue="" onChange={(e) => applyPreset(e.target.value)} className={`mt-1 ${selectCls}`}>
            <option value="">Choose a standard document…</option>
            {STAGES.map((st) => (
              <optgroup key={st.n} label={`Stage ${st.n} · ${st.label}`}>
                {JOURNEY_PRESETS.map((p, i) => p.stage === st.n ? <option key={i} value={i}>{p.track === "shared" ? "Shared" : p.track.toUpperCase()} — {p.title}</option> : null)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-base text-ivory/70">
          Journey stage
          <select value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} className={`mt-1 ${selectCls}`}>
            {STAGES.map((st) => <option key={st.n} value={String(st.n)}>Stage {st.n} · {st.label}{st.n === 5 ? " (one-off)" : ""}</option>)}
          </select>
        </label>
        <label className="text-base text-ivory/70">
          Track
          <select value={stage === "1" ? "shared" : track} disabled={stage === "1"} onChange={(e) => setTrack(e.target.value as typeof track)} className={`mt-1 ${selectCls}`}>
            <option value="shared">Shared Forum</option>
            <option value="prsc">PRSC</option>
            <option value="dis">DIS</option>
          </select>
        </label>
        <label className="text-base text-ivory/70">
          Order within the stage
          <Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="mt-1 text-base" />
        </label>
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
              setAction(value === "sign" ? "esign" : "acknowledge");
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
                <option value="esign">Read and sign in the portal</option>
                <option value="boldsign">Sign in BoldSign (link)</option>
              </>
            ) : (
              <option value="acknowledge">Read and acknowledge in the portal</option>
            )}
          </select>
        </label>
        {scope === "all" && (
          <>
            <label className="text-base text-ivory/70">
              Company
              <select value={audEntity} onChange={(e) => setAudEntity(e.target.value as typeof audEntity)} className={`mt-1 ${selectCls}`}>
                <option value="">All companies</option>
                <option value="prsc">PRSC members</option>
                <option value="dis">DIS members</option>
                <option value="both">Members of both</option>
              </select>
            </label>
            <label className="text-base text-ivory/70">
              Role
              <select value={audRole} onChange={(e) => setAudRole(e.target.value as typeof audRole)} className={`mt-1 ${selectCls}`}>
                <option value="">All roles</option>
                <option value="board_member">Board members</option>
                <option value="advisor">Advisors</option>
              </select>
            </label>
          </>
        )}
        <label className="text-base text-ivory/70">
          Classification
          <select value={classification} onChange={(e) => setClassification(e.target.value as Classification)} className={`mt-1 ${selectCls}`}>
            {CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        {classification === "restricted_opportunity" && (
          <label className="text-base text-ivory/70">
            Source permission (required)
            <Input value={permission} onChange={(e) => setPermission(e.target.value)} placeholder="Source, permitted use, confirmed by" className="mt-1 text-base" />
          </label>
        )}
        <label className="text-base text-ivory/70">
          Replaces an earlier version (new acknowledgment required)
          <select value={supersedes} onChange={(e) => setSupersedes(e.target.value)} className={`mt-1 ${selectCls}`}>
            <option value="">None: this is a new document</option>
            {active.map((d: any) => <option key={d.id} value={d.id}>{d.title}{d.version_label ? ` (${d.version_label})` : ""}</option>)}
          </select>
        </label>
        <label className="text-base text-ivory/70">
          Version label
          <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="v2 · Oct 2026" className="mt-1 text-base" />
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
          BoldSign link (only for BoldSign documents)
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mt-1 text-base" />
        </label>
        <label className="text-base text-ivory/70">
          Upload the PDF
          <input
            type="file"
            accept=".pdf"
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

      <div className="mt-6 flex flex-wrap items-center gap-3 border border-gold/25 p-4">
        <p className="flex-1 text-base text-ivory/70">
          {docs.data?.completedAt
            ? `All documents completed on ${new Date(docs.data.completedAt).toLocaleDateString()}.`
            : docs.data?.releasedAt
              ? `Released to ${memberName} on ${new Date(docs.data.releasedAt).toLocaleDateString()}. They were emailed to sign in and complete them.`
              : `Not released yet — ${memberName} can't see these documents until you release them.`}
        </p>
        <Button type="button" disabled={releasing || list.length === 0} onClick={release} className="text-base">
          {releasing ? "Releasing…" : docs.data?.releasedAt ? "Release again & re-send email" : "Release documents & email member"}
        </Button>
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
                <p className="mt-1 text-sm uppercase tracking-[0.14em] text-gold/80">
                  {(d as any).journey_stage ? `Stage ${(d as any).journey_stage} · ${STAGES[(d as any).journey_stage - 1].label}` : "Ongoing record"}
                  {(d as any).journey_track ? ` · ${(d as any).journey_track === "shared" ? "Shared" : (d as any).journey_track.toUpperCase()}` : ""}
                  {lockedIds.has(d.id) ? " · Waiting on earlier document" : ""}
                  {(d as any).version_label ? ` · ${(d as any).version_label}` : ""}
                  {(d as any).superseded_at ? " · Superseded (history only)" : ""}
                  {!(d as any).classification_reviewed_at ? " · Classification needs review" : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <select aria-label={`Classification for ${d.title}`} value={(d as any).classification ?? "entity_confidential"} onChange={(e) => setDocGov(d.id, { classification: e.target.value as Classification })} className="h-9 border border-gold/25 bg-navy-deep px-2 text-sm text-ivory">
                    {CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {!(d as any).superseded_at && <Button type="button" variant="outline" size="sm" onClick={() => setDocGov(d.id, { superseded: true })}>Mark superseded</Button>}
                </div>
                <p className="mt-1 text-base text-ivory/55">
                  {d.category === "sign" ? "Sign and return" : "Read and retain"} ·{" "}
                  {d.action === "boldsign" || d.action === "docusign" ? "BoldSign" : d.action === "esign" ? "Sign in portal" : "Acknowledge in portal"} ·{" "}
                  {d.member_id ? "This member" : "All members"}
                </p>
                {ack && (
                  <p className="mt-1 text-base text-gold">
                    {ack.kind === "signed" ? `Signed by ${ack.signed_name} (initials “${ack.initials}”)` : `Acknowledged — initialed “${ack.initials}”`} on{" "}
                    {new Date(ack.acknowledged_at).toLocaleString()}{ack.ip_address ? ` · IP ${ack.ip_address}` : ""}
                  </p>
                )}
                {ack?.signature_data && <img src={ack.signature_data} alt={`Signature of ${ack.signed_name}`} className="mt-2 h-16 bg-ivory p-1" />}
                {!ack && d.action !== "boldsign" && d.action !== "docusign" && <p className="mt-1 text-base text-ivory/45">Not completed yet</p>}
                {(d.action === "boldsign" || d.action === "docusign") && (
                  <label className="mt-2 flex items-center gap-2 text-base text-ivory/80">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" disabled={working === d.id}
                      checked={ack?.kind === "external_confirmed"}
                      onChange={(e) => toggleExternal(d.id, e.target.checked)} />
                    Signed in BoldSign (confirmed by admin)
                  </label>
                )}
                {ack && ack.kind !== "external_confirmed" && d.file_path && requested.has(d.id) && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-base text-gold">Member requested a copy</span>
                    {ack.signed_copy_sent_at && <span className="text-base text-ivory/55">Sent {new Date(ack.signed_copy_sent_at).toLocaleDateString()}</span>}
                    <Button type="button" variant="outline" size="sm" disabled={working === ack.id} onClick={() => openComposer(ack.id, d.title)}>
                      {working === ack.id ? "Preparing…" : ack.signed_copy_sent_at ? "Send signed copy again" : "Prepare & email signed copy"}
                    </Button>
                  </div>
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
      {composer && (
        <div className="mt-6 border border-gold/30 bg-navy-deep/60 p-5">
          <p className="text-base uppercase tracking-widest text-gold">Email signed copy</p>
          {composer.previewUrl && <a href={composer.previewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-base text-gold underline">Open the signed PDF to check it</a>}
          <label className="mt-4 block text-base text-ivory/70">To<Input className="mt-1" value={composer.to} onChange={(e) => setComposer({ ...composer, to: e.target.value })} /></label>
          <label className="mt-3 block text-base text-ivory/70">Subject<Input className="mt-1" value={composer.subject} onChange={(e) => setComposer({ ...composer, subject: e.target.value })} /></label>
          <label className="mt-3 block text-base text-ivory/70">Message<Textarea rows={7} className="mt-1" value={composer.body} onChange={(e) => setComposer({ ...composer, body: e.target.value })} /></label>
          <p className="mt-2 text-base text-ivory/55">The signed PDF is included as a secure download button (valid 7 days).</p>
          {composer.msg && <p className="mt-2 text-base text-destructive">{composer.msg}</p>}
          <div className="mt-4 flex gap-3">
            <Button type="button" disabled={composer.sending || !composer.to} onClick={sendComposer}>{composer.sending ? "Sending…" : "Send to member"}</Button>
            <Button type="button" variant="outline" onClick={() => setComposer(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  );
}
