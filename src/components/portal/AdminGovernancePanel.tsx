import { userFacingError } from "@/lib/user-facing-error";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getClearancePrerequisites, getMemberGovernance, listRestrictedDocuments, grantRestrictedDocument, listRestrictedGrants, recordConflictReview, recordForumClearance, recordNdaVerification, recordRoleReview, revokeRestrictedDocument } from "@/lib/governance.functions";
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
  const pre = useQuery({ queryKey: ["clearance-prereq", memberId], enabled: !preview, retry: false, queryFn: () => getClearancePrerequisites({ data: { member_id: memberId } }) });
  const grants = useQuery({ queryKey: ["restricted-grants", memberId], enabled: !preview, retry: false, queryFn: () => listRestrictedGrants({ data: { member_id: memberId } }) });
  const restricted = useQuery({ queryKey: ["restricted-docs"], enabled: !preview, retry: false, queryFn: async () => (await listRestrictedDocuments()).documents });
  const [cr, setCr] = useState({ decision: "approved" as "approved" | "declined" | "hold", notes: "" });
  const [grantReason, setGrantReason] = useState("");
  const [msg, setMsg] = useState("");
  const [nda, setNda] = useState({ reference: "", entities: "prsc" as "prsc" | "dis" | "both", scope: "" });
  const [rv, setRv] = useState({ notes: "", prsc_scope: "", dis_scope: "", conflict_controls: "" });
  const [cl, setCl] = useState({ decision: "cleared" as "cleared" | "cleared_restricted" | "escalated" | "declined", meeting_eligibility: "", restrictions: "", notes: "", disclosures: false, restrictionsChecked: false });

  const [quick, setQuick] = useState({ notes: "", restrictions: "", reviewed: false, showRestrictions: false });
  useEffect(() => {
    const mm: any = q.data?.member;
    if (mm?.nda_reference) setNda((cur) => cur.reference ? cur : { reference: mm.nda_reference, entities: (mm.nda_entities ?? "prsc") as any, scope: mm.nda_scope ?? "" });
  }, [q.data]);
  async function decide(kind: "cleared" | "cleared_restricted" | "escalated" | "declined") {
    const notes = quick.notes.trim();
    if (!quick.reviewed) return setMsg("Tick the box to confirm you reviewed the disclosures, restrictions and NDA.");
    if (kind === "cleared_restricted" && quick.restrictions.trim().length < 3) return setMsg("List the restrictions that apply.");
    const done = { cleared: "Approved and cleared for the Forum.", cleared_restricted: "Cleared with restrictions.", escalated: "Escalated. Not cleared.", declined: "Declined. Not cleared." }[kind];
    await run(async () => {
      await recordConflictReview({ data: { member_id: memberId, decision: kind === "cleared" || kind === "cleared_restricted" ? "approved" : kind === "declined" ? "declined" : "hold", notes } });
      await recordForumClearance({ data: { member_id: memberId, decision: kind, disclosures_reviewed: true, restrictions_reviewed: true, meeting_eligibility: "Inaugural Forum", restrictions: quick.restrictions.trim(), notes } });
    }, done);
  }

  const [saving, setSaving] = useState(false);
  async function run(fn: () => Promise<unknown>, ok: string) {
    if (preview) return setMsg("Preview mode: governance records are saved on the live admin page.");
    setMsg(""); setSaving(true);
    try {
      await fn();
      setMsg(ok);
      toast.success(ok);
      await Promise.all([q.refetch(), pre.refetch(), grants.refetch()]);
      onChange?.();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setMsg(`Could not save. ${userFacingError(e, "").trim() || raw.slice(0, 280)}`);
      console.error("Governance save failed", e);
    } finally {
      setSaving(false);
    }
  }
  if (preview) return <p className="mt-5 text-base text-ivory/55">Governance controls (NDA, role review, Forum clearance) appear here on the live admin page.</p>;
  if (!q.data) return <p className="mt-5 text-base text-gold">Loading governance record…</p>;
  const m: any = q.data.member;
  const box = "mt-5 border border-gold/25 p-4";
  const sel = "mt-1 h-10 w-full border border-gold/25 bg-navy-deep px-3 text-base text-ivory";

  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Governance controls</p>

      {m.participates_in_forum !== false && (() => {
        const status = m.forum_clearance_status as string;
        const cleared = status === "cleared" || status === "cleared_restricted";
        const items = pre.data?.review?.items ?? [];
        return (
          <div className="mt-5 border-2 border-gold/50 bg-gold/[.05] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Forum clearance</p>
            <p className={`mt-2 inline-block px-3 py-1.5 font-display text-2xl ${cleared ? "border border-emerald-400/60 bg-emerald-400/10 text-emerald-300" : "text-ivory"}`}>{cleared ? (status === "cleared_restricted" ? "✓ APPROVED · cleared with restrictions" : "✓ APPROVED · cleared for the Forum") : status === "declined" ? "Declined" : status === "escalated" ? "Escalated" : "Not cleared yet"}</p>
            {cleared && <p className="mt-1 text-sm text-ivory/60">{CLEARANCE_LABEL[status]}{m.forum_cleared_at ? ` on ${new Date(m.forum_cleared_at).toLocaleDateString()}` : ""}. The member can now see the Agenda and other cleared Forum materials.</p>}
            {items.length > 0 && (
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {items.map((i) => <li key={i.key} className="text-sm text-ivory/80"><span className={i.status === "done" ? "text-gold" : i.status === "unavailable" ? "text-destructive" : "text-ivory/55"}>{i.status === "done" ? "✓" : i.status === "unavailable" ? "✕" : "○"}</span> {i.label}</li>)}
              </ul>
            )}
            {pre.data?.problems.length ? <div className="mt-3">{pre.data.problems.filter((p) => !/conflict review not approved/i.test(p)).map((p) => <p key={p} className="text-sm text-destructive">{p}</p>)}</div> : null}
            {q.data.conflicts.length > 0 && q.data.conflicts.slice(0, 1).map((c: any) => (
              <p key={c.document_id + c.acknowledged_at} className="mt-3 text-base text-ivory/85">Their conflict answer: <span className="text-gold">{CONFLICT_LABEL[c.conflict_answer]}</span>{c.conflict_details ? `: ${c.conflict_details}` : ""}</p>
            ))}
            {!cleared && (
              <div className="mt-4 border-t border-gold/25 pt-4">
                <label className="block text-base text-ivory/75">Note for the record (optional)
                  <Textarea rows={2} className="mt-1" placeholder="Optional. Add context only if you want it kept with the decision." value={quick.notes} onChange={(e) => setQuick({ ...quick, notes: e.target.value })} />
                </label>
                <label className="mt-3 flex items-start gap-2 text-base text-ivory/80"><input type="checkbox" className="mt-1 h-4 w-4" checked={quick.reviewed} onChange={(e) => setQuick({ ...quick, reviewed: e.target.checked })} />I reviewed their disclosures, any restrictions and their NDA status</label>
                {quick.showRestrictions && <label className="mt-3 block text-base text-ivory/75">Restrictions<Textarea rows={2} className="mt-1" value={quick.restrictions} onChange={(e) => setQuick({ ...quick, restrictions: e.target.value })} /></label>}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button type="button" disabled={saving} onClick={() => void decide("cleared")}>{saving ? "Saving…" : "Approve and clear for the Forum"}</Button>
                  <Button type="button" variant="outline" onClick={() => { if (!quick.showRestrictions) return setQuick({ ...quick, showRestrictions: true }); void decide("cleared_restricted"); }}>{quick.showRestrictions ? "Clear with these restrictions" : "Clear with restrictions…"}</Button>
                  <Button type="button" variant="ghost" onClick={() => void decide("escalated")}>Escalate</Button>
                  <Button type="button" variant="ghost" onClick={() => void decide("declined")}>Decline</Button>
                </div>
                <p className="mt-2 text-sm text-ivory/50">One click records your conflict review and the clearance decision, each as its own audit entry. Nothing is cleared until you press a button here.</p>
              </div>
            )}
            {msg && <p role="status" className={`mt-3 text-base ${msg.startsWith("Could not") ? "text-destructive" : "text-gold"}`}>{msg}</p>}
          </div>
        );
      })()}

      <div className={box}>
        <p className="text-base text-ivory">NDA verification: {m.nda_verified_at
          ? <span className="text-gold">Verified {new Date(m.nda_verified_at).toLocaleDateString()} · covers {String(m.nda_entities).toUpperCase()} · {m.nda_reference}</span>
          : <span className="text-destructive">Not verified. Forum materials are locked and invitations are blocked</span>}</p>
        {m.nda_scope && <p className="mt-1 text-sm text-ivory/55">Scope: {m.nda_scope}</p>}
        <details className="mt-3" open={!m.nda_verified_at}>
          <summary className="cursor-pointer text-sm text-gold">{m.nda_verified_at ? "Edit NDA record (not needed: already verified)" : "Record NDA verification"}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-base text-ivory/70">Document reference / storage location<Input className="mt-1" value={nda.reference} onChange={(e) => setNda({ ...nda, reference: e.target.value })} /></label>
          <label className="text-base text-ivory/70">Entities covered<select className={sel} value={nda.entities} onChange={(e) => setNda({ ...nda, entities: e.target.value as any })}><option value="prsc">PRSC</option><option value="dis">DIS</option><option value="both">PRSC and DIS</option></select></label>
          <label className="text-base text-ivory/70">Information-sharing scope<Input className="mt-1" value={nda.scope} onChange={(e) => setNda({ ...nda, scope: e.target.value })} /></label>
        </div>
        <Button type="button" className="mt-3" onClick={() => run(() => recordNdaVerification({ data: { member_id: memberId, ...nda } }), "NDA verification recorded.")}>Record NDA verification</Button>
        </details>
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
        <details className={box}>
          <summary className="cursor-pointer text-base text-gold">Advanced: record the conflict review and clearance as separate steps</summary>
          <p className="mt-3 text-base text-ivory">Forum clearance: <span className="text-gold">{CLEARANCE_LABEL[m.forum_clearance_status]}</span>{m.forum_restrictions ? ` · Restrictions: ${m.forum_restrictions}` : ""}</p>
          <p className="mt-1 text-sm text-ivory/55">A signed confirmation does not resolve a conflict by itself. Stage 1 clears only after you record a decision here.</p>
          {q.data.conflicts.length > 0 ? q.data.conflicts.map((c: any) => (
            <p key={c.document_id + c.acknowledged_at} className="mt-2 text-base text-ivory/80">Disclosure {new Date(c.acknowledged_at).toLocaleDateString()}: <span className="text-gold">{CONFLICT_LABEL[c.conflict_answer]}</span>{c.conflict_details ? `: ${c.conflict_details}` : ""}</p>
          )) : <p className="mt-2 text-base text-ivory/55">No conflict / recusal confirmation submitted yet</p>}
          <div className="mt-3 border-l-2 border-gold/40 pl-3">
            <p className="text-sm uppercase tracking-[0.15em] text-gold">Clearance prerequisites</p>
            {pre.data?.problems.length ? pre.data.problems.map((p) => <p key={p} className="mt-1 text-base text-destructive">{p}</p>) : <p className="mt-1 text-base text-ivory/80">{pre.data ? "All prerequisites complete" : "Checking…"}</p>}
          </div>
          {pre.data?.review && (
            <div className="mt-3 border-l-2 border-gold/40 pl-3">
              <p className="text-sm uppercase tracking-[0.15em] text-gold">Consolidated Forum review</p>
              <p className="mt-1 text-sm text-ivory/55">{pre.data.review.readyForDecision ? "Everything the member must complete is recorded. Your conflict review and clearance decisions are still required." : "Recorded status only. No decision is made automatically."}</p>
              <ul className="mt-2 space-y-1">
                {pre.data.review.items.map((i) => (
                  <li key={i.key} className="text-base text-ivory/80">
                    <span className={i.status === "done" ? "text-gold" : i.status === "unavailable" ? "text-destructive" : "text-ivory/60"}>{i.status === "done" ? "Done" : i.status === "unavailable" ? "Blocked" : "Pending"}</span> · {i.label}: {i.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-base text-ivory/70">Conflict review decision<select className={sel} value={cr.decision} onChange={(e) => setCr({ ...cr, decision: e.target.value as any })}><option value="approved">Approve</option><option value="hold">Hold</option><option value="declined">Decline</option></select></label>
            <label className="text-base text-ivory/70">Conflict review notes<Input className="mt-1" value={cr.notes} onChange={(e) => setCr({ ...cr, notes: e.target.value })} /></label>
          </div>
          <Button type="button" variant="outline" className="mt-3" onClick={() => run(() => recordConflictReview({ data: { member_id: memberId, ...cr } }), "Conflict review recorded.")}>Record conflict review</Button>
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
          {pre.data?.review?.readyForDecision && (cl.decision === "cleared" || cl.decision === "cleared_restricted") && (
            <div className="mt-3 border-t border-gold/20 pt-3">
              <p className="text-sm text-ivory/55">Every item above is recorded as done. This one action records your conflict-review approval and the clearance decision above, each as its own audit entry. Add notes (at least 5 characters) to use it.</p>
              <Button type="button" className="mt-2" disabled={!cl.disclosures || !cl.restrictionsChecked || cl.notes.trim().length < 5}
                onClick={() => run(async () => {
                  await recordConflictReview({ data: { member_id: memberId, decision: "approved", notes: cl.notes.trim() } });
                  await recordForumClearance({ data: { member_id: memberId, decision: cl.decision, disclosures_reviewed: true, restrictions_reviewed: true, meeting_eligibility: cl.meeting_eligibility, restrictions: cl.restrictions, notes: cl.notes } });
                }, "Conflict review approved and clearance recorded.")}>Approve conflict review and record clearance</Button>
            </div>
          )}
        </details>
      )}

      {m.participates_in_forum !== false && (restricted.data?.length ?? 0) > 0 && (
        <div className={box}>
          <p className="text-base text-ivory">Restricted briefing access (individual, exact version)</p>
          <label className="mt-2 block text-base text-ivory/70">Reason / authorization reference<Input className="mt-1" value={grantReason} onChange={(e) => setGrantReason(e.target.value)} /></label>
          {(restricted.data ?? []).map((d: any) => {
            const active = grants.data?.grants.some((g: any) => g.document_id === d.id);
            return (
              <div key={d.id} className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-base text-ivory/80">{d.title}{d.version_label ? ` · ${d.version_label}` : ""} · {active ? <span className="text-gold">Granted</span> : "Not granted"}</span>
                {active
                  ? <Button type="button" size="sm" variant="outline" onClick={() => run(() => revokeRestrictedDocument({ data: { member_id: memberId, document_id: d.id, reason: grantReason } }), "Access revoked.")}>Revoke</Button>
                  : <Button type="button" size="sm" onClick={() => run(() => grantRestrictedDocument({ data: { member_id: memberId, document_id: d.id, reason: grantReason } }), "Access granted for this version.")}>Grant</Button>}
              </div>
            );
          })}
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
