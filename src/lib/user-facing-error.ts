type ValidationIssue = { path?: unknown[]; code?: unknown; validation?: unknown; message?: unknown };

function issuesFrom(error: unknown, depth = 0): ValidationIssue[] {
  if (depth > 3 || !error) return [];
  if (typeof error === "string") {
    try { return issuesFrom(JSON.parse(error), depth + 1); } catch { return []; }
  }
  if (Array.isArray(error)) return error.filter((issue) => issue && typeof issue === "object" && ("path" in issue || "code" in issue));
  if (typeof error !== "object") return [];
  const value = error as Record<string, unknown>;
  for (const key of ["issues", "errors", "message", "cause"]) {
    const issues = issuesFrom(value[key], depth + 1);
    if (issues.length) return issues;
  }
  return [];
}

/** Only render human-readable messages; Zod/server payloads must never reach a page. */
export function userFacingError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const issues = issuesFrom(error);
  if (issues.length) {
    const issue = issues[0];
    const path = issue.path ?? [];
    if (path.includes("preferred_email")) return "Please provide a valid email on Stage 01.";
    if (issue.validation === "email" || path.some((part) => typeof part === "string" && /email/i.test(part))) return "Please provide a valid email address.";
    if (path.includes("preferred_name")) return "Please check your preferred name on Stage 01.";
    if (path.includes("experience_answers")) return "Please review your selections on Stage 02 — Where You Fit.";
    if (path.includes("visibility_instructions") || path.includes("restriction_details")) return "Please review your profile and communication preferences on Stage 03.";
    return "Please check the information you entered and try again.";
  }
  const message = typeof error === "string" ? error : error && typeof error === "object" && "message" in error ? String(error.message ?? "") : "";
  const text = message.trim();
  if (!text || text.length > 500 || text.startsWith("[") || text.startsWith("{") || /"(?:code|path|validation|issues)"\s*:|ZodError|\n\s*at\s|SQLSTATE|invalid_(?:string|type)|violates .*constraint|relation .*does not exist/i.test(text)) return fallback;
  if (/^(?:unauthorized|forbidden|portal access unavailable|portal access has been revoked)$/i.test(text)) return "Your session cannot access this page. Please sign in again or contact the team.";
  return text;
}
