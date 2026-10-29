export const PORTAL_PROFILE_STAGES = [
  "Your information",
  "Where You Fit",
  "Profile & communication preferences",
  "Final details",
  "Received",
] as const;
export type PortalProfileRecord = Record<string, string | string[]>;
export type ProfileReadoutRow = { label: string; value: string };
export const PORTAL_FIT_VERSION = "fit_v1" as const;
export const PORTAL_COMMUNICATION_VERSION = "communication_v1" as const;

// Historical labels only: q1…q6/p1…p6 must never be relabeled as the new intake.
export const LEGACY_PORTAL_EXPERIENCE_QUESTIONS = [
  "What perspective or expertise do you bring to this work?",
  "Which market challenges deserve the greatest attention?",
  "Where do you see the strongest opportunity for impact?",
  "Which stakeholders should this work serve first?",
  "What would make this initiative credible to you?",
  "What should success look like over the next 12–24 months?",
] as const;
export const LEGACY_PORTAL_VISIBILITY_PERMISSIONS = [
  "Use my name in company materials",
  "Use my title and organization",
  "Use my professional biography",
  "Use my headshot",
  "Reference my participation in investor materials",
  "Invite me to selected external briefings",
] as const;
/** @deprecated Historical records only. */
export const PORTAL_EXPERIENCE_QUESTIONS = LEGACY_PORTAL_EXPERIENCE_QUESTIONS;
/** @deprecated Historical records only. */
export const PORTAL_VISIBILITY_PERMISSIONS = LEGACY_PORTAL_VISIBILITY_PERMISSIONS;
export const PORTAL_PERMISSION_LABELS: Record<string, string> = {
  yes: "Yes",
  discuss: "Discuss first",
  no: "No",
};

type Choice = { value: string; label: string };
const options = (pairs: readonly (readonly [string, string])[]): Choice[] =>
  pairs.map(([value, label]) => ({ value, label }));
export const PORTAL_FIT_TITLE = "Where You Fit";
export const PORTAL_FIT_DESCRIPTION =
  "Help us understand the perspective you could bring. Choose the options that fit best; there is no commitment at this stage.";
export const PORTAL_FIT_QUESTIONS = {
  primary_area: "Which area best reflects the perspective you bring?",
  environment: "Which environment are you most interested in supporting at this stage?",
  contributions: "What type of contribution fits you best?",
  ecosystem: "Which parts of the partnership ecosystem do you know most directly?",
  relationship_screen:
    "Are there any current roles, investments, advisory relationships, or commercial relationships that may be relevant to the area you selected?",
  useful_perspective:
    "What is the one perspective, capability, or connection you believe could be most useful to this work right now?",
} as const;
export const PORTAL_PERSPECTIVE_GROUPS = [
  {
    label: "PRSC — Trust, Standards & Ecosystem",
    choices: options([
      ["independent_governance", "Independent governance, institutional trust, or Board oversight"],
      ["standards_methodology", "Standards, measurement, or methodology"],
      ["sports_media_measurement", "Sports media measurement"],
      ["audience_research", "Audience data, data science, or research"],
      ["motorsport_commercial", "Motorsport commercial strategy"],
      ["participant_ecosystem", "Teams, drivers, or participant ecosystem"],
      ["rights_holder_operations", "Series, rights-holder, or league operations"],
      ["brand_sponsorship", "Brand, sponsorship, or buyer-side strategy"],
      ["agency_partnership", "Agency or partnership strategy"],
      ["motorsport_media", "Motorsport media or communications"],
      ["legal_policy_education", "Legal, governance, policy, or education"],
      ["investment_finance", "Investment, finance, or sports business"],
    ]),
  },
  {
    label: "DIS — Platform, Intelligence & Growth",
    choices: options([
      ["technology_platform_ai", "Technology, platform architecture, or AI"],
      ["data_intelligence", "Data, intelligence, or analytics"],
      ["product_experience", "Product strategy or user experience"],
      ["data_partnerships", "Data partnerships or data-provider relationships"],
      ["revenue_partnerships", "Revenue, go-to-market, or strategic partnerships"],
      ["demand_intelligence", "Brand, agency, or demand-side intelligence"],
      ["investor_growth", "Investor strategy, scale, or venture growth"],
      ["operations_build", "Operations, execution, or organizational build"],
    ]),
  },
  {
    label: "Other",
    choices: options([["other", "Other relevant perspective — short description"]]),
  },
];
export const PORTAL_PERSPECTIVE_CHOICES = PORTAL_PERSPECTIVE_GROUPS.flatMap(
  (group) => group.choices,
);
export const PORTAL_ENVIRONMENT_CHOICES = options([
  ["prsc", "PRSC — independent standards, governance, methodology, and market trust"],
  ["dis", "DIS — platform, intelligence, data, product, and market development"],
  ["either", "Either, depending on the defined scope and independence requirements"],
  ["learn_more", "I would like to learn more before selecting"],
]);
export const PORTAL_ENVIRONMENT_NOTE =
  "PRSC and DIS have distinct responsibilities. A PRSC governance or methodology role may limit or preclude certain DIS operating, equity, vendor, or commercial roles.";
