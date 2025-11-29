'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

const defaultFields = [
  { id: 'symbol', name: 'Symbol', type: 'text', options: [] },
  { id: 'pnl', name: 'PnL ($)', type: 'number', options: [] },
  { id: 'outcome', name: 'Outcome', type: 'select', options: ['win', 'loss', 'breakeven'] },
  { id: 'risk', name: 'Risk %', type: 'number', options: [] },
  { id: 'rr', name: 'RR', type: 'number', options: [] },
  { id: 'date', name: 'Date', type: 'date', options: [] },
  { id: 'timeframe', name: 'Timeframe', type: 'select', options: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] },
  { id: 'direction', name: 'Direction', type: 'select', options: ['long', 'short'] },
  { id: 'trend', name: 'Trend', type: 'select', options: ['bullish', 'bearish', 'consolidation'] },
  { id: 'confidence', name: 'Confidence', type: 'select', options: ['Calm', 'Confident', 'Anxious', 'Fomo', 'Revenge', 'Unsure', 'Greedy', 'Fearful'] },
  { id: 'rating', name: 'Rating', type: 'rating', options: [] },
  { id: 'image', name: 'Screenshot', type: 'image', options: [] },
  { id: 'notes', name: 'Notes', type: 'textarea', options: [] },
]

function getDaysAgo(d){if(!d)return'N/A';const today=new Date(),date=new Date(d);if(isNaN(date.getTime()))return'N/A';const diff=Math.floor((today-date)/(1000*60*60*24));return diff===0?'Today':diff===1?'1d ago':`${diff}d ago`}
function formatDate(d){if(!d)return'N/A';const date=new Date(d);return isNaN(date.getTime())?'N/A':date.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
function getDay(d){if(!d)return'N/A';return['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d).getDay()]}

function StarRating({rating,size=14}){if(rating==null)return<span style={{color:'#666',fontSize:'12px'}}>N/A</span>;const stars=[];for(let i=1;i<=5;i++){if(rating>=i)stars.push(<svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>);else if(rating>=i-0.5)stars.push(<svg key={i} width={size} height={size} viewBox="0 0 24 24"><defs><linearGradient id={`hs${i}${rating}`}><stop offset="50%" stopColor="#fff"/><stop offset="50%" stopColor="#333"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={`url(#hs${i}${rating})`}/></svg>);else stars.push(<svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#333"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}return<div style={{display:'flex',gap:'2px'}}>{stars}</div>}
function ImageIcon(){return<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
function PencilIcon({size=12}){return<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
function ExpandIcon(){return<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>}
function SettingsIcon(){return<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
function TrashIcon(){return<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>}
function PlusIcon(){return<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}

function BarChart({data,title}){if(!data||data.length===0)return<div style={{color:'#666',textAlign:'center',padding:'40px'}}>No data</div>;const max=Math.max(...data.map(d=>Math.abs(d.value)));return(<div><div style={{fontSize:'13px',color:'#bbb',marginBottom:'16px',fontWeight:600}}>{title}</div><div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{data.slice(0,8).map((d,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'80px',fontSize:'12px',color:'#aaa',textAlign:'right'}}>{d.label}</div><div style={{flex:1,height:'24px',background:'#1a1a22',borderRadius:'4px',overflow:'hidden'}}><div style={{width:`${max>0?(Math.abs(d.value)/max)*100:0}%`,height:'100%',background:d.value>=0?'#22c55e':'#ef4444',borderRadius:'4px'}}/></div><div style={{width:'60px',fontSize:'12px',color:d.value>=0?'#22c55e':'#ef4444',fontWeight:600}}>{d.displayValue||d.value}</div></div>))}</div></div>)}

function DonutChart({data,title}){if(!data||data.length===0)return null;const total=data.reduce((s,d)=>s+d.value,0);let cum=0;const colors=['#22c55e','#ef4444','#eab308','#3b82f6','#8b5cf6','#ec4899'];return(<div><div style={{fontSize:'13px',color:'#bbb',marginBottom:'16px',fontWeight:600}}>{title}</div><div style={{display:'flex',alignItems:'center',gap:'24px'}}><svg width="120" height="120" viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1a1a22" strokeWidth="6"/>{data.map((d,i)=>{const pct=total>0?(d.value/total)*100:0;const offset=cum;cum+=pct;return<circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={colors[i%colors.length]} strokeWidth="6" strokeDasharray={`${pct} ${100-pct}`} strokeDashoffset={25-offset}/>})}</svg><div style={{display:'flex',flexDirection:'column',gap:'6px'}}>{data.map((d,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'10px',height:'10px',borderRadius:'2px',background:colors[i%colors.length]}}/><span style={{fontSize:'12px',color:'#aaa'}}>{d.label}: {d.value} ({total>0?Math.round((d.value/total)*100):0}%)</span></div>))}</div></div></div>)}

export default function AccountPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user, isPro, supabase, loading: authLoading } = useAuth()
  const accountId = params.id
  
  const [account, setAccount] = useState(null)
  const [trades, setTrades] = useState([])
  const [fields, setFields] = useState(defaultFields)
  const [tab, setTab] = useState(searchParams.get('tab') === 'statistics' ? 'statistics' : 'trades')
  const [showAdd, setShowAdd] = useState(false)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [editingTrade, setEditingTrade] = useState(null)
  const [form, setForm] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [showNotes, setShowNotes] = useState(null)
  const [showImage, setShowImage] = useState(null)
  const [pnlFilter, setPnlFilter] = useState('symbol')
  const [winrateFilter, setWinrateFilter] = useState('symbol')
  const [compareX, setCompareX] = useState('confidence')

  useEffect(() => {
    if (user && supabase && accountId) {
      loadData()
    }
  }, [user, supabase, accountId])

  const loadData = async () => {
    const { data: acc } = await supabase.from('accounts').select('*').eq('id', accountId).single()
    setAccount(acc)
    
    const { data: trd } = await supabase.from('trades').select('*').eq('account_id', accountId).order('date', { ascending: false })
    setTrades(trd || [])
    
    const { data: fld } = await supabase.from('fields').select('*').eq('account_id', accountId).order('created_at')
    if (fld?.length) setFields(fld)
    
    setLoaded(true)
  }

  const initForm = () => {
    const f = {}
    fields.forEach(field => {
      if (field.type === 'date') f[field.id] = new Date().toISOString().split('T')[0]
      else if (field.type === 'select' && field.options?.length) f[field.id] = field.options[0]
      else if (field.type === 'number') f[field.id] = ''
      else if (field.type === 'rating') f[field.id] = '3'
      else f[field.id] = ''
    })
    return f
  }

  const openAddTrade = () => { setEditingTrade(null); setForm(initForm()); setShowAdd(true) }
  
  const openEditTrade = (trade) => {
    setEditingTrade(trade)
    const f = {}
    fields.forEach(field => { f[field.id] = trade[field.id] !== undefined ? String(trade[field.id] ?? '') : '' })
    setForm(f)
    setShowAdd(true)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setForm({ ...form, image: reader.result })
      reader.readAsDataURL(file)
    }
  }

  const saveTrade = async () => {
    if (!form.symbol) return alert('Symbol is required')
    
    const tradeData = { ...form, account_id: accountId }
    fields.forEach(f => {
      if (f.type === 'number' && tradeData[f.id]) tradeData[f.id] = parseFloat(tradeData[f.id])
      if (f.type === 'rating' && tradeData[f.id]) tradeData[f.id] = parseFloat(tradeData[f.id])
    })
    if (tradeData.outcome === 'loss' && tradeData.pnl > 0) tradeData.pnl = -tradeData.pnl
    if (tradeData.outcome === 'win' && tradeData.pnl < 0) tradeData.pnl = Math.abs(tradeData.pnl)
    if (tradeData.outcome === 'loss' && tradeData.rr > 0) tradeData.rr = -tradeData.rr
    if (tradeData.outcome === 'breakeven') tradeData.rr = 0
    
    if (editingTrade) {
      await supabase.from('trades').update(tradeData).eq('id', editingTrade.id)
      setTrades(trades.map(t => t.id === editingTrade.id ? { ...t, ...tradeData } : t))
    } else {
      const { data } = await supabase.from('trades').insert(tradeData).select().single()
      if (data) setTrades([data, ...trades])
    }
    setShowAdd(false)
    setEditingTrade(null)
  }

  const saveFields = async () => {
    // Delete existing and insert new
    await supabase.from('fields').delete().eq('account_id', accountId)
    await supabase.from('fields').insert(fields.map(f => ({ ...f, account_id: accountId })))
    setShowFieldEditor(false)
  }

  const addField = () => {
    setFields([...fields, { id: `custom_${Date.now()}`, name: 'New Field', type: 'text', options: [] }])
  }

  const updateField = (id, updates) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const deleteField = (id) => {
    if (['symbol', 'outcome', 'date'].includes(id)) return
    setFields(fields.filter(f => f.id !== id))
  }

  const getGroupedStats = (groupBy, metric = 'pnl') => {
    const groups = {}
    trades.forEach(t => {
      let key = t[groupBy]
      if (groupBy === 'date') key = getDay(t.date)
      if (groupBy === 'rating') key = t.rating >= 4 ? 'High (4-5)' : t.rating >= 2.5 ? 'Medium' : 'Low (1-2)'
      if (!key) key = 'Unknown'
      if (!groups[key]) groups[key] = { wins: 0, losses: 0, pnl: 0, rr: 0 }
      if (t.outcome === 'win') groups[key].wins++
      if (t.outcome === 'loss') groups[key].losses++
      groups[key].pnl += t.pnl || 0
      groups[key].rr += t.rr || 0
    })
    return Object.entries(groups).map(([label, data]) => ({
      label,
      value: metric === 'pnl' ? data.pnl : metric === 'winrate' ? (data.wins + data.losses > 0 ? Math.round((data.wins / (data.wins + data.losses)) * 100) : 0) : data.rr,
      displayValue: metric === 'pnl' ? `$${data.pnl}` : metric === 'winrate' ? `${Math.round((data.wins / (data.wins + data.losses || 1)) * 100)}%` : `${data.rr.toFixed(1)}R`
    })).sort((a, b) => b.value - a.value)
  }

  const getOutcomeDistribution = () => {
    const wins = trades.filter(t => t.outcome === 'win').length
    const losses = trades.filter(t => t.outcome === 'loss').length
    const be = trades.filter(t => t.outcome === 'breakeven').length
    return [{ label: 'Wins', value: wins }, { label: 'Losses', value: losses }, { label: 'Breakeven', value: be }].filter(d => d.value > 0)
  }

  const filterableFields = fields.filter(f => ['select', 'text', 'date', 'rating'].includes(f.type) && f.id !== 'notes' && f.id !== 'image')
  const inputStyle = { width: '100%', padding: '10px 12px', background: '#0a0a0f', border: '1px solid #222230', borderRadius: '8px', color: '#fff', fontSize: '14px' }
  const tableFields = fields.filter(f => f.type !== 'textarea')

  if (authLoading || !loaded) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>Loading...</div>
  if (!account) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>Account not found</div>

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 48px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '10px', padding: '14px 20px', color: '#aaa', fontSize: '14px' }}>← Back</a>
        <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '12px', padding: '6px', display: 'flex', gap: '6px' }}>
          <button onClick={() => setTab('trades')} style={{ padding: '14px 24px', background: tab === 'trades' ? '#22c55e' : 'transparent', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>JOURNAL</button>
          <button onClick={() => setTab('statistics')} style={{ padding: '14px 24px', background: tab === 'statistics' ? '#22c55e' : 'transparent', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>STATISTICS</button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #222230', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          <div><div style={{ background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '10px', padding: '10px 20px', display: 'inline-block' }}><span style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>{account.name}</span></div></div>
          <div><span style={{ color: '#ddd', fontSize: '26px', fontWeight: 700, letterSpacing: '3px' }}>JOURNAL</span></div>
          <div style={{ textAlign: 'right' }}><button onClick={openAddTrade} style={{ padding: '12px 40px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>+ LOG TRADE</button></div>
        </div>

        {/* Content */}
        {tab === 'trades' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: tableFields.map(() => '1fr').join(' ') + ' 0.4fr', padding: '14px 24px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #222230', background: '#0f0f14' }}>
              {tableFields.map(f => <span key={f.id}>{f.name}</span>)}<span></span>
            </div>
            {trades.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#777' }}>No trades yet. Click "+ LOG TRADE" to get started.</div>
            ) : (
              trades.map(trade => (
                <div key={trade.id} style={{ display: 'grid', gridTemplateColumns: tableFields.map(() => '1fr').join(' ') + ' 0.4fr', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #1a1a22', fontSize: '13px' }}>
                  {tableFields.map(f => {
                    const val = trade[f.id]
                    if (f.id === 'outcome') return <span key={f.id} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: val === 'win' ? 'rgba(34,197,94,0.15)' : val === 'loss' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: val === 'win' ? '#22c55e' : val === 'loss' ? '#ef4444' : '#eab308', width: 'fit-content', textTransform: 'uppercase' }}>{val || 'N/A'}</span>
                    if (f.id === 'pnl') return <span key={f.id} style={{ fontWeight: 600, color: val >= 0 ? '#22c55e' : '#ef4444' }}>{val != null ? `${val >= 0 ? '+' : ''}$${Math.abs(val)}` : 'N/A'}</span>
                    if (f.id === 'rating') return <StarRating key={f.id} rating={val} />
                    if (f.id === 'date') return <span key={f.id} style={{ color: '#aaa' }}>{formatDate(val)}</span>
                    if (f.id === 'image') return <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#1a1a22', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: val ? 'pointer' : 'default' }} onClick={() => val && setShowImage(val)}>{val ? <img src={val} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon />}</div></div>
                    if (f.type === 'number') return <span key={f.id} style={{ color: '#bbb' }}>{val != null ? val : 'N/A'}</span>
                    return <span key={f.id} style={{ color: '#bbb', textTransform: 'capitalize' }}>{val || 'N/A'}</span>
                  })}
                  <button onClick={() => openEditTrade(trade)} style={{ background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', color: '#777' }}><PencilIcon size={14} /></button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: '#0a0a0f', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#ddd', fontWeight: 600 }}>PnL by</span>
                  <select value={pnlFilter} onChange={e => setPnlFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: '12px' }}>{filterableFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                </div>
                <BarChart data={getGroupedStats(pnlFilter, 'pnl')} />
              </div>
              <div style={{ background: '#0a0a0f', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#ddd', fontWeight: 600 }}>Winrate by</span>
                  <select value={winrateFilter} onChange={e => setWinrateFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: '12px' }}>{filterableFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                </div>
                <BarChart data={getGroupedStats(winrateFilter, 'winrate')} />
              </div>
              <div style={{ background: '#0a0a0f', borderRadius: '12px', padding: '20px' }}><DonutChart data={getOutcomeDistribution()} title="Win/Loss Distribution" /></div>
              <div style={{ background: '#0a0a0f', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#ddd', fontWeight: 600 }}>RR by</span>
                  <select value={compareX} onChange={e => setCompareX(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: '12px' }}>{filterableFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                </div>
                <BarChart data={getGroupedStats(compareX, 'rr')} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginTop: '24px' }}>
              {[
                { label: 'Total Trades', value: trades.length },
                { label: 'Win Rate', value: `${trades.length > 0 ? Math.round((trades.filter(t => t.outcome === 'win').length / trades.filter(t => t.outcome !== 'breakeven').length || 1) * 100) : 0}%`, color: '#22c55e' },
                { label: 'Total PnL', value: `$${trades.reduce((s, t) => s + (t.pnl || 0), 0)}`, color: trades.reduce((s, t) => s + (t.pnl || 0), 0) >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Avg RR', value: `${trades.length > 0 ? (trades.reduce((s, t) => s + (t.rr || 0), 0) / trades.length).toFixed(2) : 0}R` },
                { label: 'Best Trade', value: `$${Math.max(...trades.map(t => t.pnl || 0), 0)}`, color: '#22c55e' },
                { label: 'Worst Trade', value: `$${Math.min(...trades.map(t => t.pnl || 0), 0)}`, color: '#ef4444' },
              ].map((s, i) => (<div key={i} style={{ background: '#0a0a0f', borderRadius: '10px', padding: '16px' }}><div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div><div style={{ fontSize: '22px', fontWeight: 700, color: s.color || '#fff' }}>{s.value}</div></div>))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Trade Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '16px', padding: '28px', width: '750px', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
            <button onClick={() => setShowFieldEditor(true)} style={{ position: 'absolute', top: '28px', right: '70px', background: '#1a1a24', border: '1px solid #2a2a35', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}><SettingsIcon /> Edit Fields</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>{editingTrade ? 'Edit Trade' : 'Log New Trade'}</h2>
              <button onClick={() => { setShowAdd(false); setEditingTrade(null) }} style={{ background: 'none', border: 'none', color: '#888', fontSize: '28px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {fields.filter(f => f.type !== 'textarea').map(f => (
                <div key={f.id}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>{f.name}</label>
                  {f.type === 'text' && <input type="text" value={form[f.id] || ''} onChange={e => setForm({ ...form, [f.id]: e.target.value.toUpperCase() })} style={inputStyle} />}
                  {f.type === 'number' && <input type="number" value={form[f.id] || ''} onChange={e => setForm({ ...form, [f.id]: e.target.value })} style={inputStyle} />}
                  {f.type === 'date' && <input type="date" value={form[f.id] || ''} onChange={e => setForm({ ...form, [f.id]: e.target.value })} style={inputStyle} />}
                  {f.type === 'select' && <select value={form[f.id] || ''} onChange={e => setForm({ ...form, [f.id]: e.target.value })} style={inputStyle}>{f.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>}
                  {f.type === 'rating' && <select value={form[f.id] || '3'} onChange={e => setForm({ ...form, [f.id]: e.target.value })} style={inputStyle}>{[1,1.5,2,2.5,3,3.5,4,4.5,5].map(r => <option key={r} value={r}>{r}/5</option>)}</select>}
                  {f.type === 'image' && <label style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: form.image ? '#22c55e' : '#888', gap: '8px' }}><input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} /><ImageIcon /><span>{form.image ? '✓ Added' : 'Upload'}</span></label>}
                </div>
              ))}
            </div>
            {fields.filter(f => f.type === 'textarea').map(f => (
              <div key={f.id} style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>{f.name}</label>
                <textarea value={form[f.id] || ''} onChange={e => setForm({ ...form, [f.id]: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            ))}
            {form.image && <div style={{ marginTop: '12px' }}><img src={form.image} alt="Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} /><button onClick={() => setForm({ ...form, image: null })} style={{ marginTop: '4px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>Remove</button></div>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}><button onClick={saveTrade} style={{ flex: 1, padding: '14px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>{editingTrade ? 'SAVE' : 'LOG TRADE'}</button><button onClick={() => { setShowAdd(false); setEditingTrade(null) }} style={{ padding: '14px 32px', background: '#1a1a24', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* Field Editor Modal - NEW SQUARE CARD DESIGN */}
      {showFieldEditor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '16px', padding: '28px', width: '800px', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>Customize Fields</h2>
              <button onClick={() => setShowFieldEditor(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '28px', cursor: 'pointer' }}>×</button>
            </div>

            {/* 3-Column Grid of Field Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {fields.map(f => (
                <div key={f.id} style={{ background: '#0a0a0f', border: '1px solid #222230', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                  {/* Delete button */}
                  {!['symbol', 'outcome', 'date'].includes(f.id) && (
                    <button onClick={() => deleteField(f.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><TrashIcon /></button>
                  )}
                  
                  {/* Field Name */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>Field Name</label>
                    <input 
                      type="text" 
                      value={f.name} 
                      onChange={e => updateField(f.id, { name: e.target.value })} 
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: '13px' }} 
                    />
                  </div>
                  
                  {/* Data Type */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>Data Type</label>
                    <select 
                      value={f.type} 
                      onChange={e => updateField(f.id, { type: e.target.value })} 
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: '13px' }}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Dropdown</option>
                      <option value="date">Date</option>
                      <option value="rating">Rating</option>
                      <option value="textarea">Text Area</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  
                  {/* Options (for dropdown type) */}
                  {f.type === 'select' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>Options (comma separated)</label>
                      <input 
                        type="text" 
                        value={(f.options || []).join(', ')} 
                        onChange={e => updateField(f.id, { options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })} 
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px' }} 
                        placeholder="option1, option2, option3"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Field Card */}
              <button 
                onClick={addField}
                style={{ 
                  background: '#0a0a0f', 
                  border: '2px dashed #2a2a35', 
                  borderRadius: '12px', 
                  padding: '40px 16px', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#666',
                  transition: 'border-color 0.2s, color 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a35'; e.currentTarget.style.color = '#666' }}
              >
                <PlusIcon />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Add New Field</span>
              </button>
            </div>

            <button onClick={saveFields} style={{ marginTop: '24px', width: '100%', padding: '14px', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotes && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowNotes(null)}><div style={{ background: '#14141a', border: '1px solid #222230', borderRadius: '14px', padding: '24px', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}><h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Trade Notes</h3><p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>{showNotes}</p></div></div>}

      {/* Image Modal */}
      {showImage && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowImage(null)}><img src={showImage} alt="" style={{ maxWidth: '90%', maxHeight: '85vh', borderRadius: '12px' }} /></div>}
    </div>
  )
}
