'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Default input configuration - new order
const defaultInputs = [
  { id: 'symbol', label: 'Symbol', type: 'text', required: true, enabled: true },
  { id: 'outcome', label: 'Win/Loss', type: 'select', options: ['Win', 'Loss', 'Breakeven'], required: true, enabled: true },
  { id: 'riskPercent', label: '% Risked', type: 'number', required: false, enabled: true },
  { id: 'rr', label: 'RR', type: 'number', required: false, enabled: true },
  { id: 'image', label: 'Image URL', type: 'text', required: false, enabled: true },
  { id: 'direction', label: 'Trend', type: 'select', options: ['Long', 'Short'], required: false, enabled: true },
  { id: 'confidence', label: 'Confidence', type: 'select', options: ['High', 'Medium', 'Low'], required: false, enabled: true },
  { id: 'rating', label: 'Rating', type: 'rating', required: false, enabled: true },
  { id: 'notes', label: 'Notes', type: 'textarea', required: false, enabled: true },
  { id: 'date', label: 'Date', type: 'date', required: true, enabled: true },
  { id: 'timeframe', label: 'Timeframe', type: 'select', options: ['1m', '5m', '15m', '30m', '1H', '4H', 'Daily'], required: false, enabled: true },
  { id: 'session', label: 'Session', type: 'select', options: ['London', 'New York', 'Asian', 'Overlap'], required: false, enabled: true },
  { id: 'pnl', label: 'PnL ($)', type: 'number', required: true, enabled: true },
]

