'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [trades, setTrades] = useState({})
  const [ready, setReady] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [creating, setCreating] = useState(false)

  // Initialize everything
  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase()
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/login')
        return
      }

      // Check access
      const isAdmin = currentUser.email === 'ssiagos@hotmail.com'
      
      if (!isAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', currentUser.id)
          .single()
        
        if (profile?.subscription_status !== 'active') {
          router.push('/pricing?needsub=true')
          return
        }
      }

      setUser(currentUser)

      // Load accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true })

      setAccounts(accountsData || [])

      // Load trades for each account
      if (accountsData?.length) {
        const tradesMap = {}
        for (const acc of accountsData) {
          const { data: tradesData } = await supabase
            .from('trades')
            .select('*')
            .eq('account_id', acc.id)
            .order('date', { ascending: false })
          tradesMap[acc.id] = tradesData || []
        }
        setTrades(tradesMap)
      }

      setReady(true)
    }

    init()
  }, [router])

  const handleSignOut = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/')
  }

  const createJournal = async () => {
    if (!name.trim() || !balance || !user) return

    setCreating(true)
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: name.trim(),
        starting_balance: parseFloat(balance) || 0
      })
      .select()
      .single()

    if (error) {
      alert('Error creating journal: ' + error.message)
      setCreating(false)
      return
    }

    setAccounts([...accounts, data])
    setTrades({ ...trades, [data.id]: [] })
    setName('')
    setBalance('')
    setShowModal(false)
    setCreating(false)
  }

  // Show loading while checking auth
  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>
            <span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span>
          </div>
          <div style={{ color: '#666' }}>Loading your journal...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="/" style={{ fontSize: '22px', fontWeight: 700 }}>
              <span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span>
            </a>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#555', letterSpacing: '2px' }}>DASHBOARD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setShowModal(true)} 
              style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Journal
            </button>
            <span style={{ color: '#666', fontSize: '14px' }}>{user?.email}</span>
            <button 
              onClick={handleSignOut} 
              style={{ padding: '10px 16px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '8px', color: '#888', fontSize: '13px', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 40px', background: '#14141a', border: '1px solid #222230', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Welcome to LSDTRADE+!</h2>
            <p style={{ color: '#888', marginBottom: '32px', fontSize: '16px' }}>Create your first trading journal to get started</p>
            <button 
              onClick={() => setShowModal(true)} 
              style={{ padding: '16px 32px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}
            >
              + Create Your First Journal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {accounts.map(account => (
              <AccountCard 
                key={account.id} 
                account={account} 
                trades={trades[account.id] || []} 
              />
            ))}
          </div>
        )}

        {/* Create Journal Modal */}
        {showModal && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={() => setShowModal(false)}
          >
            <div 
              style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '16px', padding: '32px', width: '420px' }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Create New Journal</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Journal Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. FTMO 10k, Personal 25k"
                  autoFocus
                  style={{ width: '100%', padding: '14px', background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }} 
                />
              </div>
              
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Starting Balance ($)</label>
                <input 
                  type="number" 
                  value={balance} 
                  onChange={e => setBalance(e.target.value)} 
                  placeholder="e.g. 10000"
                  style={{ width: '100%', padding: '14px', background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={createJournal}
                  disabled={creating || !name.trim() || !balance}
                  style={{ flex: 1, padding: '14px', background: (creating || !name.trim() || !balance) ? '#166534' : '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: creating ? 'wait' : 'pointer' }}
                >
                  {creating ? 'Creating...' : 'Create Journal'}
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '14px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Account Card Component
function AccountCard({ account, trades }) {
  const wins = trades.filter(t => t.outcome === 'win').length
  const losses = trades.filter(t => t.outcome === 'loss').length
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const winrate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const currentBalance = (account.starting_balance || 0) + totalPnl

  return (
    <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '14px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #222230', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 700, fontSize: '18px' }}>{account.name}</span>
          <span style={{ color: '#666', fontSize: '14px' }}>Starting: ${account.starting_balance?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Current Balance</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>
              ${currentBalance.toLocaleString()}
            </div>
          </div>
          <a 
            href={`/account/${account.id}`}
            style={{ padding: '10px 24px', background: '#22c55e', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px' }}
          >
            Open Journal
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatBox label="Total PnL" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`} color={totalPnl >= 0 ? '#22c55e' : '#ef4444'} />
          <StatBox label="Win Rate" value={`${winrate}%`} />
          <StatBox label="Total Trades" value={trades.length} />
          <StatBox label="Wins / Losses" value={`${wins} / ${losses}`} />
        </div>

        {/* Mini Equity Curve */}
        {trades.length > 0 && (
          <div style={{ marginTop: '20px', background: '#0a0a0f', borderRadius: '10px', padding: '16px', height: '120px' }}>
            <MiniChart trades={trades} isPositive={totalPnl >= 0} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#0a0a0f', borderRadius: '10px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 600, color: color || '#fff' }}>{value}</div>
    </div>
  )
}

function MiniChart({ trades, isPositive }) {
  if (!trades.length) return null

  // Build cumulative PnL
  const points = [0]
  let cumulative = 0
  trades.slice().reverse().forEach(t => {
    cumulative += (t.pnl || 0)
    points.push(cumulative)
  })

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1

  const width = 100
  const height = 100

  const pathPoints = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((p - min) / range) * height
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const color = isPositive ? '#22c55e' : '#ef4444'

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={pathPoints} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  )
}
