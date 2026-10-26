import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getQuestionRegister, saveQuestionRound, saveQuestionGroup, prepareOutbound, updateOutbound } from "@/lib/executive-questions.functions";
import { CATEGORY_LABELS, QUESTION_CATEGORIES, QUESTION_SOURCES, ROUTES, EXTERNAL_DISCLAIMER } from "@/lib/executive-questions";

const f = "mt-1 h-10 w-full rounded-md border border-input bg-navy px-2 text-sm text-ivory";
const toLocal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

/** Secretariat Question Register. Nothing here is ever sent to Jared or any external party automatically. */
export function AdminQuestionRegister() {
  const [roundId, setRoundId] = useState<string | null>(null);
  const reg = useQuery({ queryKey: ["question-register", roundId], queryFn: () => getQuestionRegister({ data: { round_id: roundId } }) });
  const d = reg.data as any;
  const round = d?.rounds?.find((r: any) => r.id === d.roundId);
  const [form, setForm] = useState<any>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [group, setGroup] = useState({ consolidated_text: "", category: "other", source: "internal", route: "", priority: "", review_status: "new", list_target: "none" });
  const [recipient, setRecipient] = useState("Jared Odrick");
  const [status, setStatus] = useState("");
  const run = async (fn: () => Promise<unknown>, ok: string) => { setStatus(""); try { await fn(); setStatus(ok); await reg.refetch(); } catch (e) { setStatus(e instanceof Error ? e.message : "Failed"); } };
  const editRound = (r?: any) => setForm(r ? { ...r, opens_at: toLocal(r.opens_at), deadline: toLocal(r.deadline) } : { forum_key: "motorsport-forum-1", title: "", opens_at: "", deadline: "", status: "draft", briefing_document_id: "" });

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Strategic Forum Center</p>
      <h2 className="mt-2 font-serif text-2xl text-ivory">Executive Questions Register</h2>
      <p className="mt-1 text-sm text-ivory/55">{EXTERNAL_DISCLAIMER}. Nothing is shared externally without recorded approval</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-ivory/60">Round
          <select value={d?.roundId ?? ""} onChange={(e) => setRoundId(e.target.value || null)} className={f}>
            {(d?.rounds ?? []).map((r: any) => <option key={r.id} value={r.id}>{r.title} · {r.status}</option>)}
            {!d?.rounds?.length && <option value="">No rounds yet</option>}
          </select>
        </label>
        <Button type="button" variant="outline" onClick={() => editRound()}>New round</Button>
        {round && <Button type="button" variant="outline" onClick={() => editRound(round)}>Edit round</Button>}
      </div>

      {form && (
        <div className="mt-4 grid gap-3 border border-gold/20 p-4 md:grid-cols-3">
          <label className="text-xs text-ivory/60 md:col-span-2">Title<input className={f} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="text-xs text-ivory/60">Forum<input className={f} value={form.forum_key} onChange={(e) => setForm({ ...form, forum_key: e.target.value.replace(/[^a-z0-9-]/gi, "") })} /></label>
          <label className="text-xs text-ivory/60">Opens<input type="datetime-local" className={f} value={form.opens_at} onChange={(e) => setForm({ ...form, opens_at: e.target.value })} /></label>
          <label className="text-xs text-ivory/60">Deadline<input type="datetime-local" className={f} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
          <label className="text-xs text-ivory/60">Status<select className={f} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select></label>
          <label className="text-xs text-ivory/60 md:col-span-3">Approved strategic briefing (members must have access to it)
            <select className={f} value={form.briefing_document_id ?? ""} onChange={(e) => setForm({ ...form, briefing_document_id: e.target.value })}>
              <option value="">Choose…</option>
              {(d?.documents ?? []).map((x: any) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          </label>
          <div className="flex gap-2 md:col-span-3">
            <Button type="button" onClick={() => run(async () => { const r = await saveQuestionRound({ data: { id: form.id ?? null, forum_key: form.forum_key, title: form.title, status: form.status, briefing_document_id: form.briefing_document_id || null, opens_at: new Date(form.opens_at).toISOString(), deadline: new Date(form.deadline).toISOString() } }); setRoundId(r.id); setForm(null); }, "Round saved.")}>Save round</Button>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {round && (
        <>
          <p className="mt-6 text-base text-ivory">Responses</p>
          <p className="text-sm text-ivory/60">{(d.responses ?? []).map((r: any) => `${r.portal_members?.first_name} ${r.portal_members?.last_name}: ${r.status === "no_questions" ? "no additional questions" : "submitted"}`).join(" · ") || "None yet"}</p>

          <p className="mt-6 text-base text-ivory">Submitted questions</p>
          <div className="mt-2 space-y-2">
            {(d.questions ?? []).map((q: any) => (
              <label key={q.id} className="flex gap-3 border border-gold/10 p-3 text-sm text-ivory/80">
                <input type="checkbox" checked={picked.has(q.id)} onChange={(e) => { const n = new Set(picked); e.target.checked ? n.add(q.id) : n.delete(q.id); setPicked(n); }} />
                <span><span className="text-gold">{q.portal_members?.first_name} {q.portal_members?.last_name} · P{q.priority} · {QUESTION_SOURCES.find((s) => s.value === q.source)?.label}</span>{q.group_id ? " · grouped" : ""}<br />{q.question}<br /><span className="text-ivory/50">Why: {q.why_it_matters}{q.context ? ` · Context: ${q.context}` : ""}</span></span>
              </label>
            ))}
            {!d.questions?.length && <p className="text-sm text-ivory/50">No questions yet</p>}
          </div>

          <div className="mt-4 grid gap-3 border border-gold/20 p-4 md:grid-cols-3">
            <p className="text-sm text-ivory md:col-span-3">Consolidate {picked.size} selected question(s) into one register item</p>
            <label className="text-xs text-ivory/60 md:col-span-3">Consolidated question<textarea rows={2} className="mt-1 w-full rounded-md border border-input bg-navy px-2 py-2 text-sm text-ivory" value={group.consolidated_text} onChange={(e) => setGroup({ ...group, consolidated_text: e.target.value })} /></label>
            <label className="text-xs text-ivory/60">Category<select className={f} value={group.category} onChange={(e) => setGroup({ ...group, category: e.target.value })}>{QUESTION_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</select></label>
            <label className="text-xs text-ivory/60">Source<select className={f} value={group.source} onChange={(e) => setGroup({ ...group, source: e.target.value })}>{QUESTION_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
            <label className="text-xs text-ivory/60">Route<select className={f} value={group.route} onChange={(e) => setGroup({ ...group, route: e.target.value })}><option value="">—</option>{ROUTES.map((r) => <option key={r} value={r}>[{r}]</option>)}</select></label>
            <label className="text-xs text-ivory/60">Priority<select className={f} value={group.priority} onChange={(e) => setGroup({ ...group, priority: e.target.value })}><option value="">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>
            <label className="text-xs text-ivory/60">Review status<select className={f} value={group.review_status} onChange={(e) => setGroup({ ...group, review_status: e.target.value })}>{["new", "in_review", "approved_external", "internal_only", "verify", "closed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></label>
            <label className="text-xs text-ivory/60">List<select className={f} value={group.list_target} onChange={(e) => setGroup({ ...group, list_target: e.target.value })}><option value="none">Not listed</option><option value="jared">List for Jared</option><option value="internal">Internal Forum list</option></select></label>
            <Button type="button" className="md:col-span-3" onClick={() => run(async () => { await saveQuestionGroup({ data: { round_id: round.id, ...group, route: (group.route || null) as any, priority: group.priority ? Number(group.priority) : null, category: group.category as any, source: group.source as any, review_status: group.review_status as any, list_target: group.list_target as any, question_ids: [...picked] } }); setPicked(new Set()); setGroup({ ...group, consolidated_text: "" }); }, "Register item saved; original questions kept.")}>Save register item</Button>
          </div>

          {(["jared", "internal"] as const).map((t) => (
            <div key={t} className="mt-6">
              <p className="text-base text-ivory">{t === "jared" ? "Consolidated list for Jared (draft, not sent)" : "Internal strategic question list"}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ivory/80">
                {(d.groups ?? []).filter((g: any) => g.list_target === t).map((g: any) => <li key={g.id}>{g.consolidated_text} <span className="text-ivory/45">· {CATEGORY_LABELS[g.category]}{g.route ? ` · [${g.route}]` : ""}{g.priority ? ` · P${g.priority}` : ""} · {g.review_status.replace("_", " ")}</span></li>)}
              </ol>
            </div>
          ))}

          <div className="mt-6 border border-gold/20 p-4">
            <p className="text-base text-ivory">Outbound requests</p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-xs text-ivory/60">Recipient<input className={f} value={recipient} onChange={(e) => setRecipient(e.target.value)} /></label>
              <Button type="button" variant="outline" onClick={() => run(() => prepareOutbound({ data: { round_id: round.id, recipient } }), "Outbound list prepared from the Jared list. It needs approval before sharing.")}>Prepare from Jared list</Button>
            </div>
            {(d.outbound ?? []).map((o: any) => <OutboundRow key={o.id} o={o} run={run} />)}
          </div>
        </>
      )}
      {status && <p className="mt-3 text-sm text-ivory/70" role="status">{status}</p>}
    </div>
  );
}

function OutboundRow({ o, run }: { o: any; run: (fn: () => Promise<unknown>, ok: string) => Promise<void> }) {
  const [responses, setResponses] = useState(o.responses ?? "");
  const [unresolved, setUnresolved] = useState(o.unresolved ?? "");
  return (
    <div className="mt-4 border-t border-gold/10 pt-3 text-sm text-ivory/80">
      <p>To {o.recipient} · prepared {new Date(o.created_at).toLocaleDateString()} · {o.approved_at ? `approved ${new Date(o.approved_at).toLocaleDateString()}` : "awaiting approval"} · {o.shared_at ? `shared ${new Date(o.shared_at).toLocaleDateString()}` : "not shared"}</p>
      <ol className="mt-1 list-decimal pl-5">{(o.questions ?? []).map((q: any) => <li key={q.id}>{q.consolidated_text}</li>)}</ol>
      <div className="mt-2 flex flex-wrap gap-2">
        {!o.approved_at && <Button type="button" size="sm" onClick={() => run(() => updateOutbound({ data: { id: o.id, action: "approve" } }), "Founder approval recorded.")}>Record founder approval</Button>}
        {!o.shared_at && <Button type="button" size="sm" variant="outline" onClick={() => run(() => updateOutbound({ data: { id: o.id, action: "mark_shared" } }), "Marked as shared.")}>Mark as shared</Button>}
      </div>
      <textarea rows={2} className="mt-2 w-full rounded-md border border-input bg-navy px-2 py-2 text-sm text-ivory" placeholder="Responses received" value={responses} onChange={(e) => setResponses(e.target.value)} />
      <textarea rows={2} className="mt-2 w-full rounded-md border border-input bg-navy px-2 py-2 text-sm text-ivory" placeholder="Unresolved items" value={unresolved} onChange={(e) => setUnresolved(e.target.value)} />
      <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => run(() => updateOutbound({ data: { id: o.id, action: "record", responses, unresolved } }), "Responses recorded.")}>Save responses</Button>
    </div>
  );
}