export const PORTAL_CONTRIBUTION_CHOICES = options([
  ["board_governance", "Formal Board or governance oversight"],
  ["methodology_measurement", "Independent methodology or measurement perspective"],
  ["strategic_advisor", "Strategic advisor / thought partner"],
  ["ecosystem_advisor", "Motorsport or ecosystem advisor"],
  ["technical_advisor", "Technical, data, or product advisor"],
  ["commercial_advisor", "Commercial, partnership, or go-to-market advisor"],
  ["introductions", "Targeted introductions or relationship-building support"],
  ["working_sessions", "Periodic working sessions or project review"],
  [
    "future_dis_operating",
    "Potential future operating role, if a defined DIS position becomes available",
  ],
]);
export const PORTAL_ECOSYSTEM_CHOICES = options([
  ["participants", "Teams, drivers, athletes, or participant organizations"],
  ["rights_holders", "Series, leagues, sanctioning bodies, or rights-holders"],
  ["manufacturers", "Manufacturers or automotive ecosystem"],
  ["brands", "Brands or sponsorship buyers"],
  ["agencies", "Agencies, media buyers, or partnership consultants"],
  ["media_measurement", "Sports media, audience measurement, or analytics"],
  ["data_technology", "Data providers, technology platforms, or AI"],
  ["capital", "Investors, financial institutions, or strategic capital"],
  ["legal_standards", "Legal, regulatory, governance, or standards organizations"],
  ["education_research", "Education, research, or academic institutions"],
]);
export const PORTAL_RELATIONSHIP_CHOICES = options([
  ["none", "No relevant relationship to disclose at this stage"],
  [
    "ecosystem_relationship",
    "I have a relationship with a team, driver, series, rights-holder, manufacturer, brand, agency, data provider, investor, or technology company",
  ],
  [
    "related_organization",
    "I have a current or potential relationship with PRSC, DIS, NuDaze Worldwide, or NicoleIsNine Holdings LLC",
  ],
  ["unsure", "I am unsure and would like to discuss it before any role is considered"],
]);
export const PORTAL_RELATIONSHIP_DETAILS_LABEL =
  "Optional general context — do not include sensitive conflict details.";
export const PORTAL_RELATIONSHIP_NOTE =
  "This is an initial fit screen only. Sensitive disclosures belong in your separate Conflict / Recusal Confirmation; this profile does not replace it or any role-specific agreement.";

export const PORTAL_COMMUNICATION_TITLE = "Profile & communication preferences";
export const PORTAL_COMMUNICATION_DESCRIPTION =
  "If there is a mutual fit, tell us how you would prefer to be contacted and how we should handle any potential profile materials. Nothing will be shared publicly without your approval.";
export const PORTAL_COMMUNICATION_QUESTIONS = {
  profile_handling: "How should we handle your profile at this stage?",
  materials: "If we mutually agree on a role, what materials may we prepare for your review?",
  communications_requirement:
    "Are there any communications or organizational requirements we should know about?",
  private_briefings:
    "Are you open to being invited to private, non-public PRSC / DIS briefings while we explore fit?",
} as const;
export const PORTAL_PROFILE_HANDLING_CHOICES = options([
  [
    "private",
    "Keep my profile private. Contact me directly before preparing or sharing any profile materials.",
  ],
  [
    "draft_review",
    "You may prepare draft materials for my review. Nothing may be shared until I approve the exact language and placement.",
  ],
  [
    "limited_discussion",
    "I am comfortable discussing limited, pre-approved use if a role is mutually confirmed.",
  ],
  ["discuss_live", "I would prefer to discuss this live."],
]);
export const PORTAL_PROFILE_MATERIAL_CHOICES = options([
  ["name", "Name"],
  ["title_organization", "Professional title and organization"],
  ["bio", "Short professional biography"],
  ["headshot", "Headshot"],
  ["expertise", "Relevant expertise / capability statement"],
  ["no_materials", "No profile materials at this stage"],
]);
export const PORTAL_PROFILE_MATERIALS_NOTE =
  "These selections are internal preferences only. They are not permission to describe you publicly as a PRSC Board member, PRSC advisor, DIS advisor, employee, investor, or partner before the applicable relationship is formally confirmed.";
