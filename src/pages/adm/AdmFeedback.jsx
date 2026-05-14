import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  MessageSquareHeart, Search, Lightbulb, Bug, Heart, HelpCircle, MoreHorizontal,
  CheckCircle2, Clock, Sparkles, MessageCircle, ArrowRight, RefreshCw, Star,
  Building2, Send,
} from 'lucide-react'
import './AdmSupport.css'

const CATEGORIES = {
  sugestao: { label: 'Sugestão',   icon: Lightbulb,      color: '#D97706', bg: '#FEF3C7' },
  bug:      { label: 'Bug',        icon: Bug,            color: '#DC2626', bg: '#FEE2E2' },
  elogio:   { label: 'Elogio',     icon: Heart,          color: '#DB2777', bg: '#FCE7F3' },
  duvida:   { label: 'Dúvida',     icon: HelpCircle,     color: '#0891B2', bg: '#CFFAFE' },
  outro:    { label: 'Outro',      icon: MoreHorizontal, color: '#6366F1', bg: '#E0E7FF' },
}

const STATUSES = [
  { value: 'novo',       label: 'Recebido',       icon: Clock,         color: '#475569', bg: '#F1F5F9' },
  { value: 'em_analise', label: 'Em análise',     icon: Sparkles,      color: '#0891B2', bg: '#CFFAFE' },
  { value: 'planejado',  label: 'No roadmap',     icon: ArrowRight,    color: '#7C3AED', bg: '#EDE9FE' },
  { value: 'feito',      label: 'Implementado',   icon: CheckCircle2,  color: '#16A34A', bg: '#DCFCE7' },
  { value: 'recusado',   label: 'Fora do escopo', icon: MessageCircle, color: '#DC2626', bg: '#FEE2E2' },
]

const AVATAR_PALETTE = [
  ['#C9A074', '#A37846'], ['#7C3AED', '#5B21B6'], ['#16A34A', '#15803D'],
  ['#2563EB', '#1D4ED8'], ['#DB2777', '#BE185D'], ['#EA580C', '#C2410C'],
  ['#0891B2', '#0E7490'], ['#65A30D', '#4D7C0F'],
]
function hashColor(name) {
  let h = 0
  for (let i = 0; i < (name || '').length; i++) h = ((h << 5) - h) + name.charCodeAt(i)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return new Date(ts).toLocaleDateString('pt-BR')
}

