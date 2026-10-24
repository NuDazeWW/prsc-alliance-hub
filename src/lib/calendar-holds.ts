/** Pure planning rules for Outlook calendar holds. Shared by the server sync and tests. */

export type HoldRow = { slot_id: string; kind: "hold" | "final"; outlook_event_id: string | null };
export type PollState = { status: string; confirmed_slot_id: string | null };

export type HoldPlan = {
  /** Slots that need an event created (or re-created after a failed attempt). */
  create: { slot_id: string; kind: "hold" | "final" }[];
  /** Tracked holds to turn into the confirmed Busy meeting. */
  promote: string[];
  /** Tracked events to delete. Only ever events this integration created. */
  remove: HoldRow[];
};

export function planHoldChanges(poll: PollState, slotIds: string[], holds: HoldRow[]): HoldPlan {
  const plan: HoldPlan = { create: [], promote: [], remove: [] };
  const bySlot = new Map(holds.map((h) => [h.slot_id, h]));
  const live = new Set(slotIds);

  if (poll.status === "cancelled") {
    plan.remove = holds.filter((h) => h.outlook_event_id);
    return plan;
  }
  if (poll.status === "open") {
    for (const id of slotIds) {
      const h = bySlot.get(id);
      if (!h || !h.outlook_event_id) plan.create.push({ slot_id: id, kind: "hold" });
    }
    plan.remove = holds.filter((h) => h.outlook_event_id && !live.has(h.slot_id));
    return plan;
  }
  if (poll.status === "confirmed" && poll.confirmed_slot_id) {
    const final = poll.confirmed_slot_id;
    const h = bySlot.get(final);
    if (!h || !h.outlook_event_id) plan.create.push({ slot_id: final, kind: "final" });
    else if (h.kind !== "final") plan.promote.push(final);
    plan.remove = holds.filter((x) => x.outlook_event_id && x.slot_id !== final);
    return plan;
  }
  // Drafts or unknown states: never touch the calendar.
  return plan;
}

export function holdTransactionId(pollId: string, slotId: string) {
  return `prsc-hold-${pollId}-${slotId}`;
}
