import { userFacingError } from "@/lib/user-facing-error";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getLegacyReleaseReport, reconcileEntityRelease } from "@/lib/portal.functions";

/** Existing members whose unsigned PRSC/DIS documents are now gated by the per-entity Stage 2 release. */
export function AdminReleaseReview() {
  const q = useQuery({ queryKey: ["legacy-release-report"], queryFn: () => getLegacyReleaseReport() });
  const rows = (q.data?.rows ?? []) as any[];
  const [reason, setReason] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  return (
    <div>
      <h2 className="font-serif text-2xl text-ivory">Stage 2 release review</h2>
      <p className="mt-1 text-sm text-ivory/55">Existing members with unsigned PRSC or DIS documents and no release on record. Signatures and history are never changed, and reconciling sends no email</p>
      {q.isLoading ? <p className="mt-3 text-sm text-ivory/50">Loading…</p> : !rows.length && <p className="mt-3 text-base text-ivory/70">No existing members are affected</p>}
      {(["prsc", "dis"] as const).map((t) => {
        const list = rows.filter((r) => r.entity === t);
        if (!list.length) return null;
        return (
          <div key={t} className="mt-4">
            <p className="text-gold">{t.toUpperCase()}</p>
            {list.map((r) => {
              const k = `${r.member_id}-${t}`;
              return (
                <div key={k} className="mt-2 border border-gold/15 p-3 text-sm text-ivory/80">
                  <p className="text-base text-ivory">{r.name} · {r.role.replaceAll("_", " ")} · {r.appointment} · {r.kind === "authorized" ? "Prior authorization on record" : "Needs review"}</p>
                  <p>Signed: {r.signed.map((s: any) => `${s.title}${s.version ? ` (${s.version})` : ""}`).join(", ") || "none"}</p>
                  <p>Restricted until release: {r.unsigned.map((s: any) => `${s.title}${s.version ? ` (${s.version})` : ""}`).join(", ")}</p>
                  {r.kind === "authorized" ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input value={reason[k] ?? ""} onChange={(e) => setReason({ ...reason, [k]: e.target.value })} placeholder="Reason, for the audit record" aria-label="Reconciliation reason" className="h-9 min-w-[260px] flex-1 rounded-md border border-input bg-navy px-2 text-ivory" />
                      <Button type="button" size="sm" onClick={async () => { setStatus(""); try { await reconcileEntityRelease({ data: { member_id: r.member_id, entity: t, reason: reason[k] ?? "" } }); setStatus("Release reconciled; no email sent."); await q.refetch(); } catch (e) { setStatus(userFacingError(e, "Failed")); } }}>Reconcile release</Button>
                    </div>
                  ) : <p className="mt-1 text-ivory/55">Review the member, then use Start Entity Onboarding in their documents panel if appropriate</p>}
                </div>
              );
            })}
          </div>
        );
      })}
      {status && <p className="mt-3 text-sm text-ivory/70" role="status">{status}</p>}
    </div>
  );
}
