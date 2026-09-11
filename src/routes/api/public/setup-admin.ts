import { createFileRoute } from '@tanstack/react-router'
import { timingSafeEqual } from 'crypto'

export const Route = createFileRoute('/api/public/setup-admin')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = new URL(request.url).searchParams.get('secret') ?? ''
        const expected = process.env.SETUP_SECRET ?? ''
        if (!expected || secret.length !== expected.length || !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        // Prevent repeated bootstraps
        const { data: existing } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
          .limit(1)
          .single()

        if (existing) {
          return new Response(JSON.stringify({ ok: false, message: 'An administrator already exists.' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const email = 'admin@readinessterminal.com'
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: 'PRSC Administrator' },
        })

        if (userError || !userData.user) {
          return new Response(JSON.stringify({ ok: false, error: userError?.message ?? 'User creation failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        await supabaseAdmin.from('user_roles').insert({ user_id: userData.user.id, role: 'admin' })

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: `${process.env.VITE_SITE_URL ?? 'https://access.prscstandards.org'}/auth?mode=recovery`,
          },
        })

        if (linkError) {
          return new Response(JSON.stringify({ ok: true, message: 'Admin created but link generation failed', user_id: userData.user.id, error: linkError.message }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({
          ok: true,
          message: 'Administrator account created. Use the recovery link once to set a password.',
          user_id: userData.user.id,
          recovery_link: linkData.properties?.action_link,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
