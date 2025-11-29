'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
}

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleSubscribe = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout-public', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
    }
    setCheckoutLoading(false)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a22' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px' }}>
          <span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/pricing" style={{ color: '#aaa', fontSize: '14px' }}>Pricing</a>
          <a href="/login" style={{ padding: '10px 20px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
            Member Login
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '100px 48px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>
          The Trading Journal<br />
          <span style={{ color: '#22c55e' }}>Built for Serious Traders</span>
        </h1>
        <p style={{ fontSize: '20px', color: '#888', marginBottom: '40px', lineHeight: 1.6 }}>
          Track your trades, analyze your performance, and discover patterns that make you profitable. 
          Customizable fields, powerful statistics, and beautiful visualizations.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={handleSubscribe} disabled={checkoutLoading} style={{ padding: '16px 32px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}>
            {checkoutLoading ? 'Loading...' : 'Subscribe - $9/month'}
          </button>
          <a href="/pricing" style={{ padding: '16px 32px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '16px', display: 'inline-flex', alignItems: 'center' }}>
            View Pricing
          </a>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', background: '#0d0d12' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, textAlign: 'center', marginBottom: '60px' }}>Everything You Need</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { title: 'Custom Fields', desc: 'Create your own inputs - timeframes, sessions, setups, emotions. Make the journal work for YOUR strategy.' },
              { title: 'Smart Statistics', desc: 'See PnL, winrate, and RR broken down by any field. Discover which setups actually work for you.' },
              { title: 'Trade Screenshots', desc: 'Attach images to every trade. Review your entries and exits visually.' },
              { title: 'Multiple Accounts', desc: 'Track FTMO, personal accounts, and prop firms separately with individual statistics.' },
              { title: 'Beautiful Charts', desc: 'Interactive equity curves with hover tooltips. Watch your progress over time.' },
              { title: 'Cloud Synced', desc: 'Access your journal from anywhere. Your data is securely stored and always available.' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '16px', padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#fff' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '20px' }}>Simple Pricing</h2>
          <p style={{ color: '#888', marginBottom: '48px' }}>One plan, everything included</p>
          
          <div style={{ background: 'linear-gradient(135deg, #14141a 0%, #1a2a1a 100%)', border: '2px solid #22c55e', borderRadius: '16px', padding: '32px', textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#22c55e', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>FULL ACCESS</div>
            <div style={{ fontSize: '14px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Pro</div>
            <div style={{ fontSize: '40px', fontWeight: 700, marginBottom: '24px' }}>$9<span style={{ fontSize: '16px', color: '#666' }}>/month</span></div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {['Unlimited Accounts', 'Advanced Statistics', 'Unlimited Trades', 'Custom Fields', 'Priority Support', 'Export Data'].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#bbb', fontSize: '14px' }}><CheckIcon /> {f}</li>
              ))}
            </ul>
            <button onClick={handleSubscribe} disabled={checkoutLoading} style={{ width: '100%', padding: '14px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              {checkoutLoading ? 'Loading...' : 'Subscribe Now'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#666' }}>Already a Discord member? <a href="/login" style={{ color: '#22c55e' }}>Login here</a></p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid #1a1a22', textAlign: 'center' }}>
        <p style={{ color: '#555', fontSize: '14px' }}>© 2025 JournalPro. Built for traders, by traders.</p>
      </footer>
    </div>
  )
}
