import * as React from 'react'
import { createAuthEmailHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { InviteEmail } from '@/lib/email-templates/invite'
import { PortalSignupEmail } from '@/emails/PortalSignupEmail'
import { PortalMagicLinkEmail } from '@/emails/PortalMagicLinkEmail'
import { PortalRecoveryEmail } from '@/emails/PortalRecoveryEmail'
import { PortalEmailChangeEmail } from '@/emails/PortalEmailChangeEmail'
import { PortalReauthenticationEmail } from '@/emails/PortalReauthenticationEmail'
import { memberRoleLabel, memberCandidateLabel } from '@/lib/member-role-labels'
import {
  INVITE_EMAIL_FROM,
  INVITE_EMAIL_SENDER_DOMAIN,
  INVITE_EMAIL_SITE_NAME,
  INVITE_EMAIL_SUBJECT,
  INVITE_ROLE_LABELS,
} from '@/lib/invite-email-config'

// Configuration
const SITE_NAME = INVITE_EMAIL_SITE_NAME
const SENDER_DOMAIN = INVITE_EMAIL_SENDER_DOMAIN

const entityKeys = ['prsc', 'dis', 'both'] as const

// The SDK handler owns verification, dispatch, and retry semantics; this file
// owns only the email decisions: subjects, templates, and per-type props.
export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const handler = createAuthEmailHandler({
          apiKey: process.env['LOVABLE_API_KEY']!,
          from: INVITE_EMAIL_FROM,
          senderDomain: SENDER_DOMAIN,
          sendUrl: process.env['LOVABLE_SEND_URL'],
          emails: {
            signup: {
              subject: 'Confirm your PRSC private center email',
              render: (data) => React.createElement(PortalSignupEmail, { confirmationUrl: data.url }),
            },
            invite: {
              subject: INVITE_EMAIL_SUBJECT,
              render: async (data) => {
                const callback = new URL(data.callback_url ?? data.url)
                const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
                const { data: member } = await supabaseAdmin
                  .from('portal_members')
                  .select('first_name, entity, role, why_you, is_candidate')
                  .eq('email', data.email.toLowerCase())
                  .maybeSingle()
                const { data: inviteCopy } = await supabaseAdmin
                  .from('portal_email_templates')
                  .select('eyebrow, heading, body, cta_label, cta_subtext, signatures')
                  .eq('system_key', 'invite')
                  .maybeSingle()
                const { SYSTEM_EMAIL_DEFAULTS, isOutdatedSavedInvite } = await import('@/lib/system-email-defaults')
                const activeInviteCopy = isOutdatedSavedInvite('invite', inviteCopy?.body) ? SYSTEM_EMAIL_DEFAULTS.invite : inviteCopy
                const callbackEntity = callback.searchParams.get('entity')
                const callbackRole = callback.searchParams.get('role')
                const entityValue = member?.entity ?? callbackEntity
                const entity = entityKeys.find((value) => value === entityValue) ?? 'both'
                const role = (member?.role ?? callbackRole) as keyof typeof INVITE_ROLE_LABELS | undefined
                const pollId = callback.searchParams.get('poll')
                let meetingBlock: string | null = null
                if (pollId && /^[0-9a-f-]{36}$/i.test(pollId)) {
                  const { loadOpenPoll } = await import('@/lib/meeting-poll.server')
                  meetingBlock = (await loadOpenPoll(pollId))?.block ?? null
                }
                return React.createElement(InviteEmail, {
                  confirmationUrl: data.url,
                  recipientEmail: data.email,
                  firstName: member?.first_name ?? callback.searchParams.get('first_name') ?? 'there',
                  entity,
                  roleLabel: memberCandidateLabel(role, entity, member?.is_candidate ?? callback.searchParams.get('candidate') === '1'),
                  copy: activeInviteCopy,
                  meetingBlock,
                  whyYou: member?.why_you ?? null,
                })
              },
            },
            magiclink: {
              subject: 'Sign in to the PRSC private center',
              render: (data) => React.createElement(PortalMagicLinkEmail, { confirmationUrl: data.url }),
            },
            recovery: {
              subject: 'Reset your PRSC private center password',
              render: (data) => React.createElement(PortalRecoveryEmail, { confirmationUrl: data.url }),
            },
            email_change: {
              subject: 'Confirm your new PRSC private center email',
              render: (data) => React.createElement(PortalEmailChangeEmail, { confirmationUrl: data.url }),
            },
            reauthentication: {
              subject: 'Your PRSC private center verification code',
              render: (data) => React.createElement(PortalReauthenticationEmail, { token: data.token ?? '' }),
            },
          },
        })
        return handler(request)
      },
    },
  },
})
