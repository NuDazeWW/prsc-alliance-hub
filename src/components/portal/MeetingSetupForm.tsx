import { userFacingError } from "@/lib/user-facing-error";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createMeetingPoll, listInvitableMembers } from "@/lib/meetings.functions";
import { pollWordingWarning } from "@/lib/meeting-confirmations";
import { DEFAULT_MEETING_TZ, formatSlot, MEETING_TIMEZONES, timezoneLabel, zonedToUtc } from "@/lib/meeting-block";

type MeetingType = "board" | "advisory" | "methodology" | "forum" | "custom";

function memberName(m: any) {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email;
}

function autoAudience(members: any[], type: string) {
  return members
    .filter((m) => {
      if (type === "methodology") return m.is_methodology_committee || m.role === "methodology_committee";
      if (type === "board") return m.role === "board_member" || m.role === "prsc_board_dis_advisor" || m.role === "prsc_advisor_dis_board";
      if (type === "advisory") return m.role === "advisor" || m.role === "prsc_board_dis_advisor" || m.role === "prsc_advisor_dis_board";
      return false; // The Forum / custom: admin picks invitees
    })
    .map((m) => m.id);
}

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const inputCls =
  "w-full min-w-0 rounded-md border border-gold/25 bg-navy-deep/60 px-3 py-2 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold/80";

