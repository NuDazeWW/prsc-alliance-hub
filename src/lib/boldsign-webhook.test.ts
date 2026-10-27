import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyBoldSignSignature } from "../routes/api/public/boldsign-webhook";

const secret = "s3cret", body = '{"event":{"eventType":"Signed"}}', t = 1_800_000_000;
const sig = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");

test("unsigned BoldSign request is rejected", async () => {
  assert.equal(await verifyBoldSignSignature(null, body, secret, t), false);
});
test("forged BoldSign signature is rejected", async () => {
  assert.equal(await verifyBoldSignSignature(`t=${t}, s0=${"0".repeat(64)}`, body, secret, t), false);
});
test("stale BoldSign signature (over 5 minutes) is rejected", async () => {
  assert.equal(await verifyBoldSignSignature(`t=${t}, s0=${sig}`, body, secret, t + 301), false);
});
test("valid BoldSign signature is accepted", async () => {
  assert.equal(await verifyBoldSignSignature(`t=${t}, s0=${sig}`, body, secret, t + 10), true);
});
