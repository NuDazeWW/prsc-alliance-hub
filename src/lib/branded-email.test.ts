import { test } from "node:test";
import { strictEqual } from "node:assert";
import { applyTokens, buildMemberTokens } from "./branded-email";

test("Forum-only email tokens do not expose the compatibility entity or role", () => {
  for (const entity of ["prsc", "dis", "both"]) {
    const member = { entity, role: "advisor", is_candidate: true, first_name: "Avery" };
    const tokens = buildMemberTokens(member);
    strictEqual(applyTokens("{{entity}} | {{entity_full}} | {{role}} | {{package_label}}", tokens), "United Forum | United Strategic Coordination Forum | United Forum Invitee | United Forum");
    strictEqual(member.entity, entity);
    strictEqual(member.role, "advisor");
  }
});

test("cleared Forum-only members retain neutral entity tokens", () => {
  const tokens = buildMemberTokens({ entity: "prsc", role: "advisor", is_candidate: true, forum_clearance_status: "cleared" });
  strictEqual(tokens.role, "Forum Participant");
  strictEqual(tokens.entity, "United Forum");
});

test("entity-designated email tokens retain their existing meaning", () => {
  const tokens = buildMemberTokens({ entity: "dis", role: "advisor", is_candidate: false });
  strictEqual(tokens.entity, "DIS");
  strictEqual(tokens.entity_full, "Decision Intelligence Systems, Inc. (DIS)");
  strictEqual(tokens.role, "DIS Advisor Candidate");
  strictEqual(tokens.package_label, "Advisor");
});
