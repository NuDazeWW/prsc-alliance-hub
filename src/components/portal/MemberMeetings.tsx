import { meetingTypeLabel } from "@/lib/meeting-block";
import { userFacingError } from "@/lib/user-facing-error";
import { fetchPrivateFile } from "@/lib/private-file-client";
import { DEFAULT_MEETING_TZ, timezoneLabel } from "@/lib/meeting-block";
import { Fragment, useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock, Download, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyMeetings, submitMyAvailability } from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";
import { buildSlotHoldIcs } from "@/lib/ics";
import { FORUM_CALENDAR_PURPOSE, FORUM_CALENDAR_WELCOME, FORUM_INTRO_HEADING, FORUM_INTRO_PARAGRAPHS, FORUM_NON_VOTING_NOTE, forumSlotsSentence, isForumPoll } from "@/lib/forum-meeting-intro";

function downloadHold(p: any, s: any) {
  const ics = buildSlotHoldIcs({ slotId: s.id, title: p.title, startsAt: s.starts_at, durationMinutes: p.duration_minutes });
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "prsc-hold.ics";
  a.click();
  URL.revokeObjectURL(url);
}
import { isPreviewHost } from "@/routes/_authenticated/route";

function demoPolls() {
  const at = (days: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "demo-poll",
      status: "open",
      meeting_type: "forum",
      title: "Readiness Vanguard Coordination Forum",
      description: "Sample meeting shown in preview only.",
      format: "virtual",
      location: null,
      duration_minutes: 60,
      respond_by: at(10, 17),
      slots: [
        { id: "demo-1", starts_at: at(14, 10) },
        { id: "demo-2", starts_at: at(15, 13) },
        { id: "demo-3", starts_at: at(16, 15) },
      ],
      my_responses: [],
      my_note: "",
    },
  ];
}


const CHOICES = [
  { value: "available", label: "Available", active: "border-emerald-400 bg-emerald-500/20 text-emerald-200" },
  { value: "if_needed", label: "If needed", active: "border-amber-400 bg-amber-500/20 text-amber-200" },
  { value: "unavailable", label: "Unavailable", active: "border-rose-400 bg-rose-500/20 text-rose-200" },
] as const;

