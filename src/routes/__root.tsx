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
import { AnalyticsGate } from "@/components/site/AnalyticsGate";
import { FaqLauncher } from "@/components/site/FaqLauncher";
import { getRequestHost } from "@/lib/portal.functions";

const FAVICON = "/favicon.png";

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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; host: string }>()({
  beforeLoad: async () => {
    const { host } = await getRequestHost();
    return { host };
  },
  head: ({ context }: { context: { host?: string } }) => {
    const isPortalHost = context.host === "access.prscstandards.org" || context.host === "access.prscstandards.com";
    return {
      meta: isPortalHost
        ? [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "Private Center | PRSC" },
            { name: "description", content: "Private board and advisor center for PRSC and DIS members." },
            { name: "robots", content: "noindex,nofollow,noarchive" },
          ]
        : [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { name: "google-site-verification", content: "e0IaWo7Z6cwjlkdMVIsvWX5cYfTFV4u-dxhc-HnwysU" },
            { name: "google-site-verification", content: "ynsYtB7C7c6aH2BN4QjSuV52n640eSm0_MfWL1-m9QI" },
            { title: "PRSC — The Independent Standard for Partnership Readiness" },
            {
              name: "description",
              content:
                "PRSC is the independent standards body for partnership readiness — an authoritative, evidence-based framework for the global sponsorship market. Request a briefing.",
            },
            { name: "author", content: "Partnership Readiness Standards Council" },
            { property: "og:title", content: "PRSC — The Independent Standard for Partnership Readiness" },
            {
              property: "og:description",
              content:
                "PRSC is the independent standards body for partnership readiness — an authoritative, evidence-based framework for the global sponsorship market. Request a briefing.",
            },
            { property: "og:type", content: "website" },
            { property: "og:site_name", content: "PRSC" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: "PRSC — The Independent Standard for Partnership Readiness" },
            {
              name: "twitter:description",
              content:
                "PRSC is the independent standards body for partnership readiness — an authoritative, evidence-based framework for the global sponsorship market. Request a briefing.",
            },
            { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/0JafHcnQtudk7ficMoAl5tUjyy42/social-images/social-1784099576877-ChatGPT_Image_Jul_15,_2026,_12_43_53_AM.webp" },
            { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/0JafHcnQtudk7ficMoAl5tUjyy42/social-images/social-1784099576877-ChatGPT_Image_Jul_15,_2026,_12_43_53_AM.webp" },
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
      scripts: isPortalHost
        ? []
        : [
            {
              children:
                "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KPL6XBTW');",
            },
            {
              type: "application/ld+json",
              children: JSON.stringify([
                {
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "@id": "https://prscstandards.com/#organization",
                  name: "Partnership Readiness Standards Council",
                  alternateName: ["PRSC", "PRSC Standards Council"],
                  url: "https://prscstandards.com/",
                  logo: {
                    "@type": "ImageObject",
                    url: `https://prscstandards.com${FAVICON}`,
                  },
                  description:
                    "The independent standards body governing partnership readiness — an authoritative, evidence-based rating for the $100B+ sponsorship market.",
                  knowsAbout: [
                    "PRSC Readiness Score",
                    "PRSC Readiness Standard",
                    "Partnership Readiness",
                    "Sponsorship Standards",
                    "Six Readiness Dimensions",
                  ],
                },
                {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  "@id": "https://prscstandards.com/#website",
                  name: "Partnership Readiness Standards Council",
                  alternateName: "PRSC",
                  url: "https://prscstandards.com/",
                  publisher: { "@id": "https://prscstandards.com/#organization" },
                  inLanguage: "en-US",
                },
              ]),
            },
          ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const host = Route.useRouteContext({ select: (s) => s.host }) ?? "";
  const isPortalHost = host === "access.prscstandards.org" || host === "access.prscstandards.com";
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-navy">
        {!isPortalHost && (
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-KPL6XBTW"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
        <Scripts />
      </body>

    </html>
  );
}

function RootComponent() {
  const { queryClient, host } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPortalHost = host === "access.prscstandards.org" || host === "access.prscstandards.com";
  const isPrivate = isPortalHost || pathname.startsWith("/portal") || pathname.startsWith("/admin") || pathname.startsWith("/auth");
  const isChrome = !pathname.startsWith("/vanguard/") && !isPrivate;
  return (
    <QueryClientProvider client={queryClient}>
      {isChrome && <SiteNav />}
      <main className="min-h-screen">
        <Outlet />
      </main>
      {isChrome && <SiteFooter />}
      {!isPrivate && <FaqLauncher />}
      {!isPrivate && <AnalyticsGate />}
    </QueryClientProvider>
  );
}
