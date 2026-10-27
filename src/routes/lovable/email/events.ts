import { createFileRoute } from "@tanstack/react-router";
import { createEmailWebhookHandler } from "@lovable.dev/email-js";

// Build the handler on first request, not at import time: a missing key must
// never crash the whole app while the route tree loads.
let handler: ((request: Request) => Promise<Response>) | null = null;
function getHandler() {
  if (handler) return handler;
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  handler = createEmailWebhookHandler({
    apiKey,
    on: {
      "email.bounced": async (event) => {
        console.error("[email] bounced", event.data.message_id);
      },
      "email.complaint": async (event) => {
        console.error("[email] complaint", event.data.message_id);
      },
      "email.unsubscribed": async (event) => {
        console.log("[email] unsubscribed", event.data.message_id);
      },
    },
  });
  return handler;
}

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const h = getHandler();
        if (!h) return new Response("Server configuration error", { status: 500 });
        return h(request);
      },
    },
  },
});
