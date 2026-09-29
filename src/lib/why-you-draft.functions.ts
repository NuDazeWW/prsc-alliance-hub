import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  first_name: z.string().trim().max(80),
  last_name: z.string().trim().max(80),
  organization: z.string().trim().max(180),
  title: z.string().trim().max(160),
  entity: z.enum(["prsc", "dis", "both"]),
  role: z.enum(["board_member", "advisor"]),
  linkedin_url: z.string().trim().max(300),
  background: z.string().trim().min(40, "Paste at least a few lines of their About or Experience text.").max(8000),
});

const ENTITY: Record<string, string> = {
  prsc: "the Partnership Readiness Standards Council (PRSC), an independent body that governs the PRSC Readiness Standard™ and PRSC Readiness Score™ for sponsorship and partnership readiness",
  dis: "Decision Intelligence Systems (DIS), a decision-intelligence company now entering investor prospecting",
  both: "both the Partnership Readiness Standards Council (PRSC), which governs the PRSC Readiness Standard™ for sponsorship and partnership readiness, and Decision Intelligence Systems (DIS), a decision-intelligence company now entering investor prospecting",
};

export const draftWhyYou = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!admin) throw new Error("Unauthorized");
    return generateDraft(data);
  });

// Builder-preview only: the preview is not signed in, so allow drafting only on preview/local hosts.
export const draftWhyYouPreview = createServerFn({ method: "POST" })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const host = new URL(getRequest().url).hostname;
    const ok = host === "localhost" || host === "127.0.0.1" || /(^|\.)id-preview--[^.]+\.lovable\.app$/.test(host) || host.endsWith(".lovableproject.com");
    if (!ok) throw new Error("Unauthorized");
    return generateDraft(data);
  });

async function generateDraft(data: z.infer<typeof schema>) {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI drafting is not configured.");

    const role = data.role === "board_member" ? "Board Member" : "Advisor";
    const instructions = `You write private, personal notes from Shirley Johnson, Founder, explaining to an invited ${role} why they were chosen. Write 90–140 words, second person ("you"), warm, confident, executive tone, no hype, no bullet points, no greeting or signature. Link specific details of their background to the work of ${ENTITY[data.entity]}. Use only facts present in the provided background; never invent employers, titles, or achievements. Return only the note.`;
    const input = `Candidate: ${data.first_name} ${data.last_name}\nTitle: ${data.title || "n/a"}\nOrganization: ${data.organization || "n/a"}\nLinkedIn: ${data.linkedin_url || "n/a"}\n\nBackground (from their LinkedIn About/Experience):\n${data.background}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      if (res.status === 402) throw new Error("AI credits are used up. Add credits in Settings → Plans & credits.");
      if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
      console.error("draftWhyYou failed", res.status, body.slice(0, 300));
      throw new Error("The draft could not be created. Please try again.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "response.output_text.delta") text += evt.delta ?? "";
            else if (evt.type === "response.refusal.delta") refused = true;
            else if (evt.type === "error" || evt.type === "response.failed") throw new Error("The draft could not be created. Please try again.");
          } catch (e) {
            if (e instanceof Error && e.message.startsWith("The draft")) throw e;
          }
        }
      }
    }
    if (refused || !text.trim()) throw new Error("The AI declined to write this draft. Please write it manually.");
    return { draft: text.trim().slice(0, 2000) };
  }
