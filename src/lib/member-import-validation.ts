import { z } from "zod";

/** Saving a roster does not require the invitation note to be ready. */
export const importWhyYouSchema = z.preprocess(
  (value) => value === null || value === undefined ? "" : value,
  z.string().trim().max(2000, "Keep the Why you note to 2,000 characters."),
);

/** Every invitation still needs a reviewed, substantive note before delivery. */
export const invitationWhyYouSchema = z.string().trim()
  .min(20, "Review and complete the Why you note before sending an invitation (at least 20 characters).")
  .max(2000, "Keep the Why you note to 2,000 characters.");

function normalizeLinkedinSource(value: string): string | null {
  if (!value) return null;
  if (Array.from(value).some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127 || character === "\\")) throw new Error("Use a public HTTPS LinkedIn profile URL.");
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error("Use a public HTTPS LinkedIn profile URL."); }
  const host = /^(?:(?:www|[a-z]{2})\.)?linkedin\.com$/i.test(parsed.hostname);
  const path = /^\/in\/[A-Za-z0-9._%~-]+\/?$/.test(parsed.pathname)
    || /^\/pub\/[A-Za-z0-9._%~-]+(?:\/[A-Za-z0-9._%~-]+)*\/?$/.test(parsed.pathname);
  if (parsed.protocol !== "https:" || !host || !path || parsed.username || parsed.password || parsed.port) {
    throw new Error("Use a public HTTPS LinkedIn /in/ or /pub/ profile URL.");
  }
  const normalized = parsed.toString();
  if (normalized.length > 300) throw new Error("Keep the LinkedIn profile URL to 300 characters.");
  return normalized;
}

export const linkedinSourceUrlSchema = z.preprocess(
  (value) => value === null || value === undefined ? "" : value,
  z.string().trim().max(300, "Keep the LinkedIn profile URL to 300 characters.").transform((value, context) => {
    try { return normalizeLinkedinSource(value); }
    catch (error) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: (error as Error).message });
      return z.NEVER;
    }
  }),
);

/** Background is a transient administrator-supplied fallback, never an imported NDA or role assertion. */
export const rosterProfileSourceSchema = z.object({
  linkedin_url: linkedinSourceUrlSchema,
  background: z.string().trim().max(8000).default(""),
}).strict();

export const saveMemberInvitationNotesSchema = z.object({
  member_id: z.string().uuid(),
  expected_updated_at: z.string().datetime({ offset: true }),
  why_you: importWhyYouSchema,
  linkedin_url: linkedinSourceUrlSchema,
}).strict();

export type MemberInvitationNotesInput = z.infer<typeof saveMemberInvitationNotesSchema>;

export function invitationNoteReady(whyYou: unknown): boolean {
  return invitationWhyYouSchema.safeParse(whyYou).success;
}
