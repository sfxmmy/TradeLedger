'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Default input configuration
const defaultInputs = [
  { id: 'symbol', label: 'Symbol', type: 'text', required: true, enabled: true },
  { id: 'date', label: 'Date', type: 'date', required: true, enabled: true },
  { id: 'direction', label: 'Direction', type: 'select', options: ['Long', 'Short'], required: true, enabled: true },
  { id: 'outcome', label: 'Result', type: 'select', options: ['Win', 'Loss', 'Breakeven'], required: true, enabled: true },
  { id: 'pnl', label: 'Profit ($)', type: 'number', required: true, enabled: true },
  { id: 'rr', label: 'RR', type: 'number', required: false, enabled: true },
  { id: 'timeframe', label: 'Timeframe', type: 'select', options: ['1m', '5m', '15m', '30m', '1H', '4H', 'Daily'], required: false, enabled: true },
  { id: 'session', label: 'Session', type: 'select', options: ['London', 'New York', 'Asian', 'Overlap'], required: false, enabled: true },
  { id: 'confluences', label: 'Confluences', type: 'number', required: false, enabled: true },
  { id: 'emotion', label: 'Emotion', type: 'select', options: ['Confident', 'Neutral', 'Fearful', 'FOMO', 'Revenge'], required: false, enabled: true },
  { id: 'rating', label: 'Rating', type: 'select', options: ['1', '2', '3', '4', '5'], required: false, enabled: true },
  { id: 'notes', label: 'Notes', type: 'textarea', required: false, enabled: true },
]

