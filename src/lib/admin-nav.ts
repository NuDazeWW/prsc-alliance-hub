import { useEffect, useRef, useState } from "react";

/** Tells every admin card that the address hash may have changed (the router changes it without a hashchange event). */
export function announceAdminNav() {
  if (typeof window === "undefined") return;
  window.setTimeout(() => window.dispatchEvent(new Event("admin-nav")), 80);
}

/**
 * Runs `onHit` (and scrolls to it) when the page address points at one of `ids`: on arrival, on a hash change,
 * and when an admin link is clicked on the same page. Lets the left bar open a folded card straight away.
 */
export function useAdminTarget(ids: string[], onHit: (id: string) => void) {
  const hit = useRef(onHit);
  hit.current = onHit;
  const key = ids.join("|");
  useEffect(() => {
    const check = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id || !ids.includes(id)) return;
      hit.current(id);
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 140);
    };
    const first = window.setTimeout(check, 200);
    window.addEventListener("admin-nav", check);
    window.addEventListener("hashchange", check);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("admin-nav", check);
      window.removeEventListener("hashchange", check);
    };
  }, [key]);
}

/**
 * Open/closed state for an admin panel. Panels start closed on every visit, and opening one closes the others
 * (panels that share a `group` stay open together). A panel can also be opened by name with openAdminCard(id).
 */
export function useAccordion(id: string, group: string = id, startOpen = false) {
  const [open, setOpen] = useState(startOpen);
  useEffect(() => {
    if (open) window.dispatchEvent(new CustomEvent("admin-card-open", { detail: group }));
  }, [open, group]);
  useEffect(() => {
    const closeOthers = (e: Event) => { if ((e as CustomEvent<string>).detail !== group) setOpen(false); };
    const openNamed = (e: Event) => { if ((e as CustomEvent<string>).detail === id) setOpen(true); };
    window.addEventListener("admin-card-open", closeOthers);
    window.addEventListener("admin-card-request", openNamed);
    return () => { window.removeEventListener("admin-card-open", closeOthers); window.removeEventListener("admin-card-request", openNamed); };
  }, [id, group]);
  return [open, setOpen] as const;
}

export function openAdminCard(id: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("admin-card-request", { detail: id }));
}