export default function AdmFeedback() {
  const { db } = useAuth()
  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [filter, setFilter] = useState('novo')
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('feedbacks').select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    setList(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('adm-feedbacks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' },
        (p) => {
          if (p.eventType === 'INSERT') setList(prev => [p.new, ...prev.filter(f => f.id !== p.new.id)])
          else if (p.eventType === 'UPDATE') setList(prev => prev.map(f => f.id === p.new.id ? p.new : f))
          else if (p.eventType === 'DELETE') setList(prev => prev.filter(f => f.id !== p.old.id))
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  function companyName(companyId) {
    return db?.companies?.find(c => c.id === companyId)?.name || '—'
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return list.filter(f => {
      if (filter !== 'all' && f.status !== filter) return false
      if (catFilter !== 'all' && f.category !== catFilter) return false
      if (!s) return true
      const company = companyName(f.company_id).toLowerCase()
      return company.includes(s) ||
        (f.message || '').toLowerCase().includes(s) ||
        (f.user_name || '').toLowerCase().includes(s)
    })
  }, [list, filter, catFilter, search, db])

  const counts = useMemo(() => ({
    all: list.length,
    novo: list.filter(f => f.status === 'novo').length,
    em_analise: list.filter(f => f.status === 'em_analise').length,
    planejado: list.filter(f => f.status === 'planejado').length,
    feito: list.filter(f => f.status === 'feito').length,
    recusado: list.filter(f => f.status === 'recusado').length,
  }), [list])

  const active = useMemo(() => list.find(f => f.id === activeId), [list, activeId])

  useEffect(() => {
    if (active) setResponse(active.adm_response || '')
  }, [activeId])

  async function saveStatus(status) {
    if (!active) return
    setSaving(true)
    await supabase.from('feedbacks').update({ status }).eq('id', active.id)
    setList(prev => prev.map(f => f.id === active.id ? { ...f, status } : f))
    setSaving(false)
  }

  async function saveResponse() {
    if (!active) return
    setSaving(true)
    const newStatus = active.status === 'novo' ? 'em_analise' : active.status
    await supabase.from('feedbacks').update({
      adm_response: response.trim() || null,
      status: newStatus,
    }).eq('id', active.id)
    setList(prev => prev.map(f => f.id === active.id ? { ...f, adm_response: response.trim() || null, status: newStatus } : f))
    setSaving(false)
  }

  return (
    <div className="ads-root">
      {/* HERO igual ao AdmSupport */}
      <div className="ads-hero">
        <div className="ads-hero-content">
          <div className="ads-hero-eyebrow"><MessageSquareHeart size={13} /> Feedback</div>
          <h1 className="ads-hero-title">Voz dos clientes</h1>
          <div className="ads-hero-sub">
            Sugestões, bugs, elogios e dúvidas de todas as empresas. Responda direto daqui — o cliente vê no painel.
          </div>
        </div>
        <div className="ads-hero-stats">
          <div className="ads-hero-stat">
            <div className="ads-hero-stat-num">{counts.novo}</div>
            <div className="ads-hero-stat-lbl">Novos</div>
          </div>
          <div className="ads-hero-stat">
            <div className="ads-hero-stat-num">{counts.em_analise + counts.planejado}</div>
            <div className="ads-hero-stat-lbl">Em análise</div>
          </div>
          <div className="ads-hero-stat">
            <div className="ads-hero-stat-num">{counts.feito}</div>
            <div className="ads-hero-stat-lbl">Implementados</div>
          </div>
          <button className="ads-hero-refresh" onClick={load} title="Recarregar" disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* SHELL */}
      <div className="ads-shell">
        {/* LISTA */}
        <aside className="ads-list">
          <div className="ads-list-search">
            <Search size={14} />
            <input placeholder="Empresa, mensagem ou usuário..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="ads-list-filters">
            {[
              { v: 'novo', label: 'Novos' },
              { v: 'em_analise', label: 'Em análise' },
              { v: 'planejado', label: 'Roadmap' },
              { v: 'feito', label: 'Feitos' },
              { v: 'all', label: 'Todos' },
            ].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)} className={filter === f.v ? 'active' : ''}>
                {f.label} ({counts[f.v]})
              </button>
            ))}
          </div>

          {/* Filtro categoria */}
          <div className="ads-list-filters" style={{ marginTop: -4 }}>
            <button onClick={() => setCatFilter('all')} className={catFilter === 'all' ? 'active' : ''}>Todas</button>
            {Object.entries(CATEGORIES).map(([k, c]) => {
              const Ic = c.icon
              return (
                <button key={k} onClick={() => setCatFilter(k)} className={catFilter === k ? 'active' : ''}
                  style={catFilter === k ? { background: c.bg, color: c.color, borderColor: c.color } : {}}>
                  <Ic size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{c.label}
                </button>
              )
            })}
          </div>

          <div className="ads-list-items">
            {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhum feedback {filter !== 'all' ? `em ${STATUSES.find(s => s.value === filter)?.label}` : ''}.
              </div>
            )}
            {filtered.map(f => {
              const cat = CATEGORIES[f.category] || CATEGORIES.outro
              const st  = STATUSES.find(s => s.value === f.status) || STATUSES[0]
              const company = companyName(f.company_id)
              const [c1, c2] = hashColor(company)
              const isActive = activeId === f.id
              const CIcon = cat.icon
              return (
                <button key={f.id} onClick={() => setActiveId(f.id)} className={`ads-item ${isActive ? 'active' : ''}`}>
                  <div className="ads-item-avatar" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {company.charAt(0).toUpperCase()}
                  </div>
                  <div className="ads-item-body">
                    <div className="ads-item-top">
                      <span className="ads-item-company">{company}</span>
                      <span className="ads-item-time">{timeAgo(f.created_at)}</span>
                    </div>
                    <div className="ads-item-subject" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CIcon size={11} style={{ color: cat.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.message?.slice(0, 60)}{f.message?.length > 60 ? '…' : ''}
                      </span>
                    </div>
                    <div className="ads-item-bottom">
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                      {f.rating && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#F59E0B', fontWeight: 700 }}>
                          <Star size={9} fill="#FBBF24" color="#F59E0B" /> {f.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* DETALHE */}
        <main className="ads-detail">
          {!active ? (
            <div className="ads-empty">
              <MessageSquareHeart size={56} />
              <h3>Selecione um feedback</h3>
              <p>Lista à esquerda mostra todos os feedbacks dos clientes.</p>
            </div>
          ) : (
            <div className="ads-detail-content">
              {(() => {
                const cat = CATEGORIES[active.category] || CATEGORIES.outro
                const company = companyName(active.company_id)
                const [c1, c2] = hashColor(company)
                const CIcon = cat.icon
                return (
                  <>
                    <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${c1}, ${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {company.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
                          {company}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {active.user_name} · {active.user_email} · {new Date(active.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg }}>
                        <CIcon size={11} /> {cat.label}
                      </span>
                    </header>

                    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                      {/* Mensagem do cliente */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Mensagem do cliente
                          {active.rating && (
                            <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={11} fill={i < active.rating ? '#FBBF24' : 'transparent'} color={i < active.rating ? '#F59E0B' : '#CBD5E1'} />
                              ))}
                            </span>
                          )}
                        </div>
                        <div style={{ background: '#FAFAFC', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', fontSize: 14, lineHeight: 1.6, color: '#2D2B45', whiteSpace: 'pre-wrap' }}>
                          {active.message}
                        </div>
                      </div>

                      {/* Status */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Status
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {STATUSES.map(s => {
                            const Ic = s.icon
                            const isCurr = active.status === s.value
                            return (
                              <button key={s.value}
                                onClick={() => saveStatus(s.value)}
                                disabled={saving}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '6px 12px', borderRadius: 999,
                                  border: `1.5px solid ${isCurr ? s.color : 'var(--border)'}`,
                                  background: isCurr ? s.bg : '#fff',
                                  color: isCurr ? s.color : 'var(--text-secondary)',
                                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}>
                                <Ic size={11} /> {s.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Resposta */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Resposta do time
                        </div>
                        <textarea
                          value={response}
                          onChange={e => setResponse(e.target.value)}
                          placeholder="Conta pro cliente o que vai rolar com esse feedback..."
                          rows={5}
                          style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, lineHeight: 1.55, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 120, background: '#FAFAFC' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          <button onClick={saveResponse} disabled={saving}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                            <Send size={13} /> {saving ? 'Salvando...' : 'Salvar resposta'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