export default function AccountPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const accountId = params.id
  
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'statistics' ? 'statistics' : 'trades')
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [showEditInputs, setShowEditInputs] = useState(false)
  const [showExpandedNote, setShowExpandedNote] = useState(null)
  const [showExpandedImage, setShowExpandedImage] = useState(null)
  const [editingOptions, setEditingOptions] = useState(null)
  const [optionsText, setOptionsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [inputs, setInputs] = useState(defaultInputs)
  const [tradeForm, setTradeForm] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const initial = {}
    inputs.forEach(inp => {
      if (inp.type === 'date') initial[inp.id] = new Date().toISOString().split('T')[0]
      else if (inp.type === 'select' && inp.options?.length) initial[inp.id] = inp.options[0].toLowerCase()
      else if (inp.type === 'rating') initial[inp.id] = '3'
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

    const tradeData = {
      account_id: accountId,
      symbol: tradeForm.symbol?.toUpperCase(),
      direction: tradeForm.direction || 'long',
      outcome: tradeForm.outcome || 'win',
      pnl: parseFloat(tradeForm.pnl) || 0,
      rr: parseFloat(tradeForm.rr) || 0,
      date: tradeForm.date || new Date().toISOString().split('T')[0],
      notes: tradeForm.notes || '',
      image_url: tradeForm.image || '',
      extra_data: JSON.stringify({
        timeframe: tradeForm.timeframe,
        session: tradeForm.session,
        confidence: tradeForm.confidence,
        rating: tradeForm.rating,
        riskPercent: tradeForm.riskPercent,
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
    const initial = {}
    inputs.forEach(inp => {
      if (inp.type === 'date') initial[inp.id] = new Date().toISOString().split('T')[0]
      else if (inp.type === 'select' && inp.options?.length) initial[inp.id] = inp.options[0].toLowerCase()
      else if (inp.type === 'rating') initial[inp.id] = '3'
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

  function openOptionsEditor(index) {
    const input = inputs[index]
    setEditingOptions(index)
    setOptionsText((input.options || []).join('\n'))
  }

  function saveOptions() {
    if (editingOptions === null) return
    const options = optionsText.split('\n').map(o => o.trim()).filter(o => o)
    updateInput(editingOptions, 'options', options)
    setEditingOptions(null)
    setOptionsText('')
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

  // Bar Chart Component
  function BarChart({ data, valueKey = 'value', labelKey = 'label', showPercent = false }) {
    if (!data || data.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: '#333', fontSize: '11px' }}>No data</div>
    }

    const maxValue = Math.max(...data.map(d => Math.abs(d[valueKey])))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {data.map((item, i) => {
          const value = item[valueKey]
          const percent = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0
          const isPositive = value >= 0
          
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '60px', fontSize: '11px', color: '#666', textAlign: 'right' }}>{item[labelKey]}</div>
              <div style={{ flex: 1, height: '20px', background: '#0a0a0e', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: isPositive ? '#22c55e' : '#ef4444', borderRadius: '3px' }} />
              </div>
              <div style={{ width: '50px', fontSize: '11px', fontWeight: 600, color: isPositive ? '#22c55e' : '#ef4444', textAlign: 'right' }}>
                {showPercent ? `${value}%` : (value >= 0 ? '+' : '') + '$' + value.toFixed(0)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Donut Chart
  function DonutChart({ value, label, color = '#22c55e' }) {
    const radius = 36
    const stroke = 7
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    return (
      <div style={{ textAlign: 'center' }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" stroke="#1a1a22" strokeWidth={stroke} />
          <circle cx="45" cy="45" r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 45 45)" />
          <text x="45" y="45" textAnchor="middle" dy="0.35em" fontSize="16" fontWeight="700" fill="#fff">{value}%</text>
        </svg>
        <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{label}</div>
      </div>
    )
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
  const breakevens = trades.filter(t => t.outcome === 'breakeven').length
  const totalPnl = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
  const winrate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const avgRR = trades.length > 0 ? (trades.reduce((sum, t) => sum + (parseFloat(t.rr) || 0), 0) / trades.length).toFixed(2) : '0'
  const currentBalance = (parseFloat(account?.starting_balance) || 0) + totalPnl

  const grossProfit = trades.filter(t => parseFloat(t.pnl) > 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0)
  const grossLoss = Math.abs(trades.filter(t => parseFloat(t.pnl) < 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0))
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0'
  const avgWin = wins > 0 ? Math.round(grossProfit / wins) : 0
  const avgLoss = losses > 0 ? Math.round(grossLoss / losses) : 0

  function getStatsByGroup(groupField, fromExtra = false) {
    const groups = {}
    trades.forEach(trade => {
      const extra = getExtraData(trade)
      let key = fromExtra ? extra[groupField] : trade[groupField]
      if (!key) key = 'Unknown'
      if (!groups[key]) groups[key] = { trades: [], wins: 0, losses: 0, pnl: 0 }
      groups[key].trades.push(trade)
      groups[key].pnl += parseFloat(trade.pnl) || 0
      if (trade.outcome === 'win') groups[key].wins++
      if (trade.outcome === 'loss') groups[key].losses++
    })
    return groups
  }

  function getDayOfWeekStats() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const stats = {}
    days.forEach(d => stats[d] = { wins: 0, losses: 0, pnl: 0, trades: 0 })
    trades.forEach(t => {
      const day = days[new Date(t.date).getDay()]
      stats[day].trades++
      stats[day].pnl += parseFloat(t.pnl) || 0
      if (t.outcome === 'win') stats[day].wins++
      if (t.outcome === 'loss') stats[day].losses++
    })
    return Object.entries(stats).filter(([_, v]) => v.trades > 0).map(([day, v]) => ({
      label: day.slice(0, 3),
      value: (v.wins + v.losses) > 0 ? Math.round((v.wins / (v.wins + v.losses)) * 100) : 0,
      pnl: v.pnl
    }))
  }

  function getStreaks() {
    let maxWinStreak = 0, maxLossStreak = 0, tempStreak = 0, lastOutcome = null, currentStreak = 0
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
    sorted.forEach(t => {
      if (t.outcome === 'win') {
        tempStreak = lastOutcome === 'win' ? tempStreak + 1 : 1
        maxWinStreak = Math.max(maxWinStreak, tempStreak)
        lastOutcome = 'win'
      } else if (t.outcome === 'loss') {
        tempStreak = lastOutcome === 'loss' ? tempStreak + 1 : 1
        maxLossStreak = Math.max(maxLossStreak, tempStreak)
        lastOutcome = 'loss'
      }
    })
    let i = sorted.length - 1
    if (i >= 0) {
      const last = sorted[i].outcome
      while (i >= 0 && sorted[i].outcome === last) { currentStreak++; i-- }
      if (last === 'loss') currentStreak = -currentStreak
    }
    return { currentStreak, maxWinStreak, maxLossStreak }
  }

  const streaks = getStreaks()
  const dayStats = getDayOfWeekStats()
  const enabledInputs = inputs.filter(i => i.enabled)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <a href="/dashboard" style={{ color: '#555', fontSize: '18px', textDecoration: 'none' }}>←</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Journal</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>{account?.name}</div>
          </div>
          <button onClick={() => setShowAddTrade(true)} style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            + LOG NEW TRADE
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setActiveTab('trades')} style={{ padding: '10px 24px', background: activeTab === 'trades' ? '#22c55e' : 'transparent', border: activeTab === 'trades' ? 'none' : '1px solid #1a1a22', borderRadius: '6px', color: activeTab === 'trades' ? '#fff' : '#666', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            Trades
          </button>
          <button onClick={() => setActiveTab('statistics')} style={{ padding: '10px 24px', background: activeTab === 'statistics' ? '#22c55e' : 'transparent', border: activeTab === 'statistics' ? 'none' : '1px solid #1a1a22', borderRadius: '6px', color: activeTab === 'statistics' ? '#fff' : '#666', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            Statistics
          </button>
        </div>

        {/* TRADES TAB */}
        {activeTab === 'trades' && (
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px' }}>{trades.length} Trades</span>
              <button onClick={() => setShowEditInputs(true)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '4px', color: '#555', fontSize: '10px', cursor: 'pointer' }}>
                Edit Columns
              </button>
            </div>

            {trades.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#333', fontSize: '12px' }}>
                No trades yet. Click "LOG NEW TRADE" to add your first trade.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ background: '#0a0a0e' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Symbol</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>W/L</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>PnL</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>%</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>RR</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Trend</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Confidence</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Rating</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Image</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Notes</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Placed</th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', color: '#444', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '8px 6px', width: '30px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, idx) => {
                      const extra = getExtraData(trade)
                      return (
                        <tr key={trade.id} style={{ borderBottom: idx < trades.length - 1 ? '1px solid #141418' : 'none' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px' }}>{trade.symbol}</td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, background: trade.outcome === 'win' ? 'rgba(34,197,94,0.15)' : trade.outcome === 'loss' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)', color: trade.outcome === 'win' ? '#22c55e' : trade.outcome === 'loss' ? '#ef4444' : '#888' }}>
                              {trade.outcome === 'win' ? 'WIN' : trade.outcome === 'loss' ? 'LOSS' : 'BE'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: parseFloat(trade.pnl) >= 0 ? '#22c55e' : '#ef4444' }}>
                            {parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl || 0).toFixed(0)}
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: '11px', color: '#555' }}>{extra.riskPercent || '1'}%</td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: '11px', color: '#666' }}>{trade.rr || '-'}</td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: '10px', color: trade.direction === 'long' ? '#22c55e' : '#ef4444' }}>
                            {trade.direction?.toUpperCase() || '-'}
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            {extra.confidence && (
                              <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '9px', background: extra.confidence === 'High' ? 'rgba(34,197,94,0.1)' : extra.confidence === 'Low' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: extra.confidence === 'High' ? '#22c55e' : extra.confidence === 'Low' ? '#ef4444' : '#666' }}>
                                {extra.confidence}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1px' }}>
                              {[1,2,3,4,5].map(i => (
                                <span key={i} style={{ color: i <= parseInt(extra.rating || 0) ? '#22c55e' : '#2a2a35', fontSize: '9px' }}>★</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            {trade.image_url ? (
                              <button onClick={() => setShowExpandedImage(trade.image_url)} style={{ width: '22px', height: '22px', background: '#1a1a22', borderRadius: '3px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                              </button>
                            ) : (
                              <div style={{ width: '22px', height: '22px', background: '#141418', borderRadius: '3px', margin: '0 auto' }} />
                            )}
                          </td>
                          <td style={{ padding: '10px 10px', maxWidth: '120px' }}>
                            {trade.notes ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{trade.notes}</span>
                                <button onClick={() => setShowExpandedNote(trade.notes)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#333' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: '10px', color: '#444' }}>{getDaysAgo(trade.date)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '10px', color: '#444' }}>
                            {new Date(trade.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                            <button onClick={() => deleteTrade(trade.id)} style={{ background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontSize: '14px' }}>×</button>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
              {[
                { label: 'Total PnL', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Winrate', value: `${winrate}%`, color: winrate >= 50 ? '#22c55e' : '#ef4444' },
                { label: 'Profit Factor', value: profitFactor, color: '#fff' },
                { label: 'Avg RR', value: `${avgRR}R`, color: '#fff' },
                { label: 'Avg Win', value: `+$${avgWin}`, color: '#22c55e' },
                { label: 'Avg Loss', value: `-$${avgLoss}`, color: '#ef4444' },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '9px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {/* Win/Loss */}
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Win/Loss</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <DonutChart value={winrate} label="Win Rate" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e' }} /><span style={{ fontSize: '11px' }}>{wins} Wins</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} /><span style={{ fontSize: '11px' }}>{losses} Losses</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#555' }} /><span style={{ fontSize: '11px' }}>{breakevens} BE</span></div>
                  </div>
                </div>
              </div>

              {/* Streaks */}
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Streaks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0a0a0e', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Current</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: streaks.currentStreak >= 0 ? '#22c55e' : '#ef4444' }}>{streaks.currentStreak >= 0 ? '+' : ''}{streaks.currentStreak}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0a0a0e', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Best Win</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>{streaks.maxWinStreak}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0a0a0e', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Worst Loss</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>{streaks.maxLossStreak}</span>
                  </div>
                </div>
              </div>

              {/* Long vs Short */}
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Long vs Short</h3>
                {(() => {
                  const dir = getStatsByGroup('direction')
                  const longWr = dir['long'] && (dir['long'].wins + dir['long'].losses) > 0 ? Math.round((dir['long'].wins / (dir['long'].wins + dir['long'].losses)) * 100) : 0
                  const shortWr = dir['short'] && (dir['short'].wins + dir['short'].losses) > 0 ? Math.round((dir['short'].wins / (dir['short'].wins + dir['short'].losses)) * 100) : 0
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ padding: '10px', background: '#0a0a0e', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '10px', color: '#22c55e' }}>Long</span><span style={{ fontSize: '10px', color: '#555' }}>{dir['long']?.trades?.length || 0} trades</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', fontWeight: 600 }}>{longWr}%</span><span style={{ fontSize: '12px', fontWeight: 600, color: (dir['long']?.pnl || 0) >= 0 ? '#22c55e' : '#ef4444' }}>{(dir['long']?.pnl || 0) >= 0 ? '+' : ''}${(dir['long']?.pnl || 0).toFixed(0)}</span></div>
                      </div>
                      <div style={{ padding: '10px', background: '#0a0a0e', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '10px', color: '#ef4444' }}>Short</span><span style={{ fontSize: '10px', color: '#555' }}>{dir['short']?.trades?.length || 0} trades</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', fontWeight: 600 }}>{shortWr}%</span><span style={{ fontSize: '12px', fontWeight: 600, color: (dir['short']?.pnl || 0) >= 0 ? '#22c55e' : '#ef4444' }}>{(dir['short']?.pnl || 0) >= 0 ? '+' : ''}${(dir['short']?.pnl || 0).toFixed(0)}</span></div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>PnL by Symbol</h3>
                <BarChart data={Object.entries(getStatsByGroup('symbol')).map(([s, d]) => ({ label: s, value: d.pnl })).sort((a, b) => b.value - a.value).slice(0, 6)} />
              </div>
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Winrate by Day</h3>
                <BarChart data={dayStats} valueKey="value" showPercent={true} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Winrate by Session</h3>
                <BarChart data={Object.entries(getStatsByGroup('session', true)).filter(([k]) => k !== 'Unknown').map(([s, d]) => ({ label: s, value: (d.wins + d.losses) > 0 ? Math.round((d.wins / (d.wins + d.losses)) * 100) : 0 }))} showPercent={true} />
              </div>
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Winrate by Confidence</h3>
                <BarChart data={Object.entries(getStatsByGroup('confidence', true)).filter(([k]) => k !== 'Unknown').map(([c, d]) => ({ label: c, value: (d.wins + d.losses) > 0 ? Math.round((d.wins / (d.wins + d.losses)) * 100) : 0 }))} showPercent={true} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>PnL by Rating</h3>
                <BarChart data={Object.entries(getStatsByGroup('rating', true)).filter(([k]) => k !== 'Unknown').sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([r, d]) => ({ label: `${r}★`, value: d.pnl }))} />
              </div>
              <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Winrate by Timeframe</h3>
                <BarChart data={Object.entries(getStatsByGroup('timeframe', true)).filter(([k]) => k !== 'Unknown').map(([t, d]) => ({ label: t, value: (d.wins + d.losses) > 0 ? Math.round((d.wins / (d.wins + d.losses)) * 100) : 0 }))} showPercent={true} />
              </div>
            </div>
          </div>
        )}

        {/* ADD TRADE MODAL */}
        {showAddTrade && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAddTrade(false)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '20px', width: '550px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Log New Trade</h2>
                <button onClick={() => setShowEditInputs(true)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '4px', color: '#555', fontSize: '10px', cursor: 'pointer' }}>Edit Fields</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {enabledInputs.map(input => (
                  <div key={input.id} style={{ gridColumn: input.type === 'textarea' ? 'span 2' : 'span 1' }}>
                    <label style={{ display: 'block', fontSize: '9px', color: '#444', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {input.label} {input.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {input.type === 'select' ? (
                      <select value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} style={{ width: '100%', padding: '8px 10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '5px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}>
                        {input.options?.map(opt => (<option key={opt} value={opt.toLowerCase()}>{opt}</option>))}
                      </select>
                    ) : input.type === 'textarea' ? (
                      <textarea value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} placeholder={`Enter ${input.label.toLowerCase()}...`} rows={2} style={{ width: '100%', padding: '8px 10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '5px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', resize: 'none' }} />
                    ) : input.type === 'rating' ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1,2,3,4,5].map(i => (
                          <button key={i} onClick={() => setTradeForm({...tradeForm, [input.id]: String(i)})} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: i <= parseInt(tradeForm[input.id] || 0) ? '#22c55e' : '#333' }}>★</button>
                        ))}
                      </div>
                    ) : (
                      <input type={input.type} value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} placeholder={input.type === 'number' ? '0' : ''} step={input.type === 'number' ? '0.1' : undefined} style={{ width: '100%', padding: '8px 10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '5px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addTrade} disabled={saving || !tradeForm.symbol || !tradeForm.pnl} style={{ flex: 1, padding: '10px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: (saving || !tradeForm.symbol || !tradeForm.pnl) ? 0.5 : 1 }}>
                  {saving ? 'Saving...' : 'Save Trade'}
                </button>
                <button onClick={() => setShowAddTrade(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#666', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT INPUTS MODAL */}
        {showEditInputs && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }} onClick={() => setShowEditInputs(false)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '20px', width: '480px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Customize Fields</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {inputs.map((input, index) => (
                  <div key={input.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#0a0a0e', borderRadius: '6px' }}>
                    <input type="checkbox" checked={input.enabled} onChange={e => updateInput(index, 'enabled', e.target.checked)} style={{ width: '14px', height: '14px' }} />
                    <input type="text" value={input.label} onChange={e => updateInput(index, 'label', e.target.value)} style={{ flex: 1, padding: '5px 8px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '4px', color: '#fff', fontSize: '12px' }} />
                    <select value={input.type} onChange={e => updateInput(index, 'type', e.target.value)} style={{ padding: '5px 8px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '4px', color: '#666', fontSize: '11px' }}>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Dropdown</option>
                      <option value="textarea">Notes</option>
                      <option value="rating">Rating</option>
                    </select>
                    {input.type === 'select' && (
                      <button onClick={() => openOptionsEditor(index)} style={{ padding: '4px 8px', background: '#22c55e', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>
                        Options
                      </button>
                    )}
                    {!['symbol', 'date', 'outcome', 'pnl'].includes(input.id) && (
                      <button onClick={() => deleteInput(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addNewInput} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px dashed #1a1a22', borderRadius: '6px', color: '#555', fontSize: '12px', cursor: 'pointer', marginBottom: '16px' }}>
                + Add New Field
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveInputs} style={{ flex: 1, padding: '10px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Save Changes</button>
                <button onClick={() => setShowEditInputs(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#666', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* OPTIONS EDITOR MODAL */}
        {editingOptions !== null && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 102 }} onClick={() => setEditingOptions(null)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '20px', width: '320px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Edit Dropdown Options</h2>
              <p style={{ fontSize: '11px', color: '#555', marginBottom: '12px' }}>Enter each option on a new line</p>
              <textarea value={optionsText} onChange={e => setOptionsText(e.target.value)} rows={6} placeholder="Option 1&#10;Option 2&#10;Option 3" style={{ width: '100%', padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', resize: 'none', marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveOptions} style={{ flex: 1, padding: '10px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingOptions(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#666', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* EXPANDED NOTE MODAL */}
        {showExpandedNote && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowExpandedNote(null)}>
            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '10px', padding: '20px', width: '500px', maxHeight: '60vh' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Trade Notes</h2>
              <div style={{ background: '#0a0a0e', borderRadius: '6px', padding: '14px', maxHeight: '300px', overflowY: 'auto', fontSize: '13px', color: '#888', lineHeight: '1.6' }}>
                {showExpandedNote}
              </div>
              <button onClick={() => setShowExpandedNote(null)} style={{ marginTop: '14px', width: '100%', padding: '10px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '6px', color: '#666', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}

        {/* EXPANDED IMAGE MODAL */}
        {showExpandedImage && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowExpandedImage(null)}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <img src={showExpandedImage} alt="Trade" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px' }} />
              <button onClick={() => setShowExpandedImage(null)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'transparent', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