function fmt(iso: string, tz?: string | null) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: tz || DEFAULT_MEETING_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function MemberMeetings({ hideWhenEmpty = false, hideIntro = false, asMemberId, agenda = null, onOpenAgenda }: { hideWhenEmpty?: boolean; hideIntro?: boolean; asMemberId?: string; agenda?: { id: string; title: string } | null; onOpenAgenda?: (id: string) => void } = {}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  // One shared query with the Welcome Center banner, so the banner and this calendar can never disagree
  // (a separate one-time fetch used to come back empty when the page was opened straight from an email link).
  const meetingsQuery = useQuery({
    queryKey: ["my-meetings", asMemberId ?? null],
    queryFn: async () => {
      try {
        const res = await getMyMeetings({ data: { asMemberId } });
        return isPreviewHost() && res.polls.length === 0 ? { polls: demoPolls() } : res;
      } catch (err) {
        if (!isPreviewHost()) throw err;
        return { polls: demoPolls() };
      }
    },
    retry: 2,
  });
  const polls: any[] = meetingsQuery.data?.polls ?? [];
  const loading = meetingsQuery.isPending;
  useEffect(() => {
    if (meetingsQuery.error) toast.error(userFacingError(meetingsQuery.error, "Could not load meetings"));
  }, [meetingsQuery.error]);
  useEffect(() => {
    const d: Record<string, Record<string, string>> = {};
    const n: Record<string, string> = {};
    for (const p of polls) {
      d[p.id] = {};
      for (const r of p.my_responses) d[p.id][r.slot_id] = r.availability;
      n[p.id] = p.my_note ?? "";
    }
    setDrafts(d);
    setNotes(n);
  }, [meetingsQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["my-meetings"] });

  async function submit(poll: any) {
    const answers = drafts[poll.id] ?? {};
    const responses = poll.slots
      .filter((s: any) => answers[s.id])
      .map((s: any) => ({ slot_id: s.id, availability: answers[s.id] as any }));
    if (responses.length !== poll.slots.length) {
      return toast.error("Please mark every proposed time before sending");
    }
    if (String(poll.id).startsWith("demo-")) {
      return toast.success("Preview only: your availability would be sent");
    }
    setSaving(poll.id);
    try {
      if (asMemberId) { toast("Admin view: availability can only be changed by the member."); return; }
      await submitMyAvailability({ data: { poll_id: poll.id, responses, note: notes[poll.id]?.trim() || undefined } });
      toast.success("Your availability has been sent");
      await refresh();
    } catch (e) {
      toast.error(userFacingError(e, "Could not send"));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return hideWhenEmpty ? null : <p className="text-sm text-ivory/50">Loading meetings…</p>;

  // Forum polls come first so their explanation sits directly above the availability choices.
  const openAll = polls.filter((p) => p.status === "open");
  const forumOpen = openAll.filter(isForumPoll);
  const open = [...forumOpen, ...openAll.filter((p) => !isForumPoll(p))];
  const confirmed = polls.filter((p) => p.status === "confirmed");
  if (hideWhenEmpty && open.length === 0 && confirmed.length === 0) return null;

  return (
    <div className="space-y-8">
      {agenda && onOpenAgenda && (
        <button type="button" onClick={() => onOpenAgenda(agenda.id)} className="flex w-full items-center justify-between gap-4 border border-gold bg-gold/[.08] px-5 py-4 text-left transition-colors hover:bg-gold/15">
          <span>
            <span className="block text-[10px] uppercase tracking-[0.24em] text-gold">Forum agenda</span>
            <span className="mt-1 block font-display text-[19px] leading-snug text-ivory">{agenda.title}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 text-[13px] text-gold">Open the agenda <ArrowRight className="h-4 w-4" /></span>
        </button>
      )}
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
        const isForum = isForumPoll(p);
        const firstForum = isForum && forumOpen[0]?.id === p.id;
        const lastForum = isForum && forumOpen[forumOpen.length - 1]?.id === p.id;
        return (
          <Fragment key={p.id}>
          {firstForum && (
            <section aria-labelledby="forum-calendar-welcome" className="rounded-lg border border-gold/30 bg-gold/[.06] p-5 sm:p-6">
              <h3 id="forum-calendar-welcome" className="font-display text-2xl leading-tight text-ivory">{FORUM_CALENDAR_WELCOME}</h3>
              <p className="mt-2 text-[15px] leading-7 text-ivory/80">{FORUM_CALENDAR_PURPOSE}</p>
              <h4 className="mt-5 font-display text-xl leading-tight text-gold">{FORUM_INTRO_HEADING}</h4>
              {FORUM_INTRO_PARAGRAPHS.map((text) => <p key={text} className="mt-3 text-[15px] leading-7 text-ivory/80">{text}</p>)}
              <p className="mt-4 border-l-2 border-gold pl-4 text-[15px] font-medium leading-7 text-ivory">{forumSlotsSentence(forumOpen[0].slots.length)}</p>
            </section>
          )}
          <div className="space-y-3">
          <div className="rounded-lg border border-gold/25 bg-navy-deep/40 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{meetingTypeLabel(p.meeting_type)}</p>
            <h4 className="mt-1 font-display text-lg text-ivory">{p.title}</h4>
            {p.description && <p className="mt-1 text-sm text-ivory/60">{p.description}</p>}
            <p className="mt-1 text-xs text-ivory/45">
              {p.format === "virtual" ? (
                <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Virtual</span>
              ) : (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location || "In person"}</span>
              )}{" "}
              · {p.duration_minutes} minutes · times shown in {timezoneLabel(p.timezone)} time — please confirm in your local time zone
            </p>
            {p.respond_by && (
              <p className={`mt-2 text-xs ${new Date(p.respond_by).getTime() < Date.now() ? "text-rose-300" : "text-gold"}`}>
                Please respond by {fmt(p.respond_by, p.timezone)}
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
                    {fmt(s.starts_at, p.timezone)}
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
                    {(answers[s.id] === "available" || answers[s.id] === "if_needed") && (
                      <button
                        type="button"
                        onClick={() => downloadHold(p, s)}
                        className="inline-flex items-center gap-1 rounded-full border border-gold/30 px-3 py-1 text-xs text-gold/85 hover:bg-gold/10"
                      >
                        <Download className="h-3 w-3" /> Hold this time on my calendar
                      </button>
                    )}
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
          {lastForum && <p className="text-[13px] leading-6 text-ivory/70">{FORUM_NON_VOTING_NOTE}</p>}
          </div>
          </Fragment>
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
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-300">{meetingTypeLabel(p.meeting_type)}</p>
                    <p className="mt-1 font-display text-lg text-ivory">{p.title}</p>
                    {slot && (
                      <p className="mt-1 text-sm text-ivory/70">
                        <CalendarDays className="mr-1 inline h-4 w-4 text-gold" />
                        {fmt(slot.starts_at, p.timezone)} · {p.duration_minutes} min
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
                    {p.slots.length > 1 && (
                      <p className="mt-2 text-xs text-ivory/50">
                        Released times — if you saved a hold for any of these, you can delete it from your calendar:{" "}
                        {p.slots.filter((s: any) => s.id !== p.confirmed_slot_id).map((s: any) => fmt(s.starts_at, p.timezone)).join("; ")}
                      </p>
                    )}
                  </div>
                  {p.ics_token && (
                    <Button variant="outline" onClick={async () => {
                      try {
                        const blob = await fetchPrivateFile(`/api/public/meeting-ics?poll=${p.id}`);
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a"); link.href = url; link.download = "meeting.ics"; link.click(); URL.revokeObjectURL(url);
                      } catch { toast.error("Calendar access unavailable. Please sign in again."); }
                    }}>
                      <Download className="h-4 w-4" /> Add to calendar
                    </Button>
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
