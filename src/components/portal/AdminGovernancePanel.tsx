import { userFacingError } from "@/lib/user-facing-error";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMemberGovernance, recordForumClearance, recordNdaVerification, recordRoleReview } from "@/lib/governance.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CONFLICT_LABEL: Record<string, string> = { none: "No conflict", changed: "New or changed conflict", unsure: "Unsure, please review" };
const CLEARANCE_LABEL: Record<string, string> = {
  not_reviewed: "Not reviewed", cleared: "Cleared", cleared_restricted: "Cleared with restrictions", escalated: "Escalated", declined: "Declined",
};
const REVIEW_LABEL: Record<string, string> = {
  not_required: "Not required", pending: "Blocked pending governance/legal review", approved: "Approved after review", declined: "Declined", prohibited: "Prohibited",
};

export function AdminGovernancePanel({ memberId, preview, onChange }: { memberId: string; preview: boolean; onChange?: () => void }) {
  const q = useQuery({ queryKey: ["governance", memberId], enabled: !preview, retry: false, queryFn: () => getMemberGovernance({ data: { member_id: memberId } }) });
  const [msg, setMsg] = useState("");
  const [nda, setNda] = useState({ reference: "", entities: "prsc" as "prsc" | "dis" | "both", scope: "" });
  const [rv, setRv] = useState({ notes: "", prsc_scope: "", dis_scope: "", conflict_controls: "" });
  const [cl, setCl] = useState({ decision: "cleared" as "cleared" | "cleared_restricted" | "escalated" | "declined", meeting_eligibility: "", restrictions: "", notes: "", disclosures: false, restrictionsChecked: false });

  async function run(fn: () => Promise<unknown>, ok: string) {
    if (preview) return setMsg("Preview mode: governance records are saved on the live admin page.");
    setMsg("");
    try { await fn(); setMsg(ok); await q.refetch(); onChange?.(); } catch (e) { setMsg(userFacingError(e, "Could not save")); }
  }
  if (preview) return <p className="mt-5 text-base text-ivory/55">Governance controls (NDA, role review, Forum clearance) appear here on the live admin page.</p>;
  if (!q.data) return <p className="mt-5 text-base text-gold">Loading governance record…</p>;
  const m: any = q.data.member;
  const box = "mt-5 border border-gold/25 p-4";
  const sel = "mt-1 h-10 w-full border border-gold/25 bg-navy-deep px-3 text-base text-ivory";

  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Governance controls</p>

      <div className={box}>
        <p className="text-base text-ivory">NDA verification: {m.nda_verified_at
          ? <span className="text-gold">Verified {new Date(m.nda_verified_at).toLocaleDateString()} · covers {String(m.nda_entities).toUpperCase()} · {m.nda_reference}</span>
          : <span className="text-destructive">Not verified. Forum materials are locked and invitations are blocked</span>}</p>
        {m.nda_scope && <p className="mt-1 text-sm text-ivory/55">Scope: {m.nda_scope}</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-base text-ivory/70">Document reference / storage location<Input className="mt-1" value={nda.reference} onChange={(e) => setNda({ ...nda, reference: e.target.value })} /></label>
          <label className="text-base text-ivory/70">Entities covered<select className={sel} value={nda.entities} onChange={(e) => setNda({ ...nda, entities: e.target.value as any })}><option value="prsc">PRSC</option><option value="dis">DIS</option><option value="both">PRSC and DIS</option></select></label>
          <label className="text-base text-ivory/70">Information-sharing scope<Input className="mt-1" value={nda.scope} onChange={(e) => setNda({ ...nda, scope: e.target.value })} /></label>
        </div>
        <Button type="button" className="mt-3" onClick={() => run(() => recordNdaVerification({ data: { member_id: memberId, ...nda } }), "NDA verification recorded.")}>Record NDA verification</Button>
      </div>

      {q.data.combination.tier !== "none" && (
        <div className={box}>
          <p className="text-base text-ivory">Role combination: <span className="text-gold">{REVIEW_LABEL[m.role_review_status] ?? m.role_review_status}</span></p>
          {q.data.combination.tier === "prohibited" ? (
            <p className="mt-2 text-base text-destructive">Prohibited by {q.data.combination.clause}. It cannot be approved by an administrator.</p>
          ) : (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-base text-ivory/70">PRSC engagement scope<Textarea rows={2} className="mt-1" value={rv.prsc_scope} onChange={(e) => setRv({ ...rv, prsc_scope: e.target.value })} /></label>
                <label className="text-base text-ivory/70">DIS engagement scope<Textarea rows={2} className="mt-1" value={rv.dis_scope} onChange={(e) => setRv({ ...rv, dis_scope: e.target.value })} /></label>
                <label className="text-base text-ivory/70">Conflict controls applied<Textarea rows={2} className="mt-1" value={rv.conflict_controls} onChange={(e) => setRv({ ...rv, conflict_controls: e.target.value })} /></label>
                <label className="text-base text-ivory/70">Review notes (governance/legal basis)<Textarea rows={2} className="mt-1" value={rv.notes} onChange={(e) => setRv({ ...rv, notes: e.target.value })} /></label>
              </div>
              <div className="mt-3 flex gap-3">
                <Button type="button" onClick={() => run(() => recordRoleReview({ data: { member_id: memberId, decision: "approved", ...rv } }), "Review recorded: approved.")}>Record approval</Button>
                <Button type="button" variant="outline" onClick={() => run(() => recordRoleReview({ data: { member_id: memberId, decision: "declined", ...rv } }), "Review recorded: declined.")}>Record decline</Button>
              </div>
            </>
          )}
        </div>
      )}

      {m.participates_in_forum !== false && (
        <div className={box}>
          <p className="text-base text-ivory">Forum clearance: <span className="text-gold">{CLEARANCE_LABEL[m.forum_clearance_status]}</span>{m.forum_restrictions ? ` · Restrictions: ${m.forum_restrictions}` : ""}</p>
          <p className="mt-1 text-sm text-ivory/55">A signed confirmation does not resolve a conflict by itself. Stage 1 clears only after you record a decision here.</p>
          {q.data.conflicts.length > 0 ? q.data.conflicts.map((c: any) => (
            <p key={c.document_id + c.acknowledged_at} className="mt-2 text-base text-ivory/80">Disclosure {new Date(c.acknowledged_at).toLocaleDateString()}: <span className="text-gold">{CONFLICT_LABEL[c.conflict_answer]}</span>{c.conflict_details ? `: ${c.conflict_details}` : ""}</p>
          )) : <p className="mt-2 text-base text-ivory/55">No conflict / recusal confirmation submitted yet</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-base text-ivory/70">Decision<select className={sel} value={cl.decision} onChange={(e) => setCl({ ...cl, decision: e.target.value as any })}>
              <option value="cleared">Clear</option><option value="cleared_restricted">Clear with restrictions</option><option value="escalated">Escalate</option><option value="declined">Decline</option></select></label>
            <label className="text-base text-ivory/70">Meeting-specific eligibility<Input className="mt-1" placeholder="Session and date" value={cl.meeting_eligibility} onChange={(e) => setCl({ ...cl, meeting_eligibility: e.target.value })} /></label>
            <label className="text-base text-ivory/70">Restrictions (sessions or materials limited)<Textarea rows={2} className="mt-1" value={cl.restrictions} onChange={(e) => setCl({ ...cl, restrictions: e.target.value })} /></label>
            <label className="text-base text-ivory/70">Notes<Textarea rows={2} className="mt-1" value={cl.notes} onChange={(e) => setCl({ ...cl, notes: e.target.value })} /></label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-base text-ivory/80"><input type="checkbox" className="h-4 w-4" checked={cl.disclosures} onChange={(e) => setCl({ ...cl, disclosures: e.target.checked })} />I reviewed current disclosures</label>
          <label className="mt-1 flex items-center gap-2 text-base text-ivory/80"><input type="checkbox" className="h-4 w-4" checked={cl.restrictionsChecked} onChange={(e) => setCl({ ...cl, restrictionsChecked: e.target.checked })} />I reviewed existing restrictions and NDA status</label>
          <Button type="button" className="mt-3" disabled={!cl.disclosures || !cl.restrictionsChecked} onClick={() => run(() => recordForumClearance({ data: { member_id: memberId, decision: cl.decision, disclosures_reviewed: true, restrictions_reviewed: true, meeting_eligibility: cl.meeting_eligibility, restrictions: cl.restrictions, notes: cl.notes } }), "Clearance decision recorded.")}>Record clearance decision</Button>
        </div>
      )}

      {msg && <p className="mt-3 text-base text-gold">{msg}</p>}

      {q.data.reviews.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-base text-gold">Governance history ({q.data.reviews.length})</summary>
          <ul className="mt-2 space-y-1">
            {q.data.reviews.map((r: any) => (
              <li key={r.id} className="text-sm text-ivory/70">{new Date(r.created_at).toLocaleString()} · {r.kind.replace(/_/g, " ")} · {r.decision}{r.notes ? ` · ${r.notes}` : ""}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
