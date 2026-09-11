import { Text } from "@react-email/components";
import * as React from "react";
import { PortalEmailLayout, Cta } from "./PortalEmailLayout";

export function PortalRecoveryEmail({ confirmationUrl }: { confirmationUrl: string }) {
  return (
    <PortalEmailLayout preview="Reset your private center password">
      <Text style={{ color: "#0A1322", fontSize: 22, lineHeight: 1.35, margin: "0 0 20px" }}>
        Reset your access.
      </Text>
      <Text style={{ color: "#3A4050", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
        We received a request to reset the password for your PRSC private center account. The link below is valid for a short time and can be used once.
      </Text>
      <Cta href={confirmationUrl}>Reset password</Cta>
      <Text style={{ color: "#8A8F99", fontSize: 12, lineHeight: 1.5, margin: "24px 0 0" }}>
        If you did not request this reset, you can ignore this message. Your account remains secure.
      </Text>
    </PortalEmailLayout>
  );
}

export default PortalRecoveryEmail;
