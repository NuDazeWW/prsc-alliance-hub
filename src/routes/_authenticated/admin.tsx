import { createFileRoute } from "@tanstack/react-router";
import { AdminCenter } from "@/components/portal/AdminCenter";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administrator Center | PRSC" },
      {
        name: "description",
        content: "Private administrator center for member access, profiles, and inquiries.",
      },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { property: "og:title", content: "Administrator Center | PRSC" },
      {
        property: "og:description",
        content: "Private administrator center for member access, profiles, and inquiries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AdminCenter page="overview" />,
});
