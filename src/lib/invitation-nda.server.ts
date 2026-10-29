import {
  assertInvitationNdaEvidenceOwner,
  invitationNdaEligibilityProblem,
  invitationNdaRecipientName,
  invitationNdaSnapshot,
  invitationNdaSaveSchema,
  normalizedNdaReference,
  planInvitationNdaVerification,
  type InvitationNdaEvidence,
  type InvitationNdaMember,
} from "./invitation-nda";
import type { DbClient } from "@/lib/db-types";

const memberFields = "*";
export async function loadInvitationNda(client: DbClient, memberId: string) {
  const { data, error } = await client
    .from("portal_members")
    .select(memberFields)
    .eq("id", memberId)
    .single();
  if (error || !data)
    throw new Error(
      "This candidate’s NDA record could not be loaded. Please refresh the candidate list.",
    );
  const member = data as InvitationNdaMember;
  let evidence: InvitationNdaEvidence | null = null;
  const ownedEvidence = await client
    .from("invitation_nda_evidence")
    .select("*")
    .eq("recipient_email", member.email.trim().toLowerCase())
    .order("verified_at", { ascending: false });
  if (ownedEvidence.error)
    throw new Error("This candidate’s saved NDA evidence could not be loaded. Please try again.");
  const evidenceOptions = (ownedEvidence.data ?? []) as InvitationNdaEvidence[];
  const reference = normalizedNdaReference(member.nda_reference);
  if (reference) {
    const result = await client
      .from("invitation_nda_evidence")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    if (result.error)
      throw new Error("The saved NDA evidence could not be loaded. Please try again.");
    evidence = result.data as InvitationNdaEvidence | null;
  }
  const eligibilityProblem = invitationNdaEligibilityProblem(member, evidence);
  // A conflicting reference may explain ineligibility, but another recipient's proof must never populate this form.
  if (
    evidence &&
    evidence.recipient_email.trim().toLowerCase() !== member.email.trim().toLowerCase()
  )
    evidence = null;
  return { member, evidence, evidenceOptions, eligibilityProblem };
}

