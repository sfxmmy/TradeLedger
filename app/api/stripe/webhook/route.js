import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription)
          const userId = subscription.metadata?.supabase_user_id

          if (userId) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                stripe_subscription_id: session.subscription
              })
              .eq('id', userId)
            
            console.log(`Activated subscription for user ${userId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          const status = subscription.status === 'active' ? 'active' : 'past_due'
          await supabase
            .from('profiles')
            .update({ subscription_status: status })
            .eq('id', userId)
          
          console.log(`Updated subscription status to ${status} for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          await supabase
            .from('profiles')
            .update({ 
              subscription_status: 'canceled',
              stripe_subscription_id: null
            })
            .eq('id', userId)
          
          console.log(`Canceled subscription for user ${userId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.supabase_user_id

          if (userId) {
            await supabase
              .from('profiles')
              .update({ subscription_status: 'past_due' })
              .eq('id', userId)
            
            console.log(`Payment failed for user ${userId}`)
          }
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  return NextResponse.json({ received: true })
}
