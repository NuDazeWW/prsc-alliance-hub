import { createFileRoute } from "@tanstack/react-router";
import { createEmailWebhookHandler } from "@lovable.dev/email-js";

const handler = createEmailWebhookHandler({
  apiKey: process.env["LOVABLE_API_KEY"]!,
  on: {
    "email.bounced": async (event) => {
      console.error("[email] bounced", event.data.recipient, event.data.message_id);
    },
    "email.complaint": async (event) => {
      console.error("[email] complaint", event.data.recipient, event.data.message_id);
    },
    "email.unsubscribed": async (event) => {
      console.log("[email] unsubscribed", event.data.recipient, event.data.message_id);
    },
  },
});

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: async ({ request }) => handler(request),
    },
  },
});
