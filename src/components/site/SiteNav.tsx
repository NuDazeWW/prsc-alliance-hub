import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import logo from "@/assets/prsc-logo-only.png.asset.json";
import { cn } from "@/lib/utils";

const links = [
  { to: "/the-standard", label: "The Standard" },
  { to: "/governance", label: "Governance" },
  { to: "/readiness-vanguard", label: "Readiness Vanguard" },
];

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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-navy/95 backdrop-blur-md border-b border-gold/20" : "bg-navy/60 backdrop-blur-sm",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center">
          <img src={logo.url} alt="PRSC" className="h-8 w-auto md:hidden" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-ivory/85 hover:text-gold transition-colors tracking-wide"
              activeProps={{ className: "text-gold" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          className="md:hidden text-ivory p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-gold/20 bg-navy/98 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-ivory/85" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link
            to="/request-briefing"
            className="text-gold label-caps"
            onClick={() => setOpen(false)}
          >
            Request Briefing →
          </Link>
        </div>
      )}
    </header>
  );
}