export const PORTAL_COMMUNICATION_REQUIREMENT_CHOICES = options([
  ["none", "No special requirements that I know of"],
  [
    "organization_review",
    "My employer, organization, legal team, or communications team may need to review any public reference",
  ],
  ["restrictions", "I have restrictions or context the team should understand"],
  ["discuss_first", "I would prefer to discuss this before providing any materials"],
]);
export const PORTAL_COMMUNICATION_DETAILS_LABEL =
  "Please briefly describe any requirement or consideration.";
export const PORTAL_PRIVATE_BRIEFING_CHOICES = options([
  ["yes_relevant", "Yes, subject to confidentiality and agenda relevance"],
  ["contact_each_time", "Yes, but please contact me before each invitation"],
  ["not_now", "Not at this stage"],
  ["discuss_first", "I would prefer to discuss it first"],
]);
export type FitAnswers = PortalProfileRecord & {
  version: typeof PORTAL_FIT_VERSION;
  primary_area: string;
  secondary_areas: string[];
  other_perspective: string;
  environment: string;
  contributions: string[];
  ecosystem: string[];
  relationship_screen: string;
  relationship_details: string;
  useful_perspective: string;
};
export type CommunicationPreferences = PortalProfileRecord & {
  version: typeof PORTAL_COMMUNICATION_VERSION;
  profile_handling: string;
  materials: string[];
  communications_requirement: string;
  communications_details: string;
  private_briefings: string;
};
const fitKeys = [
  "primary_area",
  "secondary_areas",
  "other_perspective",
  "environment",
  "contributions",
  "ecosystem",
  "relationship_screen",
  "relationship_details",
  "useful_perspective",
];
const communicationKeys = [
  "profile_handling",
  "materials",
  "communications_requirement",
  "communications_details",
  "private_briefings",
];
export const hasFitAnswers = (record: Record<string, unknown> | null | undefined) =>
  Boolean(record && ("version" in record || fitKeys.some((key) => key in record)));
// Presence, not a valid version, closes the historic publication-permission path.
export const hasCommunicationPreferences = (record: Record<string, unknown> | null | undefined) =>
  Boolean(record && ("version" in record || communicationKeys.some((key) => key in record)));
const text = (record: Record<string, unknown> | null | undefined, key: string) =>
  typeof record?.[key] === "string" ? (record[key] as string) : "";
const choice = (
  record: Record<string, unknown> | null | undefined,
  key: string,
  choices: readonly Choice[],
  fallback = "",
) => (choices.some((option) => option.value === text(record, key)) ? text(record, key) : fallback);
const choices = (
  record: Record<string, unknown> | null | undefined,
  key: string,
  options: readonly Choice[],
) =>
  Array.isArray(record?.[key])
    ? [
        ...new Set(
          (record[key] as unknown[]).filter(
            (value): value is string =>
              typeof value === "string" && options.some((option) => option.value === value),
          ),
        ),
      ]
    : [];
export function readFitAnswers(record?: Record<string, unknown> | null): FitAnswers {
  return {
    version: PORTAL_FIT_VERSION,
    primary_area: choice(record, "primary_area", PORTAL_PERSPECTIVE_CHOICES),
    secondary_areas: choices(record, "secondary_areas", PORTAL_PERSPECTIVE_CHOICES),
    other_perspective: text(record, "other_perspective"),
    environment: choice(record, "environment", PORTAL_ENVIRONMENT_CHOICES),
    contributions: choices(record, "contributions", PORTAL_CONTRIBUTION_CHOICES),
    ecosystem: choices(record, "ecosystem", PORTAL_ECOSYSTEM_CHOICES),
    relationship_screen: choice(record, "relationship_screen", PORTAL_RELATIONSHIP_CHOICES),
    relationship_details: text(record, "relationship_details"),
    useful_perspective: text(record, "useful_perspective"),
  };
}
export function readCommunicationPreferences(
  record?: Record<string, unknown> | null,
): CommunicationPreferences {
  const materials = choices(record, "materials", PORTAL_PROFILE_MATERIAL_CHOICES);
  return {
    version: PORTAL_COMMUNICATION_VERSION,
    profile_handling: choice(
      record,
      "profile_handling",
      PORTAL_PROFILE_HANDLING_CHOICES,
      "private",
    ),
    materials:
      materials.length && !materials.includes("no_materials") ? materials : ["no_materials"],
    communications_requirement: choice(
      record,
      "communications_requirement",
      PORTAL_COMMUNICATION_REQUIREMENT_CHOICES,
    ),
    communications_details: text(record, "communications_details"),
    private_briefings: choice(
      record,
      "private_briefings",
      PORTAL_PRIVATE_BRIEFING_CHOICES,
      "not_now",
    ),
  };
}
const label = (value: string, options: readonly Choice[]) =>
  options.find((option) => option.value === value)?.label ?? "Not answered";
