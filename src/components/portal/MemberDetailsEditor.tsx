import { userFacingError } from "@/lib/user-facing-error";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { changeMemberEmail, saveMemberBoardSeat, saveMemberIntendedDesignation, updateMemberDetails } from "@/lib/portal.functions";
import { memberRoleLabel, memberDesignation } from "@/lib/member-role-labels";
import { readIntendedDesignation, type IntendedDesignation } from "@/lib/intended-designation";
import { IntendedDesignationFields, INTENDED_ROLE_OPTIONS } from "./IntendedDesignationFields";

type Entity = "prsc" | "dis" | "both";
type Role = "board_member" | "advisor" | "prsc_board_dis_advisor" | "prsc_advisor_dis_board" | "methodology_committee";
type Member = {
  id: string; email?: string; first_name: string; last_name: string; organization: string; title: string | null;
  entity: Entity; role: Role | string; is_candidate?: boolean; is_methodology_committee?: boolean;
  updated_at?: string; intended_designation?: IntendedDesignation | null; board_seat?: string | null;
};

/** Admin edit of current employment and PRSC/DIS designation, including Forum candidate → appointed promotion. */
export function MemberDetailsEditor({ member, preview, onSaved }: { member: Member; preview: boolean; onSaved: () => void }) {
  const initial = () => ({
    email: member.email ?? "", first_name: member.first_name, last_name: member.last_name, organization: member.organization, title: member.title ?? "",
    is_candidate: !!member.is_candidate, entity: member.entity, role: (member.role as Role) ?? "board_member",
    is_methodology_committee: !!member.is_methodology_committee,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [intendedOpen, setIntendedOpen] = useState(false);
  const [intendedForm, setIntendedForm] = useState(() => readIntendedDesignation(member));
  const [intendedUpdatedAt, setIntendedUpdatedAt] = useState(member.updated_at ?? "");
  const [intendedBusy, setIntendedBusy] = useState(false);
  const [intendedMessage, setIntendedMessage] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [seatOpen, setSeatOpen] = useState(false);
  const [seat, setSeat] = useState(member.board_seat ?? "");
  const [seatBusy, setSeatBusy] = useState(false);
  const [seatMessage, setSeatMessage] = useState("");
  const savedIntended = readIntendedDesignation(member);

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return setEmailMessage("Preview mode: edits are available once you are signed in.");
    setEmailBusy(true); setEmailMessage("");
    try {
      await changeMemberEmail({ data: { member_id: member.id, email: newEmail } });
      setEmailMessage("Email address changed. They now sign in with the new address.");
      setEmailOpen(false);
      onSaved();
    } catch (error) {
      setEmailMessage(userFacingError(error, "Could not change the email address."));
    } finally {
      setEmailBusy(false);
    }
  }

  async function saveSeat(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return setSeatMessage("Preview mode: edits are available once you are signed in.");
    setSeatBusy(true); setSeatMessage("");
    try {
      await saveMemberBoardSeat({ data: { member_id: member.id, board_seat: seat } });
      setSeatMessage(seat.trim() ? "Board seat saved." : "Board seat cleared.");
      setSeatOpen(false);
      onSaved();
    } catch (error) {
      setSeatMessage(userFacingError(error, "Could not save the board seat."));
    } finally {
      setSeatBusy(false);
    }
  }
  const savedRoleLabels = INTENDED_ROLE_OPTIONS.filter((option) => savedIntended.roles.includes(option.value)).map((option) => option.value === "other" && savedIntended.other_text ? `Other: ${savedIntended.other_text}` : option.label);

  async function saveIntended(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return setIntendedMessage("Preview mode: edits are available once you are signed in.");
    if (!intendedUpdatedAt) return setIntendedMessage("Reload this member’s details before saving the intended designation.");
    setIntendedBusy(true); setIntendedMessage("");
    try {
      await saveMemberIntendedDesignation({ data: { member_id: member.id, expected_updated_at: intendedUpdatedAt, intended_designation: intendedForm } });
      setIntendedMessage("Intended designation saved for future appointment review.");
      setIntendedOpen(false);
      onSaved();
    } catch (error) {
      setIntendedMessage(userFacingError(error, "Could not save the intended designation. Reload the member details and try again."));
    } finally {
      setIntendedBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return setMessage("Preview mode: edits are available once you are signed in.");
    setBusy(true); setMessage("");
    try {
      const { email, ...rest } = form;
      await updateMemberDetails({ data: { member_id: member.id, ...rest, ...(email.trim() ? { email: email.trim() } : {}) } });
      setMessage("Member details saved.");
      setOpen(false);
      onSaved();
    } catch (error) {
      setMessage(userFacingError(error, "Could not save member details."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-gold/20 bg-ivory/[.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Member details</p>
          <p className="mt-2 text-base text-ivory">{[member.title, member.organization].filter(Boolean).join(", ")}</p>
          <p className="mt-1 text-sm text-ivory/60">{memberDesignation(member as any)}</p>
        </div>
        {!open && (
          <button type="button" disabled={intendedBusy} onClick={() => { setForm(initial()); setOpen(true); setMessage(""); }} className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-navy-deep disabled:opacity-60">
            <Pencil className="h-3.5 w-3.5" /> Edit member details
          </button>
        )}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="border border-gold/20 p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-gold/90">Email address</p>
          <p className="mt-2 break-all text-base text-ivory">{member.email}</p>
          {!emailOpen ? (
            <button type="button" onClick={() => { setNewEmail(""); setEmailMessage(""); setEmailOpen(true); }} className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-navy-deep"><Pencil className="h-3.5 w-3.5" /> Change email</button>
          ) : (
            <form onSubmit={saveEmail} className="mt-3 space-y-3">
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" aria-label="New email address" required autoFocus className="text-base" />
              <p className="text-xs leading-5 text-gold">Their sign-in moves to this address right away. No email is sent to either address, and their NDA verification must be re-reviewed for the new address.</p>
              <div className="flex gap-3">
                <button type="submit" disabled={emailBusy || !newEmail.trim()} className="rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-[0.16em] text-navy-deep disabled:opacity-60">{emailBusy ? "Saving…" : "Change email"}</button>
                <button type="button" onClick={() => setEmailOpen(false)} className="rounded-full border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.16em] text-ivory/80">Cancel</button>
              </div>
            </form>
          )}
          {emailMessage && <p role="status" className="mt-3 text-sm text-gold">{emailMessage}</p>}
        </div>
        <div className="border border-gold/20 p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-gold/90">Board seat</p>
          <p className="mt-2 text-base text-ivory">{member.board_seat || <span className="text-ivory/50">Not yet determined</span>}</p>
          {!seatOpen ? (
            <button type="button" onClick={() => { setSeat(member.board_seat ?? ""); setSeatMessage(""); setSeatOpen(true); }} className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-navy-deep"><Pencil className="h-3.5 w-3.5" /> {member.board_seat ? "Edit board seat" : "Set board seat"}</button>
          ) : (
            <form onSubmit={saveSeat} className="mt-3 space-y-3">
              <Input value={seat} onChange={(e) => setSeat(e.target.value)} maxLength={160} placeholder="e.g. PRSC Board, Seat 3" aria-label="Board seat" autoFocus className="text-base" />
              <p className="text-xs leading-5 text-ivory/60">Record the actual seat once it is determined. Leave blank to clear it. This is a record only; it does not change access or activate an appointment.</p>
              <div className="flex gap-3">
                <button type="submit" disabled={seatBusy} className="rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-[0.16em] text-navy-deep disabled:opacity-60">{seatBusy ? "Saving…" : "Save board seat"}</button>
                <button type="button" onClick={() => setSeatOpen(false)} className="rounded-full border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.16em] text-ivory/80">Cancel</button>
              </div>
            </form>
          )}
          {seatMessage && <p role="status" className="mt-3 text-sm text-gold">{seatMessage}</p>}
        </div>
      </div>
      <div className="mt-5 border border-gold/20 p-4">
        {!intendedOpen ? <>
          <p className="text-sm uppercase tracking-[0.16em] text-gold/90">Intended designation · pending appointment</p>
          <p className="mt-2 text-base text-ivory">{savedIntended.kind === "forum_invitee" ? "Forum Invitee" : savedRoleLabels.length ? savedRoleLabels.join(" / ") : "Entity role to be determined"}</p>
          <p className="mt-1 text-sm text-ivory/60">Intended entity: {savedIntended.entity === "none" ? "None" : savedIntended.entity === "both" ? "Both" : savedIntended.entity.toUpperCase()} · Methodology Committee: {savedIntended.committee === "undetermined" ? "Undetermined" : savedIntended.committee === "yes" ? "Yes" : "No"}</p>
          <button type="button" disabled={busy || intendedBusy} onClick={() => { setIntendedForm(readIntendedDesignation(member)); setIntendedUpdatedAt(member.updated_at ?? ""); setIntendedMessage(""); setIntendedOpen(true); }} className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-navy-deep disabled:opacity-60"><Pencil className="h-3.5 w-3.5" /> Edit intended designation</button>
        </> : <form onSubmit={saveIntended} className="space-y-4">
          <IntendedDesignationFields value={intendedForm} onChange={setIntendedForm} disabled={intendedBusy || busy} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={intendedBusy || busy} className="rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-[0.16em] text-navy-deep disabled:opacity-60">{intendedBusy ? "Saving…" : "Save intended designation"}</button>
            <button type="button" disabled={intendedBusy} onClick={() => setIntendedOpen(false)} className="rounded-full border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.16em] text-ivory/80 disabled:opacity-60">Cancel</button>
          </div>
        </form>}
        {intendedMessage && <p role="status" className="mt-3 text-sm text-gold">{intendedMessage}</p>}
      </div>
      {open && (
        <form onSubmit={save} className="mt-5 grid gap-3 sm:grid-cols-2">
          <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" aria-label="First name" required className="text-base" />
          <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" aria-label="Last name" required className="text-base" />
          <label className="text-sm text-ivory/70 sm:col-span-2">Email address (sign-in and all portal emails)
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email address" required className="mt-1 text-base" />
            {form.email.trim().toLowerCase() !== (member.email ?? "").toLowerCase() && <span className="mt-1 block text-xs text-gold">Saving moves their sign-in to this address. No email is sent; their NDA verification must be re-reviewed for the new address.</span>}
          </label>
          <p className="text-sm uppercase tracking-[0.16em] text-gold/80 sm:col-span-2">Current position</p>
          <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Current company / organization (optional)" aria-label="Current company or organization (optional)" className="text-base" />
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Current professional title (optional)" aria-label="Current professional title" className="text-base" />
          <fieldset className="grid gap-2 border border-gold/30 p-4 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-sm uppercase tracking-[0.16em] text-gold/80">Entity onboarding designation</legend>
            <p className="text-sm leading-6 text-ivory/60 sm:col-span-2">This section configures the existing entity onboarding track. Record future role considerations in the intended designation section above.</p>
            {([{ v: true, t: "Forum invitee" }, { v: false, t: "Identified for a PRSC / DIS role" }] as const).map((o) => (
              <label key={String(o.v)} className={`flex cursor-pointer items-center gap-3 border px-4 py-3 ${form.is_candidate === o.v ? "border-gold bg-gold/10" : "border-gold/20"}`}>
                <input type="radio" name={`status-${member.id}`} checked={form.is_candidate === o.v} onChange={() => setForm({ ...form, is_candidate: o.v })} className="h-4 w-4 accent-[#d4af37]" />
                <span className="text-base text-ivory">{o.t}</span>
              </label>
            ))}
          </fieldset>
          {!form.is_candidate && (
            <>
              <select value={form.entity} onChange={(e) => { const entity = e.target.value as Entity; setForm({ ...form, entity, role: entity !== "both" && form.role.startsWith("prsc_") ? "board_member" : form.role }); }} aria-label="Entity" className="h-9 w-full rounded-md border border-input bg-navy px-3 text-base">
                <option value="prsc">PRSC</option><option value="dis">DIS</option><option value="both">Both</option>
              </select>
              <select value={form.role} onChange={(e) => { const role = e.target.value as Role; setForm({ ...form, role, entity: role.startsWith("prsc_") ? "both" : form.entity }); }} aria-label="Role" className="h-9 w-full rounded-md border border-input bg-navy px-3 text-base">
                <option value="board_member">{memberRoleLabel("board_member", form.entity)}</option>
                <option value="advisor">{memberRoleLabel("advisor", form.entity)}</option>
                <option value="prsc_board_dis_advisor">PRSC Board / DIS Advisor</option>
                <option value="prsc_advisor_dis_board">PRSC Advisor / DIS Board</option>
                <option value="methodology_committee">{memberRoleLabel("methodology_committee", form.entity)}</option>
              </select>
              {form.role !== "methodology_committee" && (
                <label className="flex items-center gap-3 sm:col-span-2">
                  <input type="checkbox" checked={form.is_methodology_committee} onChange={(e) => setForm({ ...form, is_methodology_committee: e.target.checked })} className="h-4 w-4 accent-[#d4af37]" />
                  <span className="text-base text-ivory/85">Also on the Methodology Committee</span>
                </label>
              )}
              {member.is_candidate && <p className="text-sm text-ivory/60 sm:col-span-2">Adding an entity onboarding designation preserves Forum records and acknowledgments. Matching Stage 2–4 documents become available after their required releases; appointment activation follows its separate review.</p>}
            </>
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={busy || intendedBusy} className="rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-[0.16em] text-navy-deep disabled:opacity-60">{busy ? "Saving…" : "Save details"}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.16em] text-ivory/80">Cancel</button>
          </div>
        </form>
      )}
      {message && <p className="mt-3 text-sm text-gold">{message}</p>}
    </section>
  );
}
