import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrscMark } from "@/components/site/PrscMark";
import { Button } from "@/components/ui/button";

export function PortalShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  return <div className="min-h-screen bg-navy text-ivory">
    <header className="border-b border-gold/20 px-5 py-4 lg:px-10">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
        <Link to={admin ? "/admin" : "/portal"} aria-label="Private center home"><PrscMark className="h-12 w-auto object-contain" /></Link>
        <div className="flex items-center gap-4 text-[11px] uppercase text-ivory/60">
          <span className="hidden items-center gap-2 sm:flex"><ShieldCheck className="h-4 w-4 text-gold" /> Private & confidential</span>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-ivory hover:bg-ivory/10 hover:text-gold" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
    {children}
  </div>;
}
