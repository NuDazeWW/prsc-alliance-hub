import { verifiedSigningState, type BoldSignProperties } from "./boldsign-records";

export async function boldSignGet(path: string): Promise<Response> {
  const key = process.env["BOLDSIGN_API_KEY"];
  if (!key) throw new Error("BoldSign is not configured");
  const response = await fetch(`https://api.boldsign.com/v1/document/${path}`, { headers: { "X-API-KEY": key }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`BoldSign request failed (${response.status})`);
  return response;
}

export async function reconcileBoldSign(documentId: string) {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data: assignments, error } = await sb.from("boldsign_assignments").select("*").eq("boldsign_document_id", documentId);
  if (error) throw error;
  if (!assignments?.length) return;
  const properties: BoldSignProperties = await (await boldSignGet(`properties?documentId=${encodeURIComponent(documentId)}`)).json();
  for (const a of assignments) {
    if (a.status === "completed") continue;
    const [{ data: member }, { data: doc }] = await Promise.all([
      sb.from("portal_members").select("*").eq("id", a.member_id).maybeSingle(),
      sb.from("portal_documents").select("*").eq("id", a.document_id).maybeSingle(),
    ]);
    if (!member || member.status === "revoked" || !doc || doc.superseded_at || doc.member_id !== member.id || doc.version_label !== a.version_label || (doc.journey_track ?? member.entity) !== a.entity || member.email.toLowerCase() !== a.signer_email) continue;
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
    // Completion is document-specific; appointment activation remains manual.
  }
}