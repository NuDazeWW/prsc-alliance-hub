import { createServerFn } from "@tanstack/react-start";
import { requirePortalAccess } from "@/lib/portal-access";
import {
  buildProfileBioPrompt,
  isAiDraftPreviewHost,
  profileBioDraftSchema,
  type ProfileBioInvitation,
} from "@/lib/profile-bio-draft";
import {
  generateWhyYouWithSource,
  whyYouDraftSchema,
  type WhyYouDraftInput,
} from "./why-you-draft";

export const draftWhyYou = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => whyYouDraftSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!admin) throw new Error("Unauthorized");
    return generateDraft(data);
  });

// Builder-preview only: the preview is not signed in, so allow drafting only on preview/local hosts.
export const draftWhyYouPreview = createServerFn({ method: "POST" })
  .inputValidator((input) => whyYouDraftSchema.parse(input))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const host = new URL(getRequest().url).hostname;
    if (!isAiDraftPreviewHost(host)) throw new Error("Unauthorized");
    return generateDraft(data);
  });

/** A member may draft only their own biography; generating never writes profile or invitation data. */
export const draftMyProfileBio = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => profileBioDraftSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: member, error } = await context.supabase
      .from("portal_members")
      .select("*")
      .eq("user_id", context.userId)
      .single();
    if (error || !member || member.status === "revoked")
      throw new Error("Member profile unavailable");
    return generateAiDraft(buildProfileBioPrompt(member as ProfileBioInvitation, data));
  });

/** Builder-preview QA has no member session and may use only the supplied profile facts. */
export const draftMyProfileBioPreview = createServerFn({ method: "POST" })
  .inputValidator((input) => profileBioDraftSchema.parse(input))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    if (!isAiDraftPreviewHost(new URL(getRequest().url).hostname)) throw new Error("Unauthorized");
    return generateAiDraft(buildProfileBioPrompt({ first_name: "", last_name: "" }, data));
  });

async function generateDraft(data: WhyYouDraftInput) {
  // Single and batch drafting share the existing AI gateway and administrator-supplied facts.
  return generateWhyYouWithSource(data, { generateDraft: generateAiDraft });
}

async function generateAiDraft({ instructions, input }: { instructions: string; input: string }) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI drafting is not configured.");

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
    if (res.status === 402)
      throw new Error("AI credits are used up. Add credits in Settings → Plans & credits.");
    if (res.status === 429)
      throw new Error("Too many requests right now. Please try again in a minute.");
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
          else if (evt.type === "error" || evt.type === "response.failed")
            throw new Error("The draft could not be created. Please try again.");
        } catch (e) {
          if (e instanceof Error && e.message.startsWith("The draft")) throw e;
        }
      }
    }
  }
  if (refused || !text.trim())
    throw new Error("The AI declined to write this draft. Please write it manually.");
  return { draft: text.trim().slice(0, 2000) };
}
