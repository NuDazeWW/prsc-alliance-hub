import { Text } from "@react-email/components";
import * as React from "react";
import { PortalEmailLayout, Cta } from "./PortalEmailLayout";

export function PortalEmailChangeEmail({ confirmationUrl }: { confirmationUrl: string }) {
  return (
    <PortalEmailLayout preview="Confirm your new email address">
      <Text style={{ color: "#0A1322", fontSize: 22, lineHeight: 1.35, margin: "0 0 20px" }}>
        Confirm your new email.
      </Text>
      <Text style={{ color: "#3A4050", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
        A request was made to update the email address for your PRSC private center account. Click
        below to confirm this change.
      </Text>
      <Cta href={confirmationUrl}>Confirm email</Cta>
      <Text style={{ color: "#8A8F99", fontSize: 12, lineHeight: 1.5, margin: "24px 0 0" }}>
        If you did not make this change, contact the administrator immediately.
      </Text>
    </PortalEmailLayout>
  );
}

export default PortalEmailChangeEmail;
