import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// BoldSign webhook: marks BoldSign documents complete automatically.
// Authenticity: every event is re-checked against the BoldSign API with our
// private API key, so a forged request cannot mark anything signed.
const payloadSchema = z.object({
  event: z.object({ eventType: z.string().max(80) }).passthrough(),
  data: z.object({ documentId: z.string().max(120).optional() }).passthrough().optional(),
});

export async function verifyBoldSignSignature(header: string | null, raw: string, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const t = Number(parts["t"]);
  const sigs = Object.entries(parts).filter(([k]) => /^s\d+$/.test(k)).map(([, v]) => v);
  if (!Number.isFinite(t) || !sigs.length || Math.abs(nowSec - t) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)));
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}

type Signer = { signerEmail?: string; status?: string };

export const Route = createFileRoute("/api/public/boldsign-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        // Verify the BoldSign signature before any lookup; fail closed if not configured.
        const secret = process.env["BOLDSIGN_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        if (!(await verifyBoldSignSignature(request.headers.get("x-boldsign-signature"), raw, secret))) {
          return new Response("Unauthorized", { status: 401 });
        }
        let parsed;
        try {
          parsed = payloadSchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const type = parsed.event.eventType;
        if (type === "Verification") return new Response("ok");
        if (type !== "Signed" && type !== "Completed") return new Response("ignored");
        const documentId = parsed.data?.documentId;
        if (!documentId) return new Response("ignored");

        const apiKey = process.env["BOLDSIGN_API_KEY"];
        if (!apiKey) return new Response("Not configured", { status: 500 });
        const res = await fetch(`https://api.boldsign.com/v1/document/properties?documentId=${encodeURIComponent(documentId)}`, {
          headers: { "X-API-KEY": apiKey, Accept: "application/json" },
        });
        if (!res.ok) {
          console.error(`BoldSign lookup failed [${res.status}]: ${await res.text()}`);
          return new Response("Lookup failed", { status: 502 });
        }
        const doc = (await res.json()) as { messageTitle?: string; documentTitle?: string; signerDetails?: Signer[] };
        const signed = (doc.signerDetails ?? [])
          .filter((s) => (s.status ?? "").toLowerCase() === "completed" && s.signerEmail)
          .map((s) => s.signerEmail!.toLowerCase());
        if (!signed.length) return new Response("no signers complete");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { maybeCompletePackage } = await import("@/lib/portal.functions");
        const title = (doc.messageTitle || doc.documentTitle || "").trim().toLowerCase();

        for (const email of signed) {
          const { data: member } = await supabaseAdmin.from("portal_members")
            .select("id, email, first_name, last_name, entity, role, documents_completed_at")
            .ilike("email", email).maybeSingle();
          if (!member) continue;
          const { data: docs } = await supabaseAdmin.from("portal_documents")
            .select("id, title, external_url, member_id, audience_entity, audience_role, action")
            .eq("action", "boldsign")
            .or(`member_id.is.null,member_id.eq.${member.id}`);
          const { data: acks } = await supabaseAdmin.from("portal_document_acknowledgements")
            .select("document_id").eq("member_id", member.id);
          const done = new Set((acks ?? []).map((a: { document_id: string }) => a.document_id));
          const open = (docs ?? []).filter((d: any) => !done.has(d.id));
          const match =
            open.find((d: any) => d.external_url?.includes(documentId)) ??
            open.find((d: any) => title && d.title.trim().toLowerCase() === title) ??
            (open.length === 1 ? open[0] : undefined);
          if (!match) {
            console.warn(`BoldSign: no matching portal document for ${documentId}`);
            continue;
          }
          const { error } = await supabaseAdmin.from("portal_document_acknowledgements").insert({
            document_id: match.id, member_id: member.id, initials: "BOLDSIGN",
            kind: "external_confirmed", consent: true,
          });
          if (error && error.code !== "23505") throw error;
          await supabaseAdmin.from("portal_activity").insert({
            member_id: member.id, actor_user_id: null, event_type: "boldsign_auto_confirmed",
            metadata: { document_id: match.id, title: match.title, boldsign_document_id: documentId },
          });
          await maybeCompletePackage(member as any);
        }
        return new Response("ok");
      },
    },
  },
});
