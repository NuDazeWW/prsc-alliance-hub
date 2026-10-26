import { describe, it } from "node:test";
import { deepStrictEqual } from "node:assert";
import { entityAcceptanceComplete, type JourneyDoc } from "./journey";
import { entityAppointmentStatus, isActive } from "./governance";
import { memberDesignation } from "./member-role-labels";
import { buildMemberTokens } from "./branded-email";

const docs: JourneyDoc[] = ["prsc", "dis"].flatMap((track) => [2, 3, 4].map((stage) => ({
  id: `${track}-${stage}`, journey_stage: stage, journey_track: track as "prsc" | "dis", sort_order: 0, created_at: "2026-10-26",
})));

describe("complete appointment progression for each entity", () => {
  for (const track of ["prsc", "dis"] as const) {
    it(`${track.toUpperCase()} progresses Candidate → Pending Appointment → Appointed independently`, () => {
      const member = { role: "prsc_board_dis_advisor", entity: "both", role_review_status: "approved", forum_clearance_status: "cleared", prsc_activated_at: null as string | null, dis_activated_at: null as string | null };
      const original = structuredClone(member);
      const status = (done: Set<string>, activatedAt?: string | null) => entityAppointmentStatus({ acceptanceComplete: entityAcceptanceComplete(docs, done, member.entity)[track], roleReviewStatus: member.role_review_status, forumClearanceStatus: member.forum_clearance_status, activatedAt });
      deepStrictEqual(status(new Set()), "candidate");
      const done = new Set([`${track}-2`, `${track}-3`]);
      deepStrictEqual(status(done), "pending_appointment");
      const accepted = { ...member, acceptance_complete: entityAcceptanceComplete(docs, done, "both") };
      deepStrictEqual(memberDesignation(accepted), track === "prsc" ? "PRSC Board Pending Appointment / DIS Advisor Candidate" : "PRSC Board Candidate / DIS Advisor Pending Appointment");
      deepStrictEqual(status(done, "2026-10-26"), "appointed");
      const bothAccepted = { ...accepted, acceptance_complete: entityAcceptanceComplete(docs, new Set(["prsc-2", "prsc-3", "dis-2", "dis-3"]), "both"), [`${track}_activated_at`]: "2026-10-26" };
      deepStrictEqual(memberDesignation(bothAccepted), track === "prsc" ? "PRSC Board / DIS Advisor Pending Appointment" : "PRSC Board Pending Appointment / DIS Advisor");
      deepStrictEqual(buildMemberTokens(bothAccepted).role_label, memberDesignation(bothAccepted));
      deepStrictEqual(member, original);
    });
  }
  it("Forum access never confers either entity appointment", () => {
    const forumOnly = { role: "advisor", entity: "both", is_candidate: true, acceptance_complete: { prsc: true, dis: true }, prsc_activated_at: "2026-10-26" };
    deepStrictEqual(memberDesignation({ ...forumOnly, forum_clearance_status: "not_reviewed" }), "United Forum Invitee");
    deepStrictEqual(memberDesignation({ ...forumOnly, forum_clearance_status: "cleared" }), "Forum Participant");
    deepStrictEqual(entityAppointmentStatus({ acceptanceComplete: false, roleReviewStatus: "not_required", forumClearanceStatus: "cleared" }), "candidate");
  });
  it("a revised required disclosure prevents pending until the new version is completed", () => {
    const requirements = [
      ...docs.map((doc) => ({ ...doc, superseded_at: null })),
      { ...docs[1], id: "old-disclosure", superseded_at: "2026-10-26" },
      { ...docs[1], id: "new-disclosure", superseded_at: null },
    ].filter(isActive);
    const done = new Set(["prsc-2", "prsc-3", "old-disclosure"]);
    deepStrictEqual(entityAcceptanceComplete(requirements, done, "both").prsc, false);
    done.add("new-disclosure");
    deepStrictEqual(entityAcceptanceComplete(requirements, done, "both").prsc, true);
  });
});