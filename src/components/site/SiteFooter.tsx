import { Link } from "@tanstack/react-router";
import logo from "@/assets/prsc-logo-tag.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-ivory/80 border-t border-gold/20">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-3">
        <div className="space-y-4">
          <img src={logo.url} alt="PRSC" className="h-24 w-auto" />
          <p className="text-sm text-ivory/60 max-w-xs">
            The independent standards body for partnership readiness. Authoritative. Timeless. Institutional.
          </p>
        </div>
        <div className="space-y-3">
          <p className="label-caps text-gold">The Standard</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/the-standard" className="hover:text-gold">The PRSC Readiness Score™</Link></li>
            <li><Link to="/governance" className="hover:text-gold">Governance</Link></li>
            <li><Link to="/readiness-vanguard" className="hover:text-gold">Readiness Vanguard</Link></li>
            <li><Link to="/request-briefing" className="hover:text-gold">Request a Briefing</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="label-caps text-gold">Council</p>
          <p className="text-sm text-ivory/60">
            Partnership Readiness Standards Council™ is an independent standards body serving the global sponsorship and partnership industry.
          </p>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-ivory/45">
          <p>© {new Date().getFullYear()} Partnership Readiness Standards Council™. All rights reserved.</p>
          <p className="label-caps">PRSC Readiness Standard&trade; · Version 1.0 · Published 2026</p>
        </div>
      </div>
    </footer>
  );
}
