import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "./portal-access";
import type { PortalDocumentRecord } from "./portal.functions";

/**
 * Review and Sign: starts or safely resumes the member's single embedded BoldSign session.
 * Requests are prepared from the admin-approved template only, with BoldSign emails disabled.
 */
export const openBoldSign = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) =>
    z
      .object({
        document_id: z.string().uuid(),
        disclosures: z
          .object({
            conflict_answer: z.enum(["none", "changed", "unsure"]),
            conflict_details: z.string().trim().max(4000),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: member } = await context.supabase
      .from("portal_members")
      .select("*")
      .eq("user_id", context.userId)
      .single();
    if (!member || member.status === "revoked") throw new Error("Portal access unavailable");
    const { data: doc } = await context.supabase
      .from("portal_documents")
      .select("*")
      .eq("id", data.document_id)
      .maybeSingle();
    if (!doc || (doc.member_id && doc.member_id !== member.id))
      throw new Error("Document unavailable");
    const { data: all } = await context.supabase.from("portal_documents").select("*");
    const { data: acks } = await context.supabase
      .from("portal_document_acknowledgements")
      .select("document_id")
      .eq("member_id", member.id);
    const { data: releases } = await context.supabase
      .from("entity_onboarding_releases")
      .select("entity")
      .eq("member_id", member.id);
    const { lockedDocumentIds } = await import("./journey");
    const { appliesTo } = await import("./portal.functions");
    if (!appliesTo(doc as PortalDocumentRecord, member)) throw new Error("Document unavailable");
    const applicable = ((all ?? []) as PortalDocumentRecord[]).filter(
      (d) => !d.superseded_at && appliesTo(d, member),
    );
    if (
      lockedDocumentIds(
        applicable,
        new Set((acks ?? []).map((a) => a.document_id)),
        member.entity,
        {
          forum: member.participates_in_forum !== false,
          released: {
            prsc: !!releases?.some((r) => r.entity === "prsc"),
            dis: !!releases?.some((r) => r.entity === "dis"),
          },
        },
      ).has(doc.id)
    )
      throw new Error("Complete the applicable earlier documents and await entity release");

    const { signingAction, disclosureHash, canonicalDisclosures, CONFLICT_LABELS } =
      await import("./signing-preparation");
    const isConflict = doc.forum_role === "conflict";
    if (isConflict && !data.disclosures)
      throw new Error("Complete your conflict / recusal answers before signing");
    if (
      isConflict &&
      data.disclosures &&
      data.disclosures.conflict_answer !== "none" &&
      data.disclosures.conflict_details.length < 3
    )
      throw new Error("Describe the conflict or question before signing");
    const hash = isConflict && data.disclosures ? await disclosureHash(data.disclosures) : null;

    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await sb
      .from("boldsign_assignments")
      .select("*")
      .eq("member_id", member.id)
      .eq("document_id", doc.id)
      .maybeSingle();
    const action = signingAction(doc, existing, member.email, hash);
    if (action.kind === "block") throw new Error(action.reason);

    const { boldSignGet, boldSignPost } = await import("./boldsign.server");
    let id: string;
    if (action.kind === "resume") {
      id = existing!.boldsign_document_id;
      // A document that is already signed cannot be opened for signing again: BoldSign refuses the sign link with
      // HTTP 400. Refresh the verified state from BoldSign instead and tell the member where it stands.
      if (existing!.status === "completed") return { url: null, state: "completed" as const };
      const { verifiedSigningState } = await import("./boldsign-records");
      const props = await (
        await boldSignGet(`properties?documentId=${encodeURIComponent(id)}`)
      ).json();
      if (verifiedSigningState(props, member.email) !== "pending") {
        const { refreshMemberSigning } = await import("./boldsign.server");
        const refreshed = await refreshMemberSigning(member.id, doc.id);
        return {
          url: null,
          state:
            refreshed.status === "completed"
              ? ("completed" as const)
              : ("signed_awaiting" as const),
        };
      }
    } else if (action.kind === "start") {
      // Claim the single assignment first so concurrent clicks cannot create duplicate requests.
      const claim = `preparing:${crypto.randomUUID()}`;
      const { data: row, error: claimError } = await sb
        .from("boldsign_assignments")
        .insert({
          member_id: member.id,
          document_id: doc.id,
          boldsign_document_id: claim,
          signer_email: member.email.toLowerCase(),
          version_label: doc.version_label!,
          entity: doc.journey_track ?? member.entity,
          status: "preparing",
          disclosure_snapshot: isConflict
            ? JSON.parse(canonicalDisclosures(data.disclosures!))
            : null,
          disclosure_hash: hash,
        })
        .select("id")
        .single();
      if (claimError?.code === "23505")
        throw new Error("Your signing session is being prepared. Please try again in a moment");
      if (claimError || !row) throw claimError ?? new Error("Could not prepare signing");
      try {
        const signerName =
          [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || member.email;
        // Frozen disclosures are merged into the document itself before signing.
        const prefill =
          isConflict && data.disclosures
            ? [
                { id: "conflict_answer", value: CONFLICT_LABELS[data.disclosures.conflict_answer] },
                { id: "conflict_details", value: data.disclosures.conflict_details || "None" },
                { id: "disclosure_reference", value: hash! },
              ]
            : [];
        const sent = (await (
          await boldSignPost(
            `template/send?templateId=${encodeURIComponent(doc.boldsign_template_id!)}`,
            {
              title: `${doc.title} (${doc.version_label})`,
              disableEmails: true,
              roles: [
                {
                  roleIndex: 1,
                  signerName,
                  signerEmail: member.email,
                  ...(prefill.length ? { existingFormFields: prefill } : {}),
                },
              ],
            },
          )
        ).json()) as { documentId?: string };
        if (!sent.documentId) throw new Error("BoldSign did not return a document");
        id = sent.documentId;
        const { error: upd } = await sb
          .from("boldsign_assignments")
          .update({ boldsign_document_id: id, status: "pending" })
          .eq("id", row.id)
          .eq("status", "preparing");
        if (upd) throw upd;
      } catch (e) {
        await sb.from("boldsign_assignments").delete().eq("id", row.id).eq("status", "preparing");
        throw e;
      }
      await sb.from("portal_activity").insert({
        member_id: member.id,
        actor_user_id: context.userId,
        event_type: "boldsign_prepared",
        metadata: { document_id: doc.id, version: doc.version_label, disclosure_hash: hash },
      });
    } else {
      // Manual path: admin-recorded BoldSign documentId on the assignment link.
      const { boldSignDocumentId } = await import("./boldsign-records");
      const manualId = boldSignDocumentId(doc.external_url);
      if (!manualId || !doc.version_label || doc.member_id !== member.id)
        throw new Error("This document is not yet approved for signing");
      const properties = (await (
        await boldSignGet(`properties?documentId=${encodeURIComponent(manualId)}`)
      ).json()) as { signerDetails?: { signerEmail?: string }[] };
      if (
        !properties.signerDetails?.some(
          (s) => s.signerEmail?.toLowerCase() === member.email.toLowerCase(),
        )
      )
        throw new Error("BoldSign's intended signer does not match your account");
      const { error } = await sb.from("boldsign_assignments").insert({
        member_id: member.id,
        document_id: doc.id,
        boldsign_document_id: manualId,
        signer_email: member.email.toLowerCase(),
        version_label: doc.version_label,
        entity: doc.journey_track ?? member.entity,
      });
      if (error && error.code !== "23505") throw error;
      id = manualId;
    }
    const result = (await (
      await boldSignGet(
        `getEmbeddedSignLink?documentId=${encodeURIComponent(id)}&signerEmail=${encodeURIComponent(member.email)}&redirectUrl=${encodeURIComponent("https://access.prscstandards.org/portal")}`,
      )
    ).json()) as { signLink?: string };
    if (!result.signLink || !/^https:\/\/([a-z0-9-]+\.)*boldsign\.com\//i.test(result.signLink))
      throw new Error("BoldSign did not provide an authorized signing link");
    return { url: result.signLink, state: "ready" as const };
  });

/**
 * Refreshes the member's own signing status from BoldSign (never from the browser) so a completed signature
 * shows up without waiting for the webhook. Creates nothing and only advances what BoldSign confirms.
 */
export const refreshBoldSignStatus = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => z.object({ document_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: member } = await context.supabase
      .from("portal_members")
      .select("id, status")
      .eq("user_id", context.userId)
      .single();
    if (!member || member.status === "revoked") throw new Error("Portal access unavailable");
    const { refreshMemberSigning } = await import("./boldsign.server");
    const { signingUiState } = await import("./boldsign-records");
    const result = await refreshMemberSigning(member.id, data.document_id);
    return { state: signingUiState(result.status) };
  });
