import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vanguard/home")({
  head: () => ({
    meta: [
      { title: "Vanguard — PRSC" },
      { name: "description", content: "PRSC Vanguard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VanguardHome,
});

function VanguardHome() {
  return <div />;
}
