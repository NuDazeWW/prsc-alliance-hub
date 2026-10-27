import { describe, expect, it } from "vitest";
import { csvCell } from "./csv";
import { portalAccessAllowed } from "./portal-access";

describe("retained member authorization", () => {
  it("denies revoked members even with an existing admin role", () => {
    expect(portalAccessAllowed({ status: "revoked" }, true)).toBe(false);
    expect(portalAccessAllowed({ status: "revoked" }, false)).toBe(false);
  });
  it("preserves invited and active access, and separate admin access", () => {
    expect(portalAccessAllowed({ status: "invited" }, false)).toBe(true);
    expect(portalAccessAllowed({ status: "active" }, false)).toBe(true);
    expect(portalAccessAllowed(null, true)).toBe(true);
    expect(portalAccessAllowed(null, false)).toBe(false);
  });
});
describe("spreadsheet exports", () => {
  it.each(["=HYPERLINK(\"https://example.com\")", "+SUM(1,2)", "-1+2", "@SUM(1,2)", "\t=1+1", "\r\n=1", " \u200b=1", "\u0000=1", "\ufeff@SUM(1)"])("neutralizes %j", value => {
    expect(csvCell(value).startsWith('"\'')).toBe(true);
  });
  it("preserves ordinary names, commas and quoted text", () => {
    expect(csvCell('Shirley, "Founder"')).toBe('"Shirley, ""Founder"""');
    expect(csvCell(null)).toBe('""');
  });
});