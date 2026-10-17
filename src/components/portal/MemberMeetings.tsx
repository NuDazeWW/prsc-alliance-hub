import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, Download, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import { getMyMeetings, submitMyAvailability } from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";

const TYPE_LABEL: Record<string, string> = {
  board: "Official Board Meeting",
  advisory: "Advisory Meeting",
  methodology: "Methodology Committee Meeting",
};

const CHOICES = [
  { value: "available", label: "Available", active: "border-emerald-400 bg-emerald-500/20 text-emerald-200" },
  { value: "if_needed", label: "If needed", active: "border-amber-400 bg-amber-500/20 text-amber-200" },
  { value: "unavailable", label: "Unavailable", active: "border-rose-400 bg-rose-500/20 text-rose-200" },
] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function MemberMeetings({ hideWhenEmpty = false, hideIntro = false }: { hideWhenEmpty?: boolean; hideIntro?: boolean } = {}) {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function refresh() {
    setLoading(true);
    try {
      const res = await getMyMeetings();
      setPolls(res.polls);
      const d: Record<string, Record<string, string>> = {};
      const n: Record<string, string> = {};
      for (const p of res.polls) {
        d[p.id] = {};
        for (const r of p.my_responses) d[p.id][r.slot_id] = r.availability;
        n[p.id] = p.my_note ?? "";
      }
      setDrafts(d);
      setNotes(n);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load meetings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function submit(poll: any) {
    const answers = drafts[poll.id] ?? {};
    const responses = poll.slots
      .filter((s: any) => answers[s.id])
      .map((s: any) => ({ slot_id: s.id, availability: answers[s.id] as any }));
    if (responses.length !== poll.slots.length) {
      return toast.error("Please mark every proposed time before sending");
    }
    setSaving(poll.id);
    try {
      await submitMyAvailability({ data: { poll_id: poll.id, responses, note: notes[poll.id]?.trim() || undefined } });
      toast.success("Your availability has been sent");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return hideWhenEmpty ? null : <p className="text-sm text-ivory/50">Loading meetings…</p>;

  const open = polls.filter((p) => p.status === "open");
  const confirmed = polls.filter((p) => p.status === "confirmed");
  if (hideWhenEmpty && open.length === 0 && confirmed.length === 0) return null;

  return (
    <div className="space-y-8">
      {!hideIntro && (
        <div>
          <h3 className="font-display text-xl text-ivory">Meetings &amp; availability</h3>
          <p className="mt-1 text-sm text-ivory/55">
            When a meeting is proposed, mark each time option below. Confirmed meetings appear here with a one-click
            calendar download.
          </p>
        </div>
      )}

      {open.length === 0 && confirmed.length === 0 && (
        <p className="text-sm text-ivory/50">No meetings are scheduled for you yet.</p>
      )}

      {open.map((p) => {
        const answers = drafts[p.id] ?? {};
        const answeredCount = Object.keys(answers).length;
        return (
          <div key={p.id} className="rounded-lg border border-gold/25 bg-navy-deep/40 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{TYPE_LABEL[p.meeting_type]}</p>
            <h4 className="mt-1 font-display text-lg text-ivory">{p.title}</h4>
            {p.description && <p className="mt-1 text-sm text-ivory/60">{p.description}</p>}
            <p className="mt-1 text-xs text-ivory/45">
              {p.format === "virtual" ? (
                <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Virtual</span>
              ) : (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location || "In person"}</span>
              )}{" "}
              · {p.duration_minutes} minutes · times shown in your local time zone
            </p>
            {p.respond_by && (
              <p className={`mt-2 text-xs ${new Date(p.respond_by).getTime() < Date.now() ? "text-rose-300" : "text-gold"}`}>
                Please respond by {fmt(p.respond_by)}
                {(() => { const days = Math.ceil((new Date(p.respond_by).getTime() - Date.now()) / 86400000); return days > 0 ? ` · ${days} day${days === 1 ? "" : "s"} left` : " · deadline passed"; })()}
              </p>
            )}
            {p.my_responses.length > 0 && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                <Check className="h-3 w-3" /> Responses received{p.my_responded_at ? ` ${new Date(p.my_responded_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""} — you can update them below
              </p>
            )}
            <div className="mt-4 space-y-3">
              {p.slots.map((s: any) => (
                <div key={s.id} className="flex flex-col gap-2 rounded-md border border-ivory/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-ivory/85">
                    <Clock className="mr-1 inline h-3.5 w-3.5 text-gold/70" />
                    {fmt(s.starts_at)}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CHOICES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [p.id]: { ...(prev[p.id] ?? {}), [s.id]: c.value },
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          answers[s.id] === c.value ? c.active : "border-ivory/20 text-ivory/60 hover:border-gold/50 hover:text-ivory"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <textarea
              value={notes[p.id] ?? ""}
              onChange={(e) => setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
              rows={2}
              placeholder="Optional note (e.g. a constraint or agenda suggestion)"
              className="mt-3 w-full rounded-md border border-gold/25 bg-navy-deep/60 px-3 py-2 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none"
            />
            <Button
              type="button"
              disabled={saving === p.id}
              onClick={() => void submit(p)}
              className="mt-3 bg-gold text-navy hover:bg-gold/90"
            >
              <Check className="mr-2 h-4 w-4" />
              {(() => { const verb = p.my_responses.length > 0 ? "Update my availability" : "Send my availability"; return saving === p.id ? "Sending…" : answeredCount === p.slots.length ? verb : `${verb} (${answeredCount}/${p.slots.length} marked)`; })()}
            </Button>
          </div>
        );
      })}

      {confirmed.length > 0 && (
        <div>
          <h4 className="font-display text-lg text-ivory">Confirmed meetings</h4>
          <div className="mt-3 space-y-3">
            {confirmed.map((p) => {
              const slot = p.slots.find((s: any) => s.id === p.confirmed_slot_id);
              return (
                <div key={p.id} className="flex flex-col gap-3 rounded-lg border border-emerald-400/25 bg-navy-deep/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-300">{TYPE_LABEL[p.meeting_type]}</p>
                    <p className="mt-1 font-display text-lg text-ivory">{p.title}</p>
                    {slot && (
                      <p className="mt-1 text-sm text-ivory/70">
                        <CalendarDays className="mr-1 inline h-4 w-4 text-gold" />
                        {fmt(slot.starts_at)} · {p.duration_minutes} min
                      </p>
                    )}
                    <p className="mt-1 text-xs text-ivory/50">
                      {p.format === "virtual" ? (
                        p.virtual_link ? (
                          <a href={p.virtual_link} target="_blank" rel="noreferrer" className="text-gold underline">
                            Join video call
                          </a>
                        ) : (
                          "Virtual — joining link to follow"
                        )
                      ) : (
                        p.location || "In person"
                      )}
                    </p>
                  </div>
                  {p.ics_token && (
                    <a
                      href={`/api/public/meeting-ics?poll=${p.id}&token=${p.ics_token}`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
                    >
                      <Download className="h-4 w-4" /> Add to calendar
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
