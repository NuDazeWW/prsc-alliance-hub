import { Text } from "@react-email/components";
import * as React from "react";
import { PortalEmailLayout, Cta } from "./PortalEmailLayout";

export function PortalInviteEmail({
  confirmationUrl,
  firstName,
}: {
  confirmationUrl: string;
  firstName?: string;
}) {
  const name = firstName || "there";
  return (
    <PortalEmailLayout preview="Private center invitation">
      <Text style={{ color: "#0A1322", fontSize: 22, lineHeight: 1.35, margin: "0 0 20px" }}>
        Welcome, {name}.
      </Text>
      <Text style={{ color: "#3A4050", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
        You have been invited to the PRSC private board and advisor center — a confidential briefing
        environment for members and advisors.
      </Text>
      <Cta href={confirmationUrl}>Enter the private center</Cta>
      <Text style={{ color: "#8A8F99", fontSize: 12, lineHeight: 1.5, margin: "24px 0 0" }}>
        This personalized link is for you. Please do not share it. If you did not expect this
        invitation, contact the administrator.
      </Text>
    </PortalEmailLayout>
  );
}

export default PortalInviteEmail;
