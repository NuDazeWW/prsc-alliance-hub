import { Text } from "@react-email/components";
import * as React from "react";
import { PortalEmailLayout, Cta } from "./PortalEmailLayout";

export function PortalSignupEmail({ confirmationUrl }: { confirmationUrl: string }) {
  return (
    <PortalEmailLayout preview="Confirm your private center email">
      <Text style={{ color: "#0A1322", fontSize: 22, lineHeight: 1.35, margin: "0 0 20px" }}>
        Confirm your email address.
      </Text>
      <Text style={{ color: "#3A4050", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
        Thank you for registering for the PRSC private center. Please confirm your email to complete the setup of your account.
      </Text>
      <Cta href={confirmationUrl}>Confirm email</Cta>
      <Text style={{ color: "#8A8F99", fontSize: 12, lineHeight: 1.5, margin: "24px 0 0" }}>
        If you did not request access, you can safely ignore this message.
      </Text>
    </PortalEmailLayout>
  );
}

export default PortalSignupEmail;
