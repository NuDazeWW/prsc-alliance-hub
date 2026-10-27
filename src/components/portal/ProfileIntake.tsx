import { useState } from "react";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  PORTAL_PERSPECTIVE_GROUPS, PORTAL_ENVIRONMENT_CHOICES, PORTAL_ENVIRONMENT_NOTE,
  PORTAL_CONTRIBUTION_CHOICES, PORTAL_ECOSYSTEM_CHOICES, PORTAL_RELATIONSHIP_CHOICES,
  PORTAL_RELATIONSHIP_DETAILS_LABEL, PORTAL_RELATIONSHIP_NOTE, PORTAL_FIT_QUESTIONS,
  PORTAL_PROFILE_HANDLING_CHOICES, PORTAL_PROFILE_MATERIAL_CHOICES, PORTAL_PROFILE_MATERIALS_NOTE,
  PORTAL_COMMUNICATION_REQUIREMENT_CHOICES, PORTAL_COMMUNICATION_DETAILS_LABEL,
  PORTAL_PRIVATE_BRIEFING_CHOICES, PORTAL_COMMUNICATION_QUESTIONS,
  type FitAnswers, type CommunicationPreferences,
} from "@/lib/portal-profile-fields";

type Choice = { value: string; label: string };
const toggle = (values: string[], value: string) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

export function FitIntake({ value, onChange }: { value: FitAnswers; onChange: (next: FitAnswers) => void }) {
  const [choosing, setChoosing] = useState<"primary" | "secondary">("primary");
  const update = (patch: Partial<Pick<FitAnswers, "primary_area" | "secondary_areas" | "other_perspective" | "environment" | "contributions" | "ecosystem" | "relationship_screen" | "relationship_details" | "useful_perspective">>) => {
    const next = { ...value, ...patch };
    if (next.primary_area !== "other" && !next.secondary_areas.includes("other")) next.other_perspective = "";
    onChange(next);
  };
  const otherSelected = value.primary_area === "other" || value.secondary_areas.includes("other");
  return <div className="mt-10 space-y-9">
    <Question number={1} title={PORTAL_FIT_QUESTIONS.primary_area} hint="Choose one primary area and up to two secondary areas.">
      <div className="mb-5 flex flex-wrap gap-2" aria-label="Perspective selection type">
        <Chip selected={choosing === "primary"} onClick={() => setChoosing("primary")}>Choose primary area</Chip>
        <Chip selected={choosing === "secondary"} onClick={() => setChoosing("secondary")}>Choose secondary areas · {value.secondary_areas.length}/2</Chip>
      </div>
      <p className="mb-4 text-xs text-ivory/55" role="status">{choosing === "primary" ? "Select the one area that best reflects your perspective." : "Select up to two additional areas. Switch to “Choose primary area” to change your main selection."}</p>
      <div className="space-y-6">
        {PORTAL_PERSPECTIVE_GROUPS.map((group) => <fieldset key={group.label}>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold">{group.label}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.choices.map((option) => {
              const primary = value.primary_area === option.value;
              const secondary = value.secondary_areas.includes(option.value);
              const disabled = choosing === "secondary" && (primary || (!secondary && value.secondary_areas.length >= 2));
              return <Chip key={option.value} selected={primary || secondary} disabled={disabled} onClick={() => {
                if (choosing === "primary") update({ primary_area: primary ? "" : option.value, secondary_areas: value.secondary_areas.filter((item) => item !== option.value) });
                else update({ secondary_areas: toggle(value.secondary_areas, option.value) });
              }}>
                <span>{option.label}</span>
                {(primary || secondary) && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide">{primary ? "Primary" : "Secondary"}</span>}
              </Chip>;
            })}
          </div>
        </fieldset>)}
      </div>
      {otherSelected && <ShortAnswer label="Other relevant perspective — short description" value={value.other_perspective} onChange={(other_perspective) => update({ other_perspective })} maxLength={300} />}
    </Question>
    <Question number={2} title={PORTAL_FIT_QUESTIONS.environment} hint="Select one.">
      <SingleChoices name="fit-environment" choices={PORTAL_ENVIRONMENT_CHOICES} value={value.environment} onChange={(environment) => update({ environment })} />
      <Note>{PORTAL_ENVIRONMENT_NOTE}</Note>
    </Question>
    <Question number={3} title={PORTAL_FIT_QUESTIONS.contributions} hint={`Choose up to two. ${value.contributions.length}/2 selected.`}>
      <MultipleChoices choices={PORTAL_CONTRIBUTION_CHOICES} values={value.contributions} max={2} onChange={(contributions) => update({ contributions })} />
    </Question>
    <Question number={4} title={PORTAL_FIT_QUESTIONS.ecosystem} hint="Select all that apply.">
      <MultipleChoices choices={PORTAL_ECOSYSTEM_CHOICES} values={value.ecosystem} onChange={(ecosystem) => update({ ecosystem })} />
    </Question>
    <Question number={5} title={PORTAL_FIT_QUESTIONS.relationship_screen} hint="Preliminary relationship and independence screen · Select one.">
      <SingleChoices name="fit-relationship" choices={PORTAL_RELATIONSHIP_CHOICES} value={value.relationship_screen} onChange={(relationship_screen) => update({ relationship_screen })} />
      <ShortAnswer label={PORTAL_RELATIONSHIP_DETAILS_LABEL} value={value.relationship_details} onChange={(relationship_details) => update({ relationship_details })} maxLength={300} />
      <Note>{PORTAL_RELATIONSHIP_NOTE}</Note>
    </Question>
    <Question number={6} title={PORTAL_FIT_QUESTIONS.useful_perspective}>
      <ShortAnswer label="Your perspective" hideLabel value={value.useful_perspective} onChange={(useful_perspective) => update({ useful_perspective })} maxLength={300} />
    </Question>
  </div>;
}

