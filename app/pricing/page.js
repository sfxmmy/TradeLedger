'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function PricingPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [needsub, setNeedsub] = useState(false)
  const [autoCheckout, setAutoCheckout] = useState(false)

  useEffect(() => {
    // Check URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setNeedsub(params.get('needsub') === 'true')
      setAutoCheckout(params.get('checkout') === 'true')
    }
    
    checkAuth()
  }, [])

  useEffect(() => {
    // Auto-trigger checkout if needed
    if (autoCheckout && user && !hasAccess && !loading) {
      handleSubscribe()
    }
  }, [autoCheckout, user, hasAccess, loading])

  async function checkAuth() {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const isAdmin = user.email === 'ssiagos@hotmail.com'
        
        if (isAdmin) {
          setHasAccess(true)
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single()
          
          setHasAccess(profile?.subscription_status === 'active')
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
    }
    setLoading(false)
  }

  async function handleSubscribe() {
    if (!user) {
      router.push('/signup?redirect=checkout')
      return
    }

    setSubscribing(true)
    
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error: ' + (data.error || 'Could not create checkout session'))
        setSubscribing(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Error creating checkout. Please try again.')
      setSubscribing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      {/* Header */}
      <header style={{ 
        padding: '20px 48px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #1a1a22' 
      }}>
        <a href="/" style={{ fontSize: '22px', fontWeight: 700 }}>
          <span style={{ color: '#22c55e' }}>LSD</span>
          <span style={{ color: '#fff' }}>TRADE+</span>
        </a>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!loading && hasAccess ? (
            <a href="/dashboard" style={{ 
              padding: '12px 24px', 
              background: '#22c55e', 
              borderRadius: '8px', 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: '14px' 
            }}>
              Enter Journal
            </a>
          ) : (
            <a href="/login" style={{ 
              padding: '12px 24px', 
              background: '#1a1a24', 
              border: '1px solid #2a2a35', 
              borderRadius: '8px', 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: '14px' 
            }}>
              Member Login
            </a>
          )}
        </div>
      </header>

      {/* Warning banner */}
      {needsub && user && !hasAccess && (
        <div style={{ 
          background: 'rgba(234,179,8,0.1)', 
          borderBottom: '1px solid rgba(234,179,8,0.3)', 
          padding: '16px', 
          textAlign: 'center' 
        }}>
          <p style={{ color: '#eab308', fontSize: '14px', margin: 0 }}>
            ⚠️ Subscribe below to access the trading journal!
          </p>
        </div>
      )}

      {/* Pricing */}
      <section style={{ padding: '60px 48px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '16px' }}>Get Full Access</h1>
          <p style={{ color: '#888', fontSize: '18px', marginBottom: '48px' }}>
            Everything you need to track your trading
          </p>

          <div style={{ 
            background: 'linear-gradient(135deg, #14141a 0%, #1a2a1a 100%)', 
            border: '2px solid #22c55e', 
            borderRadius: '20px', 
            padding: '40px', 
            textAlign: 'left', 
            position: 'relative' 
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '-14px', 
              right: '24px', 
              background: '#22c55e', 
              color: '#000', 
              fontSize: '12px', 
              fontWeight: 700, 
              padding: '6px 16px', 
              borderRadius: '20px' 
            }}>
              FULL ACCESS
            </div>

            <div style={{ fontSize: '14px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Pro Membership
            </div>
            <div style={{ fontSize: '52px', fontWeight: 700, marginBottom: '8px' }}>
              £9<span style={{ fontSize: '20px', color: '#666' }}>/month</span>
            </div>
            <div style={{ color: '#666', marginBottom: '32px' }}>Cancel anytime</div>

            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {[
                'Unlimited Journals',
                'Unlimited Trades', 
                'Advanced Statistics',
                'Trade Screenshots',
                'Equity Curves',
                'Cloud Storage'
              ].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#bbb', fontSize: '15px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            {!loading && hasAccess ? (
              <div>
                <div style={{ 
                  background: 'rgba(34,197,94,0.1)', 
                  border: '1px solid rgba(34,197,94,0.3)', 
                  borderRadius: '10px', 
                  padding: '12px', 
                  marginBottom: '16px', 
                  textAlign: 'center' 
                }}>
                  <span style={{ color: '#22c55e', fontSize: '14px' }}>✓ You have full access</span>
                </div>
                <a href="/dashboard" style={{ 
                  display: 'block', 
                  padding: '16px', 
                  background: '#22c55e', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  fontWeight: 700, 
                  fontSize: '16px', 
                  textAlign: 'center' 
                }}>
                  Go to Dashboard
                </a>
              </div>
            ) : (
              <button 
                onClick={handleSubscribe} 
                disabled={subscribing} 
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  background: subscribing ? '#166534' : '#22c55e', 
                  border: 'none', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  fontWeight: 700, 
                  fontSize: '16px', 
                  cursor: subscribing ? 'not-allowed' : 'pointer',
                  opacity: subscribing ? 0.7 : 1
                }}
              >
                {subscribing ? 'Loading...' : 'Subscribe Now - £9/month'}
              </button>
            )}

            {!user && (
              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#666' }}>
                Already have an account? <a href="/login" style={{ color: '#22c55e' }}>Sign in</a>
              </p>
            )}
          </div>

          {/* Discord option */}
          <div style={{ marginTop: '32px', padding: '24px', background: '#14141a', border: '1px solid #222230', borderRadius: '16px' }}>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
              LSDTRADE+ Discord member?
            </p>
            <a href="/discord-login" style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px', 
              background: '#5865F2', 
              borderRadius: '8px', 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: '14px' 
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Get FREE Access
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
