import type { PortalProfileInput } from "./portal-profile-schema";
import { readCommunicationPreferences, readFitAnswers, type PortalProfileRecord } from "./portal-profile-fields";

export type ProfileForm = Omit<PortalProfileInput, "bio"> & { bio: string };
type InvitationDefaults = { first_name?: string; last_name?: string; professional_name?: string | null; title?: string | null; organization?: string | null; email?: string };
type SavedProfile = { [Key in keyof Omit<ProfileForm, "experience_answers" | "visibility_instructions">]?: ProfileForm[Key] | null } & {
  submitted_at?: string | null; experience_answers?: PortalProfileRecord | null; visibility_instructions?: PortalProfileRecord | null;
};

export function currentProfilePreferences(form: ProfileForm): ProfileForm {
  return {
    ...form,
    experience_answers: { ...form.experience_answers, ...readFitAnswers(form.experience_answers) },
    visibility_instructions: { ...form.visibility_instructions, ...readCommunicationPreferences(form.visibility_instructions) },
  };
}

/** A headshot may have created a sparse profile before the member opens Stage 01. */
export function initialProfileForm(profile?: SavedProfile | null, member?: InvitationDefaults | null, edit = false): ProfileForm {
  const invitationName = member?.professional_name?.trim() || [member?.first_name, member?.last_name].filter(Boolean).join(" ").trim();
  const form: ProfileForm = {
    current_stage: profile?.submitted_at ? edit ? 1 : 5 : profile?.current_stage ?? 1,
    preferred_name: profile?.preferred_name?.trim() ? profile.preferred_name : invitationName,
    professional_role: profile?.professional_role ?? member?.title ?? "",
    current_organization: profile?.current_organization ?? member?.organization ?? "",
    preferred_email: profile?.preferred_email?.trim() ? profile.preferred_email : member?.email ?? "",
    preferred_phone: profile?.preferred_phone ?? "", bio: profile?.bio ?? "",
    experience_answers: profile?.experience_answers ?? {}, visibility_instructions: profile?.visibility_instructions ?? {},
    restriction_status: profile?.restriction_status ?? null, restriction_details: profile?.restriction_details ?? "",
    final_notes: profile?.final_notes ?? "", questions: profile?.questions ?? "",
    contact_requested: profile?.contact_requested ?? false, submit: false,
  };
  // Preserve the exact historic readout until a submitted member chooses to edit.
  return profile?.submitted_at && !edit ? form : currentProfilePreferences(form);
}

export function profileFieldStage(path: readonly unknown[]): number {
  if (path[0] === "experience_answers") return 2;
  if (path[0] === "visibility_instructions" || path[0] === "restriction_details" || path[0] === "restriction_status") return 3;
  if (path[0] === "final_notes" || path[0] === "questions" || path[0] === "contact_requested") return 4;
  return 1;
}
