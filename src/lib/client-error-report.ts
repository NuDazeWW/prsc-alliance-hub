import { logClientError } from "@/lib/client-error.functions";

const scrub = (s: string) => s.replace(/\?[^\s"')]*/g, "?…").replace(/[A-Za-z0-9_\-.]{40,}/g, "…").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "(email)").slice(0, 400);
const browser = () => {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const name = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  return `${name}${/Mobile|iPhone|Android/.test(ua) ? " mobile" : ""}`;
};

/** Fire-and-forget: records a failure the reader may never see, so the cause can be read later. */
export function reportClientError(error: unknown, stage: string, attempt = 0) {
  if (typeof window === "undefined") return;
  try {
    const message = scrub(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    void logClientError({ data: { message, path: window.location.pathname.slice(0, 200), stage, attempt, agent: browser() } }).catch(() => {});
  } catch { /* never throw from error reporting */ }
}
