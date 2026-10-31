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

function renderInline(line: string): React.ReactNode {
  // **bold**, *italic*, and the "Send us any questions" mailto link.
  const parts: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  const plain = (t: string) => {
    const phrase = 'Send us any questions'
    const i = t.indexOf(phrase)
    if (i < 0) return t
    return <>{t.slice(0, i)}<Link href="mailto:info@readinessterminal.com" style={questionLink}>{phrase}</Link>{t.slice(i + phrase.length)}</>
  }
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(<React.Fragment key={k++}>{plain(line.slice(last, m.index))}</React.Fragment>)
    parts.push(m[1] !== undefined ? <strong key={k++}>{m[1]}</strong> : <em key={k++}>{m[2]}</em>)
    last = m.index + m[0].length
  }
  if (last < line.length) parts.push(<React.Fragment key={k++}>{plain(line.slice(last))}</React.Fragment>)
  return <>{parts}</>
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

function InviteLayout({ inviteeName, short, forumOnly, disOnly, confirmationUrl, ctaLabel, ctaSubtext, whyYou, recipientEmail, roleLabel, letter, footnote, meetingBlock }: {
  inviteeName: string; short: string; forumOnly: boolean; disOnly: boolean; confirmationUrl: string; ctaLabel: string; ctaSubtext?: string | null
  whyYou?: string | null; recipientEmail: string; roleLabel: string; letter: React.ReactNode; footnote?: React.ReactNode; meetingBlock?: string | null
}) {
  const steps = forumOnly
    ? [
        STEPS[0],
        { ...STEPS[1], text: 'A short overview of the Forum, PRSC and DIS, and what happens next.' },
        { icon: 'icon-calendar.png', title: ['Share your', 'availability'], text: 'Mark the times that work when the Forum poll opens.' },
        { icon: 'icon-document.png', title: ['Prepare for', 'the Forum'], text: 'Complete your Forum profile, review the pre-read and participation boundaries, and confirm conflicts.' },
      ]
    : [
        ...STEPS,
        { icon: 'icon-calendar.png', title: ['Review your', 'onboarding materials'], text: 'See what the administrator has released for you.' },
      ]
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
              <tr><td className="mobile-pad" {...bg('bg-navy', '#0A1322')} style={{ padding: '0 14px 22px', ...bgCss('bg-navy', '#0A1322') }}>
                <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" {...({ background: `${EMAIL_ASSET_BASE}/parchment-cream.jpg` } as Record<string, string>)} bgcolor="#F2EFE6" style={{ width: '100%', backgroundColor: '#F2EFE6', backgroundImage: `url(${EMAIL_ASSET_BASE}/parchment-cream.jpg)`, border: '1px solid #C9A24A', borderRadius: '6px' }}>
                  <tbody><tr><td className="mobile-pad" style={{ padding: '30px 14px 32px' }}>
                    <div>{letter}</div>
                    <div style={{ marginTop: '30px', paddingTop: '26px', borderTop: '1px solid #C9A24A' }} />
                    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ width: '100%', marginBottom: '22px' }}>
                      <tbody><tr>
                        <td style={{ borderBottom: '1px solid #C9A24A', width: '18%', fontSize: '1px', lineHeight: '1px', height: '14px' }}>&nbsp;</td>
                        <td style={stepsHeading}>YOUR NEXT STEPS</td>
                        <td style={{ borderBottom: '1px solid #C9A24A', width: '18%', fontSize: '1px', lineHeight: '1px', height: '14px' }}>&nbsp;</td>
                      </tr></tbody>
                    </table>
                    <table className="step-table" role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ width: '100%' }}>
                      <tbody><tr>
                        {steps.map((st, i) => <td key={i} className="step-column" valign="top" width="25%" style={{ width: '25%', borderRight: i < 3 ? '1px solid #D9C28A' : undefined, padding: '0 5px 12px', verticalAlign: 'top' }}>
                          <Img src={`${EMAIL_ASSET_BASE}/${st.icon}`} width="64" height="64" alt="" style={{ display: 'block', width: '64px', height: '64px', maxWidth: '64px', margin: '0 auto 8px' }} />
                          <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '0 auto' }}>
                            <tbody><tr>
                              <td valign="top" style={{ ...stepNumber, paddingRight: '5px' }}>{i + 1}</td>
                              <td valign="top" style={{ textAlign: 'left' }}><div style={stepTitle}><Lines lines={st.title} /></div></td>
                            </tr></tbody>
                          </table>
                          <div style={stepText}>{st.text}</div>
                        </td>)}
                      </tr></tbody>
                    </table>
                    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" {...bg('bg-navy', '#0A1322')} style={{ marginTop: '26px', ...bgCss('bg-navy', '#0A1322'), backgroundImage: 'linear-gradient(100deg,#0A1322 0%,#16233B 55%,#0A1322 100%)', border: '2px solid #B98925', borderRadius: '8px' }}>
                      <tbody><tr>
                        <td width={104} valign="middle" style={{ width: '104px', padding: '14px 12px 14px 18px', textAlign: 'center' }}><Img src={`${EMAIL_ASSET_BASE}/icon-security.png`} alt="" width="76" height="76" style={{ display: 'block', width: '76px', height: '76px' }} /></td>
                        <td valign="middle" style={{ padding: '16px 22px 16px 18px', borderLeft: '1px solid #8C6E3B' }}><div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '24px', color: '#F2EFE6' }}>Your private portal helps you review assigned materials, complete required actions, and prepare for the next steps in your journey.</div></td>
                      </tr></tbody>
                    </table>
                    {whyYou?.trim() && <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ marginTop: '22px' }}>
                      <tbody><tr><td style={{ padding: '17px 12px 18px', textAlign: 'center', borderTop: '1px solid #C9A24A', borderBottom: '1px solid #C9A24A' }}>
                        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#8C6E3B', fontSize: '16px', lineHeight: '22px', marginBottom: '7px' }}>Why You&apos;re Here</div>
                        <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#403B34', fontSize: '14px', lineHeight: '22px' }}>{whyYou.trim()}</div>
                      </td></tr></tbody>
                    </table>}
                    <div style={{ marginTop: '22px' }}><MeetingSection block={meetingBlock} /></div>
                    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '28px auto 10px' }}>
                      <tbody><tr><td align="center" bgcolor="#D9AE45" style={goldButtonCell}>
                        <a href={confirmationUrl} style={ctaLink}>{ctaLabel} &nbsp;→</a>
                      </td></tr></tbody>
                    </table>
                    {ctaSubtext?.trim() && <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', lineHeight: '19px', color: '#4B4D4E', textAlign: 'center', margin: '12px 0 0' }}>{ctaSubtext.trim()}</div>}
                    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', lineHeight: '20px', color: '#123D64', textAlign: 'center', marginTop: '14px' }}>Questions? <Link href="mailto:info@readinessterminal.com" style={{ color: '#123D64', textDecoration: 'underline' }}>Reply to this email</Link></div>
                    {footnote && <div style={{ marginTop: '26px', paddingTop: '18px', borderTop: '1px solid #C9A24A' }}>{footnote}</div>}
                  </td></tr></tbody>
                </table>
              </td></tr>
              <tr><td align="center" {...bg('bg-navy', '#0A1322')} style={{ ...bgCss('bg-navy', '#0A1322'), padding: '8px 30px 28px' }}>
                <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ width: '100%', marginBottom: '16px' }}>
                  <tbody><tr>
                    <td style={{ borderBottom: '1px solid #B98925', fontSize: '1px', lineHeight: '1px' }}>&nbsp;</td>
                    <td width={30} align="center" style={{ width: '30px', color: '#D4AF37', fontSize: '14px', lineHeight: '14px' }}>◆</td>
                    <td style={{ borderBottom: '1px solid #B98925', fontSize: '1px', lineHeight: '1px' }}>&nbsp;</td>
                  </tr></tbody>
                </table>
                <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#D4AF37', fontSize: '12px', lineHeight: '18px', letterSpacing: '3px' }}>PARTNERSHIP READINESS STANDARDS COUNCIL, LLC</div>
                <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#BAC0CA', fontSize: '10px', lineHeight: '17px', letterSpacing: '2px', marginTop: '9px' }}>SECURE ACCESS FOR INVITED PARTICIPANTS ONLY.</div>
                <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#9AA6B7', fontSize: '11px', lineHeight: '17px', marginTop: '12px' }}>This invitation was sent specifically to <Link href={`mailto:${recipientEmail}`} style={footerLink}>{recipientEmail}</Link>{forumOnly ? '.' : <> in connection with your previously discussed {roleLabel} role.</>} It provides access to the private onboarding process and does not constitute appointment to PRSC or DIS. Formal entity appointments and authority are governed by separate documentation and authorization.</div>
              </td></tr>
              <tr><td style={{ height: '8px', lineHeight: '8px', fontSize: '1px', backgroundColor: '#B98925', backgroundImage: 'linear-gradient(90deg,#8C6E3B,#E6C56A,#8C6E3B)' }}>&nbsp;</td></tr>
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
    const allBlocks = fill(copy.body).split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((b) => b.length)
    // Blocks that start with [footer] print small and italic under the signature.
    const isFooter = (b: string[]) => /^\[footer\]/i.test(b[0])
    const blocks = allBlocks.filter((b) => !isFooter(b))
    const footers = allBlocks.filter(isFooter).map((b) => [b[0].replace(/^\[footer\]\s*/i, ''), ...b.slice(1)].filter(Boolean))
    const sigName = (copy.signatures?.trim() || 'Shirley Johnson').split('|')[0].split(',')[0]
    // The letter below the button already carries the "Why You're Here" note when the saved copy uses that token.
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
    </>
    const footnoteNode = footers.length ? <>{footers.map((lines, fi) => <Text key={fi} style={{ ...footnote, margin: 0 }}>{lines.map((l, li) => <React.Fragment key={li}>{li > 0 && <br />}{renderInline(l)}</React.Fragment>)}</Text>)}</> : null
    return <InviteLayout {...layout} footnote={footnoteNode} ctaLabel={fill(copy.cta_label, 'Accept Your Private Invitation')} ctaSubtext={copy.cta_subtext?.trim() ? fill(copy.cta_subtext) : null} whyYou={null} letter={letter} />
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
  </>
  return <InviteLayout {...layout} ctaLabel="Access Your Private Welcome Center" ctaSubtext="After you click the button, you’ll create your own private password on the secure invitation page. No password will be sent by email." whyYou={whyYou} letter={letter} />
}

