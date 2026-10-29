import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import logo from "@/assets/prsc-logo-only.png.asset.json";
import { cn } from "@/lib/utils";

const links = [
  { to: "/the-standard", label: "The Standard" },
  { to: "/governance", label: "Governance" },
  { to: "/certification", label: "Certification" },
  { to: "/readiness-vanguard", label: "Vanguard" },
  { to: "/request-briefing", label: "Request a Briefing" },
] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const showWordmark = pathname !== "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-navy/95 backdrop-blur-md border-b border-gold/20"
            : "bg-navy/60 backdrop-blur-sm",
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center" aria-label="PRSC home">
            <img src={logo.url} alt="PRSC" className="h-8 w-auto md:hidden" />
            {showWordmark && (
              <span
                className="hidden md:block uppercase text-gold font-medium"
                style={{ fontSize: "11.5px", letterSpacing: "0.08em", lineHeight: 1.4 }}
              >
                <span className="block">Partnership Readiness</span>
                <span className="block">Standards Council</span>
              </span>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm text-ivory/85 hover:text-gold transition-colors tracking-wide pb-1 border-b-2 border-transparent"
                activeProps={{ className: "text-gold border-gold" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <button
            className="md:hidden text-ivory p-2 -mr-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-drawer"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[60] md:hidden transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        {/* backdrop */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
        />
        {/* drawer panel */}
        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={cn(
            "absolute right-0 top-0 h-full w-[85%] max-w-sm bg-navy border-l border-gold/20 shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gold/15">
            <img src={logo.url} alt="PRSC" className="h-8 w-auto" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-ivory p-2 -mr-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-6 py-6">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-3 text-lg text-ivory/90 hover:text-gold transition-colors border-b border-ivory/10"
                activeProps={{ className: "text-gold" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/request-briefing"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-sm bg-gold px-5 py-3 label-caps text-[0.75rem] text-navy tracking-wider hover:brightness-105 transition"
            >
              Request Briefing →
            </Link>
          </nav>
        </aside>
      </div>
    </>
  );
}
