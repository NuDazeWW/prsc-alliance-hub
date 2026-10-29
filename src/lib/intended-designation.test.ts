import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  intendedDesignationSchema,
  readIntendedDesignation,
  intendedDesignationLabel,
  projectIntendedDesignation,
  requiredInvitationNdaEntity,
  type IntendedDesignation,
} from "./intended-designation";
import { initialRoleReviewStatus } from "./governance";
import { memberDesignation } from "./member-role-labels";

const forum: IntendedDesignation = {
  version: 1,
  kind: "forum_invitee",
  entity: "none",
  roles: [],
  other_text: "",
  committee: "undetermined",
};
const identified = (
  entity: IntendedDesignation["entity"],
  roles: IntendedDesignation["roles"],
  committee: IntendedDesignation["committee"] = "no",
  other_text = "",
): IntendedDesignation => ({
  version: 1,
  kind: "identified",
  entity,
  roles,
  other_text,
  committee,
});
const fourRoles = ["prsc_board", "prsc_advisor", "dis_board", "dis_advisor"] as const;

describe("NDA coverage of current and intended roles", () => {
  it("does not narrow an existing Both onboarding track when future intent changes to one entity or None", () => {
    for (const intent of [
      identified("prsc", ["prsc_board"]),
      identified("dis", ["dis_advisor"]),
      forum,
    ]) {
      assert.equal(
        requiredInvitationNdaEntity({
          entity: "both",
          is_candidate: false,
          intended_designation: intent,
        }),
        "both",
      );
    }
    assert.equal(
      requiredInvitationNdaEntity({
        entity: "dis",
        is_candidate: false,
        intended_designation: identified("prsc", ["prsc_board"]),
      }),
      "both",
    );
  });
  it("uses a Forum candidate’s real intended scope rather than adding their technical placeholder entity", () => {
    assert.equal(
      requiredInvitationNdaEntity({
        entity: "prsc",
        is_candidate: true,
        intended_designation: identified("dis", ["dis_advisor"]),
      }),
      "dis",
    );
    assert.equal(
      requiredInvitationNdaEntity({
        entity: "prsc",
        is_candidate: true,
        intended_designation: identified("both", ["prsc_board", "dis_advisor"]),
      }),
      "both",
    );
    assert.equal(
      requiredInvitationNdaEntity({
        entity: "dis",
        is_candidate: true,
        intended_designation: forum,
      }),
      "dis",
    );
  });
});

describe("complete intended-role combinations", () => {
  const supported = new Map([
    ["prsc_board", "board_member"],
    ["prsc_advisor", "advisor"],
    ["dis_board", "board_member"],
    ["dis_advisor", "advisor"],
    ["dis_board,prsc_board", "board_member"],
    ["dis_advisor,prsc_advisor", "advisor"],
    ["dis_advisor,prsc_board", "prsc_board_dis_advisor"],
    ["dis_board,prsc_advisor", "prsc_advisor_dis_board"],
  ]);
  for (let bits = 0; bits < 16; bits++) {
    const roles = fourRoles.filter((_role, index) => bits & (1 << index));
    const hasPrsc = roles.some((role) => role.startsWith("prsc_"));
    const hasDis = roles.some((role) => role.startsWith("dis_"));
    const entity = hasPrsc && hasDis ? "both" : hasDis ? "dis" : "prsc";
    const intent = roles.length ? identified(entity, roles) : forum;
    it(`retains all selected intent and safely projects subset ${bits}: ${roles.join(", ") || "Forum only"}`, () => {
      const metadata = intendedDesignationSchema.parse(intent);
      assert.deepEqual(
        readIntendedDesignation({
          intended_designation: metadata,
          role: "advisor",
          entity: "prsc",
          is_candidate: true,
        }),
        intent,
      );
      const projection = projectIntendedDesignation(metadata);
      const expectedRole = supported.get([...roles].sort().join(","));
      assert.equal(projection.entity, entity);
      assert.equal(projection.role, expectedRole ?? "advisor");
      assert.equal(projection.is_candidate, !expectedRole);
      assert.equal(projection.requiresAssignmentReview, roles.length > 0 && !expectedRole);
      assert.equal(projection.is_methodology_committee, false);
      assert.deepEqual(
        Object.keys(projection).sort(),
        [
          "entity",
          "is_candidate",
          "is_methodology_committee",
          "requiresAssignmentReview",
          "role",
        ].sort(),
      );
      assert.deepEqual(intent.roles, roles, "Projection must not remove unsupported intent");
    });
  }
  it("does not invent a second entity role when Both has only one entity-specific role", () => {
    const intent = identified("both", ["prsc_board"]);
    assert.equal(intendedDesignationSchema.safeParse(intent).success, true);
    assert.deepEqual(projectIntendedDesignation(intent), {
      entity: "both",
      role: "advisor",
      is_candidate: true,
      is_methodology_committee: false,
      requiresAssignmentReview: true,
    });
    assert.match(intendedDesignationLabel(intent), /PRSC Board/);
    assert.doesNotMatch(intendedDesignationLabel(intent), /DIS (Board|Advisor)/);
  });
});

