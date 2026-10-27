import { verifiedSigningState, type BoldSignProperties } from "./boldsign-records";

export async function boldSignGet(path: string): Promise<Response> {
  const key = process.env["BOLDSIGN_API_KEY"];
  if (!key) throw new Error("BoldSign is not configured");
  const response = await fetch(`https://api.boldsign.com/v1/document/${path}`, { headers: { "X-API-KEY": key }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`BoldSign request failed (${response.status})`);
  return response;
}

export async function boldSignPost(path: string, body: unknown): Promise<Response> {
  const key = process.env["BOLDSIGN_API_KEY"];
  if (!key) throw new Error("BoldSign is not configured");
  const response = await fetch(`https://api.boldsign.com/v1/${path}`, { method: "POST", headers: { "X-API-KEY": key, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`BoldSign request failed (${response.status})`);
  return response;
}

/** One sign-in-required notice per completed assignment to the designated administrator. No attachments. */
export async function notifyAdminOfCompletion(assignmentId: string) {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data: a } = await sb.from("boldsign_assignments").select("id, member_id, document_id, version_label, status, admin_notified_at").eq("id", assignmentId).maybeSingle();
  if (!a || a.status !== "completed" || a.admin_notified_at) return false;
  const [{ data: m }, { data: d }] = await Promise.all([
    sb.from("portal_members").select("first_name, last_name").eq("id", a.member_id).maybeSingle(),
    sb.from("portal_documents").select("title").eq("id", a.document_id).maybeSingle(),
  ]);
  const { sendPortalEmail } = await import("./portal-notify.server");
  const { SIGNING_NOTICE_ADMIN, signingNoticeKey } = await import("./signed-copy-policy");
  const ok = await sendPortalEmail(SIGNING_NOTICE_ADMIN, {
    subject: `Signed: ${d?.title ?? "Document"} · ${[m?.first_name, m?.last_name].filter(Boolean).join(" ")}`.trim(),
    eyebrow: "Signing complete",
    heading: "A BoldSign document was executed.",
    body: `Document: ${d?.title ?? ""} (${a.version_label})\nMember: ${[m?.first_name, m?.last_name].filter(Boolean).join(" ")}\n\nThe executed PDF and audit trail are retained privately. Sign in as the administrator to review them in the member's documents.`,
    ctaLabel: "Open Administrator Center", ctaUrl: "https://access.prscstandards.org/admin",
  }, "boldsign-completed-admin", signingNoticeKey(a.id));
  if (ok) await sb.from("boldsign_assignments").update({ admin_notified_at: new Date().toISOString() }).eq("id", a.id).is("admin_notified_at", null);
  return ok;
}

export async function reconcileBoldSign(documentId: string) {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data: assignments, error } = await sb.from("boldsign_assignments").select("*").eq("boldsign_document_id", documentId);
  if (error) throw error;
  if (!assignments?.length) return;
  const properties: BoldSignProperties = await (await boldSignGet(`properties?documentId=${encodeURIComponent(documentId)}`)).json();
  for (const a of assignments) {
    if (a.status === "completed") { await notifyAdminOfCompletion(a.id).catch(() => false); continue; }
    if (a.status === "preparing") continue;
    const [{ data: member }, { data: doc }] = await Promise.all([
      sb.from("portal_members").select("*").eq("id", a.member_id).maybeSingle(),
      sb.from("portal_documents").select("*").eq("id", a.document_id).maybeSingle(),
    ]);
    if (!member || member.status === "revoked" || !doc || doc.superseded_at || doc.member_id !== member.id || doc.version_label !== a.version_label || (doc.journey_track ?? member.entity) !== a.entity || member.email.toLowerCase() !== a.signer_email) continue;
    const { appliesTo } = await import("./portal.functions");
    if (!appliesTo(doc as import("./portal.functions").PortalDocumentRecord, member)) continue;
    const [{ data: allDocs }, { data: acks }, { data: releases }] = await Promise.all([
      sb.from("portal_documents").select("*"),
      sb.from("portal_document_acknowledgements").select("document_id").eq("member_id", member.id),
      sb.from("entity_onboarding_releases").select("entity").eq("member_id", member.id),
    ]);
    const { lockedDocumentIds } = await import("./journey");
    const applicable = ((allDocs ?? []) as import("./portal.functions").PortalDocumentRecord[]).filter(d => !d.superseded_at && appliesTo(d, member));
    if (lockedDocumentIds(applicable, new Set((acks ?? []).map(r => r.document_id)), member.entity, { forum: member.participates_in_forum !== false, released: { prsc: !!releases?.some(r => r.entity === "prsc"), dis: !!releases?.some(r => r.entity === "dis") } }).has(doc.id)) continue;
    const state = verifiedSigningState(properties, a.signer_email);
    if (state === "pending") continue;
    if (state === "signed") {
      const { error: updateError } = await sb.from("boldsign_assignments").update({ status: "signed", signer_completed_at: new Date().toISOString() }).eq("id", a.id).eq("status", "pending");
      if (updateError) throw updateError;
      continue;
    }
    // Both artifacts must be retained before the atomic completion transaction.
    const base = `${a.member_id}/boldsign/${a.id}`;
    for (const [api, name] of [["download", "executed"], ["downloadAuditLog", "audit"]] as const) {
      const file = await (await boldSignGet(`${api}?documentId=${encodeURIComponent(documentId)}`)).blob();
      if (file.size === 0) throw new Error("BoldSign completion evidence is empty");
      const { error: uploadError } = await sb.storage.from("member-documents").upload(`${base}/${name}.pdf`, file, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;
    }
    const { error: completeError } = await sb.rpc("complete_boldsign_assignment", { p_id: a.id, p_executed_path: `${base}/executed.pdf`, p_audit_path: `${base}/audit.pdf` });
    if (completeError) throw completeError;
    await notifyAdminOfCompletion(a.id).catch(() => false);
    // Completion is document-specific; appointment activation remains manual.
  }
}