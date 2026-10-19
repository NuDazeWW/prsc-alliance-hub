/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { memberRoleLabels } from "./member-role-labels";

describe("entity-specific member capacities", () => {
  test("PRSC advisor", () => expect(memberRoleLabels("advisor", "prsc")).toEqual(["PRSC Advisor"]));
  test("DIS advisor", () => expect(memberRoleLabels("advisor", "dis")).toEqual(["DIS Advisor"]));
  test("PRSC board", () => expect(memberRoleLabels("board_member", "prsc")).toEqual(["PRSC Board"]));
  test("DIS board", () => expect(memberRoleLabels("board_member", "dis")).toEqual(["DIS Board"]));
  test("shared advisor retains separate entities", () => expect(memberRoleLabels("advisor", "both")).toEqual(["PRSC Advisor", "DIS Advisor"]));
  test("PRSC board and DIS advisor preserve mixed capacities", () => expect(memberRoleLabels("prsc_board_dis_advisor", "both")).toEqual(["PRSC Board", "DIS Advisor"]));
  test("PRSC advisor and DIS board preserve mixed capacities", () => expect(memberRoleLabels("prsc_advisor_dis_board", "both")).toEqual(["PRSC Advisor", "DIS Board"]));
  test("PRSC methodology committee", () => expect(memberRoleLabels("methodology_committee", "prsc")).toEqual(["PRSC Methodology Committee"]));
  test("DIS methodology committee", () => expect(memberRoleLabels("methodology_committee", "dis")).toEqual(["DIS Methodology Committee"]));
});