import { useId } from "react";
import { Input } from "@/components/ui/input";
import { intendedDesignationSchema, projectIntendedDesignation, type IntendedDesignation } from "@/lib/intended-designation";

export const INTENDED_ROLE_OPTIONS: { value: IntendedDesignation["roles"][number]; label: string }[] = [
  { value: "prsc_board", label: "PRSC Board" },
  { value: "prsc_advisor", label: "PRSC Advisor" },
  { value: "dis_board", label: "DIS Board" },
  { value: "dis_advisor", label: "DIS Advisor" },
  { value: "other", label: "Other" },
];

type Props = {
  value: IntendedDesignation;
  onChange: (value: IntendedDesignation) => void;
  disabled?: boolean;
};

/** Intended selections are separate from the member's released onboarding and appointment records. */
export function IntendedDesignationFields({ value, onChange, disabled = false }: Props) {
  const id = useId();
  const forumOnly = value.kind === "forum_invitee";
  const roleFitsEntity = (role: IntendedDesignation["roles"][number], entity = value.entity) =>
    role === "other" || (entity !== "none" && (entity === "both" || role.startsWith(`${entity}_`)));
  const parsed = intendedDesignationSchema.safeParse(value);
  const requiresAssignmentReview = parsed.success && projectIntendedDesignation(parsed.data).requiresAssignmentReview;

  function selectKind(kind: IntendedDesignation["kind"]) {
    onChange(kind === "forum_invitee"
      ? { ...value, kind, entity: "none", roles: [], other_text: "", committee: value.committee === "yes" ? "undetermined" : value.committee }
      : { ...value, kind, entity: value.entity === "none" ? "prsc" : value.entity });
  }

  function selectEntity(entity: IntendedDesignation["entity"]) {
    const roles = value.roles.filter((role) => roleFitsEntity(role, entity));
    onChange({ ...value, kind: entity === "none" ? value.kind : "identified", entity, roles, other_text: roles.includes("other") ? value.other_text : "", committee: entity === "none" && value.committee === "yes" ? "undetermined" : value.committee });
  }

  function toggleRole(role: IntendedDesignation["roles"][number], checked: boolean) {
    const roles = INTENDED_ROLE_OPTIONS.filter((option) => option.value === role ? checked : value.roles.includes(option.value)).map((option) => option.value);
    onChange({ ...value, roles, other_text: roles.includes("other") ? value.other_text : "" });
  }

  return (
    <fieldset disabled={disabled} aria-describedby={`${id}-help`} className="space-y-4 disabled:opacity-60">
      <legend className="text-sm uppercase tracking-[0.16em] text-gold/90">Intended designation · pending appointment</legend>
      <p id={`${id}-help`} className="pt-2 text-sm leading-6 text-ivory/65">Record the roles under consideration. Entity onboarding, appointment verification, and activation each follow their existing review.</p>
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-base text-ivory/80">Invitation status</legend>
        {([
          { kind: "forum_invitee", label: "United Forum Invitee" },
          { kind: "identified", label: "Identified for intended roles" },
        ] as const).map((option) => (
          <label key={option.kind} className={`flex items-center gap-3 border px-3 py-3 ${value.kind === option.kind ? "border-gold bg-gold/10" : "border-gold/20"}`}>
            <input type="radio" name={`${id}-kind`} checked={value.kind === option.kind} onChange={() => selectKind(option.kind)} className="h-4 w-4 accent-[#d4af37]" />
            <span className="text-base text-ivory">{option.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="block text-base text-ivory/80">Intended entity
        <select value={value.entity} onChange={(event) => selectEntity(event.target.value as IntendedDesignation["entity"])} className="mt-2 h-10 w-full rounded-md border border-input bg-navy px-3 text-base">
          <option value="none">None</option>
          <option value="prsc">PRSC</option>
          <option value="dis">DIS</option>
          <option value="both">Both</option>
        </select>
      </label>
      <fieldset aria-describedby={`${id}-roles-help`} className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-base text-ivory/80">Intended roles · select all that apply</legend>
        <p id={`${id}-roles-help`} className="mb-1 text-sm text-ivory/60 sm:col-span-2">Choose Both for roles across PRSC and DIS. Changing the entity clears roles outside that entity.</p>
        {INTENDED_ROLE_OPTIONS.map((option) => (
          <label key={option.value} className={`flex items-center gap-3 border border-gold/20 px-3 py-3 ${forumOnly || !roleFitsEntity(option.value) ? "opacity-50" : ""}`}>
            <input type="checkbox" checked={value.roles.includes(option.value)} disabled={forumOnly || !roleFitsEntity(option.value)} onChange={(event) => toggleRole(option.value, event.target.checked)} className="h-4 w-4 accent-[#d4af37]" />
            <span className="text-base text-ivory">{option.label}</span>
          </label>
        ))}
      </fieldset>
      {value.roles.includes("other") && <label className="block text-base text-ivory/80">Other intended role
        <Input value={value.other_text} onChange={(event) => onChange({ ...value, other_text: event.target.value })} required maxLength={400} placeholder="Describe the intended role" className="mt-2 text-base" />
      </label>}
      <label className="block text-base text-ivory/80">Intended Methodology Committee participation
        <select value={value.committee} onChange={(event) => onChange({ ...value, committee: event.target.value as IntendedDesignation["committee"] })} className="mt-2 h-10 w-full rounded-md border border-input bg-navy px-3 text-base">
          <option value="yes" disabled={forumOnly || value.entity === "none"}>Yes</option>
          <option value="no">No</option>
          <option value="undetermined">Undetermined</option>
        </select>
      </label>
      {requiresAssignmentReview && <p role="status" className="text-sm leading-6 text-gold">These intended roles can be saved. Existing entity onboarding requires a separate assignment review.</p>}
      {forumOnly && <p className="text-sm text-ivory/60">United Forum Invitees have no intended entity roles. Choose an identified designation to record an intended committee role.</p>}
    </fieldset>
  );
}
