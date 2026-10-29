import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { invitationWasSent } from "./invitation-state";

describe("invitationWasSent", () => {
  it("is false for a staged member nobody has emailed", () => {
    strictEqual(invitationWasSent({ first_access_at: null, has_profile: false, auth_invited_at: null, emails_sent: 0 }), false);
    strictEqual(invitationWasSent({}), false);
  });
  it("is true once the sign-in account was invited by email", () => {
    strictEqual(invitationWasSent({ auth_invited_at: "2026-10-28T12:00:00Z" }), true);
  });
  it("is true when a portal email was delivered or the member already came in", () => {
    strictEqual(invitationWasSent({ emails_sent: 1 }), true);
    strictEqual(invitationWasSent({ first_access_at: "2026-10-28T12:00:00Z" }), true);
    strictEqual(invitationWasSent({ has_profile: true }), true);
  });
});
