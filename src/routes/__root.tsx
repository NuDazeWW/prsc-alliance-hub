import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

const FAVICON = "/__l5e/assets-v1/9aec8314-32e6-4d5a-9b1d-45a144e00723/prsc-seal-badge.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold">404</h1>
        <h2 className="mt-4 text-xl text-ivory">Page not found</h2>
        <p className="mt-2 text-sm text-ivory/60">
          The page you're looking for isn't part of the Standard.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center rounded-sm border border-gold bg-gold/10 px-4 py-2 text-xs tracking-[0.18em] uppercase text-gold hover:bg-gold hover:text-navy transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="max-w-md text-center text-ivory">
        <h1 className="font-display text-2xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-ivory/60">Something went wrong. Please try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-sm border border-gold bg-gold/10 px-4 py-2 text-xs tracking-[0.18em] uppercase text-gold hover:bg-gold hover:text-navy transition-colors"
          >
            Try again
          </button>
          <a href="/" className="rounded-sm border border-ivory/30 px-4 py-2 text-xs tracking-[0.18em] uppercase text-ivory/80 hover:text-ivory">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PRSC — The Independent Standard for Partnership Readiness" },
      {
        name: "description",
        content:
          "PRSC is the independent standards body governing partnership readiness — an authoritative, evidence-based rating for the $100B+ sponsorship market.",
      },
      { name: "author", content: "Partnership Readiness Standards Council" },
      { property: "og:title", content: "PRSC — The Independent Standard for Partnership Readiness" },
      {
        property: "og:description",
        content:
          "The independent standards body governing partnership readiness. Evidence-based. Neutrally governed. Built for the $100B+ sponsorship market.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "PRSC" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PRSC — The Independent Standard for Partnership Readiness" },
      {
        name: "twitter:description",
        content:
          "The independent standards body governing partnership readiness — evidence-based, neutrally governed, adopted globally.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: FAVICON },
      { rel: "apple-touch-icon", href: FAVICON },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter+Tight:wght@300;400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Partnership Readiness Standards Council",
          alternateName: "PRSC",
          url: "https://prscstandards.com",
          logo: `https://prscstandards.com${FAVICON}`,
          description:
            "The independent standards body governing partnership readiness — an authoritative, evidence-based rating for the $100B+ sponsorship market.",
        }),
      },
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-ZMZCN0S0RV",
        async: true,
      },
      {
        children:
          "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-ZMZCN0S0RV');",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-navy">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChrome = !pathname.startsWith("/vanguard/");
  return (
    <QueryClientProvider client={queryClient}>
      {isChrome && <SiteNav />}
      <main className="min-h-screen">
        <Outlet />
      </main>
      {isChrome && <SiteFooter />}
    </QueryClientProvider>
  );
}
