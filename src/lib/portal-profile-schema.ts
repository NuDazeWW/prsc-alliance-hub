import { z } from "zod";
import {
  PORTAL_FIT_VERSION,
  PORTAL_COMMUNICATION_VERSION,
  PORTAL_PERSPECTIVE_CHOICES,
  PORTAL_ENVIRONMENT_CHOICES,
  PORTAL_CONTRIBUTION_CHOICES,
  PORTAL_ECOSYSTEM_CHOICES,
  PORTAL_RELATIONSHIP_CHOICES,
  PORTAL_PROFILE_HANDLING_CHOICES,
  PORTAL_PROFILE_MATERIAL_CHOICES,
  PORTAL_COMMUNICATION_REQUIREMENT_CHOICES,
  PORTAL_PRIVATE_BRIEFING_CHOICES,
  hasFitAnswers,
  hasCommunicationPreferences,
  type PortalProfileRecord,
} from "./portal-profile-fields";

const choice = (choices: readonly { value: string }[], message: string, allowBlank = false) =>
  z
    .string()
    .refine(
      (value) => (allowBlank && value === "") || choices.some((option) => option.value === value),
      { message },
    );
const multiChoice = (choices: readonly { value: string }[], max: number, message: string) =>
  z
    .array(choice(choices, message))
    .max(max, message)
    .superRefine((values, context) => {
      if (new Set(values).size !== values.length)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select each option only once.",
        });
    });
const historicAnswer = z
  .string()
  .trim()
  .max(3000, "Please keep each previous experience response to 3,000 characters.")
  .optional();
const historicPermission = z.enum(["yes", "discuss", "no"]).optional();
const withoutUndefined = (
  value: Record<string, string | string[] | undefined>,
): PortalProfileRecord =>
  Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string | string[]] => entry[1] !== undefined,
    ),
  );

export const fitAnswersSchema = z
  .object({
    version: z.literal(PORTAL_FIT_VERSION).optional(),
    primary_area: choice(
      PORTAL_PERSPECTIVE_CHOICES,
      "Please choose one valid primary area on Stage 02.",
      true,
    ).optional(),
    secondary_areas: multiChoice(
      PORTAL_PERSPECTIVE_CHOICES,
      2,
      "Please choose up to two valid secondary areas on Stage 02.",
    ).optional(),
    other_perspective: z
      .string()
      .trim()
      .max(300, "Please keep the other perspective description to 300 characters on Stage 02.")
      .optional(),
    environment: choice(
      PORTAL_ENVIRONMENT_CHOICES,
      "Please select a valid environment on Stage 02.",
      true,
    ).optional(),
    contributions: multiChoice(
      PORTAL_CONTRIBUTION_CHOICES,
      2,
      "Please choose up to two valid contribution types on Stage 02.",
    ).optional(),
    ecosystem: multiChoice(
      PORTAL_ECOSYSTEM_CHOICES,
      PORTAL_ECOSYSTEM_CHOICES.length,
      "Please choose valid ecosystem options on Stage 02.",
    ).optional(),
    relationship_screen: choice(
      PORTAL_RELATIONSHIP_CHOICES,
      "Please select a valid relationship response on Stage 02.",
      true,
    ).optional(),
    relationship_details: z
      .string()
      .trim()
      .max(300, "Please keep the relationship explanation to 300 characters on Stage 02.")
      .optional(),
    useful_perspective: z
      .string()
      .trim()
      .max(300, "Please keep the optional perspective answer to 300 characters on Stage 02.")
      .optional(),
    q1: historicAnswer,
    q2: historicAnswer,
    q3: historicAnswer,
    q4: historicAnswer,
    q5: historicAnswer,
    q6: historicAnswer,
  })
  .strict()
  .superRefine((answers, context) => {
    if (hasFitAnswers(answers) && answers.version !== PORTAL_FIT_VERSION)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["version"],
        message: "Please reopen Stage 02 and save the current intake.",
      });
    if (answers.primary_area && answers.secondary_areas?.includes(answers.primary_area))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondary_areas"],
        message: "Please choose secondary areas that differ from your primary area on Stage 02.",
      });
  })
  .transform(withoutUndefined);

export const communicationPreferencesSchema = z
  .object({
    version: z.literal(PORTAL_COMMUNICATION_VERSION).optional(),
    profile_handling: choice(
      PORTAL_PROFILE_HANDLING_CHOICES,
      "Please select a valid profile preference on Stage 03.",
    ).optional(),
    materials: multiChoice(
      PORTAL_PROFILE_MATERIAL_CHOICES,
      PORTAL_PROFILE_MATERIAL_CHOICES.length,
      "Please choose valid profile materials on Stage 03.",
    ).optional(),
    communications_requirement: choice(
      PORTAL_COMMUNICATION_REQUIREMENT_CHOICES,
      "Please select a valid communication requirement on Stage 03.",
      true,
    ).optional(),
    communications_details: z
      .string()
      .trim()
      .max(250, "Please keep communication details to 250 characters on Stage 03.")
      .optional(),
    private_briefings: choice(
      PORTAL_PRIVATE_BRIEFING_CHOICES,
      "Please select a valid private briefing preference on Stage 03.",
    ).optional(),
    p1: historicPermission,
    p2: historicPermission,
    p3: historicPermission,
    p4: historicPermission,
    p5: historicPermission,
    p6: historicPermission,
  })
  .strict()
  .superRefine((preferences, context) => {
    if (
      hasCommunicationPreferences(preferences) &&
      preferences.version !== PORTAL_COMMUNICATION_VERSION
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["version"],
        message: "Please reopen Stage 03 and save the current communication preferences.",
      });
    if (preferences.materials?.includes("no_materials") && preferences.materials.length !== 1)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["materials"],
        message: "Choose either no profile materials or the individual materials on Stage 03.",
      });
  })
  .transform((value): PortalProfileRecord => {
    const cleaned = withoutUndefined(value);
    // A new, incomplete record must stay private and must never become legacy consent.
    return value.version === PORTAL_COMMUNICATION_VERSION
      ? {
          ...cleaned,
          profile_handling: value.profile_handling ?? "private",
          materials: value.materials?.length ? value.materials : ["no_materials"],
          private_briefings: value.private_briefings ?? "not_now",
        }
      : cleaned;
  });

