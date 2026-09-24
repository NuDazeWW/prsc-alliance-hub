import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrscMark } from "@/components/site/PrscMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearPortalLoginFailures } from "@/lib/portal-auth.functions";

export const Route = createFileRoute("/accept-invitation")({
  head: () => ({
    meta: [
      { title: "Accept Your Private Invitation | PRSC" },
      { name: "description", content: "Create your password for the private PRSC and DIS Board & Advisor Center." },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { property: "og:title", content: "Accept Your Private Invitation | PRSC" },
      { property: "og:description", content: "Create your password for the private PRSC and DIS Board & Advisor Center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Verifying your private invitation…");
  const invitationEmail = useRef("");

  useEffect(() => {
    let active = true;
    let timeout: number | undefined;
    const confirmInvitation = (email?: string) => {
      if (!active) return;
      invitationEmail.current = email ?? invitationEmail.current;
      setReady(true);
      setMessage("");
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        confirmInvitation(data.session.user.email);
      }
    };
    void checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session) return;
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION") {
        confirmInvitation(session.user.email);
      }
    });
    timeout = window.setTimeout(() => {
      if (!active) return;
      setMessage("This invitation link has expired or has already been used. Please contact info@readinessterminal.com for a new invitation.");
    }, 4000);
    return () => {
      active = false;
      if (timeout !== undefined) window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password.length < 12) {
      setMessage("Use at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await clearPortalLoginFailures();
      const email = invitationEmail.current;
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      await navigate({
        to: "/auth",
        search: { email, passwordCreated: true, redirect: "/portal", mode: undefined },
        replace: true,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not save your password. Please request a new invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-navy px-5 py-10 text-ivory">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="mx-auto w-full max-w-6xl">
        <section className="grid w-full overflow-hidden border border-gold/25 bg-[linear-gradient(145deg,var(--color-navy),var(--color-navy-deep))] shadow-2xl lg:grid-cols-[1.15fr_.85fr]">
          <div className="hidden min-h-[620px] flex-col justify-between border-r border-gold/20 px-12 py-10 lg:flex">
            <PrscMark variant="emblem" className="h-28 w-auto self-start object-contain" />
            <div>
              <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-gold">Private Board &amp; Advisor Center</p>
              <h1 className="max-w-xl font-display text-[clamp(3.25rem,4.2vw,4.5rem)] leading-[0.95]">Your private access begins here.</h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-ivory/65">Create the password you will use each time you return to the Welcome Center.</p>
            </div>
            <p className="flex items-center gap-2 text-xs text-ivory/45"><ShieldCheck className="h-4 w-4 text-gold" /> Individual, invitation-only access</p>
          </div>
          <div className="flex min-h-[620px] items-center px-7 py-10 sm:px-12">
            <div className="w-full">
              <PrscMark variant="emblem" className="mb-10 h-16 w-auto object-contain lg:hidden" />
              <KeyRound className="mb-5 h-7 w-7 text-gold" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Invitation accepted</p>
              <h2 className="mt-3 font-display text-4xl">Create your password</h2>
              <p className="mt-4 text-sm leading-6 text-ivory/55">Choose a private password with at least 12 characters. After it is created, sign in with your invitation email and new password.</p>
              {ready ? (
                <form onSubmit={submit} className="mt-9 space-y-5">
                  <PasswordField label="New password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" />
                  <PasswordField label="Confirm new password" value={confirmation} onChange={setConfirmation} visible={showPassword} autoComplete="new-password" />
                  {message && <p role="status" className="border-l-2 border-gold pl-3 text-sm text-ivory/75">{message}</p>}
                  <Button disabled={busy} className="h-12 w-full rounded-none bg-gold text-navy hover:bg-gold-light hover:text-navy">{busy ? "Creating your password…" : "Create password & continue to sign in"}</Button>
                </form>
              ) : (
                <p role="status" className="mt-9 border-l-2 border-gold pl-3 text-sm leading-6 text-ivory/75">{message}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle, autoComplete }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle?: () => void; autoComplete: string }) {
  return (
    <label className="block text-xs uppercase text-ivory/60">
      {label}
      <span className="relative mt-2 block">
        <Input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} required minLength={12} autoComplete={autoComplete} className="h-12 border-ivory/20 bg-transparent pr-12 text-ivory" />
        {onToggle && <Button type="button" variant="ghost" size="icon" onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"} className="absolute right-1 top-1 h-10 w-10 text-ivory/60 hover:bg-ivory/10 hover:text-gold">{visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</Button>}
      </span>
    </label>
  );
}