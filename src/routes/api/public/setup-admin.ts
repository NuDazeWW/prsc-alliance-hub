import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/setup-admin')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url)
        const secret = url.searchParams.get('secret') ?? ''
        const expected = process.env.SETUP_SECRET ?? ''
        if (!expected || secret.length !== expected.length || !Buffer.from(secret).equals(Buffer.from(expected))) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const email = 'admin@readinessterminal.com'
        const siteUrl = process.env.VITE_SITE_URL ?? 'https://access.prscstandards.org'

        const { data: existing } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
          .limit(1)
          .maybeSingle()

        if (!existing) {
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
        }

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: `${siteUrl}/auth?mode=recovery`,
          },
        })

        if (linkError) {
          return new Response(JSON.stringify({ ok: false, error: linkError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({
          ok: true,
          message: 'Administrator recovery link generated. Use it once to set a password.',
          recovery_link: linkData.properties?.action_link,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