describe("committee intent remains explicit and governed", () => {
  for (const entity of ["prsc", "dis", "both"] as const) {
    it(`supports committee-only ${entity} intent through existing role and governance rules`, () => {
      const intent = identified(entity, [], "yes");
      const projection = projectIntendedDesignation(intent);
      assert.equal(projection.role, "methodology_committee");
      assert.equal(projection.is_candidate, false);
      assert.equal(projection.is_methodology_committee, true);
      assert.equal(
        initialRoleReviewStatus(
          projection.entity,
          projection.role,
          projection.is_methodology_committee,
        ),
        entity === "prsc" ? "not_required" : "pending",
      );
    });
  }
  it("never treats an undetermined committee as Yes or grants committee eligibility to unsupported combinations", () => {
    for (const committee of ["no", "undetermined"] as const) {
      assert.equal(
        projectIntendedDesignation(identified("prsc", ["prsc_board"], committee))
          .is_methodology_committee,
        false,
      );
      assert.equal(
        intendedDesignationSchema.safeParse(identified("prsc", [], committee)).success,
        false,
      );
    }
    const unsupported = identified("prsc", ["prsc_board", "prsc_advisor"], "yes");
    assert.equal(projectIntendedDesignation(unsupported).is_candidate, true);
    assert.equal(projectIntendedDesignation(unsupported).is_methodology_committee, false);
    assert.equal(
      intendedDesignationSchema.safeParse({ ...forum, committee: "yes" }).success,
      false,
    );
    assert.equal(
      intendedDesignationSchema.safeParse(
        identified("none", ["other"], "yes", "Future specialist input"),
      ).success,
      false,
    );
  });
});

describe("Other, None, and input consistency", () => {
  it("keeps Other without an entity as descriptive intent on a neutral, locked projection", () => {
    const intent = identified(
      "none",
      ["other"],
      "undetermined",
      "Potential future specialist perspective",
    );
    assert.deepEqual(readIntendedDesignation({ intended_designation: intent }), intent);
    assert.deepEqual(projectIntendedDesignation(intent), {
      entity: "prsc",
      role: "advisor",
      is_candidate: true,
      is_methodology_committee: false,
      requiresAssignmentReview: true,
    });
    assert.match(
      intendedDesignationLabel(intent),
      /Intended: Other: Potential future specialist perspective/,
    );
    assert.equal(
      projectIntendedDesignation(
        identified("dis", ["dis_advisor", "other"], "yes", "Future operating interest"),
      ).is_methodology_committee,
      false,
    );
    assert.equal(projectIntendedDesignation(forum).requiresAssignmentReview, false);
  });
  it("rejects conflicting entity/role choices, missing descriptions, duplicates, future versions, and authority fields", () => {
    const valid = identified("prsc", ["prsc_advisor"]);
    const invalid: unknown[] = [
      { ...valid, entity: "dis" },
      { ...valid, entity: "none" },
      { ...valid, roles: ["prsc_advisor", "prsc_advisor"] },
      { ...valid, roles: ["employee"] },
      { ...valid, version: 2 },
      { ...valid, appointed: true },
      { ...valid, prsc_activated_at: "2026-10-28T12:00:00Z" },
      { ...valid, other_text: "Hidden stale description" },
      identified("none", ["other"], "no", "   "),
      identified("prsc", ["other"], "no", "x".repeat(401)),
      identified("none", []),
      { ...forum, roles: ["prsc_board"] },
      { ...forum, entity: "prsc" },
    ];
    for (const value of invalid)
      assert.equal(intendedDesignationSchema.safeParse(value).success, false);
  });
});

