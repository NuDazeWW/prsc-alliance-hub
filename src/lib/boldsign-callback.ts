import { z } from "zod";

export const boldSignPayload = z.object({
  event: z.object({ eventType: z.string().min(1).max(80) }).passthrough(),
  data: z
    .object({ documentId: z.string().min(1).max(120).optional() })
    .passthrough()
    .optional(),
});

/** The sole unsigned exception is a consistent, stateless URL verification. */
export function isBoldSignVerification(header: string | null, eventType: string): boolean {
  return header === "Verification" && eventType === "Verification";
}

export async function readBoldSignBody(request: Request): Promise<string | null> {
  const limit = 256 * 1024;
  if (Number(request.headers.get("content-length")) > limit) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
