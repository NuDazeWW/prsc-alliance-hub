import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import {
  entityAppointmentStatus,
  roleCombinationTier,
  roleReviewBlocks,
  ndaProblem,
  documentVisible,
  appointmentProblems,
  governanceStatusLabel,
} from "./governance";

const nda = {
  verified_at: "2026-10-01",
  verified_by: "admin",
  reference: "Vault/NDA-001",
  entities: "prsc",
  scope: "Forum materials",
};
const pending = {
  nda_verified_at: "2026-10-01",
  forum_clearance_status: "not_reviewed",
  addendum_complete: true,
};

describe("NDA gate", () => {
  it("blocks invitation with no NDA verification", () => {
    strictEqual(
      !!ndaProblem(
        { verified_at: null, verified_by: null, reference: null, entities: null, scope: null },
        "prsc",
      ),
      true,
    );
  });
  it("blocks when the NDA covers only PRSC but the candidate is for both entities", () => {
    strictEqual(!!ndaProblem(nda, "both"), true);
  });
  it("passes a complete PRSC NDA for a PRSC candidate", () => {
    strictEqual(ndaProblem(nda, "prsc"), null);
  });
});

describe("role combinations", () => {
  it("cross-entity mixed roles are blocked pending review, not prohibited", () => {
    strictEqual(roleCombinationTier("both", "board_member").tier, "review");
    strictEqual(roleCombinationTier("prsc", "prsc_board_dis_advisor").tier, "review");
  });
  it("single-entity roles need no review", () => {
    strictEqual(roleCombinationTier("prsc", "board_member").tier, "none");
  });
  it("pending review blocks; approval unblocks", () => {
    strictEqual(roleReviewBlocks("pending"), true);
    strictEqual(roleReviewBlocks("prohibited"), true);
    strictEqual(roleReviewBlocks("approved"), false);
  });
});

describe("Forum material access", () => {
  const prep = { classification: "confidential_forum", superseded_at: null, is_forum_prep: true };
  const forumContent = {
    classification: "confidential_forum",
    superseded_at: null,
    is_forum_prep: false,
  };
  it("NDA-verified invitees open Stage 1 preparation before clearance", () => {
    strictEqual(documentVisible(prep, pending, false), true);
  });
  it("other Forum content stays closed until clearance", () => {
    strictEqual(documentVisible(forumContent, pending, false), false);
    strictEqual(
      documentVisible(forumContent, { ...pending, forum_clearance_status: "cleared" }, false),
      true,
    );
  });
  it("no NDA on file means no Forum materials at all", () => {
    strictEqual(
      documentVisible(prep, { nda_verified_at: null, forum_clearance_status: "cleared" }, false),
      false,
    );
  });
  it("restricted and secretariat items are never shown to members", () => {
    strictEqual(
      documentVisible(
        { ...prep, classification: "restricted_opportunity" },
        { ...pending, forum_clearance_status: "cleared" },
        false,
      ),
      false,
    );
  });
  it("superseded documents leave the queue but signed copies stay visible", () => {
    const old = {
      classification: "entity_confidential",
      superseded_at: "2026-10-20",
      is_forum_prep: false,
    };
    strictEqual(documentVisible(old, pending, false), false);
    strictEqual(documentVisible(old, pending, true), true);
  });
});

describe("appointment", () => {
  it("cannot be appointed without countersignature and appointment record", () => {
    const p = appointmentProblems({
      ndaOk: true,
      roleReviewOk: true,
      forumOk: true,
      trackDocsComplete: true,
      countersigned: false,
      appointmentRef: "",
    });
    strictEqual(p.length, 2);
  });
  it("all verified elements allow appointment", () => {
    deepStrictEqual(
      appointmentProblems({
        ndaOk: true,
        roleReviewOk: true,
        forumOk: true,
        trackDocsComplete: true,
        countersigned: true,
        appointmentRef: "Board resolution 2026-04",
      }),
      [],
    );
  });
  it("candidates are never labelled appointed before activation", () => {
    strictEqual(
      governanceStatusLabel({
        status: "active",
        forumCleared: true,
        stage3Done: true,
        appointed: { prsc: false, dis: false },
        tracks: ["prsc"],
      }),
      "Pending Appointment",
    );
  });
});