export default function AccountPage() {
  const params = useParams()
  const accountId = params.id
  
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('trades')
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [showEditInputs, setShowEditInputs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inputs, setInputs] = useState(defaultInputs)
  const [tradeForm, setTradeForm] = useState({})
  const [statFilter, setStatFilter] = useState('all')
  const [statMetric, setStatMetric] = useState('pnl')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Initialize trade form with default values
    const initial = {}
    inputs.forEach(inp => {
      if (inp.type === 'date') initial[inp.id] = new Date().toISOString().split('T')[0]
      else if (inp.type === 'select' && inp.options?.length) initial[inp.id] = inp.options[0].toLowerCase()
      else initial[inp.id] = ''
    })
    setTradeForm(initial)
  }, [inputs])

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

    setUser(user)

    const { data: accountData } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (!accountData) {
      window.location.href = '/dashboard'
      return
    }

    setAccount(accountData)

    // Load custom inputs if saved
    if (accountData.custom_inputs) {
      try {
        setInputs(JSON.parse(accountData.custom_inputs))
      } catch (e) {}
    }

    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false })

    setTrades(tradesData || [])
    setLoading(false)
  }

  async function addTrade() {
    if (!tradeForm.symbol || !tradeForm.pnl) return
    setSaving(true)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Prepare trade data
    const tradeData = {
      account_id: accountId,
      symbol: tradeForm.symbol?.toUpperCase(),
      direction: tradeForm.direction || 'long',
      outcome: tradeForm.outcome || 'win',
      pnl: parseFloat(tradeForm.pnl) || 0,
      rr: parseFloat(tradeForm.rr) || 0,
      date: tradeForm.date || new Date().toISOString().split('T')[0],
      notes: tradeForm.notes || '',
      // Store additional fields as JSON
      extra_data: JSON.stringify({
        timeframe: tradeForm.timeframe,
        session: tradeForm.session,
        confluences: tradeForm.confluences,
        emotion: tradeForm.emotion,
        rating: tradeForm.rating,
      })
    }

    const { data, error } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single()

    if (error) {
      alert('Error: ' + error.message)
      setSaving(false)
      return
    }

    setTrades([data, ...trades])
    // Reset form
    const initial = {}
    inputs.forEach(inp => {
      if (inp.type === 'date') initial[inp.id] = new Date().toISOString().split('T')[0]
      else if (inp.type === 'select' && inp.options?.length) initial[inp.id] = inp.options[0].toLowerCase()
      else initial[inp.id] = ''
    })
    setTradeForm(initial)
    setShowAddTrade(false)
    setSaving(false)
  }

  async function deleteTrade(tradeId) {
    if (!confirm('Delete this trade?')) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    await supabase.from('trades').delete().eq('id', tradeId)
    setTrades(trades.filter(t => t.id !== tradeId))
  }

  async function saveInputs() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    await supabase
      .from('accounts')
      .update({ custom_inputs: JSON.stringify(inputs) })
      .eq('id', accountId)

    setShowEditInputs(false)
  }

  function addNewInput() {
    setInputs([...inputs, {
      id: `custom_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      enabled: true,
      options: []
    }])
  }

  function updateInput(index, field, value) {
    const newInputs = [...inputs]
    newInputs[index] = { ...newInputs[index], [field]: value }
    setInputs(newInputs)
  }

  function deleteInput(index) {
    setInputs(inputs.filter((_, i) => i !== index))
  }

  // Get extra data from trade
  function getExtraData(trade) {
    try {
      return JSON.parse(trade.extra_data || '{}')
    } catch {
      return {}
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}><span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span></div>
          <div style={{ color: '#666' }}>Loading...</div>
        </div>
      </div>
    )
  }

  // Calculate stats
  const wins = trades.filter(t => t.outcome === 'win').length
  const losses = trades.filter(t => t.outcome === 'loss').length
  const totalPnl = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
  const winrate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const avgRR = trades.length > 0 ? (trades.reduce((sum, t) => sum + (parseFloat(t.rr) || 0), 0) / trades.length).toFixed(2) : '0'
  const currentBalance = (parseFloat(account?.starting_balance) || 0) + totalPnl

  // Stats by filter
  function getStatsByGroup(groupField) {
    const groups = {}
    trades.forEach(trade => {
      const extra = getExtraData(trade)
      let key = trade[groupField] || extra[groupField] || 'Unknown'
      if (!groups[key]) {
        groups[key] = { trades: [], wins: 0, losses: 0, pnl: 0 }
      }
      groups[key].trades.push(trade)
      groups[key].pnl += parseFloat(trade.pnl) || 0
      if (trade.outcome === 'win') groups[key].wins++
      if (trade.outcome === 'loss') groups[key].losses++
    })
    return groups
  }

  // Enabled inputs for display
  const enabledInputs = inputs.filter(i => i.enabled)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <a href="/dashboard" style={{ color: '#555', fontSize: '20px' }}>←</a>
          <div>
            <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Journal</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{account?.name}</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('trades')} 
            style={{ 
              padding: '12px 24px', 
              background: activeTab === 'trades' ? '#22c55e' : 'transparent', 
              border: activeTab === 'trades' ? 'none' : '1px solid #1a1a22', 
              borderRadius: '8px', 
              color: activeTab === 'trades' ? '#fff' : '#888', 
              fontWeight: 600, 
              fontSize: '13px', 
              cursor: 'pointer' 
            }}
          >
            Trades
          </button>
          <button 
            onClick={() => setActiveTab('statistics')} 
            style={{ 
              padding: '12px 24px', 
              background: activeTab === 'statistics' ? '#22c55e' : 'transparent', 
              border: activeTab === 'statistics' ? 'none' : '1px solid #1a1a22', 
              borderRadius: '8px', 
              color: activeTab === 'statistics' ? '#fff' : '#888', 
              fontWeight: 600, 
              fontSize: '13px', 
              cursor: 'pointer' 
            }}
          >
            Statistics
          </button>
          <div style={{ flex: 1 }} />
          <button 
            onClick={() => setShowAddTrade(true)} 
            style={{ padding: '12px 24px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            + LOG NEW TRADE
          </button>
        </div>

        {/* TRADES TAB */}
        {activeTab === 'trades' && (
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Table Header with Edit Button */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a1a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {trades.length} Trades
              </span>
              <button 
                onClick={() => setShowEditInputs(true)} 
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#666', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Columns
              </button>
            </div>

            {trades.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#444' }}>
                No trades yet. Click "LOG NEW TRADE" to add your first trade.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#0a0a0e' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Symbol</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Result</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Profit</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>RR</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Time</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Confluences</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Emotion</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Rating</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Notes</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: '#555', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '10px 8px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => {
                      const extra = getExtraData(trade)
                      return (
                        <tr key={trade.id} style={{ borderBottom: '1px solid #141418' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>{trade.symbol}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              background: trade.outcome === 'win' ? 'rgba(34,197,94,0.15)' : trade.outcome === 'loss' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)', 
                              color: trade.outcome === 'win' ? '#22c55e' : trade.outcome === 'loss' ? '#ef4444' : '#888' 
                            }}>
                              {trade.outcome?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '13px', color: parseFloat(trade.pnl) >= 0 ? '#22c55e' : '#ef4444' }}>
                            {parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl || 0).toFixed(0)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#888' }}>{trade.rr || '-'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#666' }}>{extra.timeframe || '-'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#888' }}>{extra.confluences || '-'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {extra.emotion && (
                              <span style={{ 
                                padding: '3px 8px', 
                                borderRadius: '4px', 
                                fontSize: '10px', 
                                background: extra.emotion === 'Confident' ? 'rgba(34,197,94,0.1)' : extra.emotion === 'FOMO' || extra.emotion === 'Revenge' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', 
                                color: extra.emotion === 'Confident' ? '#22c55e' : extra.emotion === 'FOMO' || extra.emotion === 'Revenge' ? '#ef4444' : '#666' 
                              }}>
                                {extra.emotion}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {extra.rating && (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                {[1,2,3,4,5].map(i => (
                                  <span key={i} style={{ color: i <= parseInt(extra.rating) ? '#22c55e' : '#333', fontSize: '10px' }}>●</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {trade.notes || '-'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
                            {new Date(trade.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <button onClick={() => deleteTrade(trade.id)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '16px' }}>×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Overall Stats */}
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#0a0a0e', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>Total PnL</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}</div>
                </div>
                <div style={{ background: '#0a0a0e', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>Winrate</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{winrate}%</div>
                </div>
                <div style={{ background: '#0a0a0e', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>Avg RR</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{avgRR}R</div>
                </div>
                <div style={{ background: '#0a0a0e', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>Balance</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>${currentBalance.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* PnL by Symbol */}
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>PnL by Symbol</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(getStatsByGroup('symbol')).slice(0, 5).map(([symbol, data]) => (
                  <div key={symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0e', borderRadius: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{symbol}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{data.trades.length} trades</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: data.pnl >= 0 ? '#22c55e' : '#ef4444' }}>{data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(getStatsByGroup('symbol')).length === 0 && (
                  <div style={{ color: '#444', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No data yet</div>
                )}
              </div>
            </div>

            {/* Winrate by Emotion */}
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Winrate by Emotion</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(getStatsByGroup('emotion')).map(([emotion, data]) => {
                  const wr = (data.wins + data.losses) > 0 ? Math.round((data.wins / (data.wins + data.losses)) * 100) : 0
                  return (
                    <div key={emotion} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0e', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px' }}>{emotion}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>{data.trades.length} trades</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: wr >= 50 ? '#22c55e' : '#ef4444' }}>{wr}%</span>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(getStatsByGroup('emotion')).length === 0 && (
                  <div style={{ color: '#444', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No data yet</div>
                )}
              </div>
            </div>

            {/* Winrate by Timeframe */}
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Winrate by Timeframe</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(getStatsByGroup('timeframe')).map(([tf, data]) => {
                  const wr = (data.wins + data.losses) > 0 ? Math.round((data.wins / (data.wins + data.losses)) * 100) : 0
                  return (
                    <div key={tf} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0e', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px' }}>{tf}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>{data.trades.length} trades</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: wr >= 50 ? '#22c55e' : '#ef4444' }}>{wr}%</span>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(getStatsByGroup('timeframe')).length === 0 && (
                  <div style={{ color: '#444', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No data yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADD TRADE MODAL */}
        {showAddTrade && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAddTrade(false)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', padding: '24px', width: '600px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Log New Trade</h2>
                <button onClick={() => setShowEditInputs(true)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '4px', color: '#666', fontSize: '11px', cursor: 'pointer' }}>
                  Edit Fields
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {enabledInputs.map(input => (
                  <div key={input.id} style={{ gridColumn: input.type === 'textarea' ? 'span 2' : 'span 1' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {input.label} {input.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {input.type === 'select' ? (
                      <select
                        value={tradeForm[input.id] || ''}
                        onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})}
                        style={{ width: '100%', padding: '10px 12px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                      >
                        {input.options?.map(opt => (
                          <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                        ))}
                      </select>
                    ) : input.type === 'textarea' ? (
                      <textarea
                        value={tradeForm[input.id] || ''}
                        onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})}
                        placeholder={`Enter ${input.label.toLowerCase()}...`}
                        rows={2}
                        style={{ width: '100%', padding: '10px 12px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', resize: 'none' }}
                      />
                    ) : (
                      <input
                        type={input.type}
                        value={tradeForm[input.id] || ''}
                        onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})}
                        placeholder={input.type === 'number' ? '0' : `Enter ${input.label.toLowerCase()}`}
                        step={input.type === 'number' ? '0.1' : undefined}
                        style={{ width: '100%', padding: '10px 12px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={addTrade} disabled={saving || !tradeForm.symbol || !tradeForm.pnl} style={{ flex: 1, padding: '12px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: (saving || !tradeForm.symbol || !tradeForm.pnl) ? 0.5 : 1 }}>
                  {saving ? 'Saving...' : 'Save Trade'}
                </button>
                <button onClick={() => setShowAddTrade(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '8px', color: '#888', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT INPUTS MODAL */}
        {showEditInputs && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }} onClick={() => setShowEditInputs(false)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '12px', padding: '24px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Customize Fields</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {inputs.map((input, index) => (
                  <div key={input.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#0a0a0e', borderRadius: '8px' }}>
                    <input
                      type="checkbox"
                      checked={input.enabled}
                      onChange={e => updateInput(index, 'enabled', e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <input
                      type="text"
                      value={input.label}
                      onChange={e => updateInput(index, 'label', e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                    />
                    <select
                      value={input.type}
                      onChange={e => updateInput(index, 'type', e.target.value)}
                      style={{ padding: '6px 10px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '4px', color: '#888', fontSize: '12px' }}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Dropdown</option>
                      <option value="textarea">Notes</option>
                    </select>
                    {!['symbol', 'date', 'direction', 'outcome', 'pnl'].includes(input.id) && (
                      <button onClick={() => deleteInput(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addNewInput} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed #1a1a22', borderRadius: '8px', color: '#666', fontSize: '13px', cursor: 'pointer', marginBottom: '20px' }}>
                + Add New Field
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={saveInputs} style={{ flex: 1, padding: '12px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
                <button onClick={() => setShowEditInputs(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '8px', color: '#888', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
