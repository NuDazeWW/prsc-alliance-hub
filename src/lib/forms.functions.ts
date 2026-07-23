import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BriefingSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  organization: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  interaction: z.enum(["property", "demand", "channel", "ecosystem"]),
  message: z.string().trim().min(1).max(2000),
});

const BoardSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  organization: z.string().trim().min(1).max(160),
  linkedin_url: z.string().trim().url().max(300),
  email: z.string().trim().email().max(200),
  statement: z.string().trim().min(20).max(3000),
});

const VanguardSchema = z.object({
  name: z.string().trim().min(1).max(120),
  property: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(1).max(40),
});

const CertificationSchema = z.object({
  email: z.string().trim().email().max(200),
});

async function insertRow(table: "briefing_requests" | "board_interest" | "vanguard_interest" | "certification_interest", row: Record<string, unknown>) {
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
    const result = await insertRow("briefing_requests", data);
    await notify("New Briefing Request — PRSC", data);
    return result;
  });

export const submitBoardInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BoardSchema.parse(d))
  .handler(async ({ data }) => {
    const result = await insertRow("board_interest", data);
    await notify("New Board Interest — PRSC", data);
    return result;
  });

export const submitVanguardInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => VanguardSchema.parse(d))
  .handler(async ({ data }) => {
    const result = await insertRow("vanguard_interest", data);
    await notify("New Vanguard Application — PRSC", data);
    return result;
  });

export const submitCertificationInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CertificationSchema.parse(d))
  .handler(async ({ data }) => {
    const result = await insertRow("certification_interest", data);
    await notify("New Certification Notify Signup — PRSC", data);
    return result;
  });