export const profileSchema = z
  .object({
    current_stage: z.number().int().min(1).max(5),
    preferred_name: z
      .string()
      .trim()
      .max(120, "Please keep the preferred name to 120 characters on Stage 01."),
    professional_role: z
      .string()
      .trim()
      .max(160, "Please keep the professional role to 160 characters on Stage 01."),
    current_organization: z
      .string()
      .trim()
      .max(180, "Please keep the organization to 180 characters on Stage 01."),
    preferred_email: z
      .string()
      .trim()
      .email("Please provide a valid email on Stage 01.")
      .max(200, "Please keep the email to 200 characters on Stage 01."),
    preferred_phone: z
      .string()
      .trim()
      .max(40, "Please keep the phone number to 40 characters on Stage 01."),
    bio: z
      .string()
      .trim()
      .max(3000, "Please keep the short bio to 3,000 characters on Stage 01.")
      .optional(),
    experience_answers: fitAnswersSchema,
    visibility_instructions: communicationPreferencesSchema,
    restriction_status: z.enum(["no", "yes", "unsure"]).nullable(),
    // Historical fields remain readable and preserved; new communication details live in versioned JSON.
    restriction_details: z
      .string()
      .trim()
      .max(3000, "Please keep previous restriction details to 3,000 characters."),
    final_notes: z
      .string()
      .trim()
      .max(3000, "Please keep final notes to 3,000 characters on Stage 04."),
    questions: z
      .string()
      .trim()
      .max(3000, "Please keep questions to 3,000 characters on Stage 04."),
    contact_requested: z.boolean(),
    submit: z.boolean(),
  })
  .superRefine((profile, context) => {
    if (!profile.submit) return;
    const fit = profile.experience_answers;
    if (hasFitAnswers(fit)) {
      if (!fit.primary_area)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["experience_answers", "primary_area"],
          message: "Please choose one primary area on Stage 02 before submitting.",
        });
      if (!fit.environment)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["experience_answers", "environment"],
          message: "Please select an environment on Stage 02 before submitting.",
        });
      if (!fit.relationship_screen)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["experience_answers", "relationship_screen"],
          message: "Please complete the relationship screen on Stage 02 before submitting.",
        });
    }
    if (
      hasCommunicationPreferences(profile.visibility_instructions) &&
      !profile.visibility_instructions.communications_requirement
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility_instructions", "communications_requirement"],
        message:
          "Please select a communications or organizational requirement on Stage 03 before submitting.",
      });
  });
export type PortalProfileInput = z.infer<typeof profileSchema>;

export function profileValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Please review your profile and try again.";
  if (issue.message.startsWith("Please ") || issue.message.startsWith("Choose "))
    return issue.message;
  if (issue.path[0] === "preferred_email") return "Please provide a valid email on Stage 01.";
  if (issue.path[0] === "experience_answers")
    return "Please review your choices on Stage 02 and try again.";
  if (issue.path[0] === "visibility_instructions")
    return "Please review your communication preferences on Stage 03 and try again.";
  return "Please review your profile fields and try again.";
}
export function parseProfileInput(input: unknown): PortalProfileInput {
  const result = profileSchema.safeParse(input);
  if (!result.success) throw new Error(profileValidationMessage(result.error));
  return result.data;
}

/** Legacy records remain readable; cached legacy forms must reload before writing. */
export function parseProfileSaveInput(input: unknown): PortalProfileInput {
  const data = parseProfileInput(input);
  if (
    data.experience_answers.version !== PORTAL_FIT_VERSION ||
    data.visibility_instructions.version !== PORTAL_COMMUNICATION_VERSION
  )
    throw new Error(
      "This profile form has been updated. Please reopen your profile to load the current questions and private communication preferences.",
    );
  return data;
}

/** Stale clients cannot overwrite new privacy preferences with historic permission rows. */
export function assertCommunicationPreferencesNotDowngraded(
  previous: Record<string, unknown> | null | undefined,
  next: Record<string, unknown>,
) {
  if (hasCommunicationPreferences(previous) && !hasCommunicationPreferences(next))
    throw new Error(
      "Please reopen Stage 03 and save your current communication preferences before continuing.",
    );
}
