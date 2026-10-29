import assert from "node:assert/strict";
import { it } from "node:test";
import { userFacingError } from "./user-facing-error";

it("replaces serialized preferred-email validation with a Stage 01 instruction", () => {
  const raw = JSON.stringify([
    {
      validation: "email",
      code: "invalid_string",
      message: "Invalid email",
      path: ["preferred_email"],
    },
  ]);
  assert.equal(userFacingError(new Error(raw)), "Please provide a valid email on Stage 01.");
});
it("handles direct and nested validation objects without rendering field codes", () => {
  assert.equal(
    userFacingError({
      issues: [{ code: "too_big", path: ["experience_answers", "secondary_areas"] }],
    }),
    "Please review your selections on Stage 02 — Where You Fit.",
  );
  assert.equal(
    userFacingError({
      message: JSON.stringify({
        issues: [{ code: "invalid_string", validation: "email", path: ["email"] }],
      }),
    }),
    "Please provide a valid email address.",
  );
});
it("retains useful plain-language errors but suppresses raw JSON and stacks", () => {
  assert.equal(
    userFacingError(new Error("Your progress could not be saved. Please try again.")),
    "Your progress could not be saved. Please try again.",
  );
  for (const raw of [
    '{"message":"raw backend detail"}',
    "Error\n at server.ts:14",
    "ZodError: [invalid_type]",
    "duplicate key violates unique constraint profiles_key",
  ])
    assert.equal(userFacingError(new Error(raw), "Please try again."), "Please try again.");
});
it("provides a session instruction for authorization failures", () => {
  assert.equal(
    userFacingError(new Error("Portal access unavailable")),
    "Your session cannot access this page. Please sign in again or contact the team.",
  );
});
