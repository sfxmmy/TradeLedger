'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [trades, setTrades] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [editName, setEditName] = useState('')
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

  async function renameAccount(accountId) {
    if (!editName.trim()) return
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    await supabase
      .from('accounts')
      .update({ name: editName.trim() })
      .eq('id', accountId)

    setAccounts(accounts.map(a => a.id === accountId ? { ...a, name: editName.trim() } : a))
    setShowEditModal(null)
    setEditName('')
  }

  async function deleteAccount(accountId) {
    if (deleteConfirm.toLowerCase() !== 'delete') return
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    await supabase.from('accounts').delete().eq('id', accountId)

    setAccounts(accounts.filter(a => a.id !== accountId))
    const newTrades = { ...trades }
    delete newTrades[accountId]
    setTrades(newTrades)
    setShowDeleteModal(null)
    setDeleteConfirm('')
  }

  // Interactive Equity Curve Component
  function EquityCurve({ accountTrades, startingBalance }) {
    const [tooltip, setTooltip] = useState(null)
    const svgRef = useRef(null)

    if (!accountTrades || accountTrades.length === 0) {
      return (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '12px' }}>
          No trades yet - start logging to see your equity curve
        </div>
      )
    }

    let cumulative = parseFloat(startingBalance) || 0
    const points = [{ balance: cumulative, date: 'Start', pnl: 0 }]
    
    accountTrades.forEach(t => {
      cumulative += parseFloat(t.pnl) || 0
      points.push({ 
        balance: cumulative, 
        date: t.date,
        pnl: parseFloat(t.pnl) || 0,
        symbol: t.symbol
      })
    })

    const maxBalance = Math.max(...points.map(p => p.balance))
    const minBalance = Math.min(...points.map(p => p.balance))
    const range = maxBalance - minBalance || 1

    const width = 520
    const height = 200
    const paddingLeft = 45
    const paddingRight = 10
    const paddingTop = 15
    const paddingBottom = 25

    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom

    const chartPoints = points.map((p, i) => {
      const x = paddingLeft + (i / (points.length - 1)) * chartWidth
      const y = paddingTop + chartHeight - ((p.balance - minBalance) / range) * chartHeight
      return { x, y, ...p }
    })

    const pathD = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = pathD + ` L ${chartPoints[chartPoints.length-1].x} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`

    const yLabels = [minBalance, minBalance + range * 0.5, maxBalance].map(v => ({
      value: v,
      y: paddingTop + chartHeight - ((v - minBalance) / range) * chartHeight
    }))

    const xLabelCount = Math.min(4, points.length)
    const xLabels = []
    for (let i = 0; i < xLabelCount; i++) {
      const idx = Math.floor(i * (points.length - 1) / (xLabelCount - 1))
      const p = chartPoints[idx]
      if (p) {
        xLabels.push({
          label: p.date === 'Start' ? 'Start' : new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          x: p.x
        })
      }
    }

    function handleMouseMove(e) {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const scaleX = width / rect.width
      const scaledMouseX = mouseX * scaleX
      
      let closest = chartPoints[0]
      let minDist = Math.abs(scaledMouseX - chartPoints[0].x)
      
      chartPoints.forEach(p => {
        const dist = Math.abs(scaledMouseX - p.x)
        if (dist < minDist) {
          minDist = dist
          closest = p
        }
      })

      if (minDist < 30) {
        setTooltip(closest)
      } else {
        setTooltip(null)
      }
    }

    return (
      <div style={{ position: 'relative', background: '#0a0a0e', borderRadius: '8px', border: '1px solid #1a1a22', padding: '8px' }}>
        <svg 
          ref={svgRef}
          width="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          style={{ display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yLabels.map((l, i) => (
            <line key={i} x1={paddingLeft} y1={l.y} x2={width - paddingRight} y2={l.y} stroke="#1a1a22" strokeWidth="1" />
          ))}

          <path d={areaD} fill="url(#areaGradient)" />
          <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {yLabels.map((l, i) => (
            <text key={i} x={paddingLeft - 6} y={l.y + 3} fill="#444" fontSize="9" textAnchor="end">
              ${l.value >= 1000 ? (l.value/1000).toFixed(1) + 'k' : l.value.toFixed(0)}
            </text>
          ))}

          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={height - 6} fill="#444" fontSize="9" textAnchor="middle">
              {l.label}
            </text>
          ))}

          {tooltip && (
            <>
              <line x1={tooltip.x} y1={paddingTop} x2={tooltip.x} y2={paddingTop + chartHeight} stroke="#22c55e" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
              <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#22c55e" />
              <circle cx={tooltip.x} cy={tooltip.y} r="2" fill="#0a0a0f" />
            </>
          )}
        </svg>

        {tooltip && (
          <div style={{
            position: 'absolute',
            left: `${(tooltip.x / width) * 100}%`,
            top: '8px',
            transform: 'translateX(-50%)',
            background: '#1a1a22',
            border: '1px solid #2a2a35',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}>
            <div style={{ color: '#666', marginBottom: '2px' }}>
              {tooltip.date === 'Start' ? 'Start' : new Date(tooltip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </div>
            <div style={{ fontWeight: 600, fontSize: '12px' }}>${tooltip.balance.toLocaleString()}</div>
            {tooltip.symbol && (
              <div style={{ color: tooltip.pnl >= 0 ? '#22c55e' : '#ef4444', marginTop: '2px' }}>
                {tooltip.symbol}: {tooltip.pnl >= 0 ? '+' : ''}${tooltip.pnl.toFixed(0)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  function getExtraData(trade) {
    try {
      return JSON.parse(trade.extra_data || '{}')
    } catch {
      return {}
    }
  }

  function getDaysAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return '1d ago'
    return `${diff}d ago`
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
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '1px' }}>DASHBOARD</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a35', borderRadius: '6px', color: '#888', fontSize: '12px', cursor: 'pointer' }}>
              + Add Account
            </button>
            <button onClick={handleSignOut} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#444', fontSize: '12px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 40px', background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>Welcome to LSDTRADE+</h2>
            <p style={{ color: '#666', marginBottom: '32px', fontSize: '14px' }}>Create your first trading journal to get started</p>
            <button onClick={() => setShowModal(true)} style={{ padding: '14px 28px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              + Create Your First Journal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {accounts.map(account => {
              const accTrades = trades[account.id] || []
              const wins = accTrades.filter(t => t.outcome === 'win').length
              const losses = accTrades.filter(t => t.outcome === 'loss').length
              const totalPnl = accTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
              const winrate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
              const avgRR = accTrades.length > 0 ? (accTrades.reduce((sum, t) => sum + (parseFloat(t.rr) || 0), 0) / accTrades.length).toFixed(1) : '0'
              const currentBalance = (parseFloat(account.starting_balance) || 0) + totalPnl
              
              const grossProfit = accTrades.filter(t => parseFloat(t.pnl) > 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0)
              const grossLoss = Math.abs(accTrades.filter(t => parseFloat(t.pnl) < 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0))
              const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(1) : grossProfit > 0 ? '∞' : '0'

              const tradeDays = {}
              accTrades.forEach(t => {
                const d = t.date
                if (!tradeDays[d]) tradeDays[d] = 0
                tradeDays[d] += parseFloat(t.pnl) || 0
              })
              const winningDays = Object.values(tradeDays).filter(v => v > 0).length
              const totalDays = Object.keys(tradeDays).length
              const consistency = totalDays > 0 ? Math.round((winningDays / totalDays) * 100) : 0

              const avgWin = wins > 0 ? Math.round(grossProfit / wins) : 0
              const avgLoss = losses > 0 ? Math.round(grossLoss / losses) : 0

              const recentTrades = [...accTrades].reverse().slice(0, 5)

              return (
                <div key={account.id} style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Top Row: Name + Balance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #1a1a22' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#1a1a22', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '14px' }}>{account.name}</span>
                      <button onClick={() => { setEditName(account.name); setShowEditModal(account.id) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div style={{ background: '#1a1a22', padding: '10px 16px', borderRadius: '6px', border: '1px solid #2a2a35' }}>
                      <span style={{ fontSize: '10px', color: '#555', marginRight: '8px' }}>Account Balance:</span>
                      <span style={{ fontSize: '18px', fontWeight: 700 }}>${currentBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Main Content: Chart + Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', borderBottom: '1px solid #1a1a22' }}>
                    {/* Chart */}
                    <div style={{ padding: '16px 20px', borderRight: '1px solid #1a1a22' }}>
                      <EquityCurve accountTrades={accTrades} startingBalance={account.starting_balance} />
                    </div>

                    {/* Stats */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Total PnL', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
                        { label: 'Winrate', value: `${winrate}%`, color: '#fff' },
                        { label: 'Avg RR', value: `${avgRR}R`, color: '#fff' },
                        { label: 'Profit Factor', value: profitFactor, color: '#fff' },
                        { label: 'Trade Amount', value: accTrades.length, color: '#fff' },
                        { label: 'Consistency', value: `${consistency}%`, color: '#fff' },
                        { label: 'Avg Win', value: `+$${avgWin}`, color: '#22c55e' },
                        { label: 'Avg Loss', value: `-$${avgLoss}`, color: '#ef4444' },
                      ].map((stat, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0e', borderRadius: '6px', border: '1px solid #1a1a22' }}>
                          <span style={{ fontSize: '11px', color: '#555' }}>{stat.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: stat.color }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Trades Table */}
                  <div>
                    <div style={{ padding: '10px 20px', borderBottom: '1px solid #1a1a22', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Trades</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                    
                    {recentTrades.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#333', fontSize: '12px' }}>
                        No trades yet
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#0a0a0e' }}>
                              <th style={{ padding: '8px 16px', textAlign: 'left', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Symbol</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>W/L</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>PnL</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>%</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Rating</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Image</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Placed</th>
                              <th style={{ padding: '8px 16px', textAlign: 'right', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentTrades.map((trade, idx) => {
                              const extra = getExtraData(trade)
                              const riskPercent = extra.riskPercent || '1'
                              return (
                                <tr key={trade.id} style={{ borderBottom: idx < recentTrades.length - 1 ? '1px solid #141418' : 'none' }}>
                                  <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: '12px' }}>{trade.symbol}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{ 
                                      padding: '3px 10px', 
                                      borderRadius: '4px', 
                                      fontSize: '10px', 
                                      fontWeight: 600,
                                      background: trade.outcome === 'win' ? 'rgba(34,197,94,0.15)' : trade.outcome === 'loss' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)',
                                      color: trade.outcome === 'win' ? '#22c55e' : trade.outcome === 'loss' ? '#ef4444' : '#888'
                                    }}>
                                      {trade.outcome === 'win' ? 'WIN' : trade.outcome === 'loss' ? 'LOSS' : 'BE'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: parseFloat(trade.pnl) >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl || 0).toFixed(0)}
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#666' }}>{riskPercent}%</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                      {[1,2,3,4,5].map(i => (
                                        <span key={i} style={{ color: i <= parseInt(extra.rating || 0) ? '#22c55e' : '#2a2a35', fontSize: '10px' }}>★</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    {trade.image_url ? (
                                      <div style={{ width: '24px', height: '24px', background: '#1a1a22', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                          <circle cx="8.5" cy="8.5" r="1.5" />
                                          <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                      </div>
                                    ) : (
                                      <div style={{ width: '24px', height: '24px', background: '#141418', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                          <circle cx="8.5" cy="8.5" r="1.5" />
                                          <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#555' }}>{getDaysAgo(trade.date)}</td>
                                  <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', color: '#555' }}>
                                    {new Date(trade.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ padding: '14px 20px', borderTop: '1px solid #1a1a22', display: 'flex', gap: '10px' }}>
                    <a href={`/account/${account.id}`} style={{ 
                      flex: 3,
                      padding: '12px', 
                      background: '#22c55e', 
                      borderRadius: '6px', 
                      color: '#fff', 
                      fontWeight: 600, 
                      fontSize: '12px', 
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}>
                      ENTER JOURNAL
                    </a>
                    <a href={`/account/${account.id}?tab=statistics`} style={{ 
                      flex: 1,
                      padding: '12px', 
                      background: 'transparent', 
                      border: '1px solid #22c55e',
                      borderRadius: '6px', 
                      color: '#22c55e', 
                      fontWeight: 600, 
                      fontSize: '12px', 
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}>
                      SEE STATISTICS
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create Account Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '24px', width: '360px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Create New Journal</h2>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Journal Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. FTMO 10k" autoFocus style={{ width: '100%', padding: '10px 12px', background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Starting Balance ($)</label>
                <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="e.g. 10000" style={{ width: '100%', padding: '10px 12px', background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={createJournal} disabled={creating || !name.trim() || !balance} style={{ flex: 1, padding: '10px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: (creating || !name.trim() || !balance) ? 0.5 : 1 }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#888', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowEditModal(null)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '24px', width: '360px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Edit Journal</h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Journal Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={{ width: '100%', padding: '10px 12px', background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button onClick={() => renameAccount(showEditModal)} disabled={!editName.trim()} style={{ flex: 1, padding: '10px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: !editName.trim() ? 0.5 : 1 }}>
                  Save
                </button>
                <button onClick={() => setShowEditModal(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#888', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
              <button onClick={() => { setShowDeleteModal(showEditModal); setShowEditModal(null) }} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                Delete Journal
              </button>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => { setShowDeleteModal(null); setDeleteConfirm('') }}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '24px', width: '360px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#ef4444' }}>Delete Journal</h2>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
                This action cannot be undone. All trades in this journal will be permanently deleted.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type "delete" to confirm</label>
                <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="delete" style={{ width: '100%', padding: '10px 12px', background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => deleteAccount(showDeleteModal)} disabled={deleteConfirm.toLowerCase() !== 'delete'} style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: deleteConfirm.toLowerCase() !== 'delete' ? 0.5 : 1 }}>
                  Delete Forever
                </button>
                <button onClick={() => { setShowDeleteModal(null); setDeleteConfirm('') }} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#888', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
