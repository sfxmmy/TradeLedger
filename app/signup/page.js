'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [redirectToCheckout, setRedirectToCheckout] = useState(false)

  useEffect(() => {
    // Check URL params on client side
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('redirect') === 'checkout') {
        setRedirectToCheckout(true)
      }
    }
  }, [])

  async function handleSignup(e) {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Connection error. Please refresh and try again.')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (signUpError) {
        console.error('Signup error:', signUpError)
        setError(signUpError.message || 'Signup failed. Please try again.')
        setLoading(false)
        return
      }

      // Check if user was created and logged in (email confirmation disabled)
      if (data.session) {
        // User is logged in immediately - redirect to pricing/checkout
        if (redirectToCheckout) {
          router.push('/pricing?checkout=true')
        } else {
          router.push('/pricing')
        }
      } else if (data.user && !data.session) {
        // Email confirmation is required
        setSuccess(true)
      } else {
        setError('Signup failed. Please try again.')
        setLoading(false)
      }

    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Success screen - email confirmation required
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
        <header style={{ padding: '20px 48px', borderBottom: '1px solid #1a1a22' }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: 700 }}>
            <span style={{ color: '#22c55e' }}>LSD</span>
            <span style={{ color: '#fff' }}>TRADE+</span>
          </a>
        </header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ 
            background: '#14141a', 
            border: '1px solid #222230', 
            borderRadius: '20px', 
            padding: '40px', 
            width: '400px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Check your email</h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              We sent a confirmation link to <strong style={{ color: '#fff' }}>{email}</strong>
            </p>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>
              Click the link in the email to verify your account, then return here to log in.
            </p>
            <a href="/login" style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              background: '#22c55e',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px'
            }}>
              Go to Login
            </a>
          </div>
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
            Member Login
          </a>
        </div>
      </header>

      {/* Signup Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{ 
          background: '#14141a', 
          border: '1px solid #222230', 
          borderRadius: '20px', 
          padding: '40px', 
          width: '400px' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Create Account</h1>
            <p style={{ color: '#888', fontSize: '14px' }}>Start your trading journal today</p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.3)', 
              borderRadius: '10px', 
              padding: '12px', 
              marginBottom: '20px', 
              color: '#ef4444', 
              fontSize: '14px', 
              textAlign: 'center' 
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                color: '#888', 
                marginBottom: '6px', 
                textTransform: 'uppercase' 
              }}>
                Email
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="your@email.com" 
                autoComplete="email"
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: '#0a0a0f', 
                  border: '1px solid #222230', 
                  borderRadius: '10px', 
                  color: '#fff', 
                  fontSize: '15px', 
                  boxSizing: 'border-box' 
                }} 
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                color: '#888', 
                marginBottom: '6px', 
                textTransform: 'uppercase' 
              }}>
                Password
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                autoComplete="new-password"
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: '#0a0a0f', 
                  border: '1px solid #222230', 
                  borderRadius: '10px', 
                  color: '#fff', 
                  fontSize: '15px', 
                  boxSizing: 'border-box' 
                }} 
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                color: '#888', 
                marginBottom: '6px', 
                textTransform: 'uppercase' 
              }}>
                Confirm Password
              </label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                autoComplete="new-password"
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: '#0a0a0f', 
                  border: '1px solid #222230', 
                  borderRadius: '10px', 
                  color: '#fff', 
                  fontSize: '15px', 
                  boxSizing: 'border-box' 
                }} 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: loading ? '#166534' : '#22c55e', 
                border: 'none', 
                borderRadius: '10px', 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: '16px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>
              Already have an account? <a href="/login" style={{ color: '#22c55e' }}>Sign in</a>
            </p>
            <p style={{ fontSize: '14px', color: '#888' }}>
              Discord member? <a href="/discord-login" style={{ color: '#5865F2' }}>Login with Discord</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
