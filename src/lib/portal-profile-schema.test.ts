import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  profileSchema, parseProfileInput, parseProfileSaveInput, communicationPreferencesSchema,
  assertCommunicationPreferencesNotDowngraded,
} from "./portal-profile-schema";
import {
  readFitAnswers, readCommunicationPreferences, fitReadoutRows, communicationReadoutRows,
  LEGACY_PORTAL_EXPERIENCE_QUESTIONS, LEGACY_PORTAL_VISIBILITY_PERMISSIONS,
} from "./portal-profile-fields";

function profile() {
  return {
    current_stage: 2, preferred_name: "Jordan", professional_role: "Advisor", current_organization: "Example",
    preferred_email: "jordan@example.org", preferred_phone: "", bio: "",
    experience_answers: {
      ...readFitAnswers(), primary_area: "independent_governance", secondary_areas: ["standards_methodology", "brand_sponsorship"],
      environment: "either", contributions: ["strategic_advisor", "working_sessions"], ecosystem: ["brands", "capital"], relationship_screen: "none",
    },
    visibility_instructions: { ...readCommunicationPreferences(), communications_requirement: "none" }, restriction_status: null,
    restriction_details: "", final_notes: "", questions: "", contact_requested: false, submit: false,
  };
}
const valid = (input: unknown) => profileSchema.safeParse(input).success;

describe("versioned profile intake validation", () => {
  it("accepts the actual fit choices and preserves arrays and historic evidence", () => {
    const input = profile();
    const parsed = parseProfileInput({ ...input, preferred_email: " jordan@example.org ",
      experience_answers: { ...input.experience_answers, q1: "Original perspective", useful_perspective: "x".repeat(300) },
      visibility_instructions: { ...input.visibility_instructions, p1: "yes", communications_details: "x".repeat(250) }, submit: true,
    });
    assert.equal(parsed.preferred_email, "jordan@example.org");
    assert.deepEqual(parsed.experience_answers.secondary_areas, ["standards_methodology", "brand_sponsorship"]);
    assert.equal(parsed.experience_answers.q1, "Original perspective");
    assert.equal(parsed.visibility_instructions.p1, "yes");
  });
  it("rejects multiple primary choices, too many secondary/contribution choices, duplicates and repeated primary", () => {
    for (const answers of [
      { primary_area: ["independent_governance", "standards_methodology"] },
      { secondary_areas: ["standards_methodology", "brand_sponsorship", "data_intelligence"] },
      { secondary_areas: ["standards_methodology", "standards_methodology"] },
      { secondary_areas: ["independent_governance"] },
      { contributions: ["strategic_advisor", "working_sessions", "introductions"] },
      { contributions: ["strategic_advisor", "strategic_advisor"] },
      { ecosystem: ["brands", "brands"] },
    ]) {
      const input = profile();
      assert.equal(valid({ ...input, experience_answers: { ...input.experience_answers, ...answers } }), false);
    }
  });
  it("validates every current enumerated answer on the server", () => {
    for (const [field, value] of Object.entries({ primary_area: "invented", secondary_areas: ["invented"], environment: "invented", contributions: ["invented"], ecosystem: ["invented"], relationship_screen: "invented" })) {
      const input = profile();
      assert.equal(valid({ ...input, experience_answers: { ...input.experience_answers, [field]: value } }), false, field);
    }
    for (const [field, value] of Object.entries({ profile_handling: "yes", materials: ["publish"], communications_requirement: "invented", private_briefings: "external" })) {
      const input = profile();
      assert.equal(valid({ ...input, visibility_instructions: { ...input.visibility_instructions, [field]: value } }), false, field);
    }
  });
  it("enforces the optional answer and communication detail character limits", () => {
    const input = profile();
    assert.equal(valid({ ...input, experience_answers: { ...input.experience_answers, useful_perspective: "x".repeat(301) } }), false);
    assert.equal(valid({ ...input, visibility_instructions: { ...input.visibility_instructions, communications_details: "x".repeat(251) } }), false);
  });
  it("allows an incomplete draft but identifies the primary question before final submission", () => {
    const input = { ...profile(), experience_answers: readFitAnswers() };
    assert.equal(valid(input), true);
    assert.throws(() => parseProfileInput({ ...input, submit: true }), /primary area on Stage 02/);
  });
  it("allows a blank Stage 03 requirement in drafts but requires an actual selection on final submission", () => {
    const input = { ...profile(), visibility_instructions: readCommunicationPreferences() };
    assert.equal(valid(input), true);
    const incomplete = profileSchema.safeParse({ ...input, submit: true });
    assert.equal(incomplete.success, false);
    if (!incomplete.success) assert.deepEqual(incomplete.error.issues[0].path, ["visibility_instructions", "communications_requirement"]);
    assert.throws(() => parseProfileInput({ ...input, submit: true }), /requirement on Stage 03 before submitting/);
    const submitted = parseProfileInput({ ...input, submit: true, visibility_instructions: {
      ...input.visibility_instructions, communications_requirement: "organization_review", communications_details: "Our communications team should review exact wording.",
    } });
    assert.equal(submitted.visibility_instructions.communications_requirement, "organization_review");
    assert.equal(submitted.visibility_instructions.profile_handling, "private");
  });
  it("gives a friendly email message instead of raw validation JSON", () => {
    assert.throws(() => parseProfileInput({ ...profile(), preferred_email: "invalid" }), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Please provide a valid email on Stage 01.");
      assert.equal(error.message.includes("invalid_string"), false);
      return true;
    });
  });
  it("requires explicit current version markers and rejects unknown fields", () => {
    const input = profile();
    assert.equal(valid({ ...input, experience_answers: { ...input.experience_answers, version: "fit_v2" } }), false);
    assert.equal(valid({ ...input, visibility_instructions: { p1: "yes", profile_handling: "draft_review" } }), false);
    assert.equal(valid({ ...input, experience_answers: { q1: "Historic", publish_all: "yes" } }), false);
  });
});

