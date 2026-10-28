import { z } from "zod";
import { intendedDesignationSchema } from "./intended-designation";
import { importWhyYouSchema, invitationWhyYouSchema, linkedinSourceUrlSchema } from "./member-import-validation";

export const portalRoleSchema = z.enum(["board_member", "advisor", "prsc_board_dis_advisor", "prsc_advisor_dis_board", "methodology_committee"]);
export const portalEntitySchema = z.enum(["prsc", "dis", "both"]);

/** Delivery input remains stricter than an unfinished roster record. NDA eligibility is checked separately on the server. */
export const invitePortalMemberSchema = z.object({
  email: z.string().trim().email().max(200), first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80), organization: z.string().trim().max(180).default(""),
  title: z.string().trim().max(160).default(""), entity: portalEntitySchema, role: portalRoleSchema,
  why_you: invitationWhyYouSchema,
  linkedin_url: linkedinSourceUrlSchema.optional(),
  is_methodology_committee: z.boolean().optional(), participates_in_forum: z.boolean().optional(), is_candidate: z.boolean().optional(),
  intended_designation: intendedDesignationSchema.optional(), poll_id: z.string().uuid().nullable().optional(),
  nda_confirmed: z.boolean().optional(), nda_recipient_email: z.string().trim().email().max(200).optional(),
  nda_reference: z.string().trim().max(400).optional(), nda_entities: portalEntitySchema.optional(), nda_scope: z.string().trim().max(600).optional(),
  selected_member_id: z.string().uuid().optional(), nda_review_id: z.string().uuid().optional(),
  role_review: z.object({
    decision: z.literal("approved"), notes: z.string().trim().min(5).max(2000),
    prsc_scope: z.string().trim().min(3).max(1000), dis_scope: z.string().trim().min(3).max(1000), conflict_controls: z.string().trim().min(3).max(1000),
  }).optional(),
});

export const importPortalMembersSchema = z.object({
  send_invitations: z.boolean(),
  rows: z.array(invitePortalMemberSchema.omit({ selected_member_id: true, nda_review_id: true }).extend({
    why_you: importWhyYouSchema, linkedin_url: linkedinSourceUrlSchema,
  }).strict()).min(1).max(200),
}).superRefine((input, context) => {
  if (!input.send_invitations) return;
  input.rows.forEach((row, index) => {
    if (!invitationWhyYouSchema.safeParse(row.why_you).success) context.addIssue({
      code: z.ZodIssueCode.custom, path: ["rows", index, "why_you"],
      message: `${row.email}: finish and review the Why You note before sending an invitation.`,
    });
  });
});
