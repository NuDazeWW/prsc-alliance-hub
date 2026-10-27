import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SIGNED_COPY_EMAIL_ENABLED } from "./signed-copy-policy";

test("signed-copy email delivery is disabled for launch", () => {
  assert.equal(SIGNED_COPY_EMAIL_ENABLED, false);
});
test("sendSignedCopy refuses before creating any download link", () => {
  const src = readFileSync(new URL("./portal.functions.ts", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("export const sendSignedCopy"));
  assert.ok(body.indexOf("SIGNED_COPY_EMAIL_ENABLED") < body.indexOf("createSignedUrl"));
});
