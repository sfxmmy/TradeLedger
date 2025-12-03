'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  )
}

export default function SignupPage() {
  const { user, profile, loading, supabase } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.subscription_status === 'active') {
        router.push('/dashboard')
      } else if (redirectTo === 'checkout') {
        handleCheckout()
      } else {
        router.push('/pricing?signup=true')
      }
    }
  }, [user, profile, loading, redirectTo, router])

  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      router.push('/pricing')
    }
  }

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      setAuthLoading(false)
      return
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters')
      setAuthLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo 
            ? `${window.location.origin}/api/auth/callback?redirect=${redirectTo}` 
            : `${window.location.origin}/api/auth/callback`
        }
      })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setAuthError(err.message)
    }
    setAuthLoading(false)
  }

  const handleGoogleLogin = async () => {
    const redirectUrl = redirectTo ? `${window.location.origin}/api/auth/callback?redirect=${redirectTo}` : `${window.location.origin}/api/auth/callback`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    })
  }

  const handleAppleLogin = async () => {
    const redirectUrl = redirectTo ? `${window.location.origin}/api/auth/callback?redirect=${redirectTo}` : `${window.location.origin}/api/auth/callback`
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: redirectUrl }
    })
  }

  const handleMicrosoftLogin = async () => {
    const redirectUrl = redirectTo ? `${window.location.origin}/api/auth/callback?redirect=${redirectTo}` : `${window.location.origin}/api/auth/callback`
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: redirectUrl, scopes: 'email' }
    })
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>Loading...</div>
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '20px', padding: '40px', width: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>Check your email</h2>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
            We've sent a confirmation link to <strong style={{ color: '#fff' }}>{email}</strong>. Click the link to activate your account.
          </p>
          <a href="/login" style={{ color: '#22c55e', fontSize: '14px' }}>Back to login</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '20px', padding: '40px', width: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            <span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span>
          </div>
          <p style={{ color: '#888', fontSize: '14px' }}>Create your account</p>
        </div>

        {authError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '20px', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleEmailSignup}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #222230', borderRadius: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #222230', borderRadius: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #222230', borderRadius: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={authLoading}
            style={{ width: '100%', padding: '14px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginBottom: '16px' }}
          >
            {authLoading ? 'Loading...' : 'Create Account'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#222230' }} />
          <span style={{ color: '#666', fontSize: '12px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#222230' }} />
        </div>

        <button 
          onClick={handleGoogleLogin}
          style={{ width: '100%', padding: '14px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <button 
          onClick={handleAppleLogin}
          style={{ width: '100%', padding: '14px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}
        >
          <AppleIcon /> Continue with Apple
        </button>

        <button 
          onClick={handleMicrosoftLogin}
          style={{ width: '100%', padding: '14px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <MicrosoftIcon /> Continue with Microsoft
        </button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#888' }}>
          Already have an account?{' '}
          <a href={redirectTo ? `/login?redirect=${redirectTo}` : '/login'} style={{ color: '#22c55e', textDecoration: 'none' }}>
            Sign in here
          </a>
        </p>

        <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px', textDecoration: 'none' }}>← Back to home</a>
      </div>
    </div>
  )
}
