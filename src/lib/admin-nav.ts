import { useEffect, useRef } from "react";

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
