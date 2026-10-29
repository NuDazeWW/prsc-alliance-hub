// Profile submission notifications: which emails a save produces, and how failures are contained.
// Pure planning so the "one meaningful submission → at most one of each" rule is testable.

export type ProfileEmailPlan = {
  template: "profile_submitted_admin_alert" | "profile_received";
  to: string;
  label: string;
  idempotencyKey: string;
  tokens: Record<string, string>;
};

export function planProfileEmails(i: {
  submit: boolean;
  alreadySubmitted: boolean;
  memberId: string;
  submittedAt: string;
  adminEmail: string;
  member: { email: string; first_name: string | null; last_name: string | null };
  roleLabel: string;
}): ProfileEmailPlan[] {
  // Autosaves and edits after submission never notify anyone.
  if (!i.submit || i.alreadySubmitted) return [];
  const submissionId = `${i.memberId}-${i.submittedAt}`;
  const name = `${i.member.first_name ?? ""} ${i.member.last_name ?? ""}`.trim() || i.member.email;
  return [
    {
      template: "profile_submitted_admin_alert",
      to: i.adminEmail,
      label: "profile-submitted-admin-alert",
      idempotencyKey: `profile-submitted-admin-${submissionId}`,
      // Minimal disclosure: name, time and reference only.
      tokens: {
        member_name: name,
        submitted_at: new Date(i.submittedAt).toUTCString(),
        submission_id: submissionId,
      },
    },
    {
      template: "profile_received",
      to: i.member.email,
      label: "profile-submitted-member-confirmation",
      idempotencyKey: `profile-submitted-member-${submissionId}`,
      tokens: { first_name: i.member.first_name?.trim() || "there", role: i.roleLabel },
    },
  ];
}

/** Sends each planned email through the shared helper; a failure is logged and never undoes the saved profile. */
export async function deliverProfileEmails(
  plan: ProfileEmailPlan[],
  deps: {
    load: (key: string) => Promise<(t: Record<string, string>) => any>;
    send: (to: string, email: any, label: string, key: string) => Promise<boolean>;
    log?: (msg: string, e: unknown) => void;
  },
) {
  const results: { template: string; ok: boolean }[] = [];
  for (const p of plan) {
    try {
      const build = await deps.load(p.template);
      results.push({
        template: p.template,
        ok: await deps.send(p.to, build(p.tokens), p.label, p.idempotencyKey),
      });
    } catch (e) {
      (deps.log ?? console.error)(`Profile email ${p.template} failed`, e);
      results.push({ template: p.template, ok: false });
    }
  }
  return results;
}
