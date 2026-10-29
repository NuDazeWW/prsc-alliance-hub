import { createFileRoute } from "@tanstack/react-router";
import { boldSignPayload, isBoldSignVerification, readBoldSignBody } from "@/lib/boldsign-callback";

// BoldSign webhook: marks BoldSign documents complete automatically.
// Authenticity: every event is re-checked against the BoldSign API with our
// private API key, so a forged request cannot mark anything signed.

export async function verifyBoldSignSignature(
  header: string | null,
  raw: string,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=", 2) as [string, string]),
  );
  const t = Number(parts["t"]);
  const sigs = Object.entries(parts)
    .filter(([k]) => /^s\d+$/.test(k))
    .map(([, v]) => v);
  if (!Number.isFinite(t) || !sigs.length || Math.abs(nowSec - t) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)),
  );
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some(
    (s) =>
      s.length === hex.length &&
      [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0,
  );
}

export const Route = createFileRoute("/api/public/boldsign-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await readBoldSignBody(request);
        if (raw === null) return new Response("Payload too large", { status: 413 });
        let parsed;
        try {
          parsed = boldSignPayload.parse(JSON.parse(raw));
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        // BoldSign documents an unsigned initial URL verification. This branch
        // is stateless and cannot reach any API, member lookup or completion.
        if (
          isBoldSignVerification(request.headers.get("x-boldsign-event"), parsed.event.eventType)
        ) {
          return new Response("ok", { status: 200 });
        }
        // Verify the BoldSign signature before any lookup; fail closed if not configured.
        const secret = process.env["BOLDSIGN_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        if (
          !(await verifyBoldSignSignature(request.headers.get("x-boldsign-signature"), raw, secret))
        ) {
          return new Response("Unauthorized", { status: 401 });
        }
        const type = parsed.event.eventType;
        if (type === "Verification") return new Response("ok");
        if (type !== "Signed" && type !== "Completed") return new Response("ignored");
        const documentId = parsed.data?.documentId;
        if (!documentId) return new Response("ignored");

        // Only exact persisted assignments can reach completion; no title or
        // last-open-document fallback is permitted.
        const { reconcileBoldSign } = await import("@/lib/boldsign.server");
        await reconcileBoldSign(documentId);
        return new Response("ok");
      },
    },
  },
});
