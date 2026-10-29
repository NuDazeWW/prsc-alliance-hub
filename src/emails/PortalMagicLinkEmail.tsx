import { Text } from "@react-email/components";
import * as React from "react";
import { PortalEmailLayout, Cta } from "./PortalEmailLayout";

export function PortalMagicLinkEmail({ confirmationUrl }: { confirmationUrl: string }) {
  return (
    <PortalEmailLayout preview="Your private center login link">
      <Text style={{ color: "#0A1322", fontSize: 22, lineHeight: 1.35, margin: "0 0 20px" }}>
        Your confidential login link.
      </Text>
      <Text style={{ color: "#3A4050", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
        Use the button below to sign in to the PRSC private center. This link is single-use and
        expires shortly.
      </Text>
      <Cta href={confirmationUrl}>Sign in</Cta>
      <Text style={{ color: "#8A8F99", fontSize: 12, lineHeight: 1.5, margin: "24px 0 0" }}>
        Do not forward this email. If you did not request it, contact the administrator.
      </Text>
    </PortalEmailLayout>
  );
}

export default PortalMagicLinkEmail;
