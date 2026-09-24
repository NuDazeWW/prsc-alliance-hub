import * as React from 'react'
import { createAuthEmailHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { InviteEmail } from '@/lib/email-templates/invite'
import { PortalSignupEmail } from '@/emails/PortalSignupEmail'
import { PortalMagicLinkEmail } from '@/emails/PortalMagicLinkEmail'
import { PortalRecoveryEmail } from '@/emails/PortalRecoveryEmail'
import { PortalEmailChangeEmail } from '@/emails/PortalEmailChangeEmail'
import { PortalReauthenticationEmail } from '@/emails/PortalReauthenticationEmail'

// Configuration
const SITE_NAME = "PRSC Board & Advisor Center"
const SENDER_DOMAIN = "notify.readinessterminal.com"

const entityLabels = {
  prsc: 'Partnership Readiness Standards Council (PRSC)',
  dis: 'Decision Intelligence Systems (DIS)',
  both: 'Partnership Readiness Standards Council (PRSC) / Decision Intelligence Systems (DIS)',
} as const

const roleLabels = { board_member: 'Board Member', advisor: 'Advisor' } as const

// The SDK handler owns verification, dispatch, and retry semantics; this file
// owns only the email decisions: subjects, templates, and per-type props.
export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const handler = createAuthEmailHandler({
          apiKey: process.env['LOVABLE_API_KEY']!,
          from: `${SITE_NAME} <no-reply@readinessterminal.com>`,
          senderDomain: SENDER_DOMAIN,
          sendUrl: process.env['LOVABLE_SEND_URL'],
          emails: {
            signup: {
              subject: 'Confirm your PRSC private center email',
              render: (data) => React.createElement(PortalSignupEmail, { confirmationUrl: data.url }),
            },
            invite: {
              subject: 'PRSC & DIS | Board & Advisor Center',
              render: async (data) => {
                const callback = new URL(data.callback_url ?? data.url)
                const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
                const { data: member } = await supabaseAdmin
                  .from('portal_members')
                  .select('first_name, entity, role')
                  .eq('email', data.email.toLowerCase())
                  .maybeSingle()
                const callbackEntity = callback.searchParams.get('entity')
                const callbackRole = callback.searchParams.get('role')
                const entity = (member?.entity ?? callbackEntity) as keyof typeof entityLabels | undefined
                const role = (member?.role ?? callbackRole) as keyof typeof roleLabels | undefined
                return React.createElement(InviteEmail, {
                  confirmationUrl: data.url,
                  recipientEmail: data.email,
                  firstName: member?.first_name ?? callback.searchParams.get('first_name') ?? 'there',
                  entityName: entity ? entityLabels[entity] : entityLabels.both,
                  roleLabel: role ? roleLabels[role] : 'Board Member or Advisor',
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
