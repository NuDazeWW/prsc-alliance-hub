import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { memberRoleLabels } from "./member-role-labels";

describe("entity-specific member capacities", () => {
  test("PRSC advisor", () => deepStrictEqual(memberRoleLabels("advisor", "prsc"), ["PRSC Advisor"]));
  test("DIS advisor", () => deepStrictEqual(memberRoleLabels("advisor", "dis"), ["DIS Advisor"]));
  test("PRSC board", () => deepStrictEqual(memberRoleLabels("board_member", "prsc"), ["PRSC Board"]));
  test("DIS board", () => deepStrictEqual(memberRoleLabels("board_member", "dis"), ["DIS Board"]));
  test("shared advisor retains separate entities", () => deepStrictEqual(memberRoleLabels("advisor", "both"), ["PRSC Advisor", "DIS Advisor"]));
  test("PRSC board and DIS advisor preserve mixed capacities", () => deepStrictEqual(memberRoleLabels("prsc_board_dis_advisor", "both"), ["PRSC Board", "DIS Advisor"]));
  test("PRSC advisor and DIS board preserve mixed capacities", () => deepStrictEqual(memberRoleLabels("prsc_advisor_dis_board", "both"), ["PRSC Advisor", "DIS Board"]));
  test("PRSC methodology committee", () => deepStrictEqual(memberRoleLabels("methodology_committee", "prsc"), ["PRSC Methodology Committee"]));
  test("DIS methodology committee", () => deepStrictEqual(memberRoleLabels("methodology_committee", "dis"), ["DIS Methodology Committee"]));
});
import { memberRoleChips, memberRoleKinds } from "./member-role-labels";

describe("role chips and role details", () => {
  test("single role chip names the full entity", () => deepStrictEqual(memberRoleChips("advisor", "prsc"), ["Advisor · Partnership Readiness Standards Council, LLC"]));
  test("mixed roles render separate chips", () => deepStrictEqual(memberRoleChips("prsc_board_dis_advisor", "both"), ["Board · Partnership Readiness Standards Council, LLC", "Advisor · Decision Intelligence Systems, Inc."]));
  test("board member sees only board details", () => deepStrictEqual(memberRoleKinds("board_member"), ["board"]));
  test("advisor sees only advisor details", () => deepStrictEqual(memberRoleKinds("advisor"), ["advisor"]));
  test("mixed role sees board and advisor", () => deepStrictEqual(memberRoleKinds("prsc_advisor_dis_board"), ["board", "advisor"]));
  test("committee flag adds committee details", () => deepStrictEqual(memberRoleKinds("board_member", true), ["board", "committee"]));
  test("committee role sees only committee", () => deepStrictEqual(memberRoleKinds("methodology_committee"), ["committee"]));
});
