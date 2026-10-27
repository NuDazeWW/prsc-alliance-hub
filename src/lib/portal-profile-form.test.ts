import assert from "node:assert/strict";
import { it } from "node:test";
import { currentProfilePreferences, initialProfileForm, profileFieldStage } from "./portal-profile-form";

const invitation = { first_name: "Alex", last_name: "Morgan", email: "alex@example.com", organization: "Example Group", title: "Director" };
it("fills invitation name and email for new and sparse headshot-only profiles", () => {
  for (const profile of [null, { current_stage: 1, preferred_name: null, preferred_email: null }, { preferred_name: " ", preferred_email: "" }]) {
    const form = initialProfileForm(profile, invitation);
    assert.equal(form.preferred_name, "Alex Morgan");
    assert.equal(form.preferred_email, "alex@example.com");
  }
  assert.equal(initialProfileForm(null, { ...invitation, professional_name: "A. Morgan" }).preferred_name, "A. Morgan");
});
it("preserves alternate contact values and never changes the invitation itself", () => {
  const form = initialProfileForm({ preferred_name: "Lex", preferred_email: "lex@example.com" }, invitation);
  assert.equal(form.preferred_name, "Lex");
  assert.equal(form.preferred_email, "lex@example.com");
  assert.equal(invitation.email, "alex@example.com");
});
it("keeps legacy answers under their original keys and starts new preferences privately", () => {
  const form = initialProfileForm({ experience_answers: { q1: "Historic essay" }, visibility_instructions: { p1: "yes" } }, invitation);
  assert.equal(form.experience_answers.q1, "Historic essay");
  assert.equal(form.experience_answers.primary_area, "");
  assert.equal(form.visibility_instructions.p1, "yes");
  assert.equal(form.visibility_instructions.profile_handling, "private");
  assert.deepEqual(form.visibility_instructions.materials, ["no_materials"]);
});
it("does not relabel submitted historic profiles until editing begins", () => {
  const form = initialProfileForm({ submitted_at: "2026-10-27", experience_answers: { q1: "Original answer" }, visibility_instructions: { p1: "yes" } }, invitation);
  assert.equal(form.current_stage, 5);
  assert.equal(form.experience_answers.version, undefined);
  const edited = currentProfilePreferences(form);
  assert.equal(edited.experience_answers.version, "fit_v1");
  assert.equal(edited.experience_answers.q1, "Original answer");
  assert.equal(edited.visibility_instructions.profile_handling, "private");
});
it("routes validation feedback back to the relevant profile stage", () => {
  assert.equal(profileFieldStage(["preferred_email"]), 1);
  assert.equal(profileFieldStage(["experience_answers", "primary_area"]), 2);
  assert.equal(profileFieldStage(["visibility_instructions", "materials"]), 3);
});
