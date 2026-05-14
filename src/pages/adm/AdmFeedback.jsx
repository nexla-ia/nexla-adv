import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  MessageSquareHeart, Search, Lightbulb, Bug, Heart, HelpCircle, MoreHorizontal,
  CheckCircle2, Clock, Sparkles, MessageCircle, ArrowRight, RefreshCw, Star,
  Building2,
} from 'lucide-react'
import './AdmFeedback.css'

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
  const { db, session } = useAuth()
  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [filter, setFilter] = useState('novo')
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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


  return (
    <div className="adm-fb-root">
      {/* HERO igual ao AdmSupport */}
      <div className="adm-fb-hero">
        <div className="adm-fb-hero-content">
          <div className="adm-fb-hero-eyebrow"><MessageSquareHeart size={13} /> Feedback</div>
          <h1 className="adm-fb-hero-title">Voz dos clientes</h1>
          <div className="adm-fb-hero-sub">
            Sugestões, bugs, elogios e dúvidas de todas as empresas. Responda direto daqui — o cliente vê no painel.
          </div>
        </div>
        <div className="adm-fb-hero-stats">
          <div className="adm-fb-hero-stat">
            <div className="adm-fb-hero-stat-num">{counts.novo}</div>
            <div className="adm-fb-hero-stat-lbl">Novos</div>
          </div>
          <div className="adm-fb-hero-stat">
            <div className="adm-fb-hero-stat-num">{counts.em_analise + counts.planejado}</div>
            <div className="adm-fb-hero-stat-lbl">Em análise</div>
          </div>
          <div className="adm-fb-hero-stat">
            <div className="adm-fb-hero-stat-num">{counts.feito}</div>
            <div className="adm-fb-hero-stat-lbl">Implementados</div>
          </div>
          <button className="adm-fb-hero-refresh" onClick={load} title="Recarregar" disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* SHELL */}
      <div className="adm-fb-shell">
        {/* LISTA */}
        <aside className="adm-fb-list">
          <div className="adm-fb-list-search">
            <Search size={14} />
            <input placeholder="Empresa, mensagem ou usuário..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="adm-fb-list-filters">
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
          <div className="adm-fb-list-filters" style={{ marginTop: -4 }}>
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

          <div className="adm-fb-list-items">
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
                <button key={f.id} onClick={() => setActiveId(f.id)} className={`adm-fb-item ${isActive ? 'active' : ''}`}>
                  <div className="adm-fb-item-avatar" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {company.charAt(0).toUpperCase()}
                  </div>
                  <div className="adm-fb-item-body">
                    <div className="adm-fb-item-top">
                      <span className="adm-fb-item-company">{company}</span>
                      <span className="adm-fb-item-time">{timeAgo(f.created_at)}</span>
                    </div>
                    <div className="adm-fb-item-subject" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CIcon size={11} style={{ color: cat.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.message?.slice(0, 60)}{f.message?.length > 60 ? '…' : ''}
                      </span>
                    </div>
                    <div className="adm-fb-item-bottom">
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
        <main className="adm-fb-detail">
          {!active ? (
            <div className="adm-fb-empty">
              <MessageSquareHeart size={56} />
              <h3>Selecione um feedback</h3>
              <p>Lista à esquerda mostra todos os feedbacks dos clientes.</p>
            </div>
          ) : (
            <div className="adm-fb-detail-content">
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

                    {/* Leitura: mensagem + rating + categoria/status */}
                    <div className="adm-fb-readbody">
                      {active.rating && (
                        <div className="adm-fb-rating">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={18} fill={i < active.rating ? '#FBBF24' : 'transparent'} color={i < active.rating ? '#F59E0B' : '#CBD5E1'} />
                          ))}
                          <span className="adm-fb-rating-num">{active.rating}/5</span>
                        </div>
                      )}

                      <div className="adm-fb-readmsg">
                        <div className="adm-fb-readmsg-label">Mensagem</div>
                        <div className="adm-fb-readmsg-text">{active.message}</div>
                      </div>

                      <div className="adm-fb-readmeta">
                        <div>
                          <div className="adm-fb-meta-label">Categoria</div>
                          <span className="adm-fb-meta-pill" style={{ color: cat.color, background: cat.bg }}>
                            <CIcon size={12} /> {cat.label}
                          </span>
                        </div>
                        <div>
                          <div className="adm-fb-meta-label">Status</div>
                          {(() => {
                            const st = STATUSES.find(s => s.value === active.status) || STATUSES[0]
                            const Si = st.icon
                            return (
                              <span className="adm-fb-meta-pill" style={{ color: st.color, background: st.bg }}>
                                <Si size={12} /> {st.label}
                              </span>
                            )
                          })()}
                        </div>
                        <div>
                          <div className="adm-fb-meta-label">Enviado em</div>
                          <div className="adm-fb-meta-value">{new Date(active.created_at).toLocaleString('pt-BR')}</div>
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
