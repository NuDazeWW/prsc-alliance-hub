import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { NextStep } from "@/lib/next-step";

const key = (memberKey: string, step: string) => `portal.nextStepPopup.${memberKey}.${step}`;
function wasDismissed(memberKey: string, step: string) { try { return window.sessionStorage.getItem(key(memberKey, step)) === "1"; } catch { return false; } }
function remember(memberKey: string, step: string) { try { window.sessionStorage.setItem(key(memberKey, step), "1"); } catch { /* storage unavailable: the pop-up just returns on the next visit */ } }

/**
 * When a member arrives (from an email link or by signing in), shows the one thing they need to do with a button that goes straight to it.
 * Closing it with "Not now" only hides it for this browser session; the step is done only from its own real record.
 */
export function NextStepPopup({ step, memberKey, suppressed, onRun }: { step: NextStep | null; memberKey: string | undefined; suppressed: boolean; onRun: () => void }) {
  const [open, setOpen] = useState(false);
  const stepKey = step?.key ?? "";
  useEffect(() => {
    if (!step || !memberKey || suppressed || step.key === "orientation") { setOpen(false); return; }
    if (!wasDismissed(memberKey, step.key)) setOpen(true);
  }, [step, stepKey, memberKey, suppressed]);
  if (!step || !memberKey) return null;
  const close = () => { remember(memberKey, step.key); setOpen(false); };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-md border-gold/40 bg-navy-deep text-ivory">
        <DialogHeader>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Your next step</p>
          <DialogTitle className="font-display text-3xl leading-tight">{step.title}</DialogTitle>
          <DialogDescription className="text-base text-ivory/75">{step.detail}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={close} className="text-xs uppercase tracking-[0.16em] text-ivory/60 hover:text-ivory">Not now</button>
          <Button onClick={() => { close(); onRun(); }} className="cta-glow h-auto min-h-12 px-6 py-3 text-base font-semibold">
            <span className="relative z-10 flex items-center gap-3">{step.action}<ArrowRight className="h-4 w-4" /></span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
