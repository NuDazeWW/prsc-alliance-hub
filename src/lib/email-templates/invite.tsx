import * as React from 'react'
import { Body, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'
import disLogo from '@/assets/dis-lockup-site.png.asset.json'
import { FORUM_INVITEE_LABEL, FORUM_ENTITY_LABEL, FORUM_ENTITY_FULL_NAME } from '@/lib/member-role-labels'
import { SYSTEM_EMAIL_DEFAULTS } from '@/lib/system-email-defaults'
import { EMAIL_ASSET_BASE, EMAIL_RESPONSIVE_CSS } from '@/lib/branded-email'

// Solid-colour images behind coloured blocks: dark modes recolour plain background colours but leave images alone.
const bg = (name: string, color: string) => ({ background: `${EMAIL_ASSET_BASE}/${name}.png`, bgcolor: color } as Record<string, string>)
const bgCss = (name: string, color: string) => ({ backgroundColor: color, backgroundImage: `url(${EMAIL_ASSET_BASE}/${name}.png)` })

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

const STEPS = [
  { icon: 'icon-account.png', title: ['Activate', 'your account'], text: 'Use your invitation to create your secure login.' },
  { icon: 'icon-orientation.png', title: ['Take the 5-minute', 'orientation'], text: 'Get to know the Forum, the organizations, and what happens next.' },
  { icon: 'icon-document.png', title: ['Complete your', 'executive profile'], text: 'Share your experience, interests, and perspective. You can do this later.' },
]

function Lines({ lines }: { lines: string[] }) {
  return <>{lines.map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</>
}

function InviteLayout({ inviteeName, short, forumOnly, disOnly, confirmationUrl, ctaLabel, ctaSubtext, whyYou, recipientEmail, roleLabel, letter, meetingBlock }: {
  inviteeName: string; short: string; forumOnly: boolean; disOnly: boolean; confirmationUrl: string; ctaLabel: string; ctaSubtext?: string | null
  whyYou?: string | null; recipientEmail: string; roleLabel: string; letter: React.ReactNode; meetingBlock?: string | null
}) {
  const step4 = forumOnly
    ? { icon: 'icon-calendar.png', title: ['Prepare for', 'the United Forum'], text: 'Share availability and review materials released for you.' }
    : { icon: 'icon-calendar.png', title: ['Review your', 'onboarding materials'], text: 'See what the administrator has released for you.' }
  const steps = [...STEPS, step4]
  return <Html lang="en" dir="ltr">
    <Head><style dangerouslySetInnerHTML={{ __html: EMAIL_RESPONSIVE_CSS }} /></Head>
    <Preview>A private invitation to the {short} Board &amp; Advisor Center.</Preview>
    <Body {...bg('bg-outer', '#071221')} style={{ ...main, ...bgCss('bg-outer', '#071221') }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" {...bg('bg-outer', '#071221')} style={{ width: '100%', ...bgCss('bg-outer', '#071221') }}>
        <tbody><tr><td align="center" style={{ padding: '24px 12px 32px' }}>
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width={600} className="email-shell" {...bg('bg-navy', '#0A1322')} style={{ width: '600px', maxWidth: '600px', ...bgCss('bg-navy', '#0A1322') }}>
            <tbody>
              <tr><td><Img className="mobile-fluid" src={`${EMAIL_ASSET_BASE}/${disOnly ? 'prsc-header-1200.jpg' : 'prsc-hero-1200.jpg'}`} width="600" height={disOnly ? '200' : '380'} alt={disOnly ? '' : 'PRSC — Partnership Readiness Standards Council'} style={{ display: 'block', width: '600px', maxWidth: '100%', height: 'auto' }} /></td></tr>
              <tr><td align="center" className="mobile-pad" {...bg('bg-navy', '#0A1322')} style={{ padding: disOnly ? '12px 34px 36px' : '0 34px 36px', ...bgCss('bg-navy', '#0A1322') }}>
                {disOnly &&
                  <Img src={`${APP_ORIGIN}${disLogo.url}`} width="196" alt="Decision Intelligence Systems" style={{ display: 'block', width: '196px', maxWidth: '196px', height: 'auto', margin: '0 auto 17px' }} />}
                <div style={eyebrowGold}>PRIVATE BOARD &amp; ADVISOR CENTER</div>
                <div className="hero-title" style={heroTitle}>Welcome to the <span style={{ color: '#F5D885' }}>{short}</span><br />Member Portal</div>
                <div style={heroLead}>Hello {inviteeName}, you&apos;ve been invited to access your secure portal for orientation, professional profile information, and the next steps relevant to your invitation.</div>
                <div style={{ margin: '20px auto 0', width: '72px', borderTop: '2px solid #D4AF37', lineHeight: '1px', fontSize: '1px' }}>&nbsp;</div>
              </td></tr>
              <tr><td className="mobile-pad" {...bg('bg-cream', '#F2EFE6')} style={{ padding: '32px 27px 34px', ...bgCss('bg-cream', '#F2EFE6') }}>
                <div style={stepsHeading}>YOUR NEXT STEPS</div>
                <table className="step-table" role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ width: '100%' }}>
                  <tbody><tr>
                    {steps.map((st, i) => <td key={i} className="step-column" valign="top" width="25%" style={{ width: '25%', borderRight: i < 3 ? '1px solid #D9CBA8' : undefined, padding: '0 10px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                      <Img src={`${EMAIL_ASSET_BASE}/${st.icon}`} width="64" height="64" alt="" style={{ display: 'block', width: '64px', height: '64px', maxWidth: '64px', margin: '0 auto 10px' }} />
                      <div style={stepNumber}>{i + 1}</div>
                      <div style={stepTitle}><Lines lines={st.title} /></div>
                      <div style={stepText}>{st.text}</div>
                    </td>)}
                  </tr></tbody>
                </table>
                <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" {...bg('bg-navy', '#0A1322')} style={{ marginTop: '25px', ...bgCss('bg-navy', '#0A1322'), border: '1px solid #B98925' }}>
                  <tbody><tr>
                    <td width={86} valign="middle" style={{ width: '86px', padding: '15px 11px 15px 16px', textAlign: 'center' }}><Img src={`${EMAIL_ASSET_BASE}/icon-security.png`} alt="" width="66" height="66" style={{ display: 'block', width: '66px', height: '66px' }} /></td>
                    <td valign="middle" style={{ padding: '16px 19px 16px 13px', borderLeft: '1px solid #8C6E3B' }}><div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', lineHeight: '21px', color: '#F2EFE6' }}>Your private portal helps you review assigned materials, complete required actions, and prepare for the next steps in your journey.</div></td>
                  </tr></tbody>
                </table>
                {whyYou?.trim() && <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ marginTop: '22px' }}>
                  <tbody><tr><td style={{ padding: '17px 12px 18px', textAlign: 'center', borderTop: '1px solid #D9CBA8', borderBottom: '1px solid #D9CBA8' }}>
                    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#8C6E3B', fontSize: '15px', lineHeight: '20px', marginBottom: '7px' }}>Why You&apos;re Here</div>
                    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#403B34', fontSize: '13px', lineHeight: '21px' }}>{whyYou.trim()}</div>
                  </td></tr></tbody>
                </table>}
                <div style={{ marginTop: '22px' }}><MeetingSection block={meetingBlock} /></div>
                <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '28px auto 10px' }}>
                  <tbody><tr><td align="center" style={{ backgroundColor: '#D4AF37', border: '1px solid #8C6E3B', borderRadius: '5px' }}>
                    <a href={confirmationUrl} style={ctaLink}>{ctaLabel} &nbsp; →</a>
                  </td></tr></tbody>
                </table>
                {ctaSubtext?.trim() && <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', lineHeight: '19px', color: '#4B4D4E', textAlign: 'center', margin: '12px 0 0' }}>{ctaSubtext.trim()}</div>}
                <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', lineHeight: '19px', color: '#4B4D4E', textAlign: 'center', marginTop: '14px' }}>Questions? <Link href="mailto:info@readinessterminal.com" style={{ color: '#123D64', textDecoration: 'underline' }}>Contact the PRSC team</Link>.</div>
                <div style={{ marginTop: '30px', paddingTop: '26px', borderTop: '1px solid #D9CBA8' }}>{letter}</div>
              </td></tr>
              <tr><td align="center" {...bg('bg-navy', '#0A1322')} style={{ ...bgCss('bg-navy', '#0A1322'), padding: '25px 30px 30px', borderTop: '3px solid #B98925' }}>
                <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#D4AF37', fontSize: '12px', lineHeight: '18px', letterSpacing: '2px' }}>PARTNERSHIP READINESS STANDARDS COUNCIL, LLC</div>
                <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#BAC0CA', fontSize: '10px', lineHeight: '17px', letterSpacing: '1px', marginTop: '9px' }}>Secure access for invited participants only.</div>
                <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#9AA6B7', fontSize: '11px', lineHeight: '17px', marginTop: '12px' }}>This invitation was sent specifically to <Link href={`mailto:${recipientEmail}`} style={footerLink}>{recipientEmail}</Link>{forumOnly ? '.' : <> in connection with your previously discussed {roleLabel} role.</>} It provides access to the private onboarding process and does not constitute appointment to PRSC or DIS. Formal entity appointments and authority are governed by separate documentation and authorization.</div>
              </td></tr>
            </tbody>
          </table>
        </td></tr></tbody>
      </table>
    </Body>
  </Html>
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
  const forumOnly = roleLabel === FORUM_INVITEE_LABEL
  const selectedEntity = forumOnly ? { full: FORUM_ENTITY_FULL_NAME, short: FORUM_ENTITY_LABEL } : inviteEntityCopy[entity]
  const disOnly = !forumOnly && entity === 'dis'
  const short = forumOnly ? 'PRSC' : selectedEntity.short
  // The existing auth hook already supplies the Forum-only label. Preserve saved
  // administrator copy, and use the approved orientation copy for an empty fallback.
  if (!copy?.body?.trim() && forumOnly) copy = SYSTEM_EMAIL_DEFAULTS.invite
  const layout = { meetingBlock, inviteeName, short, forumOnly, disOnly, confirmationUrl, recipientEmail, roleLabel }

  if (copy?.body?.trim()) {
    const tokens = { first_name: inviteeName, full_name: inviteeName, entity_full: selectedEntity.full, entity: selectedEntity.short, role: roleLabel, email: recipientEmail, why_you: whyYou?.trim() || 'We have been intentional about who we invite into this next chapter, and your experience and judgment are a meaningful part of why you were selected.' }
    const fill = (v?: string | null, d = '') => fillInviteTokens(v?.trim() || d, tokens)
    const blocks = fill(copy.body).split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((b) => b.length)
    const [sigName, ...sigTitle] = (copy.signatures?.trim() || 'Shirley Johnson|Founder').split('|')
    // The letter below the button already carries the "Why You're Here" note when the saved copy uses that token.
    const whyInBody = /\{\{\s*why_you\s*\}\}/.test(copy.body)
    const letter = <>
      <Text style={eyebrow}>{fill(copy.eyebrow, 'Private invitation')}</Text>
      <Text style={h1}>{fill(copy.heading, 'Welcome, {{first_name}}!')}</Text>
      {blocks.map((lines, bi) => {
        const isList = lines.every((l) => /^[•\-*]\s/.test(l))
        if (isList) return <Section key={bi} style={list}>{lines.map((l, li) => <Text key={li} style={listItem}>• {renderInline(l.replace(/^[•\-*]\s+/, ''))}</Text>)}</Section>
        return <Text key={bi} style={bi === 0 ? lead : text}>{lines.map((l, li) => <React.Fragment key={li}>{li > 0 && <br />}{renderInline(l)}</React.Fragment>)}</Text>
      })}
      <Text style={signoff}>Warmly,</Text>
      <Text style={signature}>{sigName.trim()}</Text>
      <Text style={signatureTitle}><Lines lines={sigTitle.join('|').split(',').map((part) => part.trim())} /></Text>
    </>
    return <InviteLayout {...layout} ctaLabel={fill(copy.cta_label, 'Accept Your Private Invitation')} ctaSubtext={copy.cta_subtext?.trim() ? fill(copy.cta_subtext) : null} whyYou={whyInBody ? null : whyYou} letter={letter} />
  }

  const letter = <>
    <Text style={eyebrow}>Private invitation</Text>
    <Text style={h1}>Welcome, {inviteeName}!</Text>
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
    <Text style={text}>We’re excited to reconnect and officially welcome you into this next chapter.</Text>
    <Text style={signoff}>Warmly,</Text>
    <Text style={signature}>Shirley Johnson</Text>
    <Text style={signatureTitle}>Founder<br />Partnership Readiness Standards Council / Decision Intelligence Systems</Text>
  </>
  return <InviteLayout {...layout} ctaLabel="Access Your Private Welcome Center" ctaSubtext="After you click the button, you’ll create your own private password on the secure invitation page. No password will be sent by email." whyYou={whyYou} letter={letter} />
}

