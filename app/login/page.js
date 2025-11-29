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


export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, supabase } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    if (isSignUp && password !== confirmPassword) {
      setAuthError('Passwords do not match')
      setAuthLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`
          }
        })
        if (error) throw error
        setAuthError('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err) {
      setAuthError(err.message)
    }
    setAuthLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    })
  }



  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '20px', padding: '40px', width: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            <span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span>
          </div>
          <p style={{ color: '#888', fontSize: '14px' }}>{isSignUp ? 'Create your account' : 'Welcome back'}</p>
        </div>

        {(error || authError) && (
          <div style={{ background: authError.includes('Check your email') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${authError.includes('Check your email') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '12px', marginBottom: '20px', color: authError.includes('Check your email') ? '#22c55e' : '#ef4444', fontSize: '14px', textAlign: 'center' }}>
            {authError || 'Authentication failed. Please try again.'}
          </div>
        )}

        <form onSubmit={handleEmailAuth}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #222230', borderRadius: '10px', color: '#fff', fontSize: '14px' }} 
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #222230', borderRadius: '10px', color: '#fff', fontSize: '14px' }} 
            />
          </div>
          {isSignUp && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required
                style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #222230', borderRadius: '10px', color: '#fff', fontSize: '14px' }} 
              />
            </div>
          )}
          <button 
            type="submit" 
            disabled={authLoading}
            style={{ width: '100%', padding: '14px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginBottom: '16px' }}
          >
            {authLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
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
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setAuthError('') }} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '14px' }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>← Back to home</a>
      </div>
    </div>
  )
}
