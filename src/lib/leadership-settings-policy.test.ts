import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("leadership heading read requires current portal access", () => {
  const sql = readFileSync("drizzle/migrations/0023_leadership_settings_current_access_read.sql", "utf8");
  assert.match(sql, /DROP POLICY IF EXISTS "Signed in read leadership settings"/);
  assert.match(sql, /FOR SELECT TO authenticated USING \(public\.portal_access_current\(\)\)/);
  assert.doesNotMatch(sql, /USING \(true\)/);
});
