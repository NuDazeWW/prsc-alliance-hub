import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listReadyForClearance, recordConflictReview, recordForumClearance } from "@/lib/governance.functions";
import { userFacingError } from "@/lib/user-facing-error";

const KEY = "admin.clearancePrompt.paused";
const CONFLICT_LABEL: Record<string, string> = { none: "No conflict", changed: "New or changed conflict", unsure: "Unsure, please review" };
function readPaused(): string[] {
  try { const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function writePaused(ids: string[]) { try { window.localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* the prompt simply returns next visit */ } }

/**
 * Pops up when a Forum member has finished everything required (NDA, addendum, stage 1 items, signed conflict form)
 * and is waiting only for the clearance decision. Clearing opens the agenda and the confidential brief and emails them.
 */
export function AdminClearancePrompt({ preview, onCleared, onOpenRecord }: { preview: boolean; onCleared: () => void; onOpenRecord: (id: string) => void }) {
  const [paused, setPaused] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { setPaused(readPaused()); setReady(true); }, []);
  const q = useQuery({ queryKey: ["ready-for-clearance"], enabled: !preview, retry: 2, refetchInterval: 60_000, queryFn: () => listReadyForClearance() });

  const list = q.data?.ready ?? [];
  if (!ready || preview || !list.length) return null;
  const active = list.filter((w: any) => !paused.includes(w.id));
  const snoozed = list.filter((w: any) => paused.includes(w.id));
  function pauseAll() { const next = [...new Set([...paused, ...active.map((w: any) => w.id)])]; setPaused(next); writePaused(next); }
  function resume() { const next = paused.filter((id) => !snoozed.some((w: any) => w.id === id)); setPaused(next); writePaused(next); }

  async function clear(w: any) {
    setBusy(w.id);
    setErrors((e) => { const { [w.id]: _gone, ...rest } = e; return rest; });
    try {
      await recordConflictReview({ data: { member_id: w.id, decision: "approved", notes: "" } });
      await recordForumClearance({ data: { member_id: w.id, decision: "cleared", disclosures_reviewed: true, restrictions_reviewed: true, meeting_eligibility: "Inaugural Forum", restrictions: "", notes: "" } });
      await q.refetch();
      onCleared();
    } catch (error) {
      setErrors((e) => ({ ...e, [w.id]: userFacingError(error, "Clearance could not be recorded.") }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {snoozed.length > 0 && active.length === 0 && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory">
          <span>{snoozed.length} {snoozed.length === 1 ? "member is" : "members are"} ready to be cleared for the Forum ({snoozed.map((w: any) => w.name).join(", ")}).</span>
          <Button size="sm" onClick={resume} className="bg-gold text-navy hover:bg-gold/90">Review now</Button>
        </div>
      )}
      <Dialog open={active.length > 0}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="max-h-[90vh] max-w-xl overflow-y-auto border-gold/40 bg-navy-deep text-ivory">
          <DialogHeader>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Next step</p>
            <DialogTitle className="font-display text-3xl">{active.length === 1 ? `${active[0].name} is ready to be cleared.` : `${active.length} members are ready to be cleared.`}</DialogTitle>
            <DialogDescription className="text-ivory/70">
              {active.length === 1 ? "They have" : "These members have"} finished the NDA, the addendum, their Forum preparation and the conflict form. Clearing opens the agenda and the confidential strategy brief and emails them.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {active.map((w: any) => {
              const clean = w.conflictAnswer === "none";
              return (
                <li key={w.id} className="border border-gold/25 p-4">
                  <p className="text-base text-ivory">{w.name}</p>
                  {w.org && <p className="text-sm text-ivory/55">{w.org}</p>}
                  <p className="mt-2 text-sm text-ivory/80">Their conflict answer: <span className="text-gold">{CONFLICT_LABEL[w.conflictAnswer] ?? "Not on record"}</span>{w.conflictDetails ? `: ${w.conflictDetails}` : ""}</p>
                  {clean ? (
                    <>
                      <label className="mt-3 flex items-start gap-2 text-sm text-ivory/80">
                        <input type="checkbox" className="mt-1 h-4 w-4" checked={!!reviewed[w.id]} onChange={(e) => setReviewed((r) => ({ ...r, [w.id]: e.target.checked }))} />
                        I reviewed their conflict disclosure and NDA.
                      </label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button disabled={busy !== null || !reviewed[w.id]} onClick={() => void clear(w)} className="bg-gold text-navy hover:bg-gold/90">{busy === w.id ? "Clearing…" : "Approve and clear for the Forum"}</Button>
                        <Button variant="outline" onClick={() => onOpenRecord(w.id)} className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">Open full record</Button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gold">They reported a conflict or are unsure. Review it in their full record before deciding.</p>
                      <Button onClick={() => onOpenRecord(w.id)} className="mt-2 bg-gold text-navy hover:bg-gold/90">Review in full record</Button>
                    </div>
                  )}
                  {errors[w.id] && <p role="alert" className="mt-3 text-sm text-rose-200">{errors[w.id]}</p>}
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between gap-3">
            <Button variant="outline" disabled={busy !== null} onClick={pauseAll} className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">Pause</Button>
          </div>
          <p className="text-xs text-ivory/45">Pause keeps a reminder at the top of the page until you are ready.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
