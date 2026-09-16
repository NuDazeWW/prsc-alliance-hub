import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrscMark } from "@/components/site/PrscMark";

type NavItem = { label: string; href: string; onSelect?: () => void };
export type PortalNotification = { id: string; label: string; detail?: string; href?: string };

export function PortalShell({
  children,
  admin = false,
  nav = [],
  memberName,
  notifications = [],
}: {
  children: React.ReactNode;
  admin?: boolean;
  nav?: NavItem[];
  memberName?: string;
  notifications?: PortalNotification[];
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: "/portal", mode: undefined }, replace: true });
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[linear-gradient(135deg,var(--color-navy-deep),var(--color-navy)_52%,var(--color-midnight))] text-ivory">
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-navy/95 backdrop-blur">
        <div className="grid h-[82px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:h-[92px] sm:px-7 lg:h-[clamp(96px,6vw,116px)] lg:grid-cols-[20%_1fr_auto] lg:gap-8 lg:px-0">
          <a
            href={admin ? "/admin" : "/portal"}
            aria-label="Private center home"
            className="flex h-full min-w-0 items-center lg:border-r lg:border-gold/15 lg:px-[12.5%]"
          >
            <PrscMark variant="horizontal" className="h-auto w-[190px] max-w-full object-contain sm:w-[230px] lg:w-[min(88%,270px)]" />
          </a>
          {nav.length > 0 && (
            <nav className="hidden h-full min-w-0 items-center justify-center gap-[clamp(2rem,3.3vw,4.5rem)] lg:flex">
              {nav.map((item, i) => {
                const cls = `relative flex h-full items-center text-[14px] transition-colors hover:text-gold ${i === 0 ? "text-gold" : "text-ivory/65"}`;
                const underline = i === 0 ? <span className="absolute inset-x-0 bottom-0 h-px bg-gold" /> : null;
                return item.onSelect ? (
                  <button key={item.label} type="button" onClick={item.onSelect} className={cls}>
                    {item.label}
                    {underline}
                  </button>
                ) : (
                  <a key={item.label} href={item.href} className={cls}>
                    {item.label}
                    {underline}
                  </a>
                );
              })}
            </nav>
          )}
          <div className="ml-auto flex h-10 items-center gap-4 pr-1 sm:gap-5 sm:pr-2 lg:ml-0 lg:border-l lg:border-gold/20 lg:pl-7 lg:pr-[clamp(1.5rem,2.5vw,3.5rem)]">
            {notifications.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAlertsOpen((v) => !v);
                    setOpen(false);
                  }}
                  aria-label={`${notifications.length} items need attention`}
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold transition-colors hover:border-gold hover:bg-gold/10"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-navy">
                    {notifications.length}
                  </span>
                </button>
                {alertsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[320px] border border-gold/25 bg-navy-deep shadow-2xl">
                    <p className="border-b border-gold/15 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-gold">
                      Needs attention
                    </p>
                    <ul className="max-h-[380px] overflow-y-auto">
                      {notifications.map((n) => (
                        <li key={n.id} className="border-b border-ivory/10 last:border-b-0">
                          <a
                            href={n.href ?? "#"}
                            onClick={() => setAlertsOpen(false)}
                            className="block px-4 py-3 transition-colors hover:bg-ivory/5"
                          >
                            <span className="block text-sm text-ivory/90">{n.label}</span>
                            {n.detail && <span className="mt-1 block text-xs text-ivory/45">{n.detail}</span>}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="relative">

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex min-h-11 items-center gap-3 text-[14px] text-ivory/80 transition-colors hover:text-gold"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/55">
                  <User className="h-[18px] w-[18px] text-gold" />
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


function PortalFooter() {
  return (
    <footer className="border-t border-gold/15 bg-navy-deep">
      <div className="w-full px-6 py-8 sm:px-10 lg:px-[4vw] lg:py-10">
        <div className="grid items-start gap-12 md:grid-cols-[1.2fr_1fr] lg:gap-20">
          <PrscMark variant="horizontal" className="h-auto w-[260px] max-w-full object-contain lg:w-[310px]" />
          <p className="font-display text-xl italic leading-8 text-ivory/55 md:text-right">
            A more transparent,
            <br />
            more valuable partnership industry.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-gold/15 pt-7 text-xs text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
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
