import { Text } from "@react-email/components";
import * as React from "react";
import { PortalEmailLayout } from "./PortalEmailLayout";

export function PortalReauthenticationEmail({ token }: { token: string }) {
  return (
    <PortalEmailLayout preview="Your private center verification code">
      <Text style={{ color: "#0A1322", fontSize: 22, lineHeight: 1.35, margin: "0 0 20px" }}>
        Your verification code.
      </Text>
      <Text style={{ color: "#3A4050", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
        Enter the code below to continue in the PRSC private center. It expires shortly.
      </Text>
      <Text style={{ color: "#0A1322", fontSize: 28, letterSpacing: "0.2em", fontWeight: 600, margin: "0 0 24px", fontFamily: "monospace" }}>
        {token}
      </Text>
      <Text style={{ color: "#8A8F99", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
        If you did not request this code, contact the administrator.
      </Text>
    </PortalEmailLayout>
  );
}

export default PortalReauthenticationEmail;
