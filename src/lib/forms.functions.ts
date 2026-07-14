import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BriefingSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  organization: z.string().min(1).max(160),
  role: z.string().min(1).max(120),
  email: z.string().email().max(200),
  interaction: z.enum(["property", "demand", "channel", "ecosystem"]),
  message: z.string().max(2000).optional().or(z.literal("")),
});

const BoardSchema = z.object({
  name: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  organization: z.string().min(1).max(160),
  linkedin_url: z.string().url().max(300).optional().or(z.literal("")),
  email: z.string().email().max(200),
  statement: z.string().min(20).max(3000),
});

const VanguardSchema = z.object({
  name: z.string().min(1).max(120),
  property: z.string().min(1).max(160),
  role: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
});

async function insertRow(table: "briefing_requests" | "board_interest" | "vanguard_interest", row: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin.from(table) as any).insert(row);
  if (error) throw new Error(`Submission failed: ${error.message}`);
  return { ok: true as const };
}

export const submitBriefing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BriefingSchema.parse(d))
  .handler(async ({ data }) => insertRow("briefing_requests", { ...data, message: data.message || null }));

export const submitBoardInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BoardSchema.parse(d))
  .handler(async ({ data }) => insertRow("board_interest", { ...data, linkedin_url: data.linkedin_url || null }));

export const submitVanguardInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => VanguardSchema.parse(d))
  .handler(async ({ data }) => insertRow("vanguard_interest", { ...data, phone: data.phone || null }));
