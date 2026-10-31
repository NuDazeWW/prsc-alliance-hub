import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MEMBER_LIST_TEMPLATE, parseMemberList } from "./member-import";

const headers = "first_name,last_name,email,organization,title,invitation_type,entity,roles,other_role,methodology_committee,linkedin_url,background,why_you";
const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
const fixture = (rows: string[][], columns = headers) => `${columns}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
const person = (n: number, invitation: string, entity: string, roles: string, committee: string, other = "") => [
  "Test", String(n), `test${n}@example.test`, "Fictional Organization", "Executive", invitation, entity, roles, other, committee, "", "", "Administrator-reviewed fictional note.",
];

describe("member CSV staging with intended designations", () => {
  it("stages four fictional recipients with distinct names, emails, choices, and no invitation or NDA writes", () => {
    const parsed = parseMemberList(fixture([
      person(1, "Forum invitee", "None", "", "Undetermined"),
      person(2, "identified", "Both", "PRSC Board; DIS Advisor", "No"),
      person(3, "identified", "PRSC", "PRSC Advisor", "Yes"),
      person(4, "identified", "DIS", "DIS Board | DIS Advisor | Other", "No", "Research working group"),
    ]));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows.length, 4);
    assert.deepEqual(parsed.rows.map((row) => row.email), [1, 2, 3, 4].map((n) => `test${n}@example.test`));
    assert.deepEqual(parsed.rows[0].intended_designation, { version: 1, kind: "forum_invitee", entity: "none", roles: [], other_text: "", committee: "undetermined" });
    assert.equal(parsed.rows[0].is_candidate, true);
    assert.deepEqual(parsed.rows[1].intended_designation.roles, ["prsc_board", "dis_advisor"]);
    assert.equal(parsed.rows[2].intended_designation.committee, "yes");
    assert.equal(parsed.rows[2].is_methodology_committee, true);
    assert.deepEqual(parsed.rows[3].intended_designation.roles, ["dis_board", "dis_advisor", "other"]);
    for (const row of parsed.rows) {
      assert.equal("nda_verified_at" in row, false);
      assert.equal("nda_confirmed" in row, false);
      assert.equal("send_invitations" in row, false);
      assert.equal("appointed_at" in row, false);
    }
  });

  it("accepts each allowed entity, role, and committee choice", () => {
    const cases = [
      person(1, "forum_invitee", "None", "", "Undetermined"),
      person(2, "identified", "PRSC", "PRSC Board", "Yes"),
      person(3, "identified", "PRSC", "PRSC Advisor", "No"),
      person(4, "identified", "DIS", "DIS Board", "Undetermined"),
      person(5, "identified", "DIS", "DIS Advisor", "No"),
      person(6, "identified", "Both", "Other", "Yes", "Specialist contributor"),
      person(7, "identified", "None", "Other", "Undetermined", "Independent research contributor"),
    ];
    const parsed = parseMemberList(fixture(cases));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows.length, cases.length);
  });

  it("accepts role as a singular header and both spaced and underscored Forum aliases", () => {
    for (const role of ["Forum invitee", "united_forum_invitee", "forum_invitee"]) {
      const parsed = parseMemberList(`first_name,last_name,email,entity,role\nTest,One,test1@example.test,None,${role}`);
      assert.deepEqual(parsed.errors, []);
      assert.equal(parsed.rows[0].intended_designation.kind, "forum_invitee");
      assert.equal(parsed.rows[0].intended_designation.entity, "none");
    }
    const parsed = parseMemberList(`first_name,last_name,email,entity,role\nTest,One,test1@example.test,Both,"PRSC Board, DIS Advisor"`);
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(parsed.rows[0].intended_designation.roles, ["prsc_board", "dis_advisor"]);
  });

  it("retains legacy roles, combinations, and committee participation", () => {
    const columns = "first_name,last_name,email,organization,title,entity,role,methodology_committee,linkedin_url,background,why_you";
    const cases = [
      ["Test", "One", "test1@example.test", "", "", "prsc", "board_member", "yes"],
      ["Test", "Two", "test2@example.test", "", "", "both", "advisor", ""],
      ["Test", "Three", "test3@example.test", "", "", "both", "prsc_board_dis_advisor", "no"],
      ["Test", "Four", "test4@example.test", "", "", "both", "prsc_advisor_dis_board", "no"],
      ["Test", "Five", "test5@example.test", "", "", "dis", "methodology_committee", ""],
    ];
    const parsed = parseMemberList(fixture(cases, columns));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows.length, cases.length);
    assert.deepEqual(parsed.rows.map((row) => row.role), ["board_member", "advisor", "prsc_board_dis_advisor", "prsc_advisor_dis_board", "methodology_committee"]);
    assert.equal(parsed.rows[1].intended_designation.committee, "no");
    assert.equal(parsed.rows[4].intended_designation.committee, "yes");
    assert.equal(parsed.rows[4].is_methodology_committee, true);
  });

  it("uses Undetermined for blank new-format committee cells and accepts the prior misspelled header", () => {
    const parsed = parseMemberList(fixture([person(1, "forum_invitee", "None", "", "")], headers.replace("methodology_committee", "methodology_commitee")));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows[0].intended_designation.committee, "undetermined");
  });

  it("rejects unknown committee values instead of silently treating them as No", () => {
    for (const value of ["undermined", "maybe", "pending"]) {
      const parsed = parseMemberList(fixture([person(1, "forum_invitee", "None", "", value)]));
      assert.equal(parsed.rows.length, 0);
      assert.match(parsed.errors.join(" "), /Yes, No, or Undetermined/);
    }
  });

  it("rejects duplicate normalized emails before returning any submit-ready rows", () => {
    const second = person(2, "forum_invitee", "None", "", "No");
    second[2] = " TEST1@EXAMPLE.TEST ";
    const parsed = parseMemberList(fixture([person(1, "forum_invitee", "None", "", "No"), second]));
    assert.deepEqual(parsed.rows, []);
    assert.match(parsed.errors.join(" "), /duplicate email.*row 2/);
  });

  it("preserves Unicode, BOM, quoted commas, escaped quotations, and multiline background", () => {
    const row = person(1, "identified", "Both", "PRSC Board, DIS Advisor", "Yes");
    row[0] = "Zoë";
    row[3] = 'Fictional "Quoted", Group';
    row[11] = "First paragraph, with a comma.\nSecond paragraph — research experience.";
    const parsed = parseMemberList(`\uFEFF${fixture([row])}`.replaceAll("\n", "\r\n"));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows[0].first_name, "Zoë");
    assert.equal(parsed.rows[0].organization, 'Fictional "Quoted", Group');
    assert.equal(parsed.rows[0].background, row[11]);
  });

  it("does not turn spreadsheet NDA labels or references into verified evidence", () => {
    const row = [...person(1, "forum_invitee", "None", "", "Undetermined"), "Verified", "nda-from-spreadsheet", "2026-10-01"];
    const parsed = parseMemberList(fixture([row], `${headers},nda_status,nda_reference,nda_verified_at`));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows.length, 1);
    assert.equal(Object.keys(parsed.rows[0]).some((key) => key.startsWith("nda_")), false);
  });

  it("stages Forum-only roster records before Why you notes are complete, retaining each supplied source", () => {
    const cases = [1, 2, 3, 4].map((n) => {
      const row = person(n, "forum_invitee", "None", "", "Undetermined");
      row[10] = `https://www.linkedin.com/in/fictional-test-${n}/`;
      row[12] = n === 1 ? "" : n === 2 ? "Draft later." : row[12];
      return row;
    });
    const parsed = parseMemberList(fixture(cases));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows.length, 4);
    assert.equal(parsed.rows[0].why_you, "");
    assert.equal(parsed.rows[1].why_you, "Draft later.");
    parsed.rows.forEach((row, i) => {
      assert.equal(row.linkedin_url, cases[i][10]);
      assert.equal(row.intended_designation.entity, "none");
      assert.equal(row.is_candidate, true);
    });
  });

  it("rejects invalid or oversized source URLs instead of silently truncating a stored source", () => {
    for (const url of ["https://example.test/in/test", "https://linkedin.com/in/" + "x".repeat(300)]) {
      const row = person(1, "forum_invitee", "None", "", "Undetermined");
      row[10] = url;
      const parsed = parseMemberList(fixture([row]));
      assert.equal(parsed.rows.length, 0);
      assert.ok(parsed.errors.length > 0);
    }
  });

  it("rejects contradictory Forum/entity roles, unknown roles, and unspecified Other roles", () => {
    for (const row of [
      person(1, "forum_invitee", "None", "PRSC Board", "No"),
      person(1, "identified", "None", "board_member", "No"),
      person(1, "identified", "PRSC", "Treasurer", "No"),
      person(1, "identified", "PRSC", "Other", "No"),
      person(1, "identified", "PRSC", "DIS Board", "No"),
    ]) {
      const parsed = parseMemberList(fixture([row]));
      assert.equal(parsed.rows.length, 0);
      assert.ok(parsed.errors.length > 0);
    }
  });

  it("rejects missing identities, malformed quotes, duplicate columns, and unquoted extra values", () => {
    for (const csv of [
      "first_name,last_name,roles\nTest,One,PRSC Board",
      'first_name,last_name,email,roles\nTest,One,test1@example.test,"PRSC Board',
      "first_name,last_name,email,email,roles\nTest,One,test1@example.test,test1@example.test,PRSC Board",
      "first_name,last_name,email,entity,roles\nTest,One,test1@example.test,Both,PRSC Board,DIS Advisor",
    ]) {
      const parsed = parseMemberList(csv);
      assert.equal(parsed.rows.length, 0);
      assert.ok(parsed.errors.length > 0);
    }
  });

  it("provides an importable template explaining multiple roles through fictional examples", () => {
    const parsed = parseMemberList(MEMBER_LIST_TEMPLATE);
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.rows.length, 2);
    assert.equal(parsed.rows[0].email, "test1@example.test");
    assert.equal(parsed.rows[1].intended_designation.roles.length, 2);
  });
});
