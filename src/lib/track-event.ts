// Generic analytics event push to GTM (dataLayer) and GA4 (gtag) when loaded.
// Safe no-op during SSR or before analytics load.
export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...params });
    if (typeof w.gtag === "function") {
      w.gtag("event", event, params);
    }
  } catch {
    // swallow — analytics must never break the UI
  }
}
