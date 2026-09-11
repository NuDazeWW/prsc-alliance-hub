import { createFileRoute } from "@tanstack/react-router";
import { createAuthEmailHandler } from "@lovable.dev/email-js";
import { PortalInviteEmail } from "@/emails/PortalInviteEmail";
import { PortalRecoveryEmail } from "@/emails/PortalRecoveryEmail";
import { PortalMagicLinkEmail } from "@/emails/PortalMagicLinkEmail";
import { PortalEmailChangeEmail } from "@/emails/PortalEmailChangeEmail";
import { PortalSignupEmail } from "@/emails/PortalSignupEmail";
import { PortalReauthenticationEmail } from "@/emails/PortalReauthenticationEmail";

const handler = createAuthEmailHandler({
  apiKey: process.env["LOVABLE_API_KEY"]!,
  from: "PRSC Private Center <no-reply@readinessterminal.com>",
  emails: {
    signup: {
      subject: "Confirm your PRSC private center email",
      render: (data) => <PortalSignupEmail confirmationUrl={data.url} />,
    },
    invite: {
      subject: "Your PRSC private center invitation",
      render: (data) => <PortalInviteEmail confirmationUrl={data.url} firstName={data.email.split("@")[0]} />,
    },
    magiclink: {
      subject: "Sign in to the PRSC private center",
      render: (data) => <PortalMagicLinkEmail confirmationUrl={data.url} />,
    },
    recovery: {
      subject: "Reset your PRSC private center password",
      render: (data) => <PortalRecoveryEmail confirmationUrl={data.url} />,
    },
    email_change: {
      subject: "Confirm your new PRSC private center email",
      render: (data) => <PortalEmailChangeEmail confirmationUrl={data.url} />,
    },
    reauthentication: {
      subject: "Your PRSC private center verification code",
      render: (data) => <PortalReauthenticationEmail token={data.token ?? ""} />,
    },
  },
});

export const Route = createFileRoute("/lovable/email/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => handler(request),
    },
  },
});
