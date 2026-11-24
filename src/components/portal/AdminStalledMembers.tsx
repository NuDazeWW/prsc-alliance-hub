import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listDocumentProgress, nudgeMemberDocuments } from "@/lib/portal.functions";
import { userFacingError } from "@/lib/user-facing-error";

/** Members with documents open, stalled ones first. One click sends a reminder that names the document they are on. */
export function AdminStalledMembers({ onOpenRecord }: { onOpenRecord: (id: string) => void }) {
  const q = useQuery({ queryKey: ["document-progress"], retry: 1, refetchInterval: 120_000, queryFn: () => listDocumentProgress() });
  const [busy, setBusy] = useState<string | null>(null);
  if (q.isPending) return <p className="mt-4 text-sm text-ivory/50">Loading…</p>;
  if (q.isError || !q.data) return <p className="mt-4 text-sm text-rose-200">This list could not be loaded.</p>;
  const list = q.data.members;
  const stalled = list.filter((m: any) => m.stalled).length;

  async function nudge(m: any) {
    setBusy(m.id);
    try {
      await nudgeMemberDocuments({ data: { member_id: m.id } });
      toast.success(`Reminder sent to ${m.name}.`);
      await q.refetch();
    } catch (error) {
      toast.error(userFacingError(error, "The reminder could not be sent."));
    } finally {
      setBusy(null);
    }
  }

  if (!list.length) return <p className="mt-4 text-sm text-ivory/60">Nobody has documents open right now.</p>;
  return (
    <div className="mt-4">
      <p className="text-sm text-ivory/70">{stalled > 0 ? `${stalled} ${stalled === 1 ? "member has" : "members have"} not finished a document in 3 days or more.` : "Everyone with documents open has made progress in the last 3 days."}</p>
      <ul className="mt-3 space-y-2">
        {list.map((m: any) => (
          <li key={m.id} className={`flex flex-wrap items-center justify-between gap-3 border px-4 py-3 ${m.stalled ? "border-gold/50 bg-gold/[.06]" : "border-gold/15"}`}>
            <div className="min-w-0">
              <button type="button" onClick={() => onOpenRecord(m.id)} className="text-left text-base text-ivory underline-offset-2 hover:underline">{m.name}</button>
              <p className="text-sm text-ivory/60">{m.done} of {m.total} done · {m.daysQuiet === 0 ? "active today" : `quiet for ${m.daysQuiet} ${m.daysQuiet === 1 ? "day" : "days"}`}{m.next ? ` · next: ${m.next.title}${m.next.state === "awaiting_signature" ? " (awaiting signature)" : ""}` : ""}</p>
              {m.lastNudgeAt && <p className="text-xs text-ivory/45">Last reminded {new Date(m.lastNudgeAt).toLocaleDateString()}</p>}
            </div>
            <Button size="sm" disabled={busy !== null} onClick={() => void nudge(m)} className="bg-gold text-navy hover:bg-gold/90">{busy === m.id ? "Sending…" : "Send reminder"}</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
