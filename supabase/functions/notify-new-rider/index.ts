import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Web push implementation using web-push compatible approach
// VAPID Public Key (same as frontend)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrqLHJWSqdnuOBuoXA4'
const VAPID_PRIVATE_KEY = 'cHoGz_ViTvjBTm6bLo7J7qiqO0sDFkgxE_fBhCbEAe4'
const VAPID_SUBJECT = 'mailto:admin@minnit.in'

serve(async (req) => {
  try {
    const body = await req.json()
    const record = body.record // new rider_profiles row
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all push subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const payload = JSON.stringify({
      title: '🛵 New Rider Registration!',
      body: `${record.name || 'A new rider'} has registered and needs KYC verification.`,
      tag: 'new-rider-' + record.id,
      url: '/fleet',
      actions: [
        { action: 'view', title: 'View Application' }
      ]
    })

    // Send push to each subscription using web-push
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }
        
        // Use the web-push npm package via esm.sh
        const webpush = await import('https://esm.sh/web-push@3.6.7')
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
        await webpush.sendNotification(pushSubscription, payload)
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, total: subscriptions.length }), { status: 200 })
  } catch (err) {
    console.error('Push notification error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
