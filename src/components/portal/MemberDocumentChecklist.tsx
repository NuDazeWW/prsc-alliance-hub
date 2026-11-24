import { useQuery } from "@tanstack/react-query";
import { getMemberDocumentChecklist } from "@/lib/portal.functions";

const STATE: Record<string, { label: string; tone: string; mark: string }> = {
  done: { label: "Done", tone: "border-emerald-400/50 text-emerald-300", mark: "✓" },
  awaiting_signature: { label: "Awaiting signature", tone: "border-gold/60 text-gold", mark: "◐" },
  not_started: { label: "Not started", tone: "border-ivory/25 text-ivory/70", mark: "○" },
  locked: { label: "Locked", tone: "border-ivory/15 text-ivory/45", mark: "–" },
};

/** Every document for one member, in order, with what is done, what is waiting on a signature and what is still locked. */
export function MemberDocumentChecklist({ memberId }: { memberId: string }) {
  const q = useQuery({ queryKey: ["member-doc-checklist", memberId], retry: 1, queryFn: () => getMemberDocumentChecklist({ data: { member_id: memberId } }) });
  if (q.isPending) return <p className="mt-6 text-sm text-ivory/50">Loading document checklist…</p>;
  if (q.isError || !q.data) return <p className="mt-6 text-sm text-rose-200">The document checklist could not be loaded.</p>;
  const { rows, done, total, releasedAt, completedAt } = q.data;
  if (!releasedAt) return <p className="mt-6 text-sm text-ivory/50">Documents have not been released to this member yet.</p>;
  return (
    <div className="mt-6 border-t border-gold/15 pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Document checklist</p>
        <p className="text-sm text-ivory/60">{done} of {total} done · released {new Date(releasedAt).toLocaleDateString()}{completedAt ? ` · completed ${new Date(completedAt).toLocaleDateString()}` : ""}</p>
      </div>
      <ol className="mt-3 space-y-2">
        {rows.map((r, i) => {
          const s = STATE[r.state];
          return (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 border border-gold/15 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-ivory"><span className="mr-2 text-ivory/40">{i + 1}.</span>{r.title}{r.version ? ` (${r.version})` : ""} <span className="text-xs text-ivory/45">· {r.action === "sign" ? "to sign" : "to read and initial"}</span></p>
                {r.note && <p className="mt-0.5 text-xs text-ivory/50">{r.note}</p>}
                {r.doneAt && <p className="mt-0.5 text-xs text-ivory/45">Completed {new Date(r.doneAt).toLocaleString()}</p>}
              </div>
              <span className={`shrink-0 border px-2 py-0.5 text-xs uppercase tracking-[0.1em] ${s.tone}`}>{s.mark} {s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
