import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { releaseMemberDocuments } from "@/lib/portal.functions";
import { userFacingError } from "@/lib/user-facing-error";

type Waiting = { id: string; name: string; org: string };
const KEY = "admin.releasePrompt.paused";

function readPaused(): string[] {
  try { const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function writePaused(ids: string[]) { try { window.localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable; the prompt simply returns next visit */ } }

/**
 * Pops up in the admin portal when members have submitted their profile and their documents have not been released.
 * It stays until each person is released or the admin pauses it. Paused people leave a slim reminder bar.
 */
export function AdminReleasePrompt({ members, profiles, preview, onReleased }: { members: any[]; profiles: any[]; preview: boolean; onReleased: () => void }) {
  const [paused, setPaused] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { setPaused(readPaused()); setReady(true); }, []);

  const waiting: Waiting[] = useMemo(() => {
    // Ready for documents once they have finished orientation or submitted their profile. A profile is never required.
    const submitted = new Set(profiles.filter((p) => p.submitted_at).map((p) => p.member_id));
    return members
      .filter((m) => m.status !== "revoked" && !m.is_admin && (submitted.has(m.id) || m.orientation_acknowledged_at) && !m.documents_released_at)
      .map((m) => ({ id: m.id, name: `${m.first_name} ${m.last_name}`.trim(), org: m.organization ?? "" }));
  }, [members, profiles]);

  if (!ready || preview || !waiting.length) return null;
  const active = waiting.filter((w) => !paused.includes(w.id));
  const snoozed = waiting.filter((w) => paused.includes(w.id));

  function pauseAll() { const next = [...new Set([...paused, ...active.map((w) => w.id)])]; setPaused(next); writePaused(next); }
  function resume() { const next = paused.filter((id) => !snoozed.some((w) => w.id === id)); setPaused(next); writePaused(next); }

  async function release(w: Waiting) {
    setBusy(w.id);
    setErrors((e) => { const { [w.id]: _gone, ...rest } = e; return rest; });
    try {
      await releaseMemberDocuments({ data: { member_id: w.id } });
      onReleased();
    } catch (error) {
      setErrors((e) => ({ ...e, [w.id]: userFacingError(error, "The documents could not be released.") }));
    } finally {
      setBusy(null);
    }
  }
  async function releaseAll() { for (const w of active) await release(w); }

  return (
    <>
      {snoozed.length > 0 && active.length === 0 && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory">
          <span>{snoozed.length} {snoozed.length === 1 ? "member is" : "members are"} ready and waiting for documents to be released ({snoozed.map((w) => w.name).join(", ")}).</span>
          <Button size="sm" onClick={resume} className="bg-gold text-navy hover:bg-gold/90">Review now</Button>
        </div>
      )}
      <Dialog open={active.length > 0}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="max-w-xl border-gold/40 bg-navy-deep text-ivory">
          <DialogHeader>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Next step</p>
            <DialogTitle className="font-display text-3xl">{active.length === 1 ? `${active[0].name} is ready for documents.` : `${active.length} members are ready for documents.`}</DialogTitle>
            <DialogDescription className="text-ivory/70">
              Release the Forum documents so {active.length === 1 ? "they" : "these members"} can continue. Each person is emailed that their documents are ready.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {active.map((w) => (
              <li key={w.id} className="border border-gold/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0"><p className="text-base text-ivory">{w.name}</p>{w.org && <p className="text-sm text-ivory/55">{w.org}</p>}</div>
                  <Button disabled={busy !== null} onClick={() => void release(w)} className="bg-gold text-navy hover:bg-gold/90">{busy === w.id ? "Releasing…" : "Release documents"}</Button>
                </div>
                {errors[w.id] && <p role="alert" className="mt-3 text-sm text-rose-200">{errors[w.id]}</p>}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="outline" disabled={busy !== null} onClick={pauseAll} className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">Pause</Button>
            {active.length > 1 && <Button disabled={busy !== null} onClick={() => void releaseAll()} className="bg-gold text-navy hover:bg-gold/90">Release all ({active.length})</Button>}
          </div>
          <p className="text-xs text-ivory/45">Pause keeps this reminder at the top of the page until you are ready.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