describe("forum candidate document visibility", () => {
  const m = {
    nda_verified_at: "2026-01-01",
    forum_clearance_status: "cleared",
    is_candidate: true,
  };
  const doc = (stage: number | null) => ({
    classification: "entity_confidential",
    superseded_at: null,
    is_forum_prep: false,
    journey_stage: stage,
  });
  it("hides Stages 2–4 from candidates but keeps Stage 1", () => {
    strictEqual(documentVisible(doc(1), m, false), true);
    strictEqual(documentVisible(doc(3), m, false), false);
    strictEqual(documentVisible(doc(3), { ...m, is_candidate: false }, false), true);
  });
});

describe("Pending Appointment review gates", () => {
  const complete = {
    acceptanceComplete: true,
    roleReviewStatus: "approved",
    forumClearanceStatus: "cleared",
  };
  it("Stage 3 incomplete stays Candidate", () =>
    strictEqual(entityAppointmentStatus({ ...complete, acceptanceComplete: false }), "candidate"));
  it("Stage 3 complete and reviews cleared becomes Pending Appointment without activation", () =>
    strictEqual(entityAppointmentStatus(complete), "pending_appointment"));
  it("pending, declined, prohibited or missing role reviews prevent Pending Appointment", () => {
    for (const roleReviewStatus of ["pending", "declined", "prohibited", undefined])
      strictEqual(entityAppointmentStatus({ ...complete, roleReviewStatus }), "candidate");
  });
  it("uncleared conflict review prevents Pending Appointment", () => {
    for (const forumClearanceStatus of ["not_reviewed", "escalated", "declined"])
      strictEqual(entityAppointmentStatus({ ...complete, forumClearanceStatus }), "candidate");
  });
  it("cleared restrictions and non-required role review allow Pending Appointment", () =>
    strictEqual(
      entityAppointmentStatus({
        ...complete,
        roleReviewStatus: "not_required",
        forumClearanceStatus: "cleared_restricted",
      }),
      "pending_appointment",
    ));
  it("Forum opt-outs need no Forum clearance", () =>
    strictEqual(
      entityAppointmentStatus({
        ...complete,
        participatesInForum: false,
        forumClearanceStatus: "not_reviewed",
      }),
      "pending_appointment",
    ));
  it("only existing verified administrative activation produces Appointed", () =>
    strictEqual(entityAppointmentStatus({ ...complete, activatedAt: "2026-10-26" }), "appointed"));
});

import { stage2ReleaseProblems } from "./governance";
describe("Stage 2 release gate", () => {
  const ok = {
    target: "prsc" as const,
    memberEntity: "prsc",
    role: "advisor",
    isCandidate: false,
    nda: {
      verified_at: "2026-01-01",
      verified_by: "a",
      reference: "ref",
      entities: "prsc",
      scope: "full",
    },
    roleReviewStatus: "not_required",
    stage2DocCount: 1,
    alreadyReleased: false,
  };
  it("allows an eligible release", () => {
    strictEqual(stage2ReleaseProblems(ok).length, 0);
  });
  it("blocks a Forum-only candidate with no intended role", () => {
    strictEqual(stage2ReleaseProblems({ ...ok, isCandidate: true }).length > 0, true);
  });
  it("7. blocks an unresolved cross-entity review", () => {
    strictEqual(
      stage2ReleaseProblems({
        ...ok,
        memberEntity: "both",
        roleReviewStatus: "pending",
        nda: { ...ok.nda, entities: "both" },
      }).length > 0,
      true,
    );
  });
  it("blocks mismatched NDA coverage", () => {
    strictEqual(
      stage2ReleaseProblems({
        ...ok,
        target: "dis",
        memberEntity: "both",
        nda: { ...ok.nda, entities: "prsc" },
        roleReviewStatus: "approved",
      }).some((p) => /NDA/.test(p)),
      true,
    );
  });
  it("8. blocks a second release of the same entity", () => {
    strictEqual(stage2ReleaseProblems({ ...ok, alreadyReleased: true }).length > 0, true);
  });
  it("blocks when no Stage 2 documents exist", () => {
    strictEqual(stage2ReleaseProblems({ ...ok, stage2DocCount: 0 }).length > 0, true);
  });
});
