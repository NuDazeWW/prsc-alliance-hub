import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, MapPin, Video, X } from "lucide-react";
import { toast } from "sonner";
import {
  cancelPoll,
  confirmPollSlot,
  createMeetingPoll,
  listAdminPolls,
  listInvitableMembers,
} from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";
import { MeetingSetupForm } from "@/components/portal/MeetingSetupForm";
import { formatSlot, timezoneLabel } from "@/lib/meeting-block";

const TYPE_LABEL: Record<string, string> = {
  board: "Official Board Meeting",
  advisory: "Advisory Meeting",
  methodology: "Methodology Committee Meeting",
};

const AVAIL_STYLE: Record<string, string> = {
  available: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  if_needed: "bg-amber-500/20 text-amber-300 border-amber-400/40",
  unavailable: "bg-rose-500/20 text-rose-300 border-rose-400/40",
};

function memberName(m: any) {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email;
}

export function AdminMeetings() {
  const [members, setMembers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([listInvitableMembers(), listAdminPolls()]);
      setMembers(m.members);
      setPolls(p.polls);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load meetings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function confirm(pollId: string, slotId: string) {
    try {
      await confirmPollSlot({ data: { poll_id: pollId, slot_id: slotId } });
      toast.success("Meeting confirmed — calendar invitations sent");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm");
    }
  }

  async function cancel(pollId: string) {
    try {
      await cancelPoll({ data: { poll_id: pollId } });
      toast.success("Meeting cancelled");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel");
    }
  }

  const inputCls =
    "w-full min-w-0 rounded-md border border-gold/25 bg-navy-deep/60 px-3 py-2 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gold/20 bg-navy-deep/40 p-5 sm:p-6">
        <h3 className="font-display text-xl text-ivory">Propose a meeting</h3>
        <p className="mt-1 mb-5 text-sm text-ivory/50">
          Pick the meeting type — the right members are pre-selected automatically (committee meetings go only to
          Methodology Committee members). Pick dates from the calendar; everyone invited gets an email asking for their
          availability.
        </p>
        <MeetingSetupForm onCreated={() => void refresh()} />
      </div>

      <div>
        <h3 className="font-display text-xl text-ivory">Meetings</h3>
        {loading ? (
          <p className="mt-3 text-sm text-ivory/50">Loading…</p>
        ) : polls.length === 0 ? (
          <p className="mt-3 text-sm text-ivory/50">No meetings proposed yet.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {polls.map((p) => {
              const responded = new Set(p.responses.map((r: any) => r.member_id));
              const pending = p.invited.filter((m: any) => !responded.has(m.id));
              return (
                <div key={p.id} className="rounded-lg border border-gold/20 bg-navy-deep/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg text-ivory">{p.title}</p>
                      <p className="mt-1 text-xs text-ivory/50">
                        {TYPE_LABEL[p.meeting_type]} · {p.duration_minutes} min · {timezoneLabel(p.timezone)} ·{" "}
                        {p.format === "virtual" ? (
                          <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Virtual</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location || "In person"}</span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                        p.status === "confirmed"
                          ? "border-emerald-400/40 text-emerald-300"
                          : p.status === "cancelled"
                            ? "border-rose-400/40 text-rose-300"
                            : "border-gold/40 text-gold"
                      }`}
                    >
                      {p.status === "open" ? "Collecting availability" : p.status}
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ivory/45">
                          <th className="border-b border-gold/15 py-2 pr-3">Member</th>
                          {p.slots.map((s: any) => (
                            <th key={s.id} className="border-b border-gold/15 px-2 py-2 text-center">
                              <Clock className="mr-1 inline h-3 w-3" />
                              {formatSlot(s.starts_at, p.timezone)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {p.invited.map((m: any) => (
                          <tr key={m.id} className="border-b border-ivory/5">
                            <td className="py-2 pr-3 text-ivory/85">{memberName(m)}</td>
                            {p.slots.map((s: any) => {
                              const r = p.responses.find((x: any) => x.slot_id === s.id && x.member_id === m.id);
                              return (
                                <td key={s.id} className="px-2 py-2 text-center">
                                  {r ? (
                                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] ${AVAIL_STYLE[r.availability]}`}>
                                      {r.availability === "available" ? "Yes" : r.availability === "if_needed" ? "If needed" : "No"}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-ivory/30">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        <tr className="text-ivory/60">
                          <td className="py-2 pr-3 text-[11px] uppercase tracking-[0.12em]">Available</td>
                          {p.slots.map((s: any) => {
                            const count = p.responses.filter(
                              (r: any) => r.slot_id === s.id && r.availability === "available",
                            ).length;
                            const best = Math.max(
                              ...p.slots.map(
                                (x: any) =>
                                  p.responses.filter((r: any) => r.slot_id === x.id && r.availability === "available")
                                    .length,
                              ),
                            );
                            return (
                              <td key={s.id} className={`px-2 py-2 text-center font-semibold ${count === best && count > 0 ? "text-gold" : ""}`}>
                                {count}/{p.invited.length}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {p.notes.filter((n: any) => n.note).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {p.notes
                        .filter((n: any) => n.note)
                        .map((n: any) => {
                          const m = p.invited.find((x: any) => x.id === n.member_id);
                          return (
                            <p key={n.member_id} className="text-xs text-ivory/55">
                              <span className="text-gold/80">{m ? memberName(m) : "Member"}:</span> {n.note}
                            </p>
                          );
                        })}
                    </div>
                  )}

                  {p.status === "open" && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {p.slots.map((s: any) => (
                        <Button
                          key={s.id}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void confirm(p.id, s.id)}
                          className="border-gold/40 text-gold hover:bg-gold/10"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Confirm {formatSlot(s.starts_at, p.timezone)}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void cancel(p.id)}
                        className="text-ivory/50 hover:text-rose-300"
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Cancel meeting
                      </Button>
                      {pending.length > 0 && (
                        <span className="text-xs text-ivory/45">
                          Waiting on: {pending.map((m: any) => memberName(m)).join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