/** Persistence only: callers must authorize the administrator before supplying a service client. */
export async function saveReviewedInvitationNda(
  client: DbClient,
  adminId: string,
  input: unknown,
  reviewedAt = new Date(),
) {
  const data = invitationNdaSaveSchema.parse(input);
  const { member } = await loadInvitationNda(client, data.member_id);
  if (member.status === "revoked")
    throw new Error(
      "This candidate’s portal access has been revoked. NDA verification cannot be saved here.",
    );
  if (new Date(member.updated_at).getTime() !== new Date(data.expected_updated_at).getTime())
    throw new Error(
      "This candidate’s record changed. Reload their NDA details and review them again before saving.",
    );
  const reference = normalizedNdaReference(data.reference);
  const { data: evidenceRow, error: evidenceError } = await client
    .from("invitation_nda_evidence")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (evidenceError) throw new Error("The NDA evidence could not be checked. Please try again.");
  const evidence = evidenceRow as InvitationNdaEvidence | null;
  const escapedReference = reference.replace(/[\\%_]/g, "\\$&");
  const [otherMembers, oldReviews] = await Promise.all([
    client
      .from("portal_members")
      .select("id")
      .ilike("nda_reference", escapedReference)
      .neq("id", member.id),
    client
      .from("governance_reviews")
      .select("member_id")
      .eq("kind", "nda")
      .ilike("notes", escapedReference)
      .neq("member_id", member.id),
  ]);
  if (otherMembers.error || oldReviews.error)
    throw new Error("The recipient-specific NDA reference could not be checked. Please try again.");
  assertInvitationNdaEvidenceOwner(member, evidence, [
    ...(otherMembers.data ?? []).map((row: { id: string }) => row.id),
    ...(oldReviews.data ?? []).map((row: { member_id: string }) => row.member_id),
  ]);
  const now = reviewedAt.toISOString();
  const plan = planInvitationNdaVerification(
    member,
    data,
    adminId,
    now,
    Boolean(evidence && evidence.recipient_name !== invitationNdaRecipientName(member)),
    evidence,
  );
  const savedMember = { ...member, ...plan.patch };
  const details = {
    source: "invitation_nda_review",
    previous: invitationNdaSnapshot(member),
    saved: invitationNdaSnapshot(savedMember),
    proof_changed: plan.proofChanged,
    verification_preserved: plan.verificationPreserved,
    verification_source: plan.verificationSource,
    reviewed_at: now,
    evidence_previous: evidence,
    review_note: data.review_note ?? null,
  };
  // A durable audit precedes every correction; only a completed save becomes invitation-eligible.
  const { data: review, error: reviewError } = await client
    .from("governance_reviews")
    .insert({
      member_id: member.id,
      kind: "nda",
      decision: "reviewed",
      reviewer_id: adminId,
      notes: reference,
      details: JSON.parse(JSON.stringify(details)),
    })
    .select("id")
    .single();
  if (reviewError || !review)
    throw new Error("The NDA review could not be recorded. Nothing was saved; please try again.");
  try {
    if (
      evidence &&
      (evidence.recipient_name !== invitationNdaRecipientName(member) ||
        evidence.entities !== data.entities ||
        evidence.scope !== data.scope)
    ) {
      // The original binding keeps ownership: corrections may never change reference or recipient_email.
      const result = await client
        .from("invitation_nda_evidence")
        .update({
          recipient_name: invitationNdaRecipientName(member),
          entities: data.entities,
          scope: data.scope,
          reviewer_id: adminId,
          verified_at: now,
        })
        .eq("reference", reference)
        .eq("recipient_email", evidence.recipient_email)
        .eq("recipient_name", evidence.recipient_name)
        .eq("entities", evidence.entities)
        .eq("scope", evidence.scope)
        .eq("reviewer_id", evidence.reviewer_id)
        .eq("verified_at", evidence.verified_at)
        .select("reference")
        .maybeSingle();
      if (result.error || !result.data) throw new Error("evidence_changed");
    }
    // Reuse the established binding procedure; its cross-recipient safeguards remain unchanged.
    const binding = await client.rpc("bind_invitation_nda", {
      p_reference: reference,
      p_email: member.email,
      p_name: invitationNdaRecipientName(member),
      p_entities: data.entities,
      p_scope: data.scope,
      p_reviewer: adminId,
    });
    if (binding.error) throw new Error("binding_failed");
    const update = await client
      .from("portal_members")
      .update({ ...plan.patch, updated_at: now })
      .eq("id", member.id)
      .eq("updated_at", data.expected_updated_at)
      .eq("email", member.email)
      .eq("first_name", member.first_name)
      .eq("last_name", member.last_name)
      .select("id")
      .maybeSingle();
    if (update.error || !update.data) throw new Error("member_changed");
    const audited = await client
      .from("governance_reviews")
      .update({ decision: "verified" })
      .eq("id", review.id);
    if (audited.error) throw new Error("audit_failed");
    const activity = await client.from("portal_activity").insert({
      member_id: member.id,
      actor_user_id: adminId,
      event_type: "governance_nda",
      metadata: {
        decision: "verified",
        source: "invitation_nda_review",
        review_id: review.id,
        proof_changed: plan.proofChanged,
        verification_preserved: plan.verificationPreserved,
      },
    });
    if (activity.error) throw new Error("activity_failed");
    return {
      ...(await loadInvitationNda(client, member.id)),
      reviewId: review.id,
      proofChanged: plan.proofChanged,
      verificationPreserved: plan.verificationPreserved,
    };
  } catch {
    await client
      .from("governance_reviews")
      .update({ decision: "save_incomplete" })
      .eq("id", review.id);
    throw new Error(
      "The NDA review could not be completed. Reload this candidate’s saved details and review again. No invitation was sent.",
    );
  }
}
