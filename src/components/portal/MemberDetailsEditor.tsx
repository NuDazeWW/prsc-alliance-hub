import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateMemberDetails } from "@/lib/portal.functions";
import { memberRoleLabel } from "@/lib/member-role-labels";

type Entity = "prsc" | "dis" | "both";
type Role = "board_member" | "advisor" | "prsc_board_dis_advisor" | "prsc_advisor_dis_board" | "methodology_committee";
type Member = {
  id: string; first_name: string; last_name: string; organization: string; title: string | null;
  entity: Entity; role: Role | string; is_candidate?: boolean; is_methodology_committee?: boolean;
};

/** Admin edit of current employment and PRSC/DIS designation, including Forum candidate → appointed promotion. */
export function MemberDetailsEditor({ member, preview, onSaved }: { member: Member; preview: boolean; onSaved: () => void }) {
  const initial = () => ({
    first_name: member.first_name, last_name: member.last_name, organization: member.organization, title: member.title ?? "",
    is_candidate: !!member.is_candidate, entity: member.entity, role: (member.role as Role) ?? "board_member",
    is_methodology_committee: !!member.is_methodology_committee,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return setMessage("Preview mode: edits are available once you are signed in.");
    setBusy(true); setMessage("");
    try {
      await updateMemberDetails({ data: { member_id: member.id, ...form } });
      setMessage("Member details saved.");
      setOpen(false);
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save member details.");
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
          <p className="mt-1 text-sm text-ivory/60">{memberRoleLabel(member.role, member.entity, !!member.is_candidate)}</p>
        </div>
        {!open && (
          <button type="button" onClick={() => { setForm(initial()); setOpen(true); setMessage(""); }} className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-navy-deep">
            <Pencil className="h-3.5 w-3.5" /> Edit member details
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={save} className="mt-5 grid gap-3 sm:grid-cols-2">
          <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" aria-label="First name" required className="text-base" />
          <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" aria-label="Last name" required className="text-base" />
          <p className="text-sm uppercase tracking-[0.16em] text-gold/80 sm:col-span-2">Current position</p>
          <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Current company / organization" aria-label="Current company or organization" required className="text-base" />
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Current professional title" aria-label="Current professional title" className="text-base" />
          <fieldset className="grid gap-2 border border-gold/30 p-4 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-sm uppercase tracking-[0.16em] text-gold/80">PRSC / DIS status</legend>
            {([{ v: true, t: "Forum candidate" }, { v: false, t: "Selected for a PRSC / DIS role" }] as const).map((o) => (
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
              {member.is_candidate && <p className="text-sm text-ivory/60 sm:col-span-2">Promoting unlocks the matching Stage 2–4 documents. Cross-entity combinations still need a recorded role review before activation.</p>}
            </>
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={busy} className="rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-[0.16em] text-navy-deep disabled:opacity-60">{busy ? "Saving…" : "Save details"}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.16em] text-ivory/80">Cancel</button>
          </div>
        </form>
      )}
      {message && <p className="mt-3 text-sm text-gold">{message}</p>}
    </section>
  );
}