export function CommunicationIntake({ value, onChange }: { value: CommunicationPreferences; onChange: (next: CommunicationPreferences) => void }) {
  const update = (patch: Partial<Pick<CommunicationPreferences, "profile_handling" | "materials" | "communications_requirement" | "communications_details" | "private_briefings">>) => onChange({ ...value, ...patch });
  const needsDetails = Boolean(value.communications_requirement && value.communications_requirement !== "none");
  return <div className="mt-10 space-y-9">
    <Question number={1} title={PORTAL_COMMUNICATION_QUESTIONS.profile_handling} hint="Select one. Your profile is private by default.">
      <SingleChoices name="profile-handling" choices={PORTAL_PROFILE_HANDLING_CHOICES} value={value.profile_handling} onChange={(profile_handling) => update({ profile_handling })} />
    </Question>
    <Question number={2} title={PORTAL_COMMUNICATION_QUESTIONS.materials} hint="Select all that apply.">
      <MultipleChoices choices={PORTAL_PROFILE_MATERIAL_CHOICES} values={value.materials} onChange={(materials, changed) => update({ materials: changed === "no_materials" ? ["no_materials"] : materials.filter((item) => item !== "no_materials") })} />
      <Note>{PORTAL_PROFILE_MATERIALS_NOTE}</Note>
    </Question>
    <Question number={3} title={PORTAL_COMMUNICATION_QUESTIONS.communications_requirement} hint="Select one.">
      <SingleChoices name="communication-requirement" choices={PORTAL_COMMUNICATION_REQUIREMENT_CHOICES} value={value.communications_requirement} onChange={(communications_requirement) => update({ communications_requirement, ...(communications_requirement === "none" ? { communications_details: "" } : {}) })} />
      {needsDetails && <ShortAnswer label={PORTAL_COMMUNICATION_DETAILS_LABEL} value={value.communications_details} onChange={(communications_details) => update({ communications_details })} maxLength={250} />}
    </Question>
    <Question number={4} title={PORTAL_COMMUNICATION_QUESTIONS.private_briefings} hint="Select one.">
      <SingleChoices name="private-briefings" choices={PORTAL_PRIVATE_BRIEFING_CHOICES} value={value.private_briefings} onChange={(private_briefings) => update({ private_briefings })} />
    </Question>
  </div>;
}

function Question({ number, title, hint, children }: { number: number; title: string; hint?: string; children: React.ReactNode }) {
  return <fieldset className="min-w-0 border-b border-ivory/10 pb-8 last:border-b-0 last:pb-0">
    <legend className="mb-2 text-base leading-6 text-ivory/90"><span className="mr-2 text-gold">{number}.</span>{title}</legend>
    {hint && <p className="mb-4 text-sm text-ivory/55">{hint}</p>}{children}
  </fieldset>;
}
function Chip({ selected, disabled, onClick, children }: { selected: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={`min-h-11 rounded-sm border px-3 py-2 text-left text-sm leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "border-gold bg-gold/15 text-gold" : "border-ivory/20 bg-navy/30 text-ivory/75 hover:border-gold/60"}`}>{children}</button>;
}
function SingleChoices({ name, choices, value, onChange }: { name: string; choices: readonly Choice[]; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2">{choices.map((option) => <label key={option.value} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border p-3 text-sm leading-6 ${value === option.value ? "border-gold/70 bg-gold/10 text-ivory" : "border-ivory/15 text-ivory/70"}`}>
    <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="mt-1.5 shrink-0 accent-gold" />
    {option.label}
  </label>)}</div>;
}
function MultipleChoices({ choices, values, max, onChange }: { choices: readonly Choice[]; values: string[]; max?: number; onChange: (values: string[], changed: string) => void }) {
  return <div className="grid gap-2 sm:grid-cols-2">{choices.map((option) => {
    const selected = values.includes(option.value);
    return <Chip key={option.value} selected={selected} disabled={!selected && max !== undefined && values.length >= max} onClick={() => onChange(toggle(values, option.value), option.value)}>
      <span className="flex items-start gap-2">{selected && <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />}<span>{option.label}</span></span>
    </Chip>;
  })}</div>;
}
function ShortAnswer({ label, hideLabel, value, onChange, maxLength }: { label: string; hideLabel?: boolean; value: string; onChange: (value: string) => void; maxLength: number }) {
  return <label className="mt-4 block text-sm text-ivory/75"><span className={hideLabel ? "sr-only" : ""}>{label}</span>
    <Textarea value={value} onChange={(event) => onChange(event.target.value)} aria-label={hideLabel ? label : undefined} maxLength={maxLength} className="mt-2 min-h-24 border-ivory/20 text-ivory" />
    <span className="mt-2 flex justify-between gap-3 text-xs text-ivory/50"><span>Optional — {maxLength} characters maximum.</span><span>{value.length}/{maxLength}</span></span>
  </label>;
}
function Note({ children }: { children: React.ReactNode }) { return <p className="mt-4 border-l-2 border-gold/30 pl-3 text-xs leading-6 text-ivory/60">{children}</p>; }
