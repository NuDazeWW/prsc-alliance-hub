import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public on purpose: a first-load failure can happen before anyone is signed in. It stores only a short,
 * scrubbed message, the page path and the browser name, never tokens, addresses or form contents.
 */
export const logClientError = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({
    message: z.string().max(400),
    path: z.string().max(200),
    stage: z.string().max(60),
    attempt: z.number().int().min(0).max(20).optional(),
    agent: z.string().max(200).optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const since = new Date(Date.now() - 10 * 60_000).toISOString();
      const { count } = await supabaseAdmin.from("portal_activity").select("id", { count: "exact", head: true }).eq("event_type", "client_error").gte("created_at", since);
      if ((count ?? 0) >= 60) return { ok: true as const };
      await supabaseAdmin.from("portal_activity").insert({ event_type: "client_error", metadata: data });
    } catch { /* logging must never cause a second failure */ }
    return { ok: true as const };
  });
