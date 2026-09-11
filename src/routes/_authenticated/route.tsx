import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Builder/preview preview-only bypass: never applies on production domains.
export function isPreviewHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h.startsWith("id-preview--") ||
    h.endsWith(".lovableproject.com")
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (isPreviewHost()) {
      const { data } = await supabase.auth.getUser();
      return { user: data.user };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: location.href, mode: undefined } });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
