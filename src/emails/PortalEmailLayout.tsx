import { Html, Head, Body, Container, Section, Row, Column, Text, Link } from "@react-email/components";
import * as React from "react";

const colors = {
  navy: "#0A1322",
  gold: "#C8A464",
  ivory: "#F4F1EA",
  charcoal: "#1E2A3A",
  muted: "#8A8F99",
};

export function PortalEmailLayout({
  children,
  preview,
}: {
  children: React.ReactNode;
  preview: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ margin: 0, padding: 0, backgroundColor: colors.ivory, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "48px 16px" }}>
          <Section style={{ backgroundColor: colors.navy, padding: "32px", textAlign: "center" }}>
            <Text style={{ color: colors.gold, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>
              Partnership Readiness Standards Council
            </Text>
          </Section>
          <Section style={{ backgroundColor: "#FFFFFF", border: `1px solid ${colors.gold}30`, padding: "40px 32px" }}>
            <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 16px" }}>
              {preview}
            </Text>
            {children}
          </Section>
          <Section style={{ backgroundColor: colors.navy, padding: "24px 32px", textAlign: "center" }}>
            <Text style={{ color: colors.gold, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
              Private Center · access.prscstandards.org
            </Text>
          </Section>
          <Section>
            <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", margin: "16px 0 0" }}>
              This message was sent to you because access to the PRSC private center was requested. Please do not forward.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Cta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colors.gold,
        color: colors.navy,
        padding: "14px 28px",
        fontSize: 12,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        textDecoration: "none",
        borderRadius: 2,
      }}
    >
      {children}
    </Link>
  );
}

export { colors };