export default InviteEmail

const main = { backgroundColor: '#071221', fontFamily: "Georgia, 'Times New Roman', serif", margin: 0, padding: 0 }
const eyebrowGold = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '3px', lineHeight: '18px', color: '#D4AF37', marginBottom: '12px' }
const heroTitle = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '37px', lineHeight: '45px', color: '#F2EFE6', fontWeight: 'normal' as const, letterSpacing: '-0.5px', marginBottom: '16px' }
const heroLead = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '24px', color: '#DFE5EC', padding: '0 8px' }
const stepsHeading = { fontFamily: "Georgia, 'Times New Roman', serif", textAlign: 'center' as const, color: '#8C6E3B', fontSize: '19px', lineHeight: '26px', letterSpacing: '4px', marginBottom: '23px' }
const stepNumber = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '25px', lineHeight: '27px', color: '#A4771C', paddingBottom: '4px' }
const stepTitle = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '15px', lineHeight: '20px', color: '#0A1322', fontWeight: 'bold' as const, minHeight: '42px' }
const stepText = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', lineHeight: '19px', color: '#4E4A45', paddingTop: '8px' }
const ctaLink = { display: 'inline-block', fontFamily: 'Arial, Helvetica, sans-serif', textDecoration: 'none', color: '#091424', fontSize: '15px', lineHeight: '22px', fontWeight: 'bold' as const, letterSpacing: '1.5px', textTransform: 'uppercase' as const, padding: '17px 30px', whiteSpace: 'normal' as const }
const eyebrow = { color: '#8C6E3B', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, margin: '0 0 10px' }
const h1 = { fontSize: '24px', fontWeight: 'normal' as const, color: '#0A1322', lineHeight: '1.25', margin: '0 0 14px' }
const lead = { fontSize: '17px', color: '#8C6E3B', lineHeight: '1.5', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#25303F', lineHeight: '1.65', margin: '0 0 18px' }
const list = { margin: '0 0 22px', paddingLeft: '4px' }
const listItem = { ...text, margin: '0 0 8px' }
const questionLink = { color: '#8C6E3B', fontWeight: 'bold' as const, textDecoration: 'underline' }
const signoff = { ...text, margin: '26px 0 2px' }
const signature = { color: '#8C6E3B', fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: '28px', lineHeight: '1.2', margin: '0 0 4px' }
const signatureTitle = { color: '#25303F', fontSize: '12px', lineHeight: '1.55', margin: 0 }
const footerLink = { color: '#D9BD82', textDecoration: 'underline' }
const meetingBox = { border: '1px solid #D4AF37', backgroundColor: '#FBF8F1', padding: '18px 20px', margin: '8px 0 10px' }
const meetingEyebrow = { color: '#8C6E3B', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase' as const, margin: '0 0 10px' }
const meetingTitle = { fontSize: '15px', color: '#0A1322', lineHeight: '1.6', margin: '0 0 12px', fontWeight: 'bold' as const }
const meetingText = { fontSize: '14px', color: '#25303F', lineHeight: '1.6', margin: '0 0 12px' }
