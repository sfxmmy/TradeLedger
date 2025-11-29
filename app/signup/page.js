'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function DiscordIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

function CheckCircle() {
  return <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>
}

export default function SignupPage() {
  const { user, loading, signInWithDiscord, supabase } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    if (!loading && user) {
      // User is logged in, link the subscription
      linkSubscription()
    }
  }, [user, loading])

  const linkSubscription = async () => {
    if (!sessionId || !user) return
    
    try {
      const res = await fetch('/api/stripe/link-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      if (res.ok) {
        router.push('/dashboard?success=true')
      }
    } catch (error) {
      console.error('Link error:', error)
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '20px', padding: '48px', width: '450px', textAlign: 'center' }}>
        <CheckCircle />
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '20px', marginBottom: '12px', color: '#fff' }}>Payment Successful!</h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>Now connect your Discord account to complete setup</p>

        <button onClick={signInWithDiscord} style={{ 
          width: '100%', 
          padding: '16px 24px', 
          background: '#5865F2', 
          border: 'none', 
          borderRadius: '12px', 
          color: '#fff', 
          fontWeight: 600, 
          fontSize: '16px', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px'
        }}>
          <DiscordIcon /> Connect Discord Account
        </button>

        <p style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
          Your subscription is active. Connect Discord to access your journal.
        </p>
      </div>
    </div>
  )
}
