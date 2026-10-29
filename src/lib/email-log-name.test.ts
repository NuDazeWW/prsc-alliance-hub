import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { emailLogName, isInvitationEmailName } from "./email-log-name";

describe("Sent log names", () => {
  it("turns internal labels into plain names", () => {
    strictEqual(emailLogName("nudge-invite"), "Reminder: invitation");
    strictEqual(emailLogName("forum-forum_confirmed"), "Forum email: forum confirmed");
    strictEqual(emailLogName("some-new-label"), "Some new label");
    strictEqual(emailLogName(""), "Portal email");
  });
  it("counts only invitations as proof a person was invited", () => {
    strictEqual(isInvitationEmailName("Portal invitation"), true);
    strictEqual(isInvitationEmailName(emailLogName("nudge-invite")), true);
    strictEqual(isInvitationEmailName(emailLogName("meeting-poll-invite")), false);
  });
});
