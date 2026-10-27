import { userFacingError } from "@/lib/user-facing-error";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FORUM_EMAILS, type ForumEmailKey } from "@/lib/forum-communications";
import { SYSTEM_EMAIL_DEFAULTS } from "@/lib/system-email-defaults";
import { getForumRecipients, sendForumEmail } from "@/lib/forum-communications.functions";
import { applyTokens, parseSignatures, renderBrandedEmail } from "@/lib/branded-email";

type Recipient = { id: string; name: string; email: string; reason: string | null; sent_at: string | null };

/** Admin-controlled Forum email series. Every send is individual and recipient-checked on the server. */
export function AdminForumCommunications() {
  const [key, setKey] = useState<ForumEmailKey>("forum_confirmed");
  const [forumKey, setForumKey] = useState("motorsport-forum-1");
  const [version, setVersion] = useState(1);
  const [docId, setDocId] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<{ id: string; title: string; forum_key: string; status: string; deadline: string }[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Recipient[]>([]);
  const [docs, setDocs] = useState<{ id: string; title: string }[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const def = FORUM_EMAILS.find((d) => d.key === key)!;

  async function load() {
    setStatus("");
    try {
      const res = await getForumRecipients({ data: { email_key: key, forum_key: forumKey, version, document_id: docId, round_id: roundId, tokens } });
      setRounds((res as any).rounds ?? []);
      setRows(res.recipients as Recipient[]);
      setDocs(res.documents as { id: string; title: string }[]);
      setPicked(new Set((res.recipients as Recipient[]).filter((r) => !r.reason && !r.sent_at).map((r) => r.id)));
    } catch {
      setStatus("Recipients could not be loaded.");
    }
  }
  useEffect(() => { void load(); }, [key, forumKey, version, docId, roundId]);

  const missing = useMemo(() => def.fields.filter((f) => !tokens[f.token]?.trim()), [def, tokens]);

  function openPreview() {
    const c = SYSTEM_EMAIL_DEFAULTS[key];
    const t = { ...tokens, first_name: "Alex" };
    const f = (v: string) => applyTokens(v, t);
    setPreview(renderBrandedEmail({ subject: f(c.subject), eyebrow: f(c.eyebrow), heading: f(c.heading), body: f(c.body), ctaLabel: f(c.cta_label), ctaUrl: f(c.cta_url), ctaSubtext: null, signatures: parseSignatures(c.signatures) }));
  }

  async function send() {
    setBusy(true);
    try {
      const res = await sendForumEmail({ data: { email_key: key, forum_key: forumKey, version, document_id: docId, round_id: roundId, tokens, member_ids: [...picked] } });
      setStatus(`${res.sent} sent individually${res.skipped ? `, ${res.skipped} skipped` : ""}.`);
      await load();
    } catch (e) {
      setStatus(userFacingError(e, "Send failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="label-caps text-gold">Forum Communications</p>
      <h2 className="mt-2 font-display text-3xl">Strategic Coordination Forum emails</h2>
      <p className="mt-2 max-w-3xl text-sm text-ivory/60">Choose an email, fill in the details, and send to the members who qualify. Each person receives their own email that links into the portal. Nothing is attached.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <label className="text-xs text-ivory/60 md:col-span-2">Email
          <select value={key} onChange={(e) => { setKey(e.target.value as ForumEmailKey); setPreview(null); }} className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-2 text-sm text-ivory">
            {FORUM_EMAILS.map((d) => <option key={d.key} value={d.key} disabled={!d.enabled}>{d.number}. {d.label}{d.enabled ? "" : " (not yet available)"}</option>)}
          </select>
        </label>
        <label className="text-xs text-ivory/60">Forum
          <input value={forumKey} onChange={(e) => setForumKey(e.target.value.replace(/[^a-z0-9-]/gi, ""))} className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-2 text-sm text-ivory" />
        </label>
        <label className="text-xs text-ivory/60">Version
          <input type="number" min={1} max={99} value={version} onChange={(e) => setVersion(Math.max(1, Number(e.target.value) || 1))} className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-2 text-sm text-ivory" />
        </label>
        {def.needsDocument && (
          <label className="text-xs text-ivory/60 md:col-span-4">Briefing document
            <select value={docId ?? ""} onChange={(e) => setDocId(e.target.value || null)} className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-2 text-sm text-ivory">
              <option value="">Choose a document…</option>
              {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </label>
        )}
        {(key === "input_requested" || key === "input_reminder") && (
          <label className="text-xs text-ivory/60 md:col-span-4">Question round (names the Forum and round; reminders skip anyone who already responded)
            <select value={roundId ?? ""} onChange={(e) => { const r = rounds.find((x) => x.id === e.target.value); setRoundId(e.target.value || null); if (r) { setForumKey(r.forum_key); setTokens({ ...tokens, deadline: new Date(r.deadline).toLocaleString(), round_title: r.title }); } }} className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-2 text-sm text-ivory">
              <option value="">Choose a round…</option>
              {rounds.map((r) => <option key={r.id} value={r.id}>{r.title} · {r.forum_key} · {r.status}</option>)}
            </select>
          </label>
        )}
        {def.fields.map((f) => (
          <label key={f.token} className="text-xs text-ivory/60 md:col-span-2">{f.label}
            <input value={tokens[f.token] ?? ""} onChange={(e) => setTokens({ ...tokens, [f.token]: e.target.value })} className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-2 text-sm text-ivory" />
          </label>
        ))}
      </div>
      {!def.enabled && <p className="mt-4 text-sm text-gold">{def.disabledReason}.</p>}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ivory/45"><tr><th className="py-2 pr-3" /><th className="pr-3">Member</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const can = !r.reason && !r.sent_at;
              return (
                <tr key={r.id} className="border-t border-ivory/10">
                  <td className="py-2 pr-3"><input type="checkbox" aria-label={`Include ${r.name}`} disabled={!can} checked={picked.has(r.id)} onChange={(e) => { const n = new Set(picked); e.target.checked ? n.add(r.id) : n.delete(r.id); setPicked(n); }} /></td>
                  <td className="pr-3">{r.name}<span className="block text-xs text-ivory/40">{r.email}</span></td>
                  <td className={r.reason ? "text-ivory/50" : r.sent_at ? "text-ivory/60" : "text-gold"}>{r.sent_at ? `Sent ${new Date(r.sent_at).toLocaleDateString()}` : r.reason ?? "Qualifies"}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={3} className="py-4 text-ivory/50">No members yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={openPreview}>Preview email</Button>
        <Button type="button" disabled={!def.enabled || busy || !picked.size || missing.length > 0} onClick={() => void send()}>{busy ? "Sending…" : `Send to ${picked.size} selected`}</Button>
        {missing.length > 0 && def.enabled && <span className="text-xs text-ivory/55">Fill in: {missing.map((m) => m.label).join(", ")}</span>}
        {status && <span className="text-sm text-gold">{status}</span>}
      </div>
      {preview && <iframe title="Forum email preview" srcDoc={preview} className="mt-5 h-[640px] w-full rounded-md border border-ivory/10 bg-background" />}
    </div>
  );
}