/** Calendar pop-up: pick a day, then a time. Calls onPick with a wall-clock "YYYY-MM-DDTHH:mm". */
function DateTimePicker({ label, onPick }: { label: string; onPick: (local: string) => void }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<Date | undefined>();
  const [time, setTime] = useState("13:00");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-xs text-gold hover:bg-gold/10">
          <Plus className="h-3.5 w-3.5" /> {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-auto border-gold/30 bg-navy-deep p-3 text-ivory" align="start">
        <div className="[--background:var(--color-navy-deep)] [--color-background:var(--color-navy-deep)] [--foreground:var(--color-ivory)] [--color-foreground:var(--color-ivory)] [--muted-foreground:color-mix(in_oklab,var(--color-ivory)_55%,transparent)] [--color-muted-foreground:color-mix(in_oklab,var(--color-ivory)_55%,transparent)] [--primary:var(--color-gold)] [--color-primary:var(--color-gold)] [--accent:color-mix(in_oklab,var(--color-gold)_20%,transparent)] [--color-accent:color-mix(in_oklab,var(--color-gold)_20%,transparent)]">
        <Calendar
          mode="single"
          selected={day}
          onSelect={setDay}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          className="pointer-events-auto bg-transparent p-0 text-ivory"
        />
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-gold/20 pt-3">
          <span className="text-xs text-ivory/60">Time</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} step={900} className={`${inputCls} w-32`} />
          <Button
            type="button"
            size="sm"
            disabled={!day || !time}
            onClick={() => {
              if (!day) return;
              onPick(`${dayKey(day)}T${time}`);
              setOpen(false);
              setDay(undefined);
            }}
            className="ml-auto bg-gold text-navy hover:bg-gold/90"
          >
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Chip({ local, tz, onRemove }: { local: string; tz: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 py-1 pl-3 pr-1.5 text-xs text-ivory">
      {formatSlot(zonedToUtc(local, tz), tz)}
      <button type="button" onClick={onRemove} aria-label="Remove this time" className="grid h-5 w-5 place-items-center rounded-full text-ivory/60 hover:bg-ivory/10 hover:text-ivory">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/**
 * Reusable meeting set-up form used by the Meetings section and the email pop-ups.
 * `allowNoInvitees` lets the invite flow create a meeting before the new person exists; they are enrolled when invited.
 */
export function MeetingSetupForm({
  defaultType = "board",
  allowNoInvitees = false,
  onCreated,
  submitLabel = "Create availability request",
}: {
  defaultType?: MeetingType;
  allowNoInvitees?: boolean;
  onCreated?: (pollId: string) => void;
  submitLabel?: string;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>(defaultType);
  const [customType, setCustomType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"virtual" | "in_person">("virtual");
  const [location, setLocation] = useState("");
  const [virtualLink, setVirtualLink] = useState("");
  const [duration, setDuration] = useState(60);
  const [timezone, setTimezone] = useState(DEFAULT_MEETING_TZ);
  const [respondBy, setRespondBy] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [invited, setInvited] = useState<string[]>([]);
  // No separate email by default: the request appears in the member's portal (and after orientation) and rides with their invitation email.
  const [sendEmailNow, setSendEmailNow] = useState(false);

  useEffect(() => {
    listInvitableMembers().then((m) => setMembers(m.members)).catch((e) => { console.error("listInvitableMembers failed", e); toast.error(userFacingError(e, "Could not load members to invite")); setMembers([]); });
  }, []);
  useEffect(() => {
    setInvited(autoAudience(members, meetingType));
  }, [meetingType, members]);

  const sortedSlots = useMemo(() => [...slots].sort(), [slots]);

  async function submit() {
    if (meetingType === "custom" && customType.trim().length < 2) return toast.error("Enter a meeting type name");
    if (!title.trim()) return toast.error("Add a meeting title");
    if (!slots.length) return toast.error("Add at least one proposed date and time");
    if (!invited.length && !allowNoInvitees) return toast.error("Select at least one member");
    if (format === "in_person" && !location.trim()) return toast.error("Add the location for an in-person meeting");
    setSaving(true);
    try {
      const res = await createMeetingPoll({
        data: {
          meeting_type: meetingType === "custom" ? customType.trim() : meetingType,
          title: title.trim(),
          description: description.trim() || undefined,
          format,
          location: location.trim() || undefined,
          virtual_link: virtualLink.trim() || undefined,
          duration_minutes: duration,
          timezone,
          respond_by: respondBy || undefined,
          slots: sortedSlots.map((s) => ({ starts_at: s })),
          invited_member_ids: invited,
          send_email: sendEmailNow,
        },
      });
      toast.success(invited.length ? (sendEmailNow ? `Meeting created — availability request emailed to ${invited.length} member${invited.length === 1 ? "" : "s"}` : `Meeting created — ${invited.length} member${invited.length === 1 ? "" : "s"} will see the request in their portal. No separate email was sent.`) : "Meeting created");
      setTitle("");
      setDescription("");
      setLocation("");
      setVirtualLink("");
      setSlots([]);
      setRespondBy("");
      onCreated?.(res.id);
    } catch (e) {
      toast.error(userFacingError(e, "Could not create the meeting"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Meeting type</span>
          <select value={meetingType} onChange={(e) => setMeetingType(e.target.value as MeetingType)} className={inputCls}>
            <option value="board">Official Board Meeting</option>
            <option value="advisory">Advisory Meeting</option>
            <option value="methodology">Methodology Committee Meeting</option>
            <option value="forum">The Forum</option>
            <option value="custom">Other (enter a name)…</option>
          </select>
          {meetingType === "custom" && (
            <input value={customType} onChange={(e) => setCustomType(e.target.value)} maxLength={100} placeholder="e.g. Executive Working Session" aria-label="Meeting type name" className={`${inputCls} mt-2`} />
          )}
          {(meetingType === "forum" || meetingType === "custom") && <span className="mt-1 block text-xs text-ivory/45">Choose who to invite below — nobody is preselected.</span>}
        </label>
        <label className="block">
          <span className={labelCls}>Meeting title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Inaugural Board Meeting" className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelCls}>Description / context (optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          {pollWordingWarning(title, description) && <span role="alert" className="mt-1 block text-sm text-gold">{pollWordingWarning(title, description)}</span>}
        </label>
        <label className="block">
          <span className={labelCls}>Format</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as "virtual" | "in_person")} className={inputCls}>
            <option value="virtual">Virtual</option>
            <option value="in_person">In person</option>
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Duration (minutes)</span>
          <input type="number" min={15} max={480} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelCls}>Meeting time zone</span>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
            {MEETING_TIMEZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>
          <span className="mt-1 block text-xs text-ivory/45">Times you pick are in this zone. Emails show it, with a note for recipients to confirm in their local time.</span>
        </label>
        {format === "virtual" ? (
          <label className="block sm:col-span-2">
            <span className={labelCls}>Video link (optional — can be added before confirming)</span>
            <input value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} placeholder="https://zoom.us/j/…" className={inputCls} />
          </label>
        ) : (
          <label className="block sm:col-span-2">
            <span className={labelCls}>Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue, address, room" className={inputCls} />
          </label>
        )}
      </div>

      <div className="mt-5">
        <span className={labelCls}>Proposed dates and times ({timezoneLabel(timezone)})</span>
        <div className="flex flex-wrap items-center gap-2">
          {sortedSlots.map((s) => <Chip key={s} local={s} tz={timezone} onRemove={() => setSlots((p) => p.filter((x) => x !== s))} />)}
          {slots.length < 12 && <DateTimePicker label={slots.length ? "Add another time" : "Pick a date and time"} onPick={(v) => setSlots((p) => (p.includes(v) ? p : [...p, v]))} />}
        </div>
      </div>

      <div className="mt-5">
        <span className={labelCls}>Respond by (optional)</span>
        <div className="flex flex-wrap items-center gap-2">
          {respondBy ? <Chip local={respondBy} tz={timezone} onRemove={() => setRespondBy("")} /> : <DateTimePicker label="Set a response deadline" onPick={setRespondBy} />}
        </div>
      </div>

      <div className="mt-5">
        <span className={labelCls}>Invited members ({invited.length})</span>
        {allowNoInvitees && <p className="mb-2 text-xs text-ivory/50">The person you're inviting is added automatically when you send the invitation.</p>}
        <div className="grid max-h-44 gap-1 overflow-y-auto rounded-md border border-gold/15 p-2 sm:grid-cols-2">
          {members.length === 0 && <p className="px-2 py-1 text-xs text-ivory/40">No current members yet.</p>}
          {members.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-ivory/80 hover:bg-ivory/5">
              <input
                type="checkbox"
                checked={invited.includes(m.id)}
                onChange={(e) => setInvited((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)))}
                className="accent-gold"
              />
              <span className="truncate">
                {memberName(m)}
                {m.is_methodology_committee && <span className="ml-1 text-[10px] text-gold/70">· Committee</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {!allowNoInvitees && (
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-ivory/80">
          <input type="checkbox" checked={sendEmailNow} onChange={(e) => setSendEmailNow(e.target.checked)} className="mt-1 accent-gold" />
          <span>
            Also send a separate availability email now
            <span className="block text-xs text-ivory/50">Leave unchecked and invited members simply see the request in their portal: as the banner on their Welcome Center and, for new members, right after they finish orientation. Attach it to a new invitation email from the Invitations screen to include the dates in that email.</span>
          </span>
        </label>
      )}

      <Button type="button" disabled={saving} onClick={() => void submit()} className="mt-5 bg-gold text-navy hover:bg-gold/90">
        <CalendarDays className="mr-2 h-4 w-4" />
        {saving ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
