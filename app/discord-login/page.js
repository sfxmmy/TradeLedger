'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function DiscordLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkExistingAuth()
  }, [])

  async function checkExistingAuth() {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        setChecking(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User already logged in, check access
        const isAdmin = user.email === 'ssiagos@hotmail.com'
        
        if (isAdmin) {
          router.push('/dashboard')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single()

        if (profile?.subscription_status === 'active') {
          router.push('/dashboard')
          return
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
    }
    setChecking(false)
  }

  async function handleDiscordLogin() {
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Connection error. Please refresh and try again.')
        setLoading(false)
        return
      }

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          scopes: 'identify email guilds'
        }
      })

      if (oauthError) {
        console.error('Discord OAuth error:', oauthError)
        setError('Failed to connect to Discord. Please try again.')
        setLoading(false)
      }
      
      // If successful, user will be redirected to Discord

    } catch (err) {
      console.error('Discord login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0a0f', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>
            <span style={{ color: '#22c55e' }}>LSD</span>
            <span style={{ color: '#fff' }}>TRADE+</span>
          </div>
          <div style={{ color: '#666' }}>Loading...</div>
        </div>
      </div>
    )
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
          <a href="/login" style={{ 
            padding: '12px 24px', 
            background: '#1a1a24', 
            border: '1px solid #2a2a35', 
            borderRadius: '8px', 
            color: '#fff', 
            fontWeight: 600, 
            fontSize: '14px' 
          }}>
            Email Login
          </a>
        </div>
      </header>

      {/* Discord Login */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
        <div style={{ 
          background: '#14141a', 
          border: '1px solid #222230', 
          borderRadius: '20px', 
          padding: '40px', 
          width: '420px',
          textAlign: 'center'
        }}>
          {/* Discord Logo */}
          <div style={{ marginBottom: '24px' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#5865F2">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Discord Member Login</h1>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
            Free access for LSDTRADE+ Discord server members
          </p>

          {error && (
            <div style={{ 
              background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.3)', 
              borderRadius: '10px', 
              padding: '12px', 
              marginBottom: '20px', 
              color: '#ef4444', 
              fontSize: '14px' 
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleDiscordLogin}
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: loading ? '#4752C4' : '#5865F2', 
              border: 'none', 
              borderRadius: '10px', 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: '16px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            {loading ? 'Connecting...' : 'Continue with Discord'}
          </button>

          <div style={{ marginTop: '24px', padding: '16px', background: '#0a0a0f', borderRadius: '10px' }}>
            <p style={{ color: '#666', fontSize: '13px', lineHeight: 1.6 }}>
              <strong style={{ color: '#888' }}>Note:</strong> You must be a member of the LSDTRADE+ Discord server to use this login. 
              Not a member? <a href="/signup" style={{ color: '#22c55e' }}>Sign up</a> for a paid account instead.
            </p>
          </div>

          <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
            Prefer email? <a href="/login" style={{ color: '#22c55e' }}>Login with email</a>
          </p>
        </div>
      </div>
    </div>
  )
}
