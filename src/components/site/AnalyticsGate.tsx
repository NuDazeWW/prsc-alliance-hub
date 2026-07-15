import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getVisitorRegion } from "@/lib/geo.functions";

const GA_ID = "G-ZMZCN0S0RV";
const CONSENT_KEY = "prsc-analytics-consent";

function loadGA() {
  if (typeof window === "undefined") return;
  if ((window as any).__gaLoaded) return;
  (window as any).__gaLoaded = true;

  const s = document.createElement("script");
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s.async = true;
  document.head.appendChild(s);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: unknown[]) { (window as any).dataLayer.push(args); }
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, { anonymize_ip: true });
}

export function AnalyticsGate() {
  const fetchRegion = useServerFn(getVisitorRegion);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { consentRequired } = await fetchRegion();
        if (cancelled) return;

        if (!consentRequired) {
          loadGA();
          return;
        }

        const stored = localStorage.getItem(CONSENT_KEY);
        if (stored === "accepted") {
          loadGA();
        } else if (stored !== "declined") {
          setShowBanner(true);
        }
      } catch {
        // Fail closed — don't load analytics if we can't determine region
      }
    })();
    return () => { cancelled = true; };
  }, [fetchRegion]);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShowBanner(false);
    loadGA();
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-2xl rounded-sm border border-gold/40 bg-navy/95 p-5 text-ivory shadow-2xl backdrop-blur md:bottom-6 md:left-6 md:right-auto"
    >
      <p className="text-sm leading-relaxed text-ivory/90">
        We use Google Analytics to understand how visitors use the Standard.
        Analytics cookies are only set with your consent.{" "}
        <a href="/governance" className="underline decoration-gold/60 underline-offset-2 hover:text-gold">
          Learn more
        </a>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={accept}
          className="rounded-sm bg-gold px-4 py-2 text-xs uppercase tracking-[0.18em] text-navy transition-colors hover:bg-gold/90"
        >
          Accept
        </button>
        <button
          onClick={decline}
          className="rounded-sm border border-ivory/30 px-4 py-2 text-xs uppercase tracking-[0.18em] text-ivory/80 transition-colors hover:text-ivory"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
