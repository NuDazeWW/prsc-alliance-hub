// Deep links (emails, bookmarks) such as /portal#documents open the same Personal Documents
// experience as every in-app entry point. There is no second documents page.

export type DeepLinkPanel = "documents";

export function panelFromHash(hash: string | null | undefined): DeepLinkPanel | null {
  const clean = (hash ?? "").replace(/^#/, "").trim().toLowerCase();
  return clean === "documents" ? "documents" : null;
}
