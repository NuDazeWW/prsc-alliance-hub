import { expect, it } from "vitest";
import { leadershipPublicationAllowed, linkedProfilePermissions } from "./leadership-publication";
it("linking a person does not approve publication", () => {
  expect(leadershipPublicationAllowed({ publication_scope: "none" })).toBe(false);
  expect(leadershipPublicationAllowed({ publication_scope: "portal_members", publication_approved_at: "2026-10-27", publication_approved_by: "admin" })).toBe(true);
});
it("no, discuss and missing profile permissions fail closed", () => {
  expect(linkedProfilePermissions({ p1: "yes", p2: "no", p3: "discuss" })).toEqual({ name: true, affiliation: false, bio: false, photo: false });
  expect(linkedProfilePermissions({ p3: "yes", p4: "yes" }).photo).toBe(true);
});