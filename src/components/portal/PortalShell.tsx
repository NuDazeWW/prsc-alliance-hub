import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrscMark } from "@/components/site/PrscMark";

type NavItem = { label: string; href: string; onSelect?: () => void };
export type PortalNotification = { id: string; label: string; detail?: string; href?: string };
export type PortalStat = { label: string; value: React.ReactNode };

export function PortalShell({
  children,
  admin = false,
  nav = [],
  memberName,
  memberProgress,
  notifications = [],
  stats = [],
}: {
  children: React.ReactNode;
  admin?: boolean;
  nav?: NavItem[];
  memberName?: string;
  memberProgress?: React.ReactNode;
  notifications?: PortalNotification[];
  stats?: PortalStat[];
}) {
  const navigate = useNavigate();
  const [alertsOpen, setAlertsOpen] = useState(false);
  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: "/portal", mode: undefined, email: undefined, passwordCreated: undefined }, replace: true });
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[linear-gradient(135deg,var(--color-navy-deep),var(--color-navy)_52%,var(--color-midnight))] text-ivory">
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-navy/95 backdrop-blur">
        <div className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 sm:px-7 lg:grid-cols-[20%_1fr_auto] lg:gap-x-8 lg:px-0 ${memberProgress && !admin ? "min-h-[82px] py-3 sm:min-h-[92px] lg:min-h-[132px] lg:py-3" : "h-[82px] sm:h-[92px] lg:h-[clamp(96px,6vw,116px)]"}`}>
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
          {admin && stats.length > 0 && (
            <div className="hidden h-full min-w-0 items-center justify-end gap-[clamp(1rem,2vw,2.25rem)] lg:flex">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-end leading-tight">
                  <span className="font-display text-xl text-gold">{s.value}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ivory/50">{s.label}</span>
                </div>
              ))}
            </div>
          )}
          {!admin && memberProgress && (
            <div className="order-3 col-span-2 mt-2 min-w-0 border-t border-gold/15 pt-3 lg:order-none lg:col-span-1 lg:mt-0 lg:overflow-x-auto lg:border-t-0 lg:pt-0">
              {memberProgress}
            </div>
          )}
          <div className="col-start-2 ml-auto flex h-10 items-center gap-4 pr-1 sm:gap-5 sm:pr-2 lg:col-start-3 lg:border-l lg:border-gold/20 lg:pl-7 lg:pr-[clamp(1.5rem,2.5vw,3.5rem)]">
            {!admin && stats.length > 0 && (
              <div className="hidden items-center gap-[clamp(1rem,2vw,2.25rem)] pr-2 md:flex">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col items-end leading-tight">
                    <span className="font-display text-xl text-gold">{s.value}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-ivory/50">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
            {notifications.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAlertsOpen((v) => !v);
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
            {admin ? (
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/55">
                  <User className="h-[18px] w-[18px] text-gold" />
                </span>
                <span className="hidden text-[13px] font-semibold uppercase tracking-[0.18em] text-gold sm:inline">Admin</span>
                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-ivory/60 transition-colors hover:border-gold hover:text-gold"
                >
                  <LogOut className="h-[16px] w-[16px]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 sm:gap-5">
                <span className="hidden whitespace-nowrap text-[13px] text-ivory/75 sm:inline">
                  Welcome{memberName ? `, ${memberName}` : ""}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap text-[12px] text-ivory/55 transition-colors hover:text-gold"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            )}
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

        <div className="mt-8 flex flex-col gap-4 border-t border-gold/15 pt-5 text-xs text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
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
