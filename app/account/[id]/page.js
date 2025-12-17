'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const defaultInputs = [
  { id: 'symbol', label: 'Symbol', type: 'text', required: true, enabled: true, fixed: true },
  { id: 'outcome', label: 'Win/Loss', type: 'select', options: ['Win', 'Loss', 'Breakeven'], required: true, enabled: true, fixed: true },
  { id: 'pnl', label: 'PnL ($)', type: 'number', required: true, enabled: true, fixed: true },
  { id: 'riskPercent', label: '% Risked', type: 'number', required: false, enabled: true, fixed: true },
  { id: 'rr', label: 'RR', type: 'number', required: false, enabled: true, fixed: true },
  { id: 'direction', label: 'Trend', type: 'select', options: ['Long', 'Short'], required: false, enabled: true, fixed: false },
  { id: 'confidence', label: 'Confidence', type: 'select', options: ['High', 'Medium', 'Low'], required: false, enabled: true, fixed: false },
  { id: 'rating', label: 'Rating', type: 'rating', required: false, enabled: true, fixed: false },
  { id: 'notes', label: 'Notes', type: 'textarea', required: false, enabled: true, fixed: false },
  { id: 'date', label: 'Date', type: 'date', required: true, enabled: true, fixed: true },
  { id: 'timeframe', label: 'Timeframe', type: 'select', options: ['1m', '5m', '15m', '30m', '1H', '4H', 'Daily'], required: false, enabled: true, fixed: false },
  { id: 'session', label: 'Session', type: 'select', options: ['London', 'New York', 'Asian', 'Overlap'], required: false, enabled: true, fixed: false },
  { id: 'image', label: 'Image', type: 'file', required: false, enabled: true, fixed: false },
]

