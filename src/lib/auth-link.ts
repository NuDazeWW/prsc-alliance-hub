// Email security scanners (Outlook Safe Links, Gmail, corporate gateways) open every link in a
// message. Supabase's confirmation link is single-use, so a scanner "clicks" it first and the
// recipient then sees "expired or already used". We instead email a link to our own page that only
// continues to the real link when the person presses a button, which scanners never do.
const SITE = "https://access.prscstandards.org";

export function wrapAuthLink(url: string | null | undefined): string {
  if (!url || !/\/auth\/v1\/verify/.test(url)) return url ?? "";
  const encoded = Buffer.from(url, "utf8").toString("base64url");
  return `${SITE}/accept-invitation?go=${encoded}`;
}

export function unwrapAuthLink(go: string | null): string | null {
  if (!go) return null;
  try {
    const bin = atob(go.replace(/-/g, "+").replace(/_/g, "/"));
    const url = new URL(decodeURIComponent(escape(bin)));
    if (url.protocol !== "https:" || url.pathname !== "/auth/v1/verify") return null;
    if (!url.hostname.endsWith(".supabase.co")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