describe("privacy defaults and historical profile data", () => {
  it("rejects legacy-only saves before reading or writing, even before any current record exists", () => {
    const legacy = { ...profile(), experience_answers: { q1: "Historic" }, visibility_instructions: { p1: "yes", p3: "yes" } };
    assert.equal(valid(legacy), true);
    assert.throws(() => parseProfileSaveInput(legacy), /reopen your profile/);
    assert.doesNotThrow(() => parseProfileSaveInput(profile()));
  });
  it("defaults new preferences to private with no materials and no briefing invitation", () => {
    assert.deepEqual(communicationPreferencesSchema.parse({ version: "communication_v1" }), {
      version: "communication_v1", profile_handling: "private", materials: ["no_materials"], private_briefings: "not_now",
    });
    assert.equal(readCommunicationPreferences({ profile_handling: "unrecognized" }).profile_handling, "private");
    assert.deepEqual(readCommunicationPreferences({ materials: ["no_materials", "name"] }).materials, ["no_materials"]);
  });
  it("rejects no-materials combined with any specific material", () => {
    const input = profile();
    assert.equal(valid({ ...input, visibility_instructions: { ...input.visibility_instructions, materials: ["no_materials", "headshot"] } }), false);
    assert.equal(valid({ ...input, visibility_instructions: { ...input.visibility_instructions, materials: ["headshot", "bio"] } }), true);
  });
  it("keeps the historic question labels and never converts historic answers into current choices", () => {
    const historic = { q1: "Original perspective", q2: "Original challenge" };
    const rows = fitReadoutRows(historic);
    assert.equal(rows[0].label, LEGACY_PORTAL_EXPERIENCE_QUESTIONS[0]);
    assert.equal(rows[1].value, "Original challenge");
    assert.equal(readFitAnswers(historic).primary_area, "");
    const mixed = fitReadoutRows({ ...readFitAnswers(), ...historic });
    assert.equal(mixed.find((row) => row.label === "Primary perspective")?.value, "Not answered");
    assert.ok(mixed.some((row) => row.label === `Previous experience response — ${LEGACY_PORTAL_EXPERIENCE_QUESTIONS[1]}` && row.value === "Original challenge"));
    assert.equal(communicationReadoutRows({ p1: "yes" })[0].label, LEGACY_PORTAL_VISIBILITY_PERMISSIONS[0]);
    assert.ok(communicationReadoutRows({ ...readCommunicationPreferences(), p1: "yes" }).some((row) => row.label.startsWith("Previous visibility permission — ") && row.value === "Yes"));
  });
  it("blocks a stale client from downgrading current preferences to legacy publication grants", () => {
    assert.throws(() => assertCommunicationPreferencesNotDowngraded(readCommunicationPreferences(), { p1: "yes" }), /reopen Stage 03/);
    assert.doesNotThrow(() => assertCommunicationPreferencesNotDowngraded({ p1: "yes" }, readCommunicationPreferences()));
    assert.doesNotThrow(() => assertCommunicationPreferencesNotDowngraded(null, { p1: "yes" }));
  });
});
