'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

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
        // Check if admin
        if (user.email === 'ssiagos@hotmail.com') {
          setHasAccess(true)
        } else {
          // Check subscription
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
          <a 
            href="/pricing" 
            style={{ 
              padding: '12px 24px', 
              background: '#22c55e', 
              borderRadius: '8px', 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: '14px' 
            }}
          >
            Get Access - £9/mo
          </a>
          {!loading && user && hasAccess ? (
            <a 
              href="/dashboard" 
              style={{ 
                padding: '12px 24px', 
                background: '#1a1a24', 
                border: '1px solid #2a2a35', 
                borderRadius: '8px', 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: '14px' 
              }}
            >
              Enter Journal
            </a>
          ) : (
            <a 
              href="/login" 
              style={{ 
                padding: '12px 24px', 
                background: '#1a1a24', 
                border: '1px solid #2a2a35', 
                borderRadius: '8px', 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: '14px' 
              }}
            >
              Member Login
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '100px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px' }}>
            The Trading Journal
          </h1>
          <h2 style={{ fontSize: '56px', fontWeight: 800, color: '#22c55e', marginBottom: '24px' }}>
            Built for Serious Traders
          </h2>
          <p style={{ fontSize: '20px', color: '#888', marginBottom: '40px', lineHeight: 1.6 }}>
            Track your trades, analyze your performance, and discover patterns that make you profitable.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="/signup" 
              style={{ 
                padding: '18px 40px', 
                background: '#22c55e', 
                borderRadius: '12px', 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: '18px' 
              }}
            >
              Get Started - £9/month
            </a>
            <a 
              href="/discord-login" 
              style={{ 
                padding: '18px 40px', 
                background: '#5865F2', 
                borderRadius: '12px', 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord Members
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 48px', background: '#0d0d12' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>
            Everything You Need
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            {[
              { title: 'Multiple Journals', desc: 'Create separate journals for each account - 10k, 25k, 50k, FTMO, etc.' },
              { title: 'Smart Statistics', desc: 'See PnL, winrate, and RR. Discover which setups work best for you.' },
              { title: 'Trade Screenshots', desc: 'Attach images to every trade. Review your entries and exits visually.' },
              { title: 'Custom Fields', desc: 'Create your own fields - timeframes, sessions, setups. Make it yours.' },
              { title: 'Equity Curves', desc: 'Beautiful charts showing your progress over time.' },
              { title: 'Cloud Synced', desc: 'Access from any device. Your data is always safe and available.' },
            ].map((f, i) => (
              <div 
                key={i} 
                style={{ 
                  background: '#14141a', 
                  border: '1px solid #222230', 
                  borderRadius: '16px', 
                  padding: '24px' 
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '60px 48px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, textAlign: 'center', marginBottom: '32px' }}>
            Simple Pricing
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Discord Members - Free */}
            <div style={{ 
              background: '#14141a', 
              border: '2px solid #5865F2', 
              borderRadius: '16px', 
              padding: '32px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '14px', color: '#5865F2', textTransform: 'uppercase', marginBottom: '8px' }}>
                Discord Members
              </div>
              <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '8px' }}>
                FREE
              </div>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
                For LSDTRADE+ Discord server members
              </p>
              <a 
                href="/discord-login" 
                style={{ 
                  display: 'block', 
                  padding: '16px', 
                  background: '#5865F2', 
                  borderRadius: '10px', 
                  color: '#fff', 
                  fontWeight: 700, 
                  fontSize: '16px' 
                }}
              >
                Login with Discord
              </a>
            </div>

            {/* Public - £9/mo */}
            <div style={{ 
              background: 'linear-gradient(135deg, #14141a 0%, #1a2a1a 100%)', 
              border: '2px solid #22c55e', 
              borderRadius: '16px', 
              padding: '32px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '14px', color: '#22c55e', textTransform: 'uppercase', marginBottom: '8px' }}>
                Full Access
              </div>
              <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '8px' }}>
                £9<span style={{ fontSize: '18px', color: '#666' }}>/mo</span>
              </div>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
                For everyone else
              </p>
              <a 
                href="/signup" 
                style={{ 
                  display: 'block', 
                  padding: '16px', 
                  background: '#22c55e', 
                  borderRadius: '10px', 
                  color: '#fff', 
                  fontWeight: 700, 
                  fontSize: '16px' 
                }}
              >
                Subscribe Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 48px', borderTop: '1px solid #1a1a22', textAlign: 'center' }}>
        <p style={{ color: '#555', fontSize: '14px' }}>© 2024 LSDTRADE+. All rights reserved.</p>
      </footer>
    </div>
  )
}
