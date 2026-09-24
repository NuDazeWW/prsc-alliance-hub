import * as React from 'react'
import { Body, Button, Column, Container, Head, Heading, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components'
import prscLogo from '@/assets/prsc-horizontal-lockup.png.asset.json'
import disLogo from '@/assets/dis-lockup-site.png.asset.json'

type InviteEntity = 'prsc' | 'dis' | 'both'

interface InviteEmailProps {
  confirmationUrl: string
  firstName?: string
  recipientEmail: string
  entity?: InviteEntity
  roleLabel?: string
}

const APP_ORIGIN = 'https://access.prscstandards.org'

const entityCopy: Record<InviteEntity, { full: string; short: string }> = {
  prsc: { full: 'Partnership Readiness Standards Council (PRSC)', short: 'PRSC' },
  dis: { full: 'Decision Intelligence Systems (DIS)', short: 'DIS' },
  both: {
    full: 'Partnership Readiness Standards Council (PRSC) / Decision Intelligence Systems (DIS)',
    short: 'PRSC and DIS',
  },
}

function capitalizeName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('en-US'))
}

export const InviteEmail = ({
  confirmationUrl,
  firstName = 'there',
  recipientEmail,
  entity = 'both',
  roleLabel = 'Board Member or Advisor',
}: InviteEmailProps) => {
  const inviteeName = capitalizeName(firstName) || 'There'
  const selectedEntity = entityCopy[entity]
  const showPrsc = entity === 'prsc' || entity === 'both'
  const showDis = entity === 'dis' || entity === 'both'

  return <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your private PRSC &amp; DIS Board &amp; Advisor Center invitation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={masthead}>
          <Row style={logoRow}>
            {showPrsc && <Column style={logoColumn}>
              <Img src={`${APP_ORIGIN}${prscLogo.url}`} width="196" alt="Partnership Readiness Standards Council" style={prscLogoStyle} />
            </Column>}
            {showDis && <Column style={logoColumn}>
              <Img src={`${APP_ORIGIN}${disLogo.url}`} width="196" alt="Decision Intelligence Systems" style={disLogoStyle} />
            </Column>}
          </Row>
          <Text style={centerName}>Private Board &amp; Advisor Center</Text>
        </Section>
        <Section style={content}>
          <Text style={eyebrow}>Private invitation</Text>
          <Heading style={h1}>Welcome, {inviteeName}!</Heading>
          <Text style={lead}>It&apos;s been a while since we spoke!</Text>
          <Text style={text}>You’re receiving this invitation because we aligned on your role at <strong>{selectedEntity.full}</strong> as a <strong>{roleLabel}</strong>.</Text>
          <Text style={text}>A great deal has happened behind the scenes. We’ve reached an important next stage—including DIS officially entering investor prospecting—and we’re excited to reconnect and bring you into what comes next.</Text>
          <Text style={text}>We’ve created a private {selectedEntity.short} Board &amp; Advisor Welcome Center where you can quickly:</Text>
          <Section style={list}>
            <Text style={listItem}>• Get reacquainted with {selectedEntity.short} and see where we are today</Text>
            <Text style={listItem}>• Review why we’re excited to have you involved</Text>
            <Text style={listItem}>• Provide a few details we need to prepare your individualized Board/Advisor package</Text>
            <Text style={listItem}>• <Link href="mailto:info@readinessterminal.com" style={questionLink}>Send us any questions</Link> before your formal materials are delivered</Text>
          </Section>
          <Button style={button} href={confirmationUrl}>Access Your Private Welcome Center →</Button>
          <Text style={instruction}>After you click the button, you’ll create your own private password on the secure invitation page. No password will be sent by email. Once your password is set, you’ll enter the Welcome Center immediately.</Text>
          <Text style={text}>We’re excited to reconnect and officially welcome you into this next chapter.</Text>
          <Text style={signoff}>Warmly,</Text>
          <Text style={signature}>Shirley Johnson</Text>
          <Text style={signatureTitle}>Founder<br />Partnership Readiness Standards Council / Decision Intelligence Systems</Text>
        </Section>
        <Section style={securityFooter}>
          <Text style={securityText}>This invitation was sent specifically to <Link href={`mailto:${recipientEmail}`} style={footerLink}>{recipientEmail}</Link> in connection with your previously discussed PRSC/DIS Board or Advisor role. If you have questions about this invitation before accessing the portal, contact us at <Link href="mailto:info@readinessterminal.com" style={footerLink}>info@readinessterminal.com</Link>.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
}

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "Georgia, 'Times New Roman', serif", margin: 0, padding: 0 }
const container = { width: '100%', maxWidth: '640px', margin: '0 auto', padding: '36px 16px' }
const masthead = { backgroundColor: '#0A1322', padding: '28px 30px', textAlign: 'center' as const }
const logoRow = { width: '100%', margin: '0 auto 16px' }
const logoColumn = { width: '50%', padding: '0 8px', textAlign: 'center' as const }
const prscLogoStyle = { display: 'block', width: '100%', maxWidth: '196px', height: 'auto', margin: '0 auto' }
const disLogoStyle = { display: 'block', width: '100%', maxWidth: '196px', height: 'auto', margin: '0 auto' }
const centerName = { color: '#C8A464', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, margin: 0 }
const content = { borderLeft: '1px solid #E5DDCE', borderRight: '1px solid #E5DDCE', padding: '38px 34px 28px' }
const eyebrow = { color: '#8C6E3B', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, margin: '0 0 12px' }
const h1 = { fontSize: '28px', fontWeight: 'normal' as const, color: '#0A1322', lineHeight: '1.25', margin: '0 0 8px' }
const lead = { fontSize: '17px', color: '#8C6E3B', lineHeight: '1.5', margin: '0 0 22px' }
const text = { fontSize: '15px', color: '#25303F', lineHeight: '1.65', margin: '0 0 18px' }
const list = { margin: '0 0 24px', paddingLeft: '4px' }
const listItem = { ...text, margin: '0 0 8px' }
const questionLink = { color: '#8C6E3B', fontWeight: 'bold' as const, textDecoration: 'underline' }
const button = { backgroundColor: '#C8A464', color: '#0A1322', fontSize: '12px', fontWeight: 'bold' as const, letterSpacing: '0.09em', textTransform: 'uppercase' as const, border: '1px solid #C8A464', borderRadius: '2px', padding: '15px 22px', textDecoration: 'none', margin: '2px 0 24px' }
const signoff = { ...text, margin: '26px 0 2px' }
const instruction = { ...text, backgroundColor: '#F4F1EA', borderLeft: '3px solid #C8A464', padding: '14px 16px', margin: '0 0 22px' }
const signature = { color: '#8C6E3B', fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: '28px', lineHeight: '1.2', margin: '0 0 4px' }
const signatureTitle = { color: '#25303F', fontSize: '12px', lineHeight: '1.55', margin: 0 }
const securityFooter = { backgroundColor: '#0A1322', padding: '20px 28px' }
const securityText = { color: '#B8C0CB', fontFamily: 'Arial, sans-serif', fontSize: '10px', lineHeight: '1.55', margin: 0, textAlign: 'center' as const }
const footerLink = { color: '#D9BD82', textDecoration: 'underline' }
