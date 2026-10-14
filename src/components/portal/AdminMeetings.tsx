import { useEffect, useMemo, useState } from "react";
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

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function memberName(m: any) {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email;
}

function autoAudience(members: any[], type: string) {
  return members
    .filter((m) => {
      if (type === "methodology") return m.is_methodology_committee || m.role === "methodology_committee";
      if (type === "board") return m.role === "board_member" || m.role === "prsc_board_dis_advisor" || m.role === "prsc_advisor_dis_board";
      return m.role === "advisor" || m.role === "prsc_board_dis_advisor" || m.role === "prsc_advisor_dis_board";
    })
    .map((m) => m.id);
}

export function AdminMeetings() {
  const [members, setMembers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [meetingType, setMeetingType] = useState<"board" | "advisory" | "methodology">("board");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"virtual" | "in_person">("virtual");
  const [location, setLocation] = useState("");
  const [virtualLink, setVirtualLink] = useState("");
  const [duration, setDuration] = useState(60);
  const [slotInputs, setSlotInputs] = useState<string[]>(["", "", ""]);
  const [invited, setInvited] = useState<string[]>([]);

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

  useEffect(() => {
    setInvited(autoAudience(members, meetingType));
  }, [meetingType, members]);

  const validSlots = useMemo(() => slotInputs.filter((s) => s), [slotInputs]);

  async function submit() {
    if (!title.trim()) return toast.error("Add a meeting title");
    if (!validSlots.length) return toast.error("Add at least one proposed time");
    if (!invited.length) return toast.error("Select at least one member");
    if (format === "in_person" && !location.trim()) return toast.error("Add the location for an in-person meeting");
    setSaving(true);
    try {
      await createMeetingPoll({
        data: {
          meeting_type: meetingType,
          title: title.trim(),
          description: description.trim() || undefined,
          format,
          location: location.trim() || undefined,
          virtual_link: virtualLink.trim() || undefined,
          duration_minutes: duration,
          slots: validSlots.map((s) => ({ starts_at: new Date(s).toISOString() })),
          invited_member_ids: invited,
        },
      });
      toast.success(`Availability request sent to ${invited.length} member${invited.length === 1 ? "" : "s"}`);
      setTitle("");
      setDescription("");
      setLocation("");
      setVirtualLink("");
      setSlotInputs(["", "", ""]);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the meeting");
    } finally {
      setSaving(false);
    }
  }

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
        <p className="mt-1 text-sm text-ivory/50">
          Pick the meeting type — the right members are pre-selected automatically (committee meetings go only to
          Methodology Committee members). Add a few time options; everyone invited gets an email asking for their
          availability.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Meeting type</span>
            <select value={meetingType} onChange={(e) => setMeetingType(e.target.value as any)} className={inputCls}>
              <option value="board">Official Board Meeting</option>
              <option value="advisory">Advisory Meeting</option>
              <option value="methodology">Methodology Committee Meeting</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q3 Board Meeting" className={inputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Agenda / notes (optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as any)} className={inputCls}>
              <option value="virtual">Virtual</option>
              <option value="in_person">In person</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Duration (minutes)</span>
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 60)}
              className={inputCls}
            />
          </label>
          {format === "virtual" ? (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Video link (optional — can be added before confirming)</span>
              <input value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} placeholder="https://zoom.us/j/…" className={inputCls} />
            </label>
          ) : (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue, address, room" className={inputCls} />
            </label>
          )}
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">Proposed times</span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {slotInputs.map((s, i) => (
              <input
                key={i}
                type="datetime-local"
                value={s}
                onChange={(e) =>
                  setSlotInputs((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                }
                className={inputCls}
              />
            ))}
          </div>
          {slotInputs.length < 12 && (
            <button
              type="button"
              onClick={() => setSlotInputs((p) => [...p, ""])}
              className="mt-2 text-xs text-gold hover:text-ivory"
            >
              + Add another time option
            </button>
          )}
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80">
            Invited members ({invited.length})
          </span>
          <div className="grid max-h-44 gap-1 overflow-y-auto rounded-md border border-gold/15 p-2 sm:grid-cols-2">
            {members.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-ivory/80 hover:bg-ivory/5">
                <input
                  type="checkbox"
                  checked={invited.includes(m.id)}
                  onChange={(e) =>
                    setInvited((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)))
                  }
                  className="accent-[#d4af37]"
                />
                <span className="truncate">
                  {memberName(m)}
                  {m.is_methodology_committee && <span className="ml-1 text-[10px] text-gold/70">· Committee</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="mt-5 bg-gold text-navy hover:bg-gold/90"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {saving ? "Sending…" : "Send availability request"}
        </Button>
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
                        {TYPE_LABEL[p.meeting_type]} · {p.duration_minutes} min ·{" "}
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
                              {fmt(s.starts_at)}
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
                          <Check className="mr-1 h-3.5 w-3.5" /> Confirm {fmt(s.starts_at)}
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
