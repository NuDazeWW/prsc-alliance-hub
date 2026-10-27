import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "./portal-access";
import type { PortalDocumentRecord } from "./portal.functions";

export const openBoldSign = createServerFn({ method: "POST" }).middleware([requirePortalAccess])
  .inputValidator(input => z.object({ document_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: member } = await context.supabase.from("portal_members").select("*").eq("user_id", context.userId).single();
    if (!member || member.status === "revoked") throw new Error("Portal access unavailable");
    const { data: doc } = await context.supabase.from("portal_documents").select("*").eq("id", data.document_id).maybeSingle();
    if (!doc || doc.member_id !== member.id || doc.action !== "boldsign" || doc.superseded_at || !doc.version_label) throw new Error("This signing assignment requires a current member-specific document and approved version");
    const { data: all } = await context.supabase.from("portal_documents").select("*");
    const { data: acks } = await context.supabase.from("portal_document_acknowledgements").select("document_id").eq("member_id", member.id);
    const { data: releases } = await context.supabase.from("entity_onboarding_releases").select("entity").eq("member_id", member.id);
    const { lockedDocumentIds } = await import("./journey");
    const { appliesTo } = await import("./portal.functions");
    const applicable = ((all ?? []) as PortalDocumentRecord[]).filter(d => !d.superseded_at && appliesTo(d, member));
    if (lockedDocumentIds(applicable, new Set((acks ?? []).map(a => a.document_id)), member.entity, { forum: member.participates_in_forum !== false, released: { prsc: !!releases?.some(r => r.entity === "prsc"), dis: !!releases?.some(r => r.entity === "dis") } }).has(doc.id)) throw new Error("Complete the applicable earlier documents and await entity release");
    const { boldSignDocumentId } = await import("./boldsign-records");
    const id = boldSignDocumentId(doc.external_url);
    if (!id) throw new Error("The administrator must add the exact BoldSign documentId to this assignment's link");
    const { boldSignGet } = await import("./boldsign.server");
    const properties = await (await boldSignGet(`properties?documentId=${encodeURIComponent(id)}`)).json() as { signerDetails?: { signerEmail?: string }[] };
    if (!properties.signerDetails?.some(s => s.signerEmail?.toLowerCase() === member.email.toLowerCase())) throw new Error("BoldSign's intended signer does not match your account");
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await sb.from("boldsign_assignments").select("*").eq("member_id", member.id).eq("document_id", doc.id).maybeSingle();
    if (existing && (existing.boldsign_document_id !== id || existing.version_label !== doc.version_label)) throw new Error("Signing assignment changed; administrator review required");
    if (!existing) {
      const { error } = await sb.from("boldsign_assignments").insert({ member_id: member.id, document_id: doc.id, boldsign_document_id: id, signer_email: member.email.toLowerCase(), version_label: doc.version_label, entity: doc.journey_track ?? member.entity });
      if (error && error.code !== "23505") throw error;
    }
    const result = await (await boldSignGet(`getEmbeddedSignLink?documentId=${encodeURIComponent(id)}&signerEmail=${encodeURIComponent(member.email)}&redirectUrl=${encodeURIComponent("https://access.prscstandards.org/portal")}`)).json() as { signLink?: string };
    if (!result.signLink || !/^https:\/\/([a-z0-9-]+\.)*boldsign\.com\//i.test(result.signLink)) throw new Error("BoldSign did not provide an authorized signing link");
    return { url: result.signLink };
  });