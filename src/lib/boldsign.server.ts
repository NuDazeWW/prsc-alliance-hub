import {
  countersignatureVerified,
  verifiedSigningState,
  type BoldSignProperties,
} from "./boldsign-records";

/**
 * A failed BoldSign call keeps the same short message for the member, but the response body BoldSign
 * sent back is logged on the server with the endpoint name. Previously the body was discarded, so an
 * HTTP 400 could not be traced to the request stage that produced it.
 */
async function boldSignFailure(path: string, response: Response): Promise<Error> {
  const stage = path.split("?")[0];
  let detail = "";
  try {
    detail = (await response.text()).replace(/\s+/g, " ").slice(0, 300);
  } catch {
    /* body unavailable */
  }
  console.error("boldsign.api_error", JSON.stringify({ stage, status: response.status, detail }));
  return Object.assign(new Error(`BoldSign request failed (${response.status})`), {
    boldsignStage: stage,
    boldsignStatus: response.status,
  });
}

export async function boldSignGet(path: string): Promise<Response> {
  const key = process.env["BOLDSIGN_API_KEY"];
  if (!key) throw new Error("BoldSign is not configured");
  const response = await fetch(`https://api.boldsign.com/v1/document/${path}`, {
    headers: { "X-API-KEY": key },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw await boldSignFailure(`document/${path}`, response);
  return response;
}

export async function boldSignPost(path: string, body: unknown): Promise<Response> {
  const key = process.env["BOLDSIGN_API_KEY"];
  if (!key) throw new Error("BoldSign is not configured");
  const response = await fetch(`https://api.boldsign.com/v1/${path}`, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw await boldSignFailure(path, response);
  return response;
}

/** One sign-in-required notice per completed assignment to the designated administrator. No attachments. */
export async function notifyAdminOfCompletion(assignmentId: string) {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data: a } = await sb
    .from("boldsign_assignments")
    .select("id, member_id, document_id, version_label, status, admin_notified_at")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!a || a.status !== "completed" || a.admin_notified_at) return false;
  const [{ data: m }, { data: d }] = await Promise.all([
    sb.from("portal_members").select("first_name, last_name").eq("id", a.member_id).maybeSingle(),
    sb.from("portal_documents").select("title").eq("id", a.document_id).maybeSingle(),
  ]);
  const { sendPortalEmail } = await import("./portal-notify.server");
  const { SIGNING_NOTICE_ADMIN, signingNoticeKey } = await import("./signed-copy-policy");
  const ok = await sendPortalEmail(
    SIGNING_NOTICE_ADMIN,
    {
      subject:
        `Signed: ${d?.title ?? "Document"} · ${[m?.first_name, m?.last_name].filter(Boolean).join(" ")}`.trim(),
      eyebrow: "Signing complete",
      heading: "A BoldSign document was executed.",
      body: `Document: ${d?.title ?? ""} (${a.version_label})\nMember: ${[m?.first_name, m?.last_name].filter(Boolean).join(" ")}\n\nThe executed PDF and audit trail are retained privately. Sign in as the administrator to review them in the member's documents.`,
      ctaLabel: "Open Administrator Center",
      ctaUrl: "https://access.prscstandards.org/admin",
    },
    "boldsign-completed-admin",
    signingNoticeKey(a.id),
  );
  if (ok)
    await sb
      .from("boldsign_assignments")
      .update({ admin_notified_at: new Date().toISOString() })
      .eq("id", a.id)
      .is("admin_notified_at", null);
  return ok;
}

export type ReconcileOutcome = { assignmentId: string; outcome: string };

/**
 * Re-checks one BoldSign document against BoldSign itself and completes only exact, verified assignments.
 * Every assignment gets a logged outcome, including the reason it was left unchanged, so a document that is
 * signed in BoldSign but not complete in the portal can be explained from the logs.
 */
export async function reconcileBoldSign(documentId: string): Promise<ReconcileOutcome[]> {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data: assignments, error } = await sb
    .from("boldsign_assignments")
    .select("*")
    .eq("boldsign_document_id", documentId);
  if (error) throw error;
  const outcomes: ReconcileOutcome[] = [];
  const record = (assignmentId: string, outcome: string) => {
    outcomes.push({ assignmentId, outcome });
    console.info("boldsign.reconcile", JSON.stringify({ assignmentId, outcome }));
  };
  if (!assignments?.length) {
    console.info("boldsign.reconcile", JSON.stringify({ outcome: "no_matching_assignment" }));
    return outcomes;
  }
  const properties: BoldSignProperties = await (
    await boldSignGet(`properties?documentId=${encodeURIComponent(documentId)}`)
  ).json();
  for (const a of assignments) {
    if (a.status === "completed") {
      await notifyAdminOfCompletion(a.id).catch(() => false);
      await recordCountersignature(sb, a, properties);
      record(a.id, "already_completed");
      continue;
    }
    if (a.status === "preparing") {
      record(a.id, "preparing");
      continue;
    }
    const [{ data: member }, { data: doc }] = await Promise.all([
      sb.from("portal_members").select("*").eq("id", a.member_id).maybeSingle(),
      sb.from("portal_documents").select("*").eq("id", a.document_id).maybeSingle(),
    ]);
    // Exact binding: member, document, version, entity and signer email must all still match the assignment.
    // A shared document (no member_id) is bound through the assignment row itself, exactly as openBoldSign creates it.
    const skip =
      !member || member.status === "revoked"
        ? "skipped:member_unavailable"
        : !doc || doc.superseded_at
          ? "skipped:document_unavailable"
          : doc.member_id && doc.member_id !== member.id
            ? "skipped:document_assigned_to_another_member"
            : doc.version_label !== a.version_label
              ? "skipped:version_changed"
              : (doc.journey_track ?? member.entity) !== a.entity
                ? "skipped:entity_changed"
                : member.email.toLowerCase() !== a.signer_email
                  ? "skipped:signer_email_changed"
                  : null;
    if (skip || !member || !doc) {
      record(a.id, skip ?? "skipped:unknown");
      continue;
    }
    const { appliesTo } = await import("./portal.functions");
    if (!appliesTo(doc as import("./portal.functions").PortalDocumentRecord, member)) {
      record(a.id, "skipped:document_not_applicable");
      continue;
    }
    const [{ data: allDocs }, { data: acks }, { data: releases }] = await Promise.all([
      sb.from("portal_documents").select("*"),
      sb.from("portal_document_acknowledgements").select("document_id").eq("member_id", member.id),
      sb.from("entity_onboarding_releases").select("entity").eq("member_id", member.id),
    ]);
    const { lockedDocumentIds } = await import("./journey");
    const applicable = (
      (allDocs ?? []) as import("./portal.functions").PortalDocumentRecord[]
    ).filter((d) => !d.superseded_at && appliesTo(d, member));
    if (
      lockedDocumentIds(
        applicable,
        new Set((acks ?? []).map((r) => r.document_id)),
        member.entity,
        {
          forum: member.participates_in_forum !== false,
          released: {
            prsc: !!releases?.some((r) => r.entity === "prsc"),
            dis: !!releases?.some((r) => r.entity === "dis"),
          },
        },
      ).has(doc.id)
    ) {
      record(a.id, "skipped:prior_required_action_incomplete");
      continue;
    }
    const state = verifiedSigningState(properties, a.signer_email);
    if (state === "pending") {
      record(a.id, "pending:signer_has_not_completed");
      continue;
    }
    if (state === "signed") {
      // The member has signed, but BoldSign has not completed the whole document (for example, a required
      // countersignature is outstanding). It is NOT complete in the portal until BoldSign says so.
      const { error: updateError } = await sb
        .from("boldsign_assignments")
        .update({ status: "signed", signer_completed_at: new Date().toISOString() })
        .eq("id", a.id)
        .eq("status", "pending");
      if (updateError) throw updateError;
      record(a.id, "signed_awaiting_completion");
      continue;
    }
    // Both artifacts must be retained before the atomic completion transaction.
    const base = `${a.member_id}/boldsign/${a.id}`;
    for (const [api, name] of [
      ["download", "executed"],
      ["downloadAuditLog", "audit"],
    ] as const) {
      const file = await (
        await boldSignGet(`${api}?documentId=${encodeURIComponent(documentId)}`)
      ).blob();
      if (file.size === 0) throw new Error("BoldSign completion evidence is empty");
      const { error: uploadError } = await sb.storage
        .from("member-documents")
        .upload(`${base}/${name}.pdf`, file, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;
    }
    const { error: completeError } = await sb.rpc("complete_boldsign_assignment", {
      p_id: a.id,
      p_executed_path: `${base}/executed.pdf`,
      p_audit_path: `${base}/audit.pdf`,
    });
    if (completeError) throw completeError;
    await recordCountersignature(sb, a, properties, doc);
    await notifyAdminOfCompletion(a.id).catch(() => false);
    record(a.id, "completed");
    // Completion is document-specific; appointment activation remains manual.
  }
  return outcomes;
}

/**
 * A countersignature is recorded only when BoldSign reports every signer finished on a completed document and
 * the document is flagged as requiring one. Nothing else ever sets countersigned_at, so a flagged Addendum could
 * otherwise never satisfy its gate even after BoldSign completed it.
 */
async function recordCountersignature(
  sb: any,
  a: { id: string; document_id: string; signer_email: string; countersigned_at?: string | null },
  properties: BoldSignProperties,
  knownDoc?: { countersignature_required?: boolean | null },
) {
  if (a.countersigned_at) return;
  const doc =
    knownDoc ??
    (
      await sb
        .from("portal_documents")
        .select("countersignature_required")
        .eq("id", a.document_id)
        .maybeSingle()
    ).data;
  if (!doc?.countersignature_required || !countersignatureVerified(properties, a.signer_email))
    return;
  await sb
    .from("boldsign_assignments")
    .update({ countersigned_at: new Date().toISOString() })
    .eq("id", a.id)
    .is("countersigned_at", null);
}

/**
 * Member-initiated status refresh for their own assignment. It re-verifies with BoldSign and never trusts the
 * browser, so it only ever moves an assignment forward when BoldSign itself confirms it. It never creates a request.
 */
export async function refreshMemberSigning(
  memberId: string,
  documentId: string,
): Promise<{ status: string | null }> {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data: a } = await sb
    .from("boldsign_assignments")
    .select("id, boldsign_document_id, status")
    .eq("member_id", memberId)
    .eq("document_id", documentId)
    .maybeSingle();
  if (!a) return { status: null };
  if (a.status === "preparing" || a.boldsign_document_id.startsWith("preparing:"))
    return { status: a.status };
  await reconcileBoldSign(a.boldsign_document_id);
  const { data: after } = await sb
    .from("boldsign_assignments")
    .select("status")
    .eq("id", a.id)
    .maybeSingle();
  return { status: after?.status ?? a.status };
}
