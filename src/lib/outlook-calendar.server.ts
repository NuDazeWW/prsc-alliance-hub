import { planHoldChanges, holdTransactionId, type HoldRow } from "@/lib/calendar-holds";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/microsoft_outlook";

function keys() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const outlook = process.env["MICROSOFT_OUTLOOK_API_KEY"];
  if (!lovable || !outlook) throw new Error("Outlook calendar is not connected");
  return { lovable, outlook };
}

async function graph(path: string, init: { method?: string; body?: unknown } = {}) {
  const k = keys();
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${k.lovable}`,
      "X-Connection-Api-Key": k.outlook,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 404 && init.method === "DELETE") return null; // already gone
  if (!res.ok) {
    const text = await res.text();
    console.error(`Outlook request failed [${res.status}]: ${text}`);
    throw new Error(`Outlook request failed [${res.status}]: ${text.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

/** Which mailbox and calendar the holds will be written to.
 *  The calendar's owner is authoritative — some connections lack the /me
 *  (profile) scope, so /me is only a best-effort extra detail. */
export async function getConnectedCalendar() {
  try {
    const cal: any = await graph("/me/calendar?$select=name,canEdit,owner");
    const owner = cal?.owner ?? {};
    const email = owner.address ?? "";
    let name = owner.name ?? "";
    if (!email || !name) {
      try {
        const me: any = await graph("/me?$select=displayName,mail,userPrincipalName");
        name = name || me?.displayName || "";
      } catch {
        // Profile scope not granted — calendar owner above is sufficient.
      }
    }
    return {
      connected: true as const,
      name,
      email,
      calendar: cal?.name ?? "Calendar",
      canEdit: cal?.canEdit !== false,
      error: cal?.canEdit === false ? "The connected account cannot write to its calendar" : null,
    };
  } catch (e) {
    return { connected: false as const, name: "", email: "", calendar: "", canEdit: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function eventBody(poll: any, startsAt: string, kind: "hold" | "final") {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + poll.duration_minutes * 60000);
  const where = poll.format === "virtual" ? poll.virtual_link || "Virtual" : poll.location || "In person";
  return {
    subject: kind === "final" ? poll.title : `HOLD: ${poll.title} — Proposed`,
    showAs: "busy",
    start: { dateTime: start.toISOString().slice(0, 19), timeZone: "UTC" },
    end: { dateTime: end.toISOString().slice(0, 19), timeZone: "UTC" },
    location: { displayName: kind === "final" ? where : "" },
    body: {
      contentType: "Text",
      content:
        kind === "final"
          ? `Confirmed through the PRSC Board & Advisor Center.\n${poll.description ?? ""}`
          : "Proposed time held by the PRSC Board & Advisor Center while availability is collected. This hold is removed automatically if another time is chosen.",
    },
    isReminderOn: kind === "final",
  };
}

/** Brings the organizer calendar in line with the poll. Safe to run repeatedly. Never throws. */
export async function reconcilePollHolds(pollId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data: poll } = await db.from("meeting_polls").select("*").eq("id", pollId).maybeSingle();
  if (!poll) return { ok: false, error: "Meeting not found" };
  const [{ data: slots }, { data: holds }] = await Promise.all([
    db.from("meeting_poll_slots").select("id, starts_at").eq("poll_id", pollId),
    db.from("meeting_calendar_holds").select("*").eq("poll_id", pollId),
  ]);
  const plan = planHoldChanges(poll, (slots ?? []).map((s: any) => s.id), (holds ?? []) as HoldRow[]);
  const errors: string[] = [];
  const now = new Date().toISOString();

  try {
    keys();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.from("meeting_polls").update({ calendar_sync_error: msg }).eq("id", pollId);
    return { ok: false, error: msg };
  }

  for (const c of plan.create) {
    const slot = (slots ?? []).find((s: any) => s.id === c.slot_id);
    const transaction_id = holdTransactionId(pollId, c.slot_id);
    try {
      // transactionId lets Outlook return the same event on retry instead of a duplicate.
      const ev: any = await graph("/me/events", { method: "POST", body: { ...eventBody(poll, slot.starts_at, c.kind), transactionId: transaction_id } });
      await db.from("meeting_calendar_holds").upsert(
        { poll_id: pollId, slot_id: c.slot_id, kind: c.kind, outlook_event_id: ev.id, transaction_id, status: "synced", last_error: null, last_synced_at: now },
        { onConflict: "slot_id" },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      await db.from("meeting_calendar_holds").upsert(
        { poll_id: pollId, slot_id: c.slot_id, kind: c.kind, transaction_id, status: "error", last_error: msg },
        { onConflict: "slot_id" },
      );
    }
  }

  for (const slotId of plan.promote) {
    const h = (holds ?? []).find((x: any) => x.slot_id === slotId);
    const slot = (slots ?? []).find((s: any) => s.id === slotId);
    try {
      await graph(`/me/events/${encodeURIComponent(h.outlook_event_id)}`, { method: "PATCH", body: eventBody(poll, slot.starts_at, "final") });
      await db.from("meeting_calendar_holds").update({ kind: "final", status: "synced", last_error: null, last_synced_at: now }).eq("slot_id", slotId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      await db.from("meeting_calendar_holds").update({ status: "error", last_error: msg }).eq("slot_id", slotId);
    }
  }

  for (const h of plan.remove) {
    try {
      await graph(`/me/events/${encodeURIComponent(h.outlook_event_id!)}`, { method: "DELETE" });
      await db.from("meeting_calendar_holds").delete().eq("slot_id", h.slot_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      await db.from("meeting_calendar_holds").update({ status: "error", last_error: msg }).eq("slot_id", h.slot_id);
    }
  }

  // Error stays visible until a later sync finishes cleanly.
  await db
    .from("meeting_polls")
    .update(errors.length ? { calendar_sync_error: errors[0] } : { calendar_sync_error: null, calendar_synced_at: now })
    .eq("id", pollId);
  return { ok: errors.length === 0, error: errors[0] ?? null };
}

/** Runs reconcile without ever letting a calendar failure break the portal poll. */
export async function safeReconcile(pollId: string) {
  try {
    return await reconcilePollHolds(pollId);
  } catch (e) {
    console.error("Calendar sync failed", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
