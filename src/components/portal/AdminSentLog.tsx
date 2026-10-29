import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Download, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { csvCell } from "@/lib/csv";
import type { EmailSend } from "@/lib/portal-email.functions";

type LogMember = { id: string; first_name: string; last_name: string; email: string };
type Props = { sends: EmailSend[]; members: LogMember[]; open: boolean; onOpenChange: (open: boolean) => void };

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/**
 * Read-only record of every email the portal sent (or tried to send) to members, newest first.
 * It only lists what was recorded; it never sends or changes anything.
 */
export function AdminSentLog({ sends, members, open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "sent" | "problem">("all");
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sends.filter((s) => {
      if (status === "sent" && s.status !== "sent") return false;
      if (status === "problem" && s.status === "sent") return false;
      if (!q) return true;
      const m = byId.get(s.member_id);
      return [s.recipient_email, s.template_name, s.subject, m ? `${m.first_name} ${m.last_name}` : ""].join(" ").toLowerCase().includes(q);
    });
  }, [sends, byId, query, status]);
  const failed = sends.filter((s) => s.status !== "sent").length;

  function exportCsv() {
    const header = ["Date", "Recipient", "Email address", "Email", "Subject", "Status"];
    const lines = rows.map((s) => {
      const m = byId.get(s.member_id);
      return [new Date(s.created_at).toISOString(), m ? `${m.first_name} ${m.last_name}` : "", s.recipient_email, s.template_name, s.subject, s.status].map(csvCell).join(",");
    });
    const blob = new Blob(["﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portal-sent-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="sent-log" className="admin-card scroll-mt-24 p-6 sm:p-8" aria-labelledby="sent-log-title">
      <button type="button" onClick={() => onOpenChange(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-3">
          <History className="h-7 w-7 text-gold" />
          <span>
            <span id="sent-log-title" className="block font-display text-3xl">Sent log</span>
            <span className="mt-1 block text-sm text-ivory/55">
              {sends.length === 0 ? "Nothing has been sent yet." : `${sends.length} recorded email${sends.length === 1 ? "" : "s"}${failed ? ` · ${failed} did not deliver` : ""} · latest ${when(sends[0].created_at)}`}
            </span>
          </span>
        </span>
        {open ? <ChevronUp className="h-5 w-5 shrink-0 text-gold" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gold" />}
      </button>

      {open && (
        <div className="mt-5">
          <p className="text-sm leading-6 text-ivory/55">
            Every invitation, reminder and message the portal sent from this page, newest first (most recent 500). Adding a member without inviting them records nothing here, because nothing was sent.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email address or subject" aria-label="Search the sent log" className="min-w-0 text-base" />
            <select aria-label="Filter the sent log by result" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 border border-input bg-navy px-2 text-base">
              <option value="all">All results</option>
              <option value="sent">Delivered</option>
              <option value="problem">Did not deliver</option>
            </select>
            <Button type="button" variant="outline" className="rounded-none" disabled={rows.length === 0} onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <p className="mt-2 text-sm text-ivory/45">Showing {rows.length} of {sends.length}</p>
          <div className="mt-3 max-h-[28rem] overflow-auto border border-gold/20">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 bg-navy text-xs uppercase text-gold">
                <tr><th className="p-3">When</th><th>To</th><th>Email</th><th className="pr-3">Result</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={4} className="p-4 text-ivory/50">No emails match.</td></tr>}
                {rows.map((s) => {
                  const m = byId.get(s.member_id);
                  const ok = s.status === "sent";
                  return (
                    <tr key={s.id} className="border-t border-ivory/10 align-top">
                      <td className="whitespace-nowrap p-3 text-ivory/70">{when(s.created_at)}</td>
                      <td className="py-3 pr-3">
                        <span className="block text-ivory">{m ? `${m.first_name} ${m.last_name}` : s.recipient_email}</span>
                        {m && <span className="block text-xs text-ivory/45">{s.recipient_email}</span>}
                      </td>
                      <td className="py-3 pr-3"><span className="block text-ivory/85">{s.template_name}</span><span className="block text-xs text-ivory/45">{s.subject}</span></td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center gap-1.5 ${ok ? "text-gold" : "text-red-300/90"}`}>
                          {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                          {ok ? "Delivered" : "Did not deliver"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
