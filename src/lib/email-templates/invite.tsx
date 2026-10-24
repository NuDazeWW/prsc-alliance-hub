import * as React from 'react'
import { Body, Button, Column, Container, Head, Heading, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components'
import prscLogo from '@/assets/prsc-horizontal-lockup.png.asset.json'
import disLogo from '@/assets/dis-lockup-site.png.asset.json'

export type InviteEntity = 'prsc' | 'dis' | 'both'

export interface InviteEmailProps {
  confirmationUrl: string
  firstName?: string
  recipientEmail: string
  entity?: InviteEntity
  roleLabel?: string
  copy?: InviteEmailCopy | null
  meetingBlock?: string | null
  whyYou?: string | null
}

function MeetingSection({ block }: { block?: string | null }) {
  if (!block?.trim()) return null
  const parts = block.trim().split(/\n\s*\n/)
  return <Section style={meetingBox}>
    <Text style={meetingEyebrow}>Upcoming meeting · please select your availability</Text>
    {parts.map((p, i) => <Text key={i} style={i === 0 ? meetingTitle : meetingText}>{p.split('\n').map((l, li) => <React.Fragment key={li}>{li > 0 && <br />}{l}</React.Fragment>)}</Text>)}
  </Section>
}

export interface InviteEmailCopy {
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  cta_label?: string | null
  cta_subtext?: string | null
  signatures?: string | null
}

function fillInviteTokens(value: string, tokens: Record<string, string>) {
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => tokens[k] ?? m)
}

function renderInline(line: string) {
  const phrase = 'Send us any questions'
  const i = line.indexOf(phrase)
  if (i < 0) return line
  return <>{line.slice(0, i)}<Link href="mailto:info@readinessterminal.com" style={questionLink}>{phrase}</Link>{line.slice(i + phrase.length)}</>
}

const APP_ORIGIN = 'https://access.prscstandards.org'

export const inviteEntityCopy: Record<InviteEntity, { full: string; short: string }> = {
  prsc: { full: 'Partnership Readiness Standards Council, LLC (PRSC)', short: 'PRSC' },
  dis: { full: 'Decision Intelligence Systems, Inc. (DIS)', short: 'DIS' },
  both: {
    full: 'Partnership Readiness Standards Council, LLC (PRSC) / Decision Intelligence Systems, Inc. (DIS)',
    short: 'PRSC and DIS',
  },
}