export default function AccountPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const accountId = params.id
  
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [trades, setTrades] = useState([])
  const [notes, setNotes] = useState({ daily: {}, weekly: {}, custom: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'statistics' ? 'statistics' : searchParams.get('tab') === 'notes' ? 'notes' : 'trades')
  const [notesSubTab, setNotesSubTab] = useState('daily')
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [showEditInputs, setShowEditInputs] = useState(false)
  const [showExpandedNote, setShowExpandedNote] = useState(null)
  const [showExpandedImage, setShowExpandedImage] = useState(null)
  const [editingOptions, setEditingOptions] = useState(null)
  const [optionsText, setOptionsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [inputs, setInputs] = useState(defaultInputs)
  const [tradeForm, setTradeForm] = useState({})
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [noteText, setNoteText] = useState('')
  const [customNoteTitle, setCustomNoteTitle] = useState('')
  const [barGraphMetric, setBarGraphMetric] = useState('winrate')
  const [graphGroupBy, setGraphGroupBy] = useState('symbol')
  const [analysisGroupBy, setAnalysisGroupBy] = useState('direction')
  const [analysisMetric, setAnalysisMetric] = useState('avgpnl')
  const [pairAnalysisType, setPairAnalysisType] = useState('best')
  const [hoverPoint, setHoverPoint] = useState(null)
  const [hoverBar, setHoverBar] = useState(null)
  const [hoverDaily, setHoverDaily] = useState(null)
  const [hasNewInputs, setHasNewInputs] = useState(false)

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const initial = {}
    inputs.forEach(inp => {
      if (inp.type === 'select' && inp.options?.length) initial[inp.id] = inp.options[0].toLowerCase()
      else if (inp.type === 'date') initial[inp.id] = new Date().toISOString().split('T')[0]
      else if (inp.type === 'rating') initial[inp.id] = '3'
      else initial[inp.id] = ''
    })
    setTradeForm(initial)
  }, [inputs, showAddTrade])

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function loadData() {
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return window.location.href = '/'
      setUser(u)

      const { data: acc } = await supabase.from('accounts').select('*').eq('id', accountId).single()
      if (acc) {
        setAccount(acc)
        if (acc.custom_inputs) {
          const parsed = JSON.parse(acc.custom_inputs)
          if (Array.isArray(parsed)) setInputs(parsed)
        }
      }

      const { data: t } = await supabase.from('trades').select('*').eq('account_id', accountId).order('date', { ascending: false })
      if (t) setTrades(t)

      const { data: n } = await supabase.from('notes').select('*').eq('account_id', accountId)
      if (n?.length) {
        const organized = { daily: {}, weekly: {}, custom: [] }
        n.forEach(note => {
          if (note.type === 'custom') organized.custom.push({ date: note.date, title: note.title, text: note.content })
          else organized[note.type] = { ...organized[note.type], [note.date]: note.content }
        })
        setNotes(organized)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function addTrade() {
    setSaving(true)
    const { symbol, outcome, pnl, riskPercent, rr, date, direction, ...rest } = tradeForm
    const { error } = await supabase.from('trades').insert({
      account_id: accountId,
      symbol: symbol.toUpperCase(),
      outcome: outcome?.toLowerCase(),
      pnl: parseFloat(pnl),
      risk_percent: parseFloat(riskPercent) || null,
      rr: parseFloat(rr) || null,
      date,
      direction: direction?.toLowerCase(),
      extra_data: JSON.stringify(rest)
    })
    if (!error) {
      setShowAddTrade(false)
      setHasNewInputs(true)
      loadData()
    }
    setSaving(false)
  }

  async function deleteTrade(id) {
    if (!confirm('Delete this trade?')) return
    await supabase.from('trades').delete().eq('id', id)
    loadData()
  }

  async function saveNote() {
    const { error } = await supabase.from('notes').upsert({
      account_id: accountId, type: notesSubTab, date: noteDate,
      title: notesSubTab === 'custom' ? customNoteTitle || 'Untitled' : null,
      content: noteText
    }, { onConflict: notesSubTab === 'custom' ? undefined : 'account_id,type,date' })
    if (!error) { setNoteText(''); setCustomNoteTitle(''); loadData() }
  }

  async function deleteNote(type, key) {
    if (type === 'custom') {
      const n = notes.custom[key]
      await supabase.from('notes').delete().eq('account_id', accountId).eq('type', 'custom').eq('date', n.date).eq('title', n.title)
    } else {
      await supabase.from('notes').delete().eq('account_id', accountId).eq('type', type).eq('date', key)
    }
    loadData()
  }

  async function saveInputs() {
    setHasNewInputs(true)
    await supabase.from('accounts').update({ custom_inputs: JSON.stringify(inputs) }).eq('id', accountId)
    setShowEditInputs(false)
  }

  function getWeekStart(d) {
    d = new Date(d)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toISOString().split('T')[0]
  }

  function addNewInput() { 
    const newInput = { id: `custom_${Date.now()}`, label: 'New Field', type: 'text', required: false, enabled: true, fixed: false, options: [] }
    setInputs([...inputs, newInput]) 
  }
  function updateInput(i, f, v) { const n = [...inputs]; n[i] = { ...n[i], [f]: v }; setInputs(n) }
  function deleteInput(i) { setInputs(inputs.filter((_, idx) => idx !== i)) }
  function openOptionsEditor(i) { setEditingOptions(i); setOptionsText((inputs[i].options || []).join('\n')) }
  function saveOptions() { if (editingOptions === null) return; updateInput(editingOptions, 'options', optionsText.split('\n').map(o => o.trim()).filter(o => o)); setEditingOptions(null); setOptionsText('') }
  function getExtraData(t) { try { return JSON.parse(t.extra_data || '{}') } catch { return {} } }
  function getDaysAgo(d) { const diff = Math.floor((new Date() - new Date(d)) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? '1d ago' : `${diff}d ago` }

  // Get custom select inputs for dropdown options
  function getCustomSelectInputs() {
    return inputs.filter(i => i.type === 'select' && i.enabled && !['outcome'].includes(i.id))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}><span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE+</span></div>
        <div style={{ color: '#888' }}>Loading...</div>
      </div>
    </div>
  )

  const wins = trades.filter(t => t.outcome === 'win').length
  const losses = trades.filter(t => t.outcome === 'loss').length
  const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const winrate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const grossProfit = trades.filter(t => parseFloat(t.pnl) > 0).reduce((s, t) => s + parseFloat(t.pnl), 0)
  const grossLoss = Math.abs(trades.filter(t => parseFloat(t.pnl) < 0).reduce((s, t) => s + parseFloat(t.pnl), 0))
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? 'Inf' : '0'
  const avgWin = wins > 0 ? Math.round(grossProfit / wins) : 0
  const avgLoss = losses > 0 ? Math.round(grossLoss / losses) : 0
  const startingBalance = parseFloat(account?.starting_balance) || 10000
  const currentBalance = startingBalance + totalPnl

  function getStreaks() {
    let mw = 0, ml = 0, ts = 0, lo = null, cs = 0
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
    sorted.forEach(t => { if (t.outcome === 'win') { ts = lo === 'win' ? ts + 1 : 1; mw = Math.max(mw, ts); lo = 'win' } else if (t.outcome === 'loss') { ts = lo === 'loss' ? ts + 1 : 1; ml = Math.max(ml, ts); lo = 'loss' } })
    let i = sorted.length - 1
    if (i >= 0) { const last = sorted[i].outcome; while (i >= 0 && sorted[i].outcome === last) { cs++; i-- }; if (last === 'loss') cs = -cs }
    return { cs, mw, ml }
  }
  const streaks = getStreaks()
  const enabledInputs = inputs.filter(i => i.enabled)
  const fixedInputs = enabledInputs.filter(i => i.fixed || ['symbol', 'outcome', 'pnl', 'riskPercent', 'rr', 'date'].includes(i.id))
  const customInputs = enabledInputs.filter(i => !i.fixed && !['symbol', 'outcome', 'pnl', 'riskPercent', 'rr', 'date'].includes(i.id))

  const avgRating = trades.length > 0 ? (trades.reduce((s, t) => s + (parseInt(getExtraData(t).rating) || 0), 0) / trades.length).toFixed(1) : '0'
  const avgPnl = trades.length > 0 ? Math.round(totalPnl / trades.length) : 0
  const avgRR = trades.length > 0 ? (trades.reduce((s, t) => s + (parseFloat(t.rr) || 0), 0) / trades.length).toFixed(1) : '0'
  const mostTradedPair = (() => { const c = {}; trades.forEach(t => c[t.symbol] = (c[t.symbol] || 0) + 1); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || '-' })()
  const mostUsedRR = (() => { const c = {}; trades.forEach(t => { const rr = Math.round(parseFloat(t.rr) || 0); if (rr > 0) c[rr] = (c[rr] || 0) + 1 }); const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return best ? best[0] + 'R' : '-' })()
  const mostProfitableRR = (() => { const c = {}; trades.forEach(t => { const rr = Math.round(parseFloat(t.rr) || 0); if (rr > 0) c[rr] = (c[rr] || 0) + (parseFloat(t.pnl) || 0) }); const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return best ? best[0] + 'R' : '-' })()
  const bestRR = (() => { const best = trades.filter(t => t.outcome === 'win').sort((a, b) => (parseFloat(b.rr) || 0) - (parseFloat(a.rr) || 0))[0]; return best ? `${best.rr}R` : '-' })()
  const avgTrend = trades.filter(t => t.direction === 'long').length >= trades.filter(t => t.direction === 'short').length ? 'Long' : 'Short'
  const longCount = trades.filter(t => t.direction === 'long').length
  const shortCount = trades.filter(t => t.direction === 'short').length
  const longPct = Math.round((longCount / (longCount + shortCount || 1)) * 100)

  const bestDay = (() => { const byDay = {}; trades.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + (parseFloat(t.pnl) || 0) }); const best = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]; return best ? { date: best[0], pnl: best[1] } : null })()
  const worstDay = (() => { const byDay = {}; trades.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + (parseFloat(t.pnl) || 0) }); const worst = Object.entries(byDay).sort((a, b) => a[1] - b[1])[0]; return worst ? { date: worst[0], pnl: worst[1] } : null })()
  const tradingDays = new Set(trades.map(t => t.date)).size
  const avgTradesPerDay = tradingDays > 0 ? (trades.length / tradingDays).toFixed(1) : 0
  const biggestWin = Math.max(...trades.map(t => parseFloat(t.pnl) || 0), 0)
  const biggestLoss = Math.min(...trades.map(t => parseFloat(t.pnl) || 0), 0)
  const expectancy = trades.length > 0 ? ((winrate / 100) * avgWin - ((100 - winrate) / 100) * avgLoss).toFixed(0) : 0
  const lossExpectancy = trades.length > 0 ? (((100 - winrate) / 100) * avgLoss).toFixed(0) : 0
  const returnOnRisk = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '-'

  // Calculate consistency score (% of winning days)
  const consistencyScore = (() => {
    const byDay = {}
    trades.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + (parseFloat(t.pnl) || 0) })
    const days = Object.values(byDay)
    if (days.length === 0) return 0
    const winningDays = days.filter(pnl => pnl > 0).length
    return Math.round((winningDays / days.length) * 100)
  })()

  // Calculate monthly growth %
  const monthlyGrowth = (() => {
    if (trades.length === 0) return '0'
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
    const firstDate = new Date(sorted[0].date)
    const lastDate = new Date(sorted[sorted.length - 1].date)
    const monthsDiff = Math.max(1, (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth()) + 1)
    const totalGrowth = ((currentBalance / startingBalance) - 1) * 100
    return (totalGrowth / monthsDiff).toFixed(1)
  })()

  // Daily PnL data for net daily chart
  const dailyPnL = (() => {
    const byDay = {}
    trades.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + (parseFloat(t.pnl) || 0) })
    return Object.entries(byDay).sort((a, b) => new Date(a[0]) - new Date(b[0])).map(([date, pnl]) => ({ date, pnl }))
  })()

  const tabTitles = { trades: 'TRADES AREA', statistics: 'STATISTICS AREA', notes: 'NOTES AREA' }
  const tabDescriptions = {
    trades: 'View and manage all your trades. Add new trades and track performance.',
    statistics: 'Detailed statistics, charts, and breakdowns by pair, session, and more.',
    notes: 'Keep daily, weekly, and custom notes about your trading journey.'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>

      {/* FIXED HEADER */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a22', background: '#0a0a0f' }}>
        <a href="/" style={{ fontSize: '28px', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.5px' }}><span style={{ color: '#22c55e' }}>LSD</span><span style={{ color: '#fff' }}>TRADE</span><span style={{ color: '#22c55e' }}>+</span></a>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{tabTitles[activeTab]}</div>
        <a href="/dashboard" style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a35', borderRadius: '8px', color: '#fff', fontSize: '14px', textDecoration: 'none' }}>← Dashboard</a>
      </header>

      {/* FIXED SUBHEADER - removed border between sidebar and account name */}
      <div style={{ position: 'fixed', top: '57px', left: '180px', right: 0, zIndex: 40, padding: '14px 24px', background: '#0a0a0f', borderBottom: '1px solid #1a1a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '26px', fontWeight: 700, color: '#fff' }}>{account?.name}</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          {activeTab === 'trades' && (
            <button onClick={() => setShowEditInputs(true)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #2a2a35', borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer' }}>Edit Columns</button>
          )}
          <button onClick={() => setShowAddTrade(true)} style={{ padding: '12px 28px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>+ LOG NEW TRADE</button>
        </div>
      </div>

      {/* FIXED SIDEBAR - moved buttons lower */}
      <div style={{ position: 'fixed', top: '57px', left: 0, bottom: 0, width: '180px', padding: '16px 12px', background: '#0a0a0f', zIndex: 45, display: 'flex', flexDirection: 'column', paddingTop: '100px' }}>
        <div>
          {['trades', 'statistics', 'notes'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); if (tab === 'statistics') setHasNewInputs(false) }} 
              style={{ 
                width: '100%', padding: '16px 20px', marginBottom: '8px',
                background: activeTab === tab ? '#22c55e' : 'transparent', 
                border: activeTab === tab ? 'none' : '1px solid #2a2a35',
                borderRadius: '8px', color: activeTab === tab ? '#fff' : '#888', 
                fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '14px', background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.5' }}>{tabDescriptions[activeTab]}</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: '180px', marginTop: '124px', padding: '16px 24px', minHeight: 'calc(100vh - 124px)' }}>

        {/* TRADES TAB - with fixed bottom horizontal scroll */}
        {activeTab === 'trades' && (
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', position: 'relative' }}>
            {trades.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#888', fontSize: '15px' }}>No trades yet. Click "+ LOG NEW TRADE" to add your first trade.</div>
            ) : (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: '#0d0d12', zIndex: 5 }}>
                      {enabledInputs.map(input => (
                        <th key={input.id} style={{ padding: '14px 12px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #1a1a22', whiteSpace: 'nowrap' }}>{input.label}</th>
                      ))}
                      <th style={{ padding: '14px 12px', width: '80px', borderBottom: '1px solid #1a1a22' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, i) => {
                      const extra = getExtraData(trade)
                      return (
                        <tr key={trade.id} style={{ background: i % 2 ? '#0a0a0e' : 'transparent' }}>
                          {enabledInputs.map(input => {
                            let val
                            if (input.id === 'symbol') val = <span style={{ fontWeight: 600 }}>{trade.symbol}</span>
                            else if (input.id === 'outcome') val = <span style={{ color: trade.outcome === 'win' ? '#22c55e' : trade.outcome === 'loss' ? '#ef4444' : '#888', fontWeight: 600, textTransform: 'capitalize' }}>{trade.outcome}</span>
                            else if (input.id === 'pnl') val = <span style={{ color: parseFloat(trade.pnl) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl).toFixed(2)}</span>
                            else if (input.id === 'riskPercent') val = trade.risk_percent ? `${trade.risk_percent}%` : '-'
                            else if (input.id === 'rr') val = trade.rr ? `${trade.rr}R` : '-'
                            else if (input.id === 'date') val = <span style={{ color: '#888' }}>{getDaysAgo(trade.date)}</span>
                            else if (input.id === 'direction') val = <span style={{ color: trade.direction === 'long' ? '#22c55e' : trade.direction === 'short' ? '#ef4444' : '#888', textTransform: 'capitalize' }}>{trade.direction || '-'}</span>
                            else if (input.type === 'rating') {
                              const r = parseInt(extra[input.id]) || 0
                              val = <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map(j => <span key={j} style={{ color: j <= r ? '#22c55e' : '#333', fontSize: '12px' }}>★</span>)}</div>
                            }
                            else if (input.type === 'file' && extra[input.id]) {
                              val = <img src={extra[input.id]} alt="" onClick={() => setShowExpandedImage(extra[input.id])} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} />
                            }
                            else val = extra[input.id] || '-'
                            return <td key={input.id} style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #1a1a22' }}>{val}</td>
                          })}
                          <td style={{ padding: '12px', borderBottom: '1px solid #1a1a22' }}>
                            <button onClick={() => deleteTrade(trade.id)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px' }}>×</button>
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
          <>
            {/* ROW 1: Stats + Graphs */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              {/* Stats Column */}
              <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { l: 'Total PnL', v: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, c: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
                  { l: 'Winrate', v: `${winrate}%`, c: winrate >= 50 ? '#22c55e' : '#ef4444' },
                  { l: 'Profit Factor', v: profitFactor, c: '#fff' },
                  { l: 'Avg Win', v: `+$${avgWin}`, c: '#22c55e' },
                  { l: 'Avg Loss', v: `-$${avgLoss}`, c: '#ef4444' },
                  { l: 'Streak', v: `${streaks.cs >= 0 ? '+' : ''}${streaks.cs}`, c: streaks.cs >= 0 ? '#22c55e' : '#ef4444' },
                  { l: 'Best Pair', v: mostTradedPair, c: '#22c55e' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#888' }}>{s.l}</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: s.c }}>{s.v}</span>
                  </div>
                ))}
                <div style={{ background: '#0d0d12', border: '2px solid #22c55e', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Total Trades</span>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{trades.length}</span>
                </div>
              </div>

              {/* Graphs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Equity Curve - Dashboard style with green dot tooltip */}
                <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '16px', height: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase' }}>Equity Curve</span>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                      <span style={{ color: '#888' }}>Start: <span style={{ color: '#fff' }}>${startingBalance.toLocaleString()}</span></span>
                      <span style={{ color: '#888' }}>Current: <span style={{ color: '#22c55e' }}>${currentBalance.toLocaleString()}</span></span>
                    </div>
                  </div>
                  <div style={{ height: 'calc(100% - 30px)', position: 'relative', display: 'flex' }}>
                    {(() => {
                      if (trades.length < 2) return <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Need 2+ trades</div>
                      const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
                      let cum = startingBalance
                      const points = [{ balance: cum, date: null, pnl: 0 }]
                      sorted.forEach(t => { cum += parseFloat(t.pnl) || 0; points.push({ balance: cum, date: t.date, pnl: parseFloat(t.pnl) || 0, symbol: t.symbol }) })
                      
                      const maxBal = Math.max(...points.map(p => p.balance))
                      const minBal = Math.min(...points.map(p => p.balance))
                      const yStep = Math.ceil((maxBal - minBal) / 4 / 1000) * 1000 || 1000
                      const yMax = Math.ceil(maxBal / yStep) * yStep
                      const yMin = Math.floor(minBal / yStep) * yStep
                      const yRange = yMax - yMin || yStep
                      
                      const yLabels = []
                      for (let v = yMax; v >= yMin; v -= yStep) yLabels.push(v)
                      
                      const svgW = 100, svgH = 100
                      const chartPoints = points.map((p, i) => ({
                        x: points.length > 1 ? (i / (points.length - 1)) * svgW : svgW / 2,
                        y: svgH - ((p.balance - yMin) / yRange) * svgH,
                        ...p
                      }))
                      
                      const pathD = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                      const areaD = pathD + ` L ${chartPoints[chartPoints.length - 1].x} ${svgH} L ${chartPoints[0].x} ${svgH} Z`
                      
                      return (
                        <>
                          <div style={{ width: '45px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '0px', flexShrink: 0 }}>
                            {yLabels.map((v, i) => <span key={i} style={{ fontSize: '10px', color: '#888', lineHeight: 1, textAlign: 'right' }}>${(v/1000).toFixed(0)}k</span>)}
                          </div>
                          <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid #333' }}>
                            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none"
                              onMouseMove={e => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const mouseXPct = ((e.clientX - rect.left) / rect.width) * svgW
                                let closest = chartPoints[0], minDist = Math.abs(mouseXPct - chartPoints[0].x)
                                chartPoints.forEach(p => { const d = Math.abs(mouseXPct - p.x); if (d < minDist) { minDist = d; closest = p } })
                                if (minDist < 10) {
                                  setHoverPoint({ ...closest, xPct: (closest.x / svgW) * 100, yPct: (closest.y / svgH) * 100 })
                                } else {
                                  setHoverPoint(null)
                                }
                              }}
                              onMouseLeave={() => setHoverPoint(null)}
                            >
                              <defs><linearGradient id="eqG" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0" /></linearGradient></defs>
                              <path d={areaD} fill="url(#eqG)" />
                              <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            </svg>
                            {/* Green dot on line */}
                            {hoverPoint && (
                              <div style={{ position: 'absolute', left: `${hoverPoint.xPct}%`, top: `${hoverPoint.yPct}%`, transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '2px solid #fff', pointerEvents: 'none', zIndex: 10 }} />
                            )}
                            {/* Tooltip - smooth transition across graph */}
                            {hoverPoint && (
                              <div style={{ 
                                position: 'absolute', 
                                left: `${hoverPoint.xPct}%`, 
                                top: `${hoverPoint.yPct}%`, 
                                transform: `translate(${-hoverPoint.xPct}%, ${hoverPoint.yPct < 50 ? '15px' : 'calc(-100% - 15px)'})`,
                                background: '#1a1a22', border: '1px solid #2a2a35', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' 
                              }}>
                                <div style={{ color: '#888', marginBottom: '2px' }}>{hoverPoint.date ? new Date(hoverPoint.date).toLocaleDateString() : 'Start'}</div>
                                <div style={{ fontWeight: 700, color: '#22c55e' }}>${hoverPoint.balance.toLocaleString()}</div>
                                {hoverPoint.pnl !== 0 && <div style={{ color: hoverPoint.pnl >= 0 ? '#22c55e' : '#ef4444', fontSize: '10px' }}>{hoverPoint.pnl >= 0 ? '+' : ''}${hoverPoint.pnl.toFixed(0)} {hoverPoint.symbol || ''}</div>}
                              </div>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Bar Chart */}
                <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '16px', height: '200px', display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    {(() => {
                      const groupedData = {}
                      const customSelects = getCustomSelectInputs()
                      trades.forEach(t => {
                        let key
                        if (graphGroupBy === 'symbol') key = t.symbol
                        else if (['direction', 'session', 'confidence', 'timeframe'].includes(graphGroupBy)) {
                          key = graphGroupBy === 'direction' ? t.direction : getExtraData(t)[graphGroupBy]
                        } else {
                          key = getExtraData(t)[graphGroupBy]
                        }
                        if (!key || key === 'Unknown') return
                        if (!groupedData[key]) groupedData[key] = { w: 0, l: 0, pnl: 0, count: 0 }
                        groupedData[key].count++
                        groupedData[key].pnl += parseFloat(t.pnl) || 0
                        if (t.outcome === 'win') groupedData[key].w++
                        else if (t.outcome === 'loss') groupedData[key].l++
                      })
                      
                      const entries = Object.entries(groupedData).map(([name, d]) => {
                        const wr = d.w + d.l > 0 ? Math.round((d.w / (d.w + d.l)) * 100) : 0
                        let val, disp
                        if (barGraphMetric === 'winrate') { val = wr; disp = wr + '%' }
                        else if (barGraphMetric === 'pnl') { val = d.pnl; disp = (d.pnl >= 0 ? '+' : '') + '$' + Math.round(d.pnl) }
                        else if (barGraphMetric === 'avgpnl') { val = d.count > 0 ? d.pnl / d.count : 0; disp = (val >= 0 ? '+' : '') + '$' + Math.round(val) }
                        else { val = d.count; disp = d.count.toString() }
                        return { name, val, disp, data: d }
                      }).sort((a, b) => b.val - a.val).slice(0, 8)
                      
                      if (entries.length === 0) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No data</div>
                      const maxVal = barGraphMetric === 'winrate' ? 100 : Math.max(...entries.map(e => Math.abs(e.val)), 1)
                      
                      return (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '4px' }}>
                            {entries.map((item, i) => {
                              const hPct = Math.max((Math.abs(item.val) / maxVal) * 100, 5)
                              const isGreen = barGraphMetric === 'winrate' ? item.val >= 50 : item.val >= 0
                              const xPct = ((i + 0.5) / entries.length) * 100
                              return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                                  onMouseEnter={() => setHoverBar({ name: item.name, val: item.val, disp: item.disp, isGreen, xPct, data: item.data })}
                                  onMouseLeave={() => setHoverBar(null)}
                                >
                                  <div style={{ fontSize: '11px', color: isGreen ? '#22c55e' : '#ef4444', marginBottom: '3px', fontWeight: 600 }}>{item.disp}</div>
                                  <div style={{ width: '100%', height: `${hPct}%`, background: isGreen ? '#22c55e' : '#ef4444', borderRadius: '3px 3px 0 0' }} />
                                </div>
                              )
                            })}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                            {entries.map((item, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>)}
                          </div>
                          {/* Bar chart tooltip - smooth transition */}
                          {hoverBar && (
                            <div style={{ 
                              position: 'absolute', 
                              left: `${hoverBar.xPct}%`, 
                              top: '10px',
                              transform: `translateX(${-hoverBar.xPct}%)`,
                              background: '#1a1a22', border: '1px solid #2a2a35', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' 
                            }}>
                              <div style={{ fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{hoverBar.name}</div>
                              <div style={{ color: hoverBar.isGreen ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{hoverBar.disp}</div>
                              <div style={{ color: '#888', fontSize: '10px' }}>{hoverBar.data.count} trades • {hoverBar.data.w}W / {hoverBar.data.l}L</div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Show</div>
                      <select value={barGraphMetric} onChange={e => setBarGraphMetric(e.target.value)} style={{ width: '110px', padding: '6px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '4px', color: '#fff', fontSize: '12px' }}>
                        <option value="winrate">Winrate</option>
                        <option value="pnl">PnL</option>
                        <option value="avgpnl">Avg PnL</option>
                        <option value="count">Count</option>
                      </select>
                    </div>
                    <div style={{ padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Group by</div>
                      <select value={graphGroupBy} onChange={e => setGraphGroupBy(e.target.value)} style={{ width: '110px', padding: '6px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '4px', color: '#fff', fontSize: '12px' }}>
                        <option value="symbol">Pairs</option>
                        <option value="direction">Direction</option>
                        <option value="session">Session</option>
                        <option value="confidence">Confidence</option>
                        <option value="timeframe">Timeframe</option>
                        {getCustomSelectInputs().filter(i => !['direction', 'session', 'confidence', 'timeframe'].includes(i.id)).map(inp => (
                          <option key={inp.id} value={inp.id}>{inp.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Net Daily PnL + Direction/Rating */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              {/* Net Daily PnL - same height as bar chart area */}
              <div style={{ flex: 2, background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '16px', position: 'relative' }}>
                <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Net Daily PnL</div>
                <div style={{ height: '120px', position: 'relative' }}>
                  {dailyPnL.length === 0 ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No data</div> : (
                    <>
                      {/* Thin horizontal grid lines */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                        {[0,1,2,3].map(i => <div key={i} style={{ borderTop: '1px solid #1a1a22' }} />)}
                      </div>
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', gap: '3px', position: 'relative' }}>
                        {dailyPnL.map((d, i) => {
                          const maxAbs = Math.max(...dailyPnL.map(x => Math.abs(x.pnl)), 1)
                          const hPct = (Math.abs(d.pnl) / maxAbs) * 45
                          const xPct = ((i + 0.5) / dailyPnL.length) * 100
                          return (
                            <div 
                              key={i} 
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center', position: 'relative' }}
                              onMouseEnter={() => setHoverDaily({ date: d.date, pnl: d.pnl, xPct })}
                              onMouseLeave={() => setHoverDaily(null)}
                            >
                              {d.pnl >= 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '50%', justifyContent: 'flex-end' }}>
                                  <div style={{ width: '100%', maxWidth: '24px', minWidth: '8px', height: `${Math.max(hPct, 3)}%`, background: '#22c55e', borderRadius: '2px 2px 0 0' }} />
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '50%', justifyContent: 'flex-start', marginTop: '50%' }}>
                                  <div style={{ width: '100%', maxWidth: '24px', minWidth: '8px', height: `${Math.max(hPct, 3)}%`, background: '#ef4444', borderRadius: '0 0 2px 2px' }} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {/* Daily PnL tooltip - smooth transition */}
                        {hoverDaily && (
                          <div style={{ 
                            position: 'absolute', 
                            left: `${hoverDaily.xPct}%`, 
                            top: hoverDaily.pnl >= 0 ? '5px' : 'auto',
                            bottom: hoverDaily.pnl < 0 ? '5px' : 'auto',
                            transform: `translateX(${-hoverDaily.xPct}%)`,
                            background: '#1a1a22', border: '1px solid #2a2a35', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' 
                          }}>
                            <div style={{ color: '#888', marginBottom: '2px' }}>{new Date(hoverDaily.date).toLocaleDateString()}</div>
                            <div style={{ fontWeight: 700, color: hoverDaily.pnl >= 0 ? '#22c55e' : '#ef4444' }}>{hoverDaily.pnl >= 0 ? '+' : ''}${hoverDaily.pnl.toFixed(0)}</div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Direction Split + Avg Rating (reduced height) */}
              <div style={{ flex: 1, background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Direction Split */}
                <div>
                  <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>Direction Split</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 700 }}>{longPct}% L</span>
                    <div style={{ flex: 1, height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${longPct}%`, background: '#22c55e' }} />
                      <div style={{ width: `${100 - longPct}%`, background: '#ef4444' }} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 700 }}>{100 - longPct}% S</span>
                  </div>
                </div>
                {/* Average Rating - compact */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #1a1a22' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Avg Rating</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(parseFloat(avgRating)) ? '#22c55e' : '#2a2a35', fontSize: '16px' }}>★</span>)}</div>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{avgRating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2.5: Most Used RR + Most Profitable RR - thin wide section */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1, background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '12px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Most Used RR</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{mostUsedRR}</span>
                </div>
                <div style={{ width: '1px', height: '24px', background: '#1a1a22' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Most Profitable RR</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{mostProfitableRR}</span>
                </div>
              </div>
            </div>

            {/* ROW 3: Stats + Donut + Trade Analysis + Expectancy */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              {/* Stats + Donut - narrower, removed RR items */}
              <div style={{ width: '300px', background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '14px', display: 'flex' }}>
                <div style={{ flex: 1 }}>
                  {[
                    { l: 'Avg. Trend', v: avgTrend },
                    { l: 'Avg. Rating', v: avgRating + '★' },
                    { l: 'Avg. Trade PnL', v: (avgPnl >= 0 ? '+' : '') + '$' + avgPnl },
                    { l: 'Most Traded', v: mostTradedPair },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid #1a1a22' : 'none' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>{item.l}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{item.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ width: '1px', background: '#1a1a22', margin: '0 12px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>
                  <select value={pairAnalysisType} onChange={e => setPairAnalysisType(e.target.value)} style={{ fontSize: '10px', color: '#888', marginBottom: '6px', background: 'transparent', border: '1px solid #1a1a22', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}>
                    <option value="best">Best Pair</option>
                    <option value="worst">Worst Pair</option>
                    <option value="most">Most Used</option>
                  </select>
                  {(() => {
                    const ps = {}
                    trades.forEach(t => { if (!ps[t.symbol]) ps[t.symbol] = { w: 0, l: 0, pnl: 0, count: 0 }; if (t.outcome === 'win') ps[t.symbol].w++; else if (t.outcome === 'loss') ps[t.symbol].l++; ps[t.symbol].pnl += parseFloat(t.pnl) || 0; ps[t.symbol].count++ })
                    let selected
                    if (pairAnalysisType === 'best') selected = Object.entries(ps).sort((a, b) => b[1].pnl - a[1].pnl)[0]
                    else if (pairAnalysisType === 'worst') selected = Object.entries(ps).sort((a, b) => a[1].pnl - b[1].pnl)[0]
                    else selected = Object.entries(ps).sort((a, b) => b[1].count - a[1].count)[0]
                    if (!selected) return <div style={{ color: '#666' }}>No data</div>
                    const wr = selected[1].w + selected[1].l > 0 ? Math.round((selected[1].w / (selected[1].w + selected[1].l)) * 100) : 0
                    const size = 70, stroke = 7, r = (size - stroke) / 2, c = 2 * Math.PI * r
                    return (
                      <>
                        <div style={{ position: 'relative', width: size, height: size }}>
                          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ef4444" strokeWidth={stroke} />
                            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#22c55e" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - wr/100)} strokeLinecap="butt" />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{selected[0]}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>{wr}%</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '10px' }}>
                          <span><span style={{ color: '#22c55e' }}>●</span> W</span>
                          <span><span style={{ color: '#ef4444' }}>●</span> L</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Trade Analysis - wider with green border */}
              <div style={{ flex: 1, background: '#0d0d12', border: '2px solid #22c55e', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', marginBottom: '12px' }}>Trade Analysis</div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <select value={analysisGroupBy} onChange={e => setAnalysisGroupBy(e.target.value)} style={{ flex: 1, padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px' }}>
                    <option value="direction">Direction</option>
                    <option value="confidence">Confidence</option>
                    <option value="session">Session</option>
                    <option value="timeframe">Timeframe</option>
                    {getCustomSelectInputs().filter(i => !['direction', 'session', 'confidence', 'timeframe'].includes(i.id)).map(inp => (
                      <option key={inp.id} value={inp.id}>{inp.label}</option>
                    ))}
                  </select>
                  <select value={analysisMetric} onChange={e => setAnalysisMetric(e.target.value)} style={{ flex: 1, padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px' }}>
                    <option value="avgpnl">Avg PnL</option>
                    <option value="winrate">Winrate</option>
                    <option value="pnl">Total PnL</option>
                    <option value="count">Count</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const groups = {}
                    trades.forEach(t => {
                      let key
                      if (analysisGroupBy === 'direction') key = t.direction?.toUpperCase()
                      else key = getExtraData(t)[analysisGroupBy]
                      if (!key) return
                      if (!groups[key]) groups[key] = { w: 0, l: 0, pnl: 0, count: 0 }
                      groups[key].count++
                      groups[key].pnl += parseFloat(t.pnl) || 0
                      if (t.outcome === 'win') groups[key].w++
                      else if (t.outcome === 'loss') groups[key].l++
                    })
                    return Object.entries(groups).slice(0, 4).map(([name, data]) => {
                      let val, disp
                      if (analysisMetric === 'avgpnl') { val = data.count > 0 ? data.pnl / data.count : 0; disp = (val >= 0 ? '+' : '') + '$' + Math.round(val) + '/trade' }
                      else if (analysisMetric === 'winrate') { val = (data.w + data.l) > 0 ? (data.w / (data.w + data.l)) * 100 : 0; disp = Math.round(val) + '%' }
                      else if (analysisMetric === 'pnl') { val = data.pnl; disp = (val >= 0 ? '+' : '') + '$' + Math.round(val) }
                      else { val = data.count; disp = data.count + ' trades' }
                      return (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0e', borderRadius: '6px' }}>
                          <span style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>{name}:</span>
                          <span style={{ fontSize: '17px', fontWeight: 700, color: val >= 0 ? '#22c55e' : '#ef4444' }}>{disp}</span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Average Win / Average Loss - compact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '130px' }}>
                <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Average Win</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e' }}>+${avgWin}</div>
                </div>
                <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Average Loss</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444' }}>-${avgLoss}</div>
                </div>
                <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Expectancy</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: parseFloat(expectancy) >= 0 ? '#22c55e' : '#ef4444' }}>${expectancy}</div>
                </div>
              </div>
            </div>

            {/* ROW 4: Performance + Streaks - 4 items each */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1, background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', marginBottom: '12px' }}>Performance</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { l: 'Best Day', v: bestDay ? `+$${Math.round(bestDay.pnl)}` : '-', c: '#22c55e' },
                    { l: 'Worst Day', v: worstDay ? `$${Math.round(worstDay.pnl)}` : '-', c: '#ef4444' },
                    { l: 'Biggest Win', v: `+$${biggestWin}`, c: '#22c55e' },
                    { l: 'Biggest Loss', v: `$${biggestLoss}`, c: '#ef4444' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px', background: '#0a0a0e', borderRadius: '6px', border: '1px solid #1a1a22', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>{item.l}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: item.c }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', marginBottom: '12px' }}>Streaks & Consistency</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { l: 'Max Wins', v: streaks.mw, c: '#22c55e' },
                    { l: 'Max Losses', v: streaks.ml, c: '#ef4444' },
                    { l: 'Days', v: tradingDays, c: '#fff' },
                    { l: 'Consistency', v: `${consistencyScore}%`, c: consistencyScore >= 50 ? '#22c55e' : '#ef4444' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px', background: '#0a0a0e', borderRadius: '6px', border: '1px solid #1a1a22', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>{item.l}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: item.c }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ROW 5: Risk + Progress - 4 items each */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', marginBottom: '12px' }}>Risk Management</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { l: 'Avg RR', v: avgRR + 'R', c: '#fff' },
                    { l: 'Risk/Reward', v: returnOnRisk + 'x', c: '#22c55e' },
                    { l: 'Profit Factor', v: profitFactor, c: '#fff' },
                    { l: 'Trades/Day', v: avgTradesPerDay, c: '#fff' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px', background: '#0a0a0e', borderRadius: '6px', border: '1px solid #1a1a22', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>{item.l}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: item.c }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', marginBottom: '12px' }}>Account Progress</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { l: 'Starting', v: '$' + startingBalance.toLocaleString(), c: '#888' },
                    { l: 'Current', v: '$' + currentBalance.toLocaleString(), c: '#22c55e' },
                    { l: 'Growth', v: ((currentBalance / startingBalance - 1) * 100).toFixed(1) + '%', c: currentBalance >= startingBalance ? '#22c55e' : '#ef4444' },
                    { l: 'Monthly', v: monthlyGrowth + '%', c: parseFloat(monthlyGrowth) >= 0 ? '#22c55e' : '#ef4444' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px', background: '#0a0a0e', borderRadius: '6px', border: '1px solid #1a1a22', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>{item.l}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: item.c }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {['daily', 'weekly', 'custom'].map(sub => (
                <button key={sub} onClick={() => setNotesSubTab(sub)} style={{ padding: '12px 24px', background: notesSubTab === sub ? '#22c55e' : 'transparent', border: notesSubTab === sub ? 'none' : '1px solid #2a2a35', borderRadius: '8px', color: notesSubTab === sub ? '#fff' : '#888', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{sub}</button>
              ))}
            </div>

            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase' }}>Write {notesSubTab} Note</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {notesSubTab === 'custom' && <input type="text" placeholder="Note title..." value={customNoteTitle} onChange={e => setCustomNoteTitle(e.target.value)} style={{ padding: '8px 12px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px', width: '160px' }} />}
                  <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} style={{ padding: '8px 12px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px' }} />
                </div>
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder={`Write your ${notesSubTab} note...`} style={{ width: '100%', minHeight: '140px', padding: '14px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '8px', color: '#fff', fontSize: '14px', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button onClick={saveNote} disabled={!noteText.trim()} style={{ padding: '12px 24px', background: noteText.trim() ? '#22c55e' : '#1a1a22', border: 'none', borderRadius: '8px', color: noteText.trim() ? '#fff' : '#666', fontWeight: 600, fontSize: '14px', cursor: noteText.trim() ? 'pointer' : 'not-allowed' }}>Save Note</button>
              </div>
            </div>

            <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '20px' }}>
              <span style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase' }}>{notesSubTab} Notes</span>
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                {notesSubTab === 'custom' ? (
                  (notes.custom || []).length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No custom notes yet.</div> : (notes.custom || []).map((note, idx) => (
                    <div key={idx} style={{ padding: '16px', background: '#0a0a0e', borderRadius: '8px', border: '1px solid #1a1a22' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: 600 }}>{note.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#666' }}>{new Date(note.date).toLocaleDateString()}</span>
                          <button onClick={() => deleteNote('custom', idx)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px' }}>×</button>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{note.text}</div>
                    </div>
                  ))
                ) : (
                  Object.keys(notes[notesSubTab] || {}).length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No {notesSubTab} notes yet.</div> : Object.entries(notes[notesSubTab] || {}).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, text]) => (
                    <div key={date} style={{ padding: '16px', background: '#0a0a0e', borderRadius: '8px', border: '1px solid #1a1a22' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: 600 }}>{notesSubTab === 'weekly' ? `Week of ${date}` : new Date(date).toLocaleDateString()}</span>
                        <button onClick={() => deleteNote(notesSubTab, date)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px' }}>×</button>
                      </div>
                      <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ADD TRADE MODAL */}
      {showAddTrade && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAddTrade(false)}>
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '28px', width: '560px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>Log New Trade</h2>
            
            {/* Fixed inputs row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {fixedInputs.map(input => (
                <div key={input.id}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>{input.label} {input.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                  {input.type === 'select' ? (
                    <select value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} style={{ width: '100%', padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                      {input.options?.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={input.type} value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} step={input.type === 'number' ? '0.01' : undefined} style={{ width: '100%', padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Custom inputs section */}
            {customInputs.length > 0 && (
              <>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>Additional Fields</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {customInputs.map(input => (
                    <div key={input.id} style={{ gridColumn: input.type === 'textarea' ? 'span 2' : 'span 1' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>{input.label}</label>
                      {input.type === 'select' ? (
                        <select value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} style={{ width: '100%', padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                          {input.options?.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                        </select>
                      ) : input.type === 'textarea' ? (
                        <textarea value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} rows={3} style={{ width: '100%', padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
                      ) : input.type === 'rating' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>{[1,2,3,4,5].map(i => <button key={i} type="button" onClick={() => setTradeForm({...tradeForm, [input.id]: String(i)})} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '24px', color: i <= parseInt(tradeForm[input.id] || 0) ? '#22c55e' : '#333' }}>★</button>)}</div>
                      ) : input.type === 'file' ? (
                        <input type="file" accept="image/*" onChange={e => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => setTradeForm({...tradeForm, [input.id]: reader.result})
                            reader.readAsDataURL(file)
                          }
                        }} style={{ width: '100%', padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
                      ) : (
                        <input type={input.type} value={tradeForm[input.id] || ''} onChange={e => setTradeForm({...tradeForm, [input.id]: e.target.value})} style={{ width: '100%', padding: '10px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={addTrade} disabled={saving || !tradeForm.symbol || !tradeForm.pnl} style={{ flex: 1, padding: '14px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', opacity: (saving || !tradeForm.symbol || !tradeForm.pnl) ? 0.5 : 1 }}>{saving ? 'Saving...' : 'Save Trade'}</button>
              <button onClick={() => setShowAddTrade(false)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #2a2a35', borderRadius: '8px', color: '#888', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COLUMNS MODAL - green checkboxes */}
      {showEditInputs && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }} onClick={() => setShowEditInputs(false)}>
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '28px', width: '520px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>Customize Columns</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {inputs.map((input, i) => (
                <div key={input.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: input.fixed ? '#141418' : '#0a0a0e', borderRadius: '6px', opacity: input.fixed ? 0.7 : 1 }}>
                  <input type="checkbox" checked={input.enabled} onChange={e => !input.fixed && updateInput(i, 'enabled', e.target.checked)} disabled={input.fixed} style={{ width: '18px', height: '18px', accentColor: '#22c55e' }} />
                  <input type="text" value={input.label} onChange={e => updateInput(i, 'label', e.target.value)} disabled={input.fixed} style={{ flex: 1, padding: '8px 12px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '13px' }} />
                  <select value={input.type} onChange={e => updateInput(i, 'type', e.target.value)} disabled={input.fixed} style={{ padding: '8px', background: '#141418', border: '1px solid #1a1a22', borderRadius: '6px', color: '#888', fontSize: '12px' }}>
                    {['text', 'number', 'date', 'select', 'textarea', 'rating', 'file'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {input.type === 'select' && !input.fixed && <button onClick={() => openOptionsEditor(i)} style={{ padding: '6px 12px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Opts</button>}
                  {!input.fixed && <button onClick={() => deleteInput(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>}
                  {input.fixed && <span style={{ fontSize: '10px', color: '#666', padding: '4px 8px', background: '#1a1a22', borderRadius: '4px' }}>Fixed</span>}
                </div>
              ))}
            </div>
            <button onClick={addNewInput} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed #2a2a35', borderRadius: '8px', color: '#888', fontSize: '13px', cursor: 'pointer', marginBottom: '20px' }}>+ Add New Field</button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={saveInputs} style={{ flex: 1, padding: '14px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowEditInputs(false)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #2a2a35', borderRadius: '8px', color: '#888', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* OPTIONS EDITOR MODAL */}
      {editingOptions !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 102 }} onClick={() => setEditingOptions(null)}>
          <div style={{ background: '#0d0d12', border: '1px solid #1a1a22', borderRadius: '8px', padding: '28px', width: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>Edit Options</h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Enter each option on a new line:</p>
            <textarea value={optionsText} onChange={e => setOptionsText(e.target.value)} rows={8} style={{ width: '100%', padding: '12px', background: '#0a0a0e', border: '1px solid #1a1a22', borderRadius: '6px', color: '#fff', fontSize: '14px', resize: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={saveOptions} style={{ flex: 1, padding: '12px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setEditingOptions(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #2a2a35', borderRadius: '8px', color: '#888', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED IMAGE MODAL */}
      {showExpandedImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 103, cursor: 'pointer' }} onClick={() => setShowExpandedImage(null)}>
          <img src={showExpandedImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  )
}
