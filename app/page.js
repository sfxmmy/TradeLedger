'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
}

export default function LandingPage() {
  const { user, loading, signInWithDiscord } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a22' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px' }}>
          <span style={{ color: '#22c55e' }}>JOURNAL</span><span style={{ color: '#fff' }}>PRO</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/pricing" style={{ color: '#aaa', fontSize: '14px' }}>Pricing</a>
          <button onClick={signInWithDiscord} style={{ padding: '10px 20px', background: '#5865F2', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DiscordIcon /> Login with Discord
          </button>
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
          <button onClick={signInWithDiscord} style={{ padding: '16px 32px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}>
            Start Free with Discord
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
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '20px' }}>Simple Pricing</h2>
          <p style={{ color: '#888', marginBottom: '48px' }}>Start free, upgrade when you're ready</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Free */}
            <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '16px', padding: '32px', textAlign: 'left' }}>
              <div style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Free</div>
              <div style={{ fontSize: '40px', fontWeight: 700, marginBottom: '24px' }}>$0<span style={{ fontSize: '16px', color: '#666' }}>/forever</span></div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {['1 Trading Account', 'Basic Statistics', 'Up to 50 Trades', 'Discord Login'].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#bbb', fontSize: '14px' }}><CheckIcon /> {f}</li>
                ))}
              </ul>
              <button onClick={signInWithDiscord} style={{ width: '100%', padding: '14px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Get Started Free</button>
            </div>

            {/* Pro */}
            <div style={{ background: 'linear-gradient(135deg, #14141a 0%, #1a2a1a 100%)', border: '2px solid #22c55e', borderRadius: '16px', padding: '32px', textAlign: 'left', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#22c55e', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>POPULAR</div>
              <div style={{ fontSize: '14px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Pro</div>
              <div style={{ fontSize: '40px', fontWeight: 700, marginBottom: '24px' }}>$9<span style={{ fontSize: '16px', color: '#666' }}>/month</span></div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {['Unlimited Accounts', 'Advanced Statistics', 'Unlimited Trades', 'Custom Fields', 'Priority Support', 'Export Data'].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#bbb', fontSize: '14px' }}><CheckIcon /> {f}</li>
                ))}
              </ul>
              <button onClick={signInWithDiscord} style={{ width: '100%', padding: '14px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Start Pro Trial</button>
            </div>
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
