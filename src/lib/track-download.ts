// Fires a "file_download" event to GTM (dataLayer) and GA4 (gtag) if loaded.
// Safe no-op during SSR or when analytics haven't loaded yet.
export function trackDownload(fileName: string, fileUrl: string, label?: string) {
  if (typeof window === "undefined") return;
  const payload = {
    event: "file_download",
    file_name: fileName,
    file_url: fileUrl,
    link_text: label ?? fileName,
    file_extension: fileName.split(".").pop()?.toLowerCase() ?? "",
  };
  try {
    const w = window as unknown as {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push(payload);
    if (typeof w.gtag === "function") {
      w.gtag("event", "file_download", payload);
    }
  } catch {
    // swallow — analytics must never break the download
  }
}
