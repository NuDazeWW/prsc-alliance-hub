import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrscMark } from "@/components/site/PrscMark";

type NavItem = { label: string; href: string };

export function PortalShell({
  children,
  admin = false,
  nav = [],
  memberName,
}: {
  children: React.ReactNode;
  admin?: boolean;
  nav?: NavItem[];
  memberName?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: "/portal", mode: undefined }, replace: true });
  }
  return (
    <div className="flex min-h-screen flex-col bg-navy text-ivory">
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex h-[86px] max-w-[1440px] items-center gap-6 px-5 lg:px-10">
          <a href={admin ? "/admin" : "/portal"} aria-label="Private center home" className="shrink-0">
            <PrscMark className="h-11 w-auto object-contain" />
          </a>
          <nav className="hidden flex-1 items-center justify-center gap-9 lg:flex">
            {nav.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative py-2 text-[15px] transition-colors hover:text-gold ${i === 0 ? "text-gold" : "text-ivory/75"}`}
              >
                {item.label}
                {i === 0 && <span className="absolute -bottom-[9px] left-0 h-px w-full bg-gold" />}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 lg:ml-0">
            <span className="hidden h-8 w-px bg-gold/20 lg:block" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-3 text-[15px] text-ivory/85 transition-colors hover:text-gold"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/40">
                  <User className="h-4 w-4 text-gold" />
                </span>
                <span className="hidden sm:inline">Welcome{memberName ? `, ${memberName}` : ""}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {open && (
                <div className="absolute right-0 top-12 w-52 border border-gold/25 bg-navy-deep p-2 shadow-xl">
                  <Link
                    to="/portal/profile"
                    className="block px-3 py-2 text-sm text-ivory/75 hover:bg-ivory/5 hover:text-gold"
                    onClick={() => setOpen(false)}
                  >
                    Private profile
                  </Link>
                  <Link
                    to="/portal/questions"
                    className="block px-3 py-2 text-sm text-ivory/75 hover:bg-ivory/5 hover:text-gold"
                    onClick={() => setOpen(false)}
                  >
                    Send a message
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ivory/75 hover:bg-ivory/5 hover:text-gold"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <PortalFooter />
    </div>
  );
}

const footerLinks = [
  { label: "PRSC Readiness Score", href: "https://www.prscstandards.com/the-standard" },
  { label: "Governance", href: "https://www.prscstandards.com/governance" },
  { label: "The Readiness Vanguard", href: "https://www.prscstandards.com/readiness-vanguard" },
];

function PortalFooter() {
  return (
    <footer className="border-t border-gold/15 bg-navy-deep">
      <div className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10">
        <div className="grid gap-12 md:grid-cols-3">
          <PrscMark className="h-12 w-auto object-contain" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Explore the council</p>
            <ul className="mt-5 space-y-3">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-6 text-sm text-ivory/70 hover:text-gold md:max-w-[230px]"
                  >
                    {l.label}
                    <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="font-display text-lg italic leading-8 text-ivory/60 md:text-right">
            A more transparent,
            <br />
            more valuable partnership industry.
          </p>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-gold/15 pt-6 text-xs text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Partnership Readiness Standards Council™. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <span>Private &amp; confidential</span>
            <span className="text-ivory/20">|</span>
            <a href="mailto:info@readinessterminal.com" className="hover:text-gold">
              Contact
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
