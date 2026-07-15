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
  if (error) {
    console.error(`[insertRow] ${table} failed:`, error);
    throw new Error("Something went wrong. Please try again.");
  }
  return { ok: true as const };
}

async function notify(subject: string, fields: Record<string, unknown>) {
  try {
    const { sendNotification } = await import("./sendgrid.server");
    await sendNotification(subject, fields);
  } catch (e) {
    console.error("[notify] failed", e);
  }
}

export const submitBriefing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BriefingSchema.parse(d))
  .handler(async ({ data }) => {
    const row = { ...data, message: data.message || null };
    const result = await insertRow("briefing_requests", row);
    await notify("New Briefing Request — PRSC", row);
    return result;
  });

export const submitBoardInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BoardSchema.parse(d))
  .handler(async ({ data }) => {
    const row = { ...data, linkedin_url: data.linkedin_url || null };
    const result = await insertRow("board_interest", row);
    await notify("New Board Interest — PRSC", row);
    return result;
  });

export const submitVanguardInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => VanguardSchema.parse(d))
  .handler(async ({ data }) => {
    const row = { ...data, phone: data.phone || null };
    const result = await insertRow("vanguard_interest", row);
    await notify("New Vanguard Application — PRSC", row);
    return result;
  });

