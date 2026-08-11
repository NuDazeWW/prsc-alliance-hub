import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FaqSearch } from "./FaqSearch";
import { trackEvent } from "@/lib/track-event";

export function FaqLauncher() {
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      pillRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      {!open && (
        <button
          ref={pillRef}
          type="button"
          onClick={() => {
            setOpen(true);
            trackEvent("faq_open", {
              faq_source: "pill",
              page_path: typeof window !== "undefined" ? window.location.pathname : "",
            });
          }}
          aria-label="Open frequently asked questions"
          className="fixed z-50 right-5 bottom-5 inline-flex items-center gap-2 rounded-full border border-gold bg-navy/95 px-5 py-3 text-[0.72rem] uppercase tracking-[0.16em] text-gold shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-navy"
          style={{
            marginBottom: "env(safe-area-inset-bottom)",
            boxShadow: "0 8px 30px rgba(212,175,55,0.25)",
          }}
        >
          <MessageCircleQuestion size={16} strokeWidth={1.6} aria-hidden />
          Questions?
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Frequently asked questions"
        >
          <div
            className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-ivory text-navy shadow-2xl sm:h-[92vh] sm:rounded-sm"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-navy/10 px-5 md:px-8 pt-6 pb-4">
              <div>
                <p className="label-caps text-gold mb-2 text-[0.68rem]">Frequently Asked Questions</p>
                <h2 className="font-display text-2xl md:text-3xl leading-tight">
                  Everything about the PRSC Readiness Score™
                </h2>
                <div className="gold-rule mt-3 w-16" />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full border border-navy/15 p-2 text-stone transition-colors hover:border-gold hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <FaqSearch
                footer={
                  <Link
                    to="/faq"
                    onClick={() => setOpen(false)}
                    className="text-gold underline underline-offset-4 hover:text-navy transition-colors"
                  >
                    View all questions as a page
                  </Link>
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