describe("fictional Table 1–4 legacy and future edits", () => {
  const table = [
    {
      member: {
        role: "board_member",
        entity: "both",
        is_candidate: true,
        is_methodology_committee: true,
      },
      expected: forum,
    },
    {
      member: {
        role: "board_member",
        entity: "prsc",
        is_candidate: false,
        is_methodology_committee: false,
      },
      expected: identified("prsc", ["prsc_board"]),
    },
    {
      member: {
        role: "prsc_board_dis_advisor",
        entity: "both",
        is_candidate: false,
        is_methodology_committee: true,
      },
      expected: identified("both", ["prsc_board", "dis_advisor"], "yes"),
    },
    {
      member: {
        role: "methodology_committee",
        entity: "dis",
        is_candidate: false,
        is_methodology_committee: false,
      },
      expected: identified("dis", [], "yes"),
    },
  ];
  for (const [index, row] of table.entries())
    it(`derives safe informational fallback for fictional Table ${index + 1} without modifying the legacy row`, () => {
      const before = structuredClone(row.member);
      assert.deepEqual(readIntendedDesignation(row.member), row.expected);
      assert.deepEqual(row.member, before);
      assert.equal(
        intendedDesignationSchema.safeParse(readIntendedDesignation(row.member)).success,
        true,
      );
    });
  it("expands existing both-entity Board/Advisor roles and keeps unknown records neutral", () => {
    assert.deepEqual(readIntendedDesignation({ role: "board_member", entity: "both" }).roles, [
      "prsc_board",
      "dis_board",
    ]);
    assert.deepEqual(readIntendedDesignation({ role: "advisor", entity: "both" }).roles, [
      "prsc_advisor",
      "dis_advisor",
    ]);
    assert.deepEqual(
      readIntendedDesignation({ role: "prsc_advisor_dis_board", entity: "both" }).roles,
      ["prsc_advisor", "dis_board"],
    );
    assert.deepEqual(readIntendedDesignation({ role: "unknown", entity: "unknown" }), forum);
    assert.deepEqual(readIntendedDesignation(null), forum);
  });
  it("reads future metadata edits without changing an existing appointment, authority, NDA, access, or releases", () => {
    const member = {
      ...table[1].member,
      id: "fictional-2",
      status: "active",
      prsc_activated_at: "2026-09-01T12:00:00Z",
      dis_activated_at: null,
      documents_released_at: "2026-08-01T12:00:00Z",
      nda_verified_at: "2026-07-01T12:00:00Z",
      role_review_status: "not_required",
      intended_designation: identified(
        "none",
        ["other"],
        "undetermined",
        "A possible future contribution",
      ),
    };
    const before = structuredClone(member);
    const appointmentBefore = memberDesignation(member);
    const intent = readIntendedDesignation(member);
    assert.equal(intendedDesignationLabel(member), intendedDesignationLabel(intent));
    assert.equal(projectIntendedDesignation(intent).is_candidate, true);
    assert.equal(memberDesignation(member), appointmentBefore);
    assert.deepEqual(member, before);
    const { intended_designation: _intent, ...actualFields } = member;
    const { intended_designation: _previous, ...priorFields } = before;
    assert.deepEqual(actualFields, priorFields);
  });
  it("ignores malformed stored metadata and safely derives the established legacy presentation", () => {
    const fallback = readIntendedDesignation({
      ...table[1].member,
      intended_designation: { ...forum, role: "admin" },
    });
    assert.deepEqual(fallback, table[1].expected);
    assert.match(intendedDesignationLabel(forum), /United Forum Invitee/);
    assert.match(intendedDesignationLabel(table[1].member), /^Intended:/);
  });
});
