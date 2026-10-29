import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import {
  questionAccessBlock,
  roundOpen,
  validateQuestions,
  needsReminder,
  shareBlock,
} from "./executive-questions";
import { legacyReleaseCase } from "./governance";
import { planProfileEmails, deliverProfileEmails } from "./profile-emails";
import { forumEmailBlock } from "./forum-communications";

const cleared = {
  status: "active",
  participates_in_forum: true,
  nda_verified_at: "2026-01-01",
  forum_clearance_status: "cleared",
};
const round = {
  status: "open",
  opens_at: "2026-10-01T00:00:00Z",
  deadline: "2026-11-01T00:00:00Z",
};
const q = (p: number) => ({ priority: p, question: "Q", why_it_matters: "W", source: "jared" });

describe("Executive Questions access", () => {
  it("cleared participant with briefing access may submit", () => {
    strictEqual(questionAccessBlock(cleared, true), null);
  });
  it("blocked without briefing access", () => {
    strictEqual(questionAccessBlock(cleared, false) !== null, true);
  });
  it("blocked without Forum clearance", () => {
    strictEqual(
      questionAccessBlock({ ...cleared, forum_clearance_status: "pending" }, true) !== null,
      true,
    );
  });
  it("blocked when opted out of the Forum", () => {
    strictEqual(
      questionAccessBlock({ ...cleared, participates_in_forum: false }, true) !== null,
      true,
    );
  });
  it("submission after the deadline is blocked", () => {
    strictEqual(roundOpen(round, new Date("2026-11-02T00:00:00Z")), false);
  });
  it("submission before opening is blocked", () => {
    strictEqual(roundOpen(round, new Date("2026-09-30T00:00:00Z")), false);
  });
  it("open within window", () => {
    strictEqual(roundOpen(round, new Date("2026-10-15T00:00:00Z")), true);
  });
  it("draft rounds are never open", () => {
    strictEqual(roundOpen({ ...round, status: "draft" }, new Date("2026-10-15T00:00:00Z")), false);
  });
});

describe("Executive Questions content", () => {
  it("three prioritized questions are accepted", () => {
    strictEqual(validateQuestions([q(1), q(2), q(3)]), null);
  });
  it("a fourth question is rejected", () => {
    strictEqual(validateQuestions([q(1), q(2), q(3), q(3)]) !== null, true);
  });
  it("duplicate priorities are rejected", () => {
    strictEqual(validateQuestions([q(1), q(1)]) !== null, true);
  });
  it("missing why-it-matters is rejected", () => {
    strictEqual(validateQuestions([{ ...q(1), why_it_matters: " " }]) !== null, true);
  });
  it("reminder skips submitted and no-questions responders", () => {
    strictEqual(needsReminder("submitted"), false);
    strictEqual(needsReminder("no_questions"), false);
    strictEqual(needsReminder(null), true);
  });
  it("external sharing requires approval", () => {
    strictEqual(shareBlock({ approved_at: null }) !== null, true);
    strictEqual(shareBlock({ approved_at: "2026-10-20" }), null);
  });
  it("question emails go only to cleared participants", () => {
    strictEqual(forumEmailBlock("input_requested", cleared), null);
    strictEqual(
      forumEmailBlock("input_requested", { ...cleared, forum_clearance_status: "pending" }) !==
        null,
      true,
    );
    strictEqual(
      forumEmailBlock("input_reminder", { ...cleared, participates_in_forum: false }) !== null,
      true,
    );
  });
});

describe("existing-member release reconciliation", () => {
  it("prior activation counts as authorized", () => {
    strictEqual(
      legacyReleaseCase({
        hasRelease: false,
        activatedAt: "2026-05-01",
        signedEntityDocs: 0,
        unsignedEntityDocs: 2,
      }),
      "authorized",
    );
  });
  it("a signed entity document counts as authorized", () => {
    strictEqual(
      legacyReleaseCase({
        hasRelease: false,
        activatedAt: null,
        signedEntityDocs: 1,
        unsignedEntityDocs: 1,
      }),
      "authorized",
    );
  });
  it("merely visible documents need review", () => {
    strictEqual(
      legacyReleaseCase({
        hasRelease: false,
        activatedAt: null,
        signedEntityDocs: 0,
        unsignedEntityDocs: 3,
      }),
      "needs_review",
    );
  });
  it("already released or nothing pending is not affected", () => {
    strictEqual(
      legacyReleaseCase({
        hasRelease: true,
        activatedAt: null,
        signedEntityDocs: 0,
        unsignedEntityDocs: 3,
      }),
      null,
    );
    strictEqual(
      legacyReleaseCase({
        hasRelease: false,
        activatedAt: null,
        signedEntityDocs: 2,
        unsignedEntityDocs: 0,
      }),
      null,
    );
  });
});

describe("profile submission emails", () => {
  const base = {
    memberId: "m1",
    submittedAt: "2026-10-26T12:00:00.000Z",
    adminEmail: "admin@x.org",
    member: { email: "a@x.org", first_name: "Ava", last_name: "Lane" },
    roleLabel: "PRSC Advisor",
  };
  it("first submission plans exactly one of each, using the editable templates", () => {
    const p = planProfileEmails({ ...base, submit: true, alreadySubmitted: false });
    strictEqual(p.length, 2);
    strictEqual(p.filter((x) => x.template === "profile_submitted_admin_alert").length, 1);
    strictEqual(p.filter((x) => x.template === "profile_received").length, 1);
  });
  it("autosave sends nothing", () => {
    strictEqual(planProfileEmails({ ...base, submit: false, alreadySubmitted: false }).length, 0);
  });
  it("re-submitting after submission sends nothing", () => {
    strictEqual(planProfileEmails({ ...base, submit: true, alreadySubmitted: true }).length, 0);
  });
  it("retrying the same submission reuses the same keys", () => {
    const a = planProfileEmails({ ...base, submit: true, alreadySubmitted: false });
    const b = planProfileEmails({ ...base, submit: true, alreadySubmitted: false });
    strictEqual(a.map((x) => x.idempotencyKey).join(), b.map((x) => x.idempotencyKey).join());
  });
  it("admin alert carries only name, time and reference", () => {
    const alert = planProfileEmails({ ...base, submit: true, alreadySubmitted: false })[0];
    strictEqual(Object.keys(alert.tokens).sort().join(), "member_name,submission_id,submitted_at");
  });
  it("both go through the shared sender, and a failure does not throw", async () => {
    const sent: string[] = [];
    const r = await deliverProfileEmails(
      planProfileEmails({ ...base, submit: true, alreadySubmitted: false }),
      {
        load: async (k: string) => (t: Record<string, string>) => ({ k, t }),
        send: async (_to: string, e) => {
          sent.push(e.k);
          if (e.k === "profile_received") throw new Error("down");
          return true;
        },
        log: () => {},
      },
    );
    strictEqual(sent.join(), "profile_submitted_admin_alert,profile_received");
    strictEqual(r[1].ok, false);
  });
});