export function capitalizeInviteName(value: string) {
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
  roleLabel = 'Board or Advisor Candidate',
  copy,
  meetingBlock,
  whyYou,
}: InviteEmailProps) => {
  const inviteeName = capitalizeInviteName(firstName) || 'There'
  const selectedEntity = inviteEntityCopy[entity]
  const showPrsc = entity === 'prsc' || entity === 'both'
  const showDis = entity === 'dis' || entity === 'both'
  if (copy?.body?.trim()) {
    const tokens = { first_name: inviteeName, full_name: inviteeName, entity_full: selectedEntity.full, entity: selectedEntity.short, role: roleLabel, email: recipientEmail, why_you: whyYou?.trim() || 'We have been intentional about who we invite into this next chapter, and your experience and judgment are a meaningful part of why you were selected.' }
    const fill = (v?: string | null, d = '') => fillInviteTokens(v?.trim() || d, tokens)
    const blocks = fill(copy.body).split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((b) => b.length)
    const [sigName, ...sigTitle] = (copy.signatures?.trim() || 'Shirley Johnson|Founder').split('|')
    return <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your private PRSC &amp; DIS Board &amp; Advisor Center invitation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={masthead}>
            <Row style={logoRow}>
              {showPrsc && <Column style={logoColumn}><Img src={`${APP_ORIGIN}${prscLogo.url}`} width="196" alt="Partnership Readiness Standards Council" style={prscLogoStyle} /></Column>}
              {showDis && <Column style={logoColumn}><Img src={`${APP_ORIGIN}${disLogo.url}`} width="196" alt="Decision Intelligence Systems" style={disLogoStyle} /></Column>}
            </Row>
            <Text style={centerName}>Private Board &amp; Advisor Center</Text>
          </Section>
          <Section style={content}>
            <Text style={eyebrow}>{fill(copy.eyebrow, 'Private invitation')}</Text>
            <Heading style={h1}>{fill(copy.heading, 'Welcome, {{first_name}}!')}</Heading>
            {blocks.map((lines, bi) => {
              const isList = lines.every((l) => /^[•\-*]\s/.test(l))
              if (isList) return <Section key={bi} style={list}>{lines.map((l, li) => <Text key={li} style={listItem}>• {renderInline(l.replace(/^[•\-*]\s+/, ''))}</Text>)}</Section>
              const isLast = bi === blocks.length - 1
              return <React.Fragment key={bi}>
                {isLast && blocks.length > 1 && <><Button style={button} href={confirmationUrl}>{fill(copy.cta_label, 'Access Your Private Welcome Center →')}</Button>
                  {copy.cta_subtext?.trim() && <Text style={instruction}>{fill(copy.cta_subtext)}</Text>}</>}
                <Text style={bi === 0 ? lead : text}>{lines.map((l, li) => <React.Fragment key={li}>{li > 0 && <br />}{renderInline(l)}</React.Fragment>)}</Text>
              </React.Fragment>
            })}
            {blocks.length <= 1 && <><Button style={button} href={confirmationUrl}>{fill(copy.cta_label, 'Access Your Private Welcome Center →')}</Button>
              {copy.cta_subtext?.trim() && <Text style={instruction}>{fill(copy.cta_subtext)}</Text>}</>}
            <MeetingSection block={meetingBlock} />
            <Text style={signoff}>Warmly,</Text>
            <Text style={signature}>{sigName.trim()}</Text>
            <Text style={signatureTitle}>{sigTitle.join('|').split(',').map((part, i) => <React.Fragment key={i}>{i > 0 && <br />}{part.trim()}</React.Fragment>)}</Text>
          </Section>
          <Section style={securityFooter}>
            <Text style={securityText}>This invitation was sent specifically to <Link href={`mailto:${recipientEmail}`} style={footerLink}>{recipientEmail}</Link> in connection with your previously discussed {roleLabel} role. If you have questions about this invitation before accessing the portal, contact us at <Link href="mailto:info@readinessterminal.com" style={footerLink}>info@readinessterminal.com</Link>.</Text>
            <Text style={securityText}>This invitation provides access to the private onboarding process. Formal entity appointments and authority are governed by separate documentation and authorization.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  }

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
          <MeetingSection block={meetingBlock} />
          <Text style={signoff}>Warmly,</Text>
          <Text style={signature}>Shirley Johnson</Text>
          <Text style={signatureTitle}>Founder<br />Partnership Readiness Standards Council / Decision Intelligence Systems</Text>
        </Section>
        <Section style={securityFooter}>
          <Text style={securityText}>This invitation was sent specifically to <Link href={`mailto:${recipientEmail}`} style={footerLink}>{recipientEmail}</Link> in connection with your previously discussed {roleLabel} role. If you have questions about this invitation before accessing the portal, contact us at <Link href="mailto:info@readinessterminal.com" style={footerLink}>info@readinessterminal.com</Link>.</Text>
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
const meetingBox = { border: '1px solid #C8A464', backgroundColor: '#FBF8F1', padding: '18px 20px', margin: '8px 0 10px' }
const meetingEyebrow = { color: '#8C6E3B', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase' as const, margin: '0 0 10px' }
const meetingTitle = { fontSize: '15px', color: '#0A1322', lineHeight: '1.6', margin: '0 0 12px', fontWeight: 'bold' as const }
const meetingText = { fontSize: '14px', color: '#25303F', lineHeight: '1.6', margin: '0 0 12px' }
