'use client'

import { useAuth } from '@/components/AuthProvider'

export default function Header() {
  const { user, hasAccess } = useAuth()

  return (
    <header style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a22', background: '#0a0a0f' }}>
      <a href="/" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px', textDecoration: 'none' }}>
        <span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span>
      </a>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user && hasAccess ? (
          <a href="/dashboard" style={{ padding: '12px 24px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            Dashboard
          </a>
        ) : (
          <>
            <a href="/pricing" style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderRadius: '8px', color: '#aaa', fontWeight: 500, fontSize: '14px', textDecoration: 'none' }}>
              Pricing
            </a>
            <a href="/login" style={{ padding: '12px 24px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
              Member Login
            </a>
          </>
        )}
      </div>
    </header>
  )
}