export default InviteEmail

const main = { backgroundColor: '#071221', fontFamily: "Georgia, 'Times New Roman', serif", margin: 0, padding: 0 }
const eyebrowGold = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '3px', lineHeight: '18px', color: '#D4AF37', marginBottom: '12px' }
const heroTitle = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '37px', lineHeight: '45px', color: '#F2EFE6', fontWeight: 'normal' as const, letterSpacing: '-0.5px', marginBottom: '16px' }
const heroLead = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '24px', color: '#DFE5EC', padding: '0 8px' }
const stepsHeading = { fontFamily: "Georgia, 'Times New Roman', serif", textAlign: 'center' as const, color: '#8C6E3B', fontSize: '20px', lineHeight: '26px', letterSpacing: '5px', padding: '0 14px', whiteSpace: 'nowrap' as const }
const stepNumber = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '34px', lineHeight: '36px', color: '#B8862A' }
const stepTitle = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '14px', lineHeight: '19px', color: '#0A1322', fontWeight: 'bold' as const, textAlign: 'left' as const }
const stepText = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', lineHeight: '18px', color: '#4E4A45', paddingTop: '8px', textAlign: 'center' as const }
const goldButtonCell = { backgroundColor: '#D9AE45', backgroundImage: 'linear-gradient(180deg,#F0D27A 0%,#D9AE45 48%,#BC8B28 100%)', border: '1px solid #A47A22', borderRadius: '6px', boxShadow: '0 3px 6px rgba(60,40,0,0.35)', padding: '18px 38px' }
const ctaLink = { display: 'block', textAlign: 'center' as const, fontFamily: "Georgia, 'Times New Roman', serif", textDecoration: 'none', color: '#0A1322', fontSize: '17px', lineHeight: '24px', fontWeight: 'bold' as const, letterSpacing: '3px', textTransform: 'uppercase' as const, padding: 0, whiteSpace: 'normal' as const }
const eyebrow = { color: '#8C6E3B', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, margin: '0 0 10px' }
const h1 = { fontSize: '24px', fontWeight: 'normal' as const, color: '#0A1322', lineHeight: '1.25', margin: '0 0 14px' }
const lead = { fontSize: '17px', color: '#8C6E3B', lineHeight: '1.5', margin: '0 0 20px' }
const footnote = { fontSize: '12px', fontStyle: 'italic', color: '#5B6472', lineHeight: '1.55', margin: '22px 0 0' }
const text = { fontSize: '15px', color: '#25303F', lineHeight: '1.65', margin: '0 0 18px' }
const list = { margin: '0 0 22px', paddingLeft: '4px' }
const listItem = { ...text, margin: '0 0 8px' }
const questionLink = { color: '#8C6E3B', fontWeight: 'bold' as const, textDecoration: 'underline' }
const signoff = { ...text, margin: '26px 0 2px' }
const signature = { color: '#8C6E3B', fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: '28px', lineHeight: '1.2', margin: '0 0 4px' }
const footerLink = { color: '#D9BD82', textDecoration: 'underline' }
const meetingBox = { border: '1px solid #D4AF37', backgroundColor: '#FBF8F1', padding: '18px 20px', margin: '8px 0 10px' }
const meetingEyebrow = { color: '#8C6E3B', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase' as const, margin: '0 0 10px' }
const meetingTitle = { fontSize: '15px', color: '#0A1322', lineHeight: '1.6', margin: '0 0 12px', fontWeight: 'bold' as const }
const meetingText = { fontSize: '14px', color: '#25303F', lineHeight: '1.6', margin: '0 0 12px' }