const labels = (values: string[], options: readonly Choice[]) =>
  values.map((value) => label(value, options)).join("; ") || "Not answered";
const legacyFitRows = (record?: Record<string, unknown> | null, populatedOnly = false) =>
  LEGACY_PORTAL_EXPERIENCE_QUESTIONS.flatMap((question, index) => {
    const value = text(record, `q${index + 1}`);
    return populatedOnly && !value
      ? []
      : [
          {
            label: `${populatedOnly ? "Previous experience response — " : ""}${question}`,
            value: value || "Not answered",
          },
        ];
  });
const legacyCommunicationRows = (record?: Record<string, unknown> | null, populatedOnly = false) =>
  LEGACY_PORTAL_VISIBILITY_PERMISSIONS.flatMap((question, index) => {
    const value = PORTAL_PERMISSION_LABELS[text(record, `p${index + 1}`)];
    return populatedOnly && !value
      ? []
      : [
          {
            label: `${populatedOnly ? "Previous visibility permission — " : ""}${question}`,
            value: value || "Not answered",
          },
        ];
  });
export function fitReadoutRows(record?: Record<string, unknown> | null): ProfileReadoutRow[] {
  if (!hasFitAnswers(record)) return legacyFitRows(record);
  const fit = readFitAnswers(record);
  return [
    { label: "Primary perspective", value: label(fit.primary_area, PORTAL_PERSPECTIVE_CHOICES) },
    {
      label: "Secondary perspectives",
      value: labels(fit.secondary_areas, PORTAL_PERSPECTIVE_CHOICES),
    },
    { label: "Other relevant perspective", value: fit.other_perspective || "Not answered" },
    {
      label: PORTAL_FIT_QUESTIONS.environment,
      value: label(fit.environment, PORTAL_ENVIRONMENT_CHOICES),
    },
    {
      label: PORTAL_FIT_QUESTIONS.contributions,
      value: labels(fit.contributions, PORTAL_CONTRIBUTION_CHOICES),
    },
    {
      label: PORTAL_FIT_QUESTIONS.ecosystem,
      value: labels(fit.ecosystem, PORTAL_ECOSYSTEM_CHOICES),
    },
    {
      label: PORTAL_FIT_QUESTIONS.relationship_screen,
      value: label(fit.relationship_screen, PORTAL_RELATIONSHIP_CHOICES),
    },
    { label: PORTAL_RELATIONSHIP_DETAILS_LABEL, value: fit.relationship_details || "Not answered" },
    {
      label: PORTAL_FIT_QUESTIONS.useful_perspective,
      value: fit.useful_perspective || "Not answered",
    },
    ...legacyFitRows(record, true),
  ];
}
export function communicationReadoutRows(
  record?: Record<string, unknown> | null,
): ProfileReadoutRow[] {
  if (!hasCommunicationPreferences(record)) return legacyCommunicationRows(record);
  const preferences = readCommunicationPreferences(record);
  return [
    {
      label: PORTAL_COMMUNICATION_QUESTIONS.profile_handling,
      value: label(preferences.profile_handling, PORTAL_PROFILE_HANDLING_CHOICES),
    },
    {
      label: PORTAL_COMMUNICATION_QUESTIONS.materials,
      value: labels(preferences.materials, PORTAL_PROFILE_MATERIAL_CHOICES),
    },
    {
      label: PORTAL_COMMUNICATION_QUESTIONS.communications_requirement,
      value: label(
        preferences.communications_requirement,
        PORTAL_COMMUNICATION_REQUIREMENT_CHOICES,
      ),
    },
    {
      label: PORTAL_COMMUNICATION_DETAILS_LABEL,
      value: preferences.communications_details || "Not answered",
    },
    {
      label: PORTAL_COMMUNICATION_QUESTIONS.private_briefings,
      value: label(preferences.private_briefings, PORTAL_PRIVATE_BRIEFING_CHOICES),
    },
    {
      label: "Publication approval",
      value: "Internal preferences only — no permission to publish",
    },
    ...legacyCommunicationRows(record, true),
  ];
}
