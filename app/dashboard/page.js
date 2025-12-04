'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [trades, setTrades] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      window.location.href = '/login'
      return
    }

    const isAdmin = user.email === 'ssiagos@hotmail.com'
    
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      if (!profile || profile.subscription_status !== 'active') {
        window.location.href = '/pricing'
        return
      }
    }

    setUser(user)

    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    setAccounts(accountsData || [])

    if (accountsData?.length) {
      const tradesMap = {}
      for (const acc of accountsData) {
        const { data: tradesData } = await supabase
          .from('trades')
          .select('*')
          .eq('account_id', acc.id)
          .order('date', { ascending: true })
        tradesMap[acc.id] = tradesData || []
      }
      setTrades(tradesMap)
    }

    setLoading(false)
  }

  async function handleSignOut() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function createJournal() {
    if (!name.trim() || !balance) return
    setCreating(true)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('accounts')
      .insert({ user_id: user.id, name: name.trim(), starting_balance: parseFloat(balance) || 0 })
      .select()
      .single()

    if (error) {
      alert('Error: ' + error.message)
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

  // Mini equity curve component
  function EquityCurve({ accountTrades, startingBalance }) {
    if (!accountTrades || accountTrades.length === 0) {
      return (
        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
          No trades yet
        </div>
      )
    }

    // Calculate cumulative balance
    let cumulative = parseFloat(startingBalance) || 0
    const points = [{ balance: cumulative, date: 'Start' }]
    
    accountTrades.forEach(t => {
      cumulative += parseFloat(t.pnl) || 0
      points.push({ balance: cumulative, date: t.date })
    })

    const maxBalance = Math.max(...points.map(p => p.balance))
    const minBalance = Math.min(...points.map(p => p.balance))
    const range = maxBalance - minBalance || 1

    // Generate SVG path
    const width = 300
    const height = 100
    const padding = 10

    const pathPoints = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2)
      const y = height - padding - ((p.balance - minBalance) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')

    // Area path
    const areaPath = pathPoints + ` L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

    // Get last few dates for x-axis
    const dateLabels = points.slice(-4).map(p => {
      if (p.date === 'Start') return 'Start'
      return new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    })

    return (
      <div style={{ position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height + 20}`} style={{ display: 'block' }}>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#gradient)" />
          <path d={pathPoints} fill="none" stroke="#22c55e" strokeWidth="2" />
          {/* Date labels */}
          {dateLabels.map((label, i) => (
            <text key={i} x={padding + (i / (dateLabels.length - 1)) * (width - padding * 2)} y={height + 15} fill="#555" fontSize="9" textAnchor="middle">{label}</text>
          ))}
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>
            <span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span>
          </div>
          <div style={{ color: '#666' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#888', letterSpacing: '2px' }}>DASHBOARD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a35', borderRadius: '8px', color: '#888', fontSize: '13px', cursor: 'pointer' }}>
              + Add Account
            </button>
            <button onClick={handleSignOut} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#555', fontSize: '13px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 40px', background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Welcome to LSDTRADE+</h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>Create your first trading journal to get started</p>
            <button onClick={() => setShowModal(true)} style={{ padding: '14px 28px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              + Create Your First Journal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {accounts.map(account => {
              const accTrades = trades[account.id] || []
              const wins = accTrades.filter(t => t.outcome === 'win').length
              const losses = accTrades.filter(t => t.outcome === 'loss').length
              const totalPnl = accTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
              const winrate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
              const avgRR = accTrades.length > 0 ? (accTrades.reduce((sum, t) => sum + (parseFloat(t.rr) || 0), 0) / accTrades.length).toFixed(1) : '0'
              const currentBalance = (parseFloat(account.starting_balance) || 0) + totalPnl
              
              // Calculate profit factor
              const grossProfit = accTrades.filter(t => parseFloat(t.pnl) > 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0)
              const grossLoss = Math.abs(accTrades.filter(t => parseFloat(t.pnl) < 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0))
              const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0'

              // Recent trades (last 5)
              const recentTrades = [...accTrades].reverse().slice(0, 5)

              return (
                <div key={account.id} style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Account Header */}
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px' }}>{account.name}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" style={{ cursor: 'pointer' }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Account Balance</div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>${currentBalance.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '0' }}>
                    {/* Left: Chart */}
                    <div style={{ padding: '20px 24px', borderRight: '1px solid #1a1a22' }}>
                      <EquityCurve accountTrades={accTrades} startingBalance={account.starting_balance} />
                    </div>

                    {/* Right: Stats */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>Total PnL</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>Winrate</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{winrate}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>Avg RR</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{avgRR}R</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>Profit Factor</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{profitFactor}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>Total Trades</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{accTrades.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Trades */}
                  <div style={{ borderTop: '1px solid #1a1a22' }}>
                    <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Trades</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {recentTrades.map((t, i) => (
                          <div key={i} style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '2px', 
                            background: t.outcome === 'win' ? '#22c55e' : t.outcome === 'loss' ? '#ef4444' : '#666' 
                          }} title={`${t.symbol}: ${t.outcome}`} />
                        ))}
                        {recentTrades.length === 0 && <span style={{ fontSize: '11px', color: '#444' }}>No trades</span>}
                      </div>
                    </div>
                  </div>

                  {/* Enter Journal Button */}
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #1a1a22' }}>
                    <a href={`/account/${account.id}`} style={{ 
                      display: 'block', 
                      padding: '14px', 
                      background: '#22c55e', 
                      borderRadius: '8px', 
                      color: '#fff', 
                      fontWeight: 600, 
                      fontSize: '14px', 
                      textAlign: 'center' 
                    }}>
                      ENTER JOURNAL
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', padding: '28px', width: '380px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Create New Journal</h2>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Journal Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. FTMO 10k" autoFocus style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Starting Balance ($)</label>
                <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="e.g. 10000" style={{ width: '100%', padding: '12px 14px', background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createJournal} disabled={creating || !name.trim() || !balance} style={{ flex: 1, padding: '12px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: (creating || !name.trim() || !balance) ? 0.5 : 1 }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '8px', color: '#888', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
