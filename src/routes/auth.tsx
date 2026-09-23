import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrscMark } from "@/components/site/PrscMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPortalSession } from "@/lib/portal.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : "/portal", mode: search.mode === "setup" ? "setup" : undefined }),
  head: () => ({ meta: [
    { title: "Private Center Access | PRSC" }, { name: "description", content: "Secure access for invited PRSC and DIS board members and advisors." },
    { name: "robots", content: "noindex,nofollow,noarchive" }, { property: "og:title", content: "Private Center Access | PRSC" },
    { property: "og:description", content: "Secure access for invited PRSC and DIS board members and advisors." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "reset" | "setup">(search.mode === "setup" ? "setup" : "signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const isRecovery = search.mode === "setup" || (typeof window !== "undefined" && /type=(recovery|invite)/.test(window.location.hash));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("setup");
    });
    if (!isRecovery) {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        getPortalSession().then((s) => navigate({ to: s.isAdmin ? "/admin" : search.redirect, replace: true })).catch(() => navigate({ to: search.redirect, replace: true }));
      });
    } else setMode("setup");
    return () => sub.subscription.unsubscribe();
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=setup` });
        if (error) throw error; setMessage("If this address has access, password instructions are on the way."); return;
      }
      if (mode === "setup") {
        if (password.length < 12) throw new Error("Use at least 12 characters.");
        const { error } = await supabase.auth.updateUser({ password }); if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw new Error("The email or password was not recognized.");
      }
      try {
        const s = await getPortalSession();
        await navigate({ to: s.isAdmin ? "/admin" : search.redirect, replace: true });
      } catch {
        await navigate({ to: search.redirect, replace: true });
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="relative flex min-h-screen items-center overflow-hidden bg-navy px-5 py-10 text-ivory">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
    <div className="mx-auto w-full max-w-6xl">
      <section className="grid w-full overflow-hidden border border-gold/25 bg-[linear-gradient(145deg,var(--color-navy),var(--color-navy-deep))] shadow-2xl lg:grid-cols-[1.15fr_.85fr]">
        <div className="hidden flex-col justify-between border-r border-gold/20 px-12 py-10 lg:flex lg:min-h-[620px]">
          <PrscMark variant="emblem" className="h-28 w-auto self-start object-contain" />
          <div>
            <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-gold">Private Board &amp; Advisor Center</p>
            <h1 className="max-w-xl font-display text-[clamp(3.25rem,4.2vw,4.5rem)] leading-[0.95]">Built for those who shape the standard.</h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-ivory/65">Access is reserved for invited PRSC and DIS board members and advisors.</p>
          </div>
          <p className="flex items-center gap-2 text-xs text-ivory/45"><ShieldCheck className="h-4 w-4 text-gold" /> Invitation-only access</p>
        </div>
        <div className="flex min-h-[620px] items-center px-7 py-10 sm:px-12">
          <div className="w-full"><PrscMark variant="emblem" className="mb-10 h-16 w-auto object-contain lg:hidden" /><KeyRound className="mb-5 h-7 w-7 text-gold" /><p className="text-[11px] uppercase tracking-[0.22em] text-gold">Welcome Center</p><h2 className="mt-3 font-display text-4xl">{mode === "reset" ? "Recover access" : mode === "setup" ? "Secure your account" : "Private access"}</h2><p className="mt-4 text-sm leading-6 text-ivory/55">{mode === "setup" ? "Create a new private password (at least 12 characters) to continue." : "Use the email address associated with your invitation."}</p>
            <form onSubmit={submit} className="mt-9 space-y-5">
              {mode !== "setup" && <label className="block text-xs uppercase text-ivory/60">Email address<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="mt-2 h-12 border-ivory/20 bg-transparent text-ivory" /></label>}
              {mode !== "reset" && <label className="block text-xs uppercase text-ivory/60">Password<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "setup" ? 12 : undefined} autoComplete={mode === "setup" ? "new-password" : "current-password"} className="mt-2 h-12 border-ivory/20 bg-transparent text-ivory" /></label>}
              {message && <p role="status" className="border-l-2 border-gold pl-3 text-sm text-ivory/75">{message}</p>}
              <Button disabled={busy} className="h-12 w-full rounded-none bg-gold text-navy hover:bg-gold-light">{busy ? "Please wait…" : mode === "reset" ? "Send instructions" : mode === "setup" ? "Set password & enter" : "Enter the center"}</Button>
            </form>
            <button type="button" onClick={() => { setMessage(""); setMode(mode === "reset" ? "signin" : "reset"); }} className="mt-6 flex items-center gap-2 text-sm text-ivory/55 hover:text-gold"><Mail className="h-4 w-4" />{mode === "reset" ? "Return to sign in" : "Forgot your password?"}</button>
          </div>
        </div>
      </section>
    </div>
  </main>;
}
