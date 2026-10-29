import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { csvCell } from "./csv";
import { portalAccessAllowed } from "./portal-access";

describe("retained member authorization", () => {
  it("denies revoked members even with an existing admin role", () => {
    assert.equal(portalAccessAllowed({ status: "revoked" }, true), false);
    assert.equal(portalAccessAllowed({ status: "revoked" }, false), false);
  });
  it("preserves invited and active access, and separate admin access", () => {
    assert.equal(portalAccessAllowed({ status: "invited" }, false), true);
    assert.equal(portalAccessAllowed({ status: "active" }, false), true);
    assert.equal(portalAccessAllowed(null, true), true);
    assert.equal(portalAccessAllowed(null, false), false);
  });
});
describe("spreadsheet exports", () => {
  for (const value of [
    '=HYPERLINK("https://example.com")',
    "+SUM(1,2)",
    "-1+2",
    "@SUM(1,2)",
    "\t=1+1",
    "\r\n=1",
    " \u200b=1",
    "\u0000=1",
    "\ufeff@SUM(1)",
  ])
    it(`neutralizes ${JSON.stringify(value)}`, () => {
      assert.equal(csvCell(value).startsWith("\"'"), true);
    });
  it("preserves ordinary names, commas and quoted text", () => {
    assert.equal(csvCell('Shirley, "Founder"'), '"Shirley, ""Founder"""');
    assert.equal(csvCell(null), '""');
  });
});
