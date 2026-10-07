import { z } from "zod";

const inviteReviewSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().min(1).max(180),
  title: z.string().trim().min(1).max(160),
  entity: z.enum(["prsc", "dis", "both"]),
  role: z.enum(["board_member", "advisor", "prsc_board_dis_advisor", "prsc_advisor_dis_board"]),
  why_you: z.string().trim().min(20).max(2000),
});

export type InviteEmailReview = z.infer<typeof inviteReviewSchema>;
