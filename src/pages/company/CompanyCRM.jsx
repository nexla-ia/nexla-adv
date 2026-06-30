import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Briefcase, Plus, X, Trash2, Pencil, Phone, Mail, Calendar, FileText,
  AlertCircle, CheckCircle2, Filter, ChevronDown, ChevronRight, MoreVertical,
  Flame, Snowflake, Thermometer, MessageSquare, Tag as TagIcon, User,
  Layers, ListChecks, GripVertical, Scale, Wallet, Kanban as KanbanIcon,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtBRL = (n) => (typeof n === 'number' ? n : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const cleanPhone = (p) => (p || '').replace(/\D/g, '')
const daysIn = (ts) => {
  if (!ts) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 86400000))
}
const fmtRelative = (ts) => {
  if (!ts) return ''
  const ms = Date.now() - new Date(ts).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return new Date(ts).toLocaleDateString('pt-BR')
}
const fmtDateTime = (ts) => ts ? new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''

const TEMPERATURAS = [
  { value: 'frio',   label: 'Frio',   color: '#0891B2', bg: '#ECFEFF', icon: Snowflake },
  { value: 'morno',  label: 'Morno',  color: '#D97706', bg: '#FFFBEB', icon: Thermometer },
  { value: 'quente', label: 'Quente', color: '#DC2626', bg: '#FEF2F2', icon: Flame },
]
const ORIGENS = ['WhatsApp', 'Indicação', 'Site', 'Google', 'Instagram', 'Facebook', 'LinkedIn', 'Anúncio', 'Evento', 'Outros']
const AREAS_PRATICA = ['Trabalhista', 'Cível', 'Tributário', 'Família', 'Empresarial', 'Previdenciário', 'Penal', 'Consumidor', 'Outros']

const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }

function Counter({ icon, color, value, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PAGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function CompanyCRM() {
  const { session } = useAuth()
  const instance = session?.company?.instance
  const isAdmin = session?.user?.role === 'admin'
  const [tab, setTab] = useState('board')
  const [loading, setLoading] = useState(true)
  const [funnels, setFunnels] = useState([])
  const [stages, setStages] = useState([])
  const [contacts, setContacts] = useState([])
  const [lists, setLists] = useState([])
  const [users, setUsers] = useState([])
  const [activeFunnel, setActiveFunnel] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [contactModal, setContactModal] = useState(null) // novo lead modal
  const [stagesModal, setStagesModal] = useState(false)  // editar etapas
  const [activeList, setActiveList] = useState(null)     // lista dinamica filtrada
  const [toast, setToast] = useState(null)

  function showToast(msg, color = '#16A34A') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  // Carrega tudo
  useEffect(() => {
    if (!instance) return
    setLoading(true)
    ;(async () => {
      const [funR, stR, ctR, lstR, usR] = await Promise.all([
        supabase.from('crm_funnels').select('*').eq('instancia', instance).order('posicao'),
        supabase.from('crm_stages').select('*').eq('instancia', instance).order('posicao'),
        supabase.from('crm_contacts').select('*').eq('instancia', instance).order('created_at', { ascending: false }).limit(5000),
        supabase.from('crm_lists').select('*').eq('instancia', instance).order('created_at'),
        supabase.from('users').select('id, name, email').eq('company_id', session?.company?.id),
      ])
      let funList = funR.data || []
      let stList = stR.data || []
      if (funList.length === 0) {
        // Auto-seed
        const { data: newId } = await supabase.rpc('crm_seed_default_funnel', { p_instancia: instance })
        if (newId) {
          const [funR2, stR2] = await Promise.all([
            supabase.from('crm_funnels').select('*').eq('instancia', instance).order('posicao'),
            supabase.from('crm_stages').select('*').eq('instancia', instance).order('posicao'),
          ])
          funList = funR2.data || []
          stList = stR2.data || []
        }
      }
      setFunnels(funList)
      setStages(stList)
      setContacts(ctR.data || [])
      setLists(lstR.data || [])
      setUsers(usR.data || [])
      if (funList.length && !activeFunnel) setActiveFunnel(funList[0].id)
      setLoading(false)
    })()
  }, [instance])

  // Stages do funil ativo
  const activeStages = useMemo(
    () => stages.filter(s => s.funil_id === activeFunnel).sort((a, b) => a.posicao - b.posicao),
    [stages, activeFunnel]
  )

  // Contatos filtrados pelo funil + lista ativa
  const visibleContacts = useMemo(() => {
    let arr = contacts.filter(c => c.funil_id === activeFunnel)
    if (activeList) arr = applyListFilter(arr, activeList.filtros)
    return arr
  }, [contacts, activeFunnel, activeList])

  // Indexa por stage
  const byStage = useMemo(() => {
    const map = {}
    visibleContacts.forEach(c => {
      const k = c.stage_id || '_'
      if (!map[k]) map[k] = []
      map[k].push(c)
    })
    return map
  }, [visibleContacts])

  // Stale leads
  const staleLeads = useMemo(() => {
    return visibleContacts.filter(c => {
      const stage = activeStages.find(s => s.id === c.stage_id)
      if (!stage || stage.is_won || stage.is_lost) return false
      const lim = stage.alerta_dias || 7
      return daysIn(c.data_entrada_etapa) > lim
    }).sort((a, b) => daysIn(b.data_entrada_etapa) - daysIn(a.data_entrada_etapa))
  }, [visibleContacts, activeStages])

  // ─── CRUD ──────────────────────────────────────────────────────────────
  function openNewContact() {
    if (!activeFunnel || !activeStages.length) return showToast('Crie um funil primeiro', '#DC2626')
    setContactModal({
      id: null, funil_id: activeFunnel, stage_id: activeStages[0].id,
      phone: '', nome: '', email: '', origem: '', temperatura: 'morno', tags: [],
      processo_numero: '', area_pratica: '', valor_estimado: '',
      observacoes: '',
    })
  }

  async function saveContact(m) {
    if (!m.nome?.trim() && !m.phone?.trim()) return showToast('Nome ou telefone obrigatório', '#DC2626')
    const payload = {
      instancia: instance,
      funil_id: m.funil_id,
      stage_id: m.stage_id || null,
      phone: cleanPhone(m.phone) || null,
      nome: m.nome?.trim() || null,
      email: m.email?.trim() || null,
      origem: m.origem || null,
      temperatura: m.temperatura || 'morno',
      tags: m.tags || [],
      processo_numero: m.processo_numero?.trim() || null,
      area_pratica: m.area_pratica || null,
      valor_estimado: m.valor_estimado ? Number(m.valor_estimado) : null,
      observacoes: m.observacoes?.trim() || null,
    }
    if (m.id) {
      const { data, error } = await supabase.from('crm_contacts').update(payload).eq('id', m.id).select().single()
      if (error) return showToast(error.message, '#DC2626')
      setContacts(prev => prev.map(c => c.id === data.id ? data : c))
      showToast('Atualizado')
    } else {
      const { data, error } = await supabase.from('crm_contacts').insert(payload).select().single()
      if (error) return showToast(error.message, '#DC2626')
      setContacts(prev => [data, ...prev])
      await supabase.from('crm_interactions').insert({
        instancia: instance, contact_id: data.id, phone: data.phone,
        tipo: 'etapa', conteudo: 'Lead criado',
        autor_nome: session?.user?.name, autor_email: session?.user?.email,
      })
      showToast('Lead criado')
    }
    setContactModal(null)
  }

  async function moveContact(contact, newStageId) {
    if (contact.stage_id === newStageId) return
    const fromStage = activeStages.find(s => s.id === contact.stage_id)
    const toStage = activeStages.find(s => s.id === newStageId)
    // Otimista
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, stage_id: newStageId, data_entrada_etapa: new Date().toISOString() } : c))
    const { error } = await supabase.from('crm_contacts').update({ stage_id: newStageId }).eq('id', contact.id)
    if (error) {
      // Rollback
      setContacts(prev => prev.map(c => c.id === contact.id ? contact : c))
      return showToast('Erro: ' + error.message, '#DC2626')
    }
    await supabase.from('crm_interactions').insert({
      instancia: instance, contact_id: contact.id, phone: contact.phone,
      tipo: 'etapa',
      conteudo: `Movido de "${fromStage?.nome || '?'}" para "${toStage?.nome || '?'}"`,
      autor_nome: session?.user?.name, autor_email: session?.user?.email,
      metadata: { from_stage_id: contact.stage_id, to_stage_id: newStageId },
    })
  }

  async function deleteContact(c) {
    if (!confirm(`Excluir lead "${c.nome || c.phone}"?`)) return
    await supabase.from('crm_contacts').delete().eq('id', c.id)
    setContacts(prev => prev.filter(x => x.id !== c.id))
    if (selectedContact?.id === c.id) setSelectedContact(null)
    showToast('Excluído')
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Briefcase size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
        <div>CRM disponível apenas pra administradores.</div>
      </div>
    )
  }

  // Busca + filtro de temperatura no header
  const [search, setSearch] = useState('')
  const [tempoFilter, setTempoFilter] = useState('todos')
  const searchFiltered = useMemo(() => visibleContacts.filter(c => {
    if (tempoFilter !== 'todos' && c.temperatura !== tempoFilter) return false
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (c.nome || '').toLowerCase().includes(q)
      || (c.phone || '').includes(q)
      || (c.processo_numero || '').toLowerCase().includes(q)
  }), [visibleContacts, search, tempoFilter])

  const byStageFiltered = useMemo(() => {
    const map = {}
    searchFiltered.forEach(c => {
      const k = c.stage_id || '_'
      if (!map[k]) map[k] = []
      map[k].push(c)
    })
    return map
  }, [searchFiltered])

  // Counters do header
  const counters = useMemo(() => ({
    leads: searchFiltered.length,
    quentes: searchFiltered.filter(c => c.temperatura === 'quente').length,
    parados: staleLeads.length,
  }), [searchFiltered, staleLeads])

  const TABS = [
    { id: 'board',    label: 'Board',    icon: KanbanIcon },
    { id: 'alertas',  label: 'Alertas',  icon: AlertCircle, count: staleLeads.length },
    { id: 'listas',   label: 'Listas',   icon: ListChecks },
  ]

  const sharedProps = {
    instance, session, users,
    funnels, stages, activeStages, contacts, visibleContacts, byStage: byStageFiltered,
    activeFunnel, setActiveFunnel,
    selectedContact, setSelectedContact,
    moveContact, openNewContact, deleteContact,
    staleLeads, showToast,
    setContactModal, setStagesModal,
    lists, setLists, activeList, setActiveList,
  }

  // Dedupe funis com mesmo nome (bug que apareceu antes)
  const uniqueFunnels = useMemo(() => {
    const seen = new Set()
    return funnels.filter(f => {
      if (seen.has(f.nome)) return false
      seen.add(f.nome); return true
    })
  }, [funnels])

  return (
    <div style={{ padding: '1.25rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header em UMA linha — simples e compacto igual ref */}
      <div style={{ padding: '4px 0 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* Logo + titulo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#0F172A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={16} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', lineHeight: 1 }}>CRM</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>Pipeline de clientes</div>
          </div>
        </div>

        {/* Counters compactos */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0, marginLeft: 4 }}>
          <Counter icon="📋" color="#2563EB" value={counters.leads} label="leads" />
          <Counter icon="🔥" color="#DC2626" value={counters.quentes} label="quentes" />
          <Counter icon="⚠️" color="#D97706" value={counters.parados} label="parados" />
        </div>

        <div style={{ flex: 1 }} />

        {/* Tabs segmented */}
        <div style={{ display: 'flex', gap: 2, background: '#F1F5F9', borderRadius: 8, padding: 3, flexShrink: 0 }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', border: 'none', cursor: 'pointer',
                  background: active ? '#fff' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderRadius: 6, fontSize: 12, fontWeight: 600,
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}>
                <Icon size={12} /> {t.label}
                {typeof t.count === 'number' && t.count > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10, background: '#FEE2E2', color: '#B91C1C', marginLeft: 2 }}>{t.count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 180, flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 11 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lead…"
            style={{
              width: '100%', paddingLeft: 30, paddingRight: 12,
              height: 32, fontSize: 12, borderRadius: 8,
              border: '1px solid var(--border)', background: '#fff', outline: 'none',
            }} />
        </div>

        {/* Filtro temperatura */}
        <select value={tempoFilter} onChange={e => setTempoFilter(e.target.value)}
          style={{ fontSize: 12, height: 32, padding: '0 28px 0 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', flexShrink: 0, minWidth: 90 }}>
          <option value="todos">Todos</option>
          {TEMPERATURAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Etapas icon-only */}
        <button onClick={() => setStagesModal(true)} title="Editar etapas"
          style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', color: 'var(--text-secondary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
          <Layers size={13} />
        </button>

        {/* Novo Lead */}
        <button onClick={openNewContact}
          style={{
            background: '#0F172A', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0 16px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 6px rgba(15,23,42,0.18)', flexShrink: 0, height: 32,
          }}>
          <Plus size={13} /> Novo Lead
        </button>
      </div>

      {/* Funil selector quando >1 (dedupe ja aplicado) */}
      {uniqueFunnels.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {uniqueFunnels.map(f => {
            const active = activeFunnel === f.id
            return (
              <button key={f.id} onClick={() => setActiveFunnel(f.id)}
                style={{
                  border: '1px solid', borderColor: active ? '#2563EB' : 'var(--border)',
                  background: active ? '#EFF6FF' : '#fff',
                  color: active ? '#1D4ED8' : 'var(--text-secondary)',
                  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                {f.nome}
              </button>
            )
          })}
        </div>
      )}

      {/* tabs antigas removidas — agora estao no header */}
      <div style={{ display: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 16px', fontSize: 13, fontWeight: 600,
                color: active ? t.color : 'var(--text-secondary)',
                borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
              }}>
              <Icon size={14} /> {t.label}
              {typeof t.count === 'number' && t.count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: t.color, color: '#fff' }}>{t.count}</span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando…</div>
      ) : !activeFunnel ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhum funil. Criando funil padrão…
        </div>
      ) : (
        <>
          {tab === 'board' && <BoardKanban {...sharedProps} />}
          {tab === 'alertas' && <AlertasTab {...sharedProps} />}
          {tab === 'listas' && <ListasTab {...sharedProps} />}
        </>
      )}

      {/* Painel lateral do contato */}
      {selectedContact && (
        <ContactPanel
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          {...sharedProps}
        />
      )}

      {/* Modal novo/editar lead */}
      {contactModal && (
        <ContactModal modal={contactModal} setModal={setContactModal} stages={activeStages}
          users={users} onSave={saveContact} />
      )}

      {/* Modal editar etapas */}
      {stagesModal && (
        <StagesModal funnel={funnels.find(f => f.id === activeFunnel)} stages={activeStages}
          instance={instance} onClose={() => setStagesModal(false)}
          onUpdate={(newStages) => setStages(prev => [...prev.filter(s => s.funil_id !== activeFunnel), ...newStages])}
          showToast={showToast} />
      )}

      {toast && createPortal(
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.color, color: '#fff', padding: '10px 18px', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 99999, fontSize: 13, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={14} /> {toast.msg}
        </div>, document.body)}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BOARD KANBAN
// ════════════════════════════════════════════════════════════════════════════
function BoardKanban({ activeStages, byStage, moveContact, setSelectedContact, setContactModal, activeFunnel }) {
  const [dragId, setDragId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)

  function addToStage(stageId) {
    setContactModal({
      id: null, funil_id: activeFunnel, stage_id: stageId,
      phone: '', nome: '', email: '', origem: '', temperatura: 'morno', tags: [],
      processo_numero: '', area_pratica: '', valor_estimado: '', observacoes: '',
    })
  }

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, alignItems: 'flex-start' }}>
      {activeStages.map(stage => {
        const cards = byStage[stage.id] || []
        const hover = dragOverStage === stage.id
        return (
          <div key={stage.id}
            onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id) }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={() => {
              if (dragId) {
                const contact = (Object.values(byStage).flat()).find(x => x.id === dragId)
                if (contact && contact.stage_id !== stage.id) moveContact(contact, stage.id)
              }
              setDragId(null); setDragOverStage(null)
            }}
            style={{
              minWidth: 240, width: 240, flexShrink: 0,
              background: '#fff',
              border: `1px solid ${hover ? '#2563EB' : 'var(--border)'}`,
              boxShadow: hover ? '0 2px 8px rgba(37,99,235,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
              borderRadius: 10, display: 'flex', flexDirection: 'column',
              transition: 'all 0.15s',
              alignSelf: 'flex-start', /* nao estica vertical */
            }}>
            {/* Header coluna */}
            <div style={{
              padding: '10px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.cor || '#94A3B8', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stage.nome}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: stage.cor || '#94A3B8', color: '#fff',
                borderRadius: 12, padding: '1px 8px', minWidth: 20, textAlign: 'center',
              }}>{cards.length}</span>
            </div>
            {/* Subheader: alerta */}
            <div style={{ padding: '0 12px 8px', fontSize: 10, color: 'var(--text-muted)' }}>
              alerta após {stage.alerta_dias || 7}d
            </div>
            {/* Cards — altura natural quando vazio, scroll se passar de 8 cards */}
            {cards.length > 0 && (
            <div style={{ padding: '0 8px 4px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
              {cards.map(c => {
                const tempo = TEMPERATURAS.find(t => t.value === c.temperatura)
                const TempIcon = tempo?.icon
                const dias = daysIn(c.data_entrada_etapa)
                const overdue = dias > (stage.alerta_dias || 7) && !stage.is_won && !stage.is_lost
                return (
                  <div key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => { setDragId(null); setDragOverStage(null) }}
                    onClick={() => setSelectedContact(c)}
                    style={{
                      background: '#fff', border: `1px solid ${overdue ? '#FED7AA' : 'var(--border)'}`,
                      borderRadius: 8, padding: 10, cursor: 'grab',
                      boxShadow: dragId === c.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                      opacity: dragId === c.id ? 0.5 : 1,
                      transition: 'all 0.12s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                        {c.nome || `+${c.phone}` || 'Sem nome'}
                      </div>
                      {tempo && (
                        <span title={tempo.label}
                          style={{ width: 18, height: 18, borderRadius: '50%', background: tempo.bg, color: tempo.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <TempIcon size={10} />
                        </span>
                      )}
                    </div>
                    {c.phone && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.phone}</div>}
                    {c.area_pratica && (
                      <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 600, marginTop: 3 }}>
                        <Scale size={9} style={{ verticalAlign: -1 }} /> {c.area_pratica}
                      </div>
                    )}
                    {c.valor_estimado > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginTop: 3 }}>{fmtBRL(Number(c.valor_estimado))}</div>
                    )}
                    {(c.tags || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 5 }}>
                        {(c.tags || []).slice(0, 3).map(t => (
                          <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#F1F5F9', color: 'var(--text-secondary)', fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 9, color: 'var(--text-muted)' }}>
                      <span>{c.responsavel_nome || 'sem responsável'}</span>
                      <span style={{ color: overdue ? '#D97706' : 'var(--text-muted)', fontWeight: overdue ? 700 : 400 }}>
                        {dias}d
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            )}
            {/* Rodape: + Adicionar lead */}
            <button onClick={() => addToStage(stage.id)}
              style={{
                margin: 8, padding: '8px',
                background: 'transparent', border: '1px dashed var(--border)',
                borderRadius: 6, color: 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
              <Plus size={12} /> Adicionar lead
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ALERTAS
// ════════════════════════════════════════════════════════════════════════════
function AlertasTab({ staleLeads, activeStages, setSelectedContact }) {
  if (!staleLeads.length) {
    return (
      <div className="nx-card" style={{ padding: 40, textAlign: 'center', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <CheckCircle2 size={32} style={{ color: '#16A34A', marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>Nenhum lead parado 🎉</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Todos estão dentro do prazo de cada etapa.</div>
      </div>
    )
  }
  return (
    <div className="nx-card" style={{ padding: 0, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ background: '#F8FAFC' }}>
          <tr>
            <th style={th}>Lead</th>
            <th style={th}>Etapa</th>
            <th style={th}>Parado há</th>
            <th style={th}>Limite</th>
            <th style={th}>Responsável</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {staleLeads.map(c => {
            const stage = activeStages.find(s => s.id === c.stage_id)
            const dias = daysIn(c.data_entrada_etapa)
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{c.nome || `+${c.phone}`}</div>
                  {c.phone && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.phone}</div>}
                </td>
                <td style={td}>
                  {stage && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: (stage.cor || '#94A3B8') + '22', color: stage.cor || '#475569' }}>
                      {stage.nome}
                    </span>
                  )}
                </td>
                <td style={{ ...td, fontWeight: 700, color: '#D97706' }}>{dias} dias</td>
                <td style={td}>{stage?.alerta_dias || 7} dias</td>
                <td style={td}>{c.responsavel_nome || '—'}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button onClick={() => setSelectedContact(c)} className="nx-btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
                    Abrir <ChevronRight size={11} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LISTAS DINAMICAS
// ════════════════════════════════════════════════════════════════════════════
function ListasTab({ lists, setLists, activeList, setActiveList, contacts, activeStages, instance, showToast, setSelectedContact, activeFunnel }) {
  const [modal, setModal] = useState(null)

  async function save(m) {
    if (!m.nome?.trim()) return showToast('Nome obrigatório', '#DC2626')
    const payload = { nome: m.nome.trim(), filtros: m.filtros || {}, cor: m.cor || '#2563EB' }
    if (m.id) {
      const { data, error } = await supabase.from('crm_lists').update(payload).eq('id', m.id).select().single()
      if (error) return showToast(error.message, '#DC2626')
      setLists(prev => prev.map(l => l.id === data.id ? data : l))
    } else {
      const { data, error } = await supabase.from('crm_lists').insert({ ...payload, instancia: instance }).select().single()
      if (error) return showToast(error.message, '#DC2626')
      setLists(prev => [...prev, data])
    }
    setModal(null); showToast('Salvo')
  }
  async function del(l) {
    if (!confirm(`Excluir lista "${l.nome}"?`)) return
    await supabase.from('crm_lists').delete().eq('id', l.id)
    setLists(prev => prev.filter(x => x.id !== l.id))
    if (activeList?.id === l.id) setActiveList(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="nx-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {lists.length} lista{lists.length !== 1 ? 's' : ''} salva{lists.length !== 1 ? 's' : ''}
          {activeList && <span style={{ marginLeft: 8 }}>· Aplicada: <strong style={{ color: activeList.cor }}>{activeList.nome}</strong>
            <button onClick={() => setActiveList(null)} style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={12} /></button>
          </span>}
        </div>
        <button className="nx-btn-primary" onClick={() => setModal({ nome: '', filtros: {}, cor: '#2563EB' })} style={{ fontSize: 12 }}>
          <Plus size={13} /> Nova lista
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="nx-card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma lista. Crie filtros salvos pra acessar grupos de leads rapidamente.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {lists.map(l => {
            const matched = applyListFilter(contacts.filter(c => c.funil_id === activeFunnel), l.filtros)
            const isActive = activeList?.id === l.id
            return (
              <div key={l.id} className="nx-card" style={{ padding: 14, borderLeft: `4px solid ${l.cor || '#2563EB'}`, background: isActive ? '#EFF6FF' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{l.nome}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setModal({ ...l })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={12} /></button>
                    <button onClick={() => del(l)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {matched.length} lead{matched.length !== 1 ? 's' : ''} • {summarizeFilter(l.filtros, activeStages)}
                </div>
                <button onClick={() => setActiveList(isActive ? null : l)}
                  style={{
                    width: '100%', background: isActive ? l.cor : '#fff',
                    color: isActive ? '#fff' : l.cor,
                    border: `1px solid ${l.cor}`, borderRadius: 6, padding: '6px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                  {isActive ? 'Remover filtro' : 'Aplicar no funil'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modal && <ListaModal modal={modal} setModal={setModal} stages={activeStages} onSave={save} />}
    </div>
  )
}

function applyListFilter(arr, filtros) {
  if (!filtros) return arr
  return arr.filter(c => {
    if (filtros.temperatura && c.temperatura !== filtros.temperatura) return false
    if (filtros.stage_id && c.stage_id !== filtros.stage_id) return false
    if (filtros.origem && c.origem !== filtros.origem) return false
    if (filtros.area_pratica && c.area_pratica !== filtros.area_pratica) return false
    if (filtros.tag && !(c.tags || []).includes(filtros.tag)) return false
    if (filtros.responsavel_id && c.responsavel_id !== filtros.responsavel_id) return false
    if (filtros.dias_min != null) {
      if (daysIn(c.data_entrada_etapa) < Number(filtros.dias_min)) return false
    }
    return true
  })
}
function summarizeFilter(f, stages) {
  if (!f) return 'sem filtros'
  const parts = []
  if (f.temperatura) parts.push(f.temperatura)
  if (f.stage_id) {
    const s = stages.find(x => x.id === f.stage_id)
    if (s) parts.push(s.nome)
  }
  if (f.origem) parts.push(f.origem)
  if (f.area_pratica) parts.push(f.area_pratica)
  if (f.tag) parts.push(`#${f.tag}`)
  if (f.dias_min != null) parts.push(`>${f.dias_min}d`)
  return parts.length ? parts.join(' · ') : 'sem filtros'
}

// ════════════════════════════════════════════════════════════════════════════
// PAINEL LATERAL — ficha do lead + timeline
// ════════════════════════════════════════════════════════════════════════════
function ContactPanel({ contact, onClose, instance, session, activeStages, setContacts, users, showToast, deleteContact, setContactModal }) {
  const navigate = useNavigate()
  const [timeline, setTimeline] = useState([])
  const [loadingTl, setLoadingTl] = useState(true)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    if (!contact?.id) return
    loadPanelData()
  }, [contact?.id])

  async function loadPanelData() {
    setLoadingTl(true)
    const ph = cleanPhone(contact.phone)
    const sid = ph ? `${ph}@s.whatsapp.net` : null
    const [intR, msgR, apR, finR, knR] = await Promise.all([
      supabase.from('crm_interactions').select('*').eq('contact_id', contact.id).order('created_at', { ascending: false }).limit(200),
      ph ? supabase.from('mensagens_geral').select('id, mensagem, type, created_at, nome').eq('instancia', instance).eq('numero', sid).order('created_at', { ascending: false }).limit(50)
         : Promise.resolve({ data: [] }),
      ph ? supabase.from('appointments').select('id, starts_at, status, contact_nome').eq('instancia', instance).eq('contact_numero', ph).order('starts_at', { ascending: false }).limit(20)
         : Promise.resolve({ data: [] }),
      ph ? supabase.from('financial_transactions').select('id, tipo, descricao, valor, vencimento, status').eq('instancia', instance).eq('contato_nome', contact.nome || '_no_match_').order('vencimento', { ascending: false }).limit(20)
         : Promise.resolve({ data: [] }),
      supabase.from('kanban_cards').select('id, title, column_id, created_at, due_date').eq('crm_contact_id', contact.id).order('created_at', { ascending: false }).limit(20),
    ])
    const events = []
    ;(intR.data || []).forEach(i => events.push({
      ts: i.created_at, kind: i.tipo, title: i.conteudo, sub: i.autor_nome, source: 'crm', data: i,
    }))
    ;(msgR.data || []).forEach(m => events.push({
      ts: m.created_at, kind: 'mensagem',
      title: (m.mensagem || '').slice(0, 80) + ((m.mensagem || '').length > 80 ? '…' : ''),
      sub: m.type === 'cliente' ? 'Cliente' : (m.nome || 'Atendente'),
      source: 'whatsapp',
    }))
    ;(apR.data || []).forEach(a => events.push({
      ts: a.starts_at, kind: 'agendamento',
      title: `Agendamento ${a.status}`,
      sub: fmtDateTime(a.starts_at),
      source: 'agenda',
    }))
    ;(finR.data || []).forEach(f => events.push({
      ts: f.vencimento, kind: 'financeiro',
      title: `${f.tipo === 'receita' ? '↑' : '↓'} ${f.descricao} — ${fmtBRL(Number(f.valor))}`,
      sub: f.status,
      source: 'financeiro',
    }))
    ;(knR.data || []).forEach(k => events.push({
      ts: k.created_at, kind: 'kanban', title: k.title, sub: k.due_date ? `vence ${fmtDateTime(k.due_date)}` : '', source: 'kanban',
    }))
    events.sort((a, b) => new Date(b.ts) - new Date(a.ts))
    setTimeline(events)
    setLoadingTl(false)
  }

  async function addNote() {
    if (!newNote.trim()) return
    const { data, error } = await supabase.from('crm_interactions').insert({
      instancia: instance, contact_id: contact.id, phone: contact.phone,
      tipo: 'nota', conteudo: newNote.trim(),
      autor_nome: session?.user?.name, autor_email: session?.user?.email,
    }).select().single()
    if (error) return showToast(error.message, '#DC2626')
    setTimeline(prev => [{ ts: data.created_at, kind: 'nota', title: data.conteudo, sub: data.autor_nome, source: 'crm', data }, ...prev])
    setNewNote('')
    showToast('Nota adicionada')
  }

  async function setTemperatura(temp) {
    await supabase.from('crm_contacts').update({ temperatura: temp }).eq('id', contact.id)
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, temperatura: temp } : c))
    await supabase.from('crm_interactions').insert({
      instancia: instance, contact_id: contact.id, phone: contact.phone,
      tipo: 'temperatura', conteudo: `Temperatura alterada para ${temp}`,
      autor_nome: session?.user?.name,
    })
    loadPanelData()
  }

  async function setResponsavel(userId) {
    const u = users.find(x => x.id === userId)
    await supabase.from('crm_contacts').update({ responsavel_id: userId || null, responsavel_nome: u?.name || null }).eq('id', contact.id)
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, responsavel_id: userId, responsavel_nome: u?.name || null } : c))
    await supabase.from('crm_interactions').insert({
      instancia: instance, contact_id: contact.id, phone: contact.phone,
      tipo: 'responsavel', conteudo: `Responsável: ${u?.name || 'removido'}`,
      autor_nome: session?.user?.name,
    })
  }

  async function createKanbanTask() {
    const title = prompt('Título da tarefa:')
    if (!title?.trim()) return
    // Acha primeira coluna do kanban
    const { data: cols } = await supabase.from('kanban_columns').select('id').eq('instancia', instance).order('position').limit(1)
    if (!cols?.length) return showToast('Nenhuma coluna no Kanban. Cria primeiro em Atividades.', '#DC2626')
    const { error } = await supabase.from('kanban_cards').insert({
      instancia: instance, column_id: cols[0].id,
      title: title.trim(), crm_contact_id: contact.id,
      assigned_user_id: session?.user?.id, assigned_user_name: session?.user?.name,
    })
    if (error) return showToast(error.message, '#DC2626')
    showToast('Tarefa criada no Kanban')
    loadPanelData()
  }

  const tempo = TEMPERATURAS.find(t => t.value === contact.temperatura)
  const stage = activeStages.find(s => s.id === contact.stage_id)

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, maxWidth: '100vw',
      background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 9998,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.nome || `+${contact.phone}` || 'Sem nome'}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            {stage && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: (stage.cor || '#94A3B8') + '22', color: stage.cor || '#475569' }}>{stage.nome}</span>}
            {tempo && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: tempo.bg, color: tempo.color, display: 'inline-flex', alignItems: 'center', gap: 3 }}><tempo.icon size={9} /> {tempo.label}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
      </div>

      {/* Conteudo scrollavel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Info basica */}
        <div className="nx-card" style={{ padding: 12 }}>
          {contact.phone && <Info icon={Phone} label="Telefone" value={contact.phone} mono />}
          {contact.email && <Info icon={Mail} label="Email" value={contact.email} />}
          {contact.origem && <Info icon={TagIcon} label="Origem" value={contact.origem} />}
          {contact.area_pratica && <Info icon={Scale} label="Área" value={contact.area_pratica} />}
          {contact.processo_numero && <Info icon={FileText} label="Processo" value={contact.processo_numero} mono />}
          {contact.valor_estimado > 0 && <Info icon={Wallet} label="Estimativa" value={fmtBRL(Number(contact.valor_estimado))} color="#16A34A" />}
          <button onClick={() => setContactModal({ ...contact })}
            style={{ width: '100%', marginTop: 8, fontSize: 11, padding: 6, background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Pencil size={11} /> Editar dados
          </button>
        </div>

        {/* Acoes rapidas */}
        <div className="nx-card" style={{ padding: 12 }}>
          <div style={labelStyle}>Temperatura</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {TEMPERATURAS.map(t => {
              const TI = t.icon
              const active = contact.temperatura === t.value
              return (
                <button key={t.value} onClick={() => setTemperatura(t.value)}
                  style={{
                    flex: 1, padding: '6px', border: '1px solid', borderColor: active ? t.color : 'var(--border)',
                    background: active ? t.bg : '#fff', color: active ? t.color : 'var(--text-secondary)',
                    borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                  <TI size={11} /> {t.label}
                </button>
              )
            })}
          </div>
          <div style={{ ...labelStyle, marginTop: 12 }}>Responsável</div>
          <select className="nx-select" value={contact.responsavel_id || ''}
            onChange={e => setResponsavel(e.target.value || null)} style={{ fontSize: 12 }}>
            <option value="">— sem responsável —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {/* Botoes de acao */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {contact.phone && (
            <button onClick={() => navigate(`/painel/conversas?contact=${cleanPhone(contact.phone)}`)}
              className="nx-btn-ghost" style={{ flex: 1, fontSize: 12 }}>
              <MessageSquare size={13} /> Abrir conversa
            </button>
          )}
          <button onClick={createKanbanTask} className="nx-btn-ghost" style={{ flex: 1, fontSize: 12 }}>
            <KanbanIcon size={13} /> Criar tarefa
          </button>
          <button onClick={() => deleteContact(contact)}
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Trash2 size={13} />
          </button>
        </div>

        {/* Nova nota */}
        <div className="nx-card" style={{ padding: 12 }}>
          <div style={labelStyle}>Adicionar nota</div>
          <textarea className="nx-input" rows={2} value={newNote}
            onChange={e => setNewNote(e.target.value)} placeholder="O que aconteceu com esse lead?" />
          <button onClick={addNote} disabled={!newNote.trim()}
            className="nx-btn-primary" style={{ width: '100%', marginTop: 6, fontSize: 12, opacity: newNote.trim() ? 1 : 0.5 }}>
            <Plus size={12} /> Adicionar nota
          </button>
        </div>

        {/* Timeline */}
        <div className="nx-card" style={{ padding: 12 }}>
          <div style={labelStyle}>Timeline ({timeline.length})</div>
          {loadingTl ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Carregando…</div>
          ) : timeline.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sem interações ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {timeline.map((e, i) => <TimelineItem key={i} ev={e} />)}
            </div>
          )}
        </div>
      </div>
    </div>, document.body)
}

const KIND_META = {
  nota:         { icon: FileText,       color: '#7C3AED', bg: '#F5F3FF', label: 'Nota' },
  etapa:        { icon: ChevronRight,   color: '#2563EB', bg: '#EFF6FF', label: 'Etapa' },
  mensagem:     { icon: MessageSquare,  color: '#16A34A', bg: '#F0FDF4', label: 'Mensagem' },
  agendamento:  { icon: Calendar,       color: '#D97706', bg: '#FFFBEB', label: 'Agenda' },
  financeiro:   { icon: Wallet,         color: '#0891B2', bg: '#ECFEFF', label: 'Financeiro' },
  tarefa:       { icon: ListChecks,     color: '#475569', bg: '#F1F5F9', label: 'Tarefa' },
  kanban:       { icon: KanbanIcon,     color: '#475569', bg: '#F1F5F9', label: 'Kanban' },
  temperatura:  { icon: Thermometer,    color: '#DC2626', bg: '#FEF2F2', label: 'Temperatura' },
  responsavel:  { icon: User,           color: '#0891B2', bg: '#ECFEFF', label: 'Responsável' },
  tag:          { icon: TagIcon,        color: '#7C3AED', bg: '#F5F3FF', label: 'Tag' },
}
function TimelineItem({ ev }) {
  const k = KIND_META[ev.kind] || KIND_META.nota
  const Icon = k.icon
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          <span style={{ color: k.color, fontWeight: 700, marginRight: 6 }}>{k.label}</span>
          {ev.sub && <span>· {ev.sub} ·</span>} <span>{fmtRelative(ev.ts)}</span>
        </div>
      </div>
    </div>
  )
}

function Info({ icon: Icon, label, value, mono, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #F8FAFC', fontSize: 13 }}>
      <Icon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>{label}</span>
      <span style={{ flex: 1, fontFamily: mono ? 'monospace' : 'inherit', color: color || 'var(--text-primary)', fontWeight: color ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PHONE INPUT (com dropdown de pais)
// ════════════════════════════════════════════════════════════════════════════
const COUNTRIES = [
  { code: '55',  flag: '🇧🇷', name: 'Brasil' },
  { code: '1',   flag: '🇺🇸', name: 'EUA / Canadá' },
  { code: '351', flag: '🇵🇹', name: 'Portugal' },
  { code: '54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '56',  flag: '🇨🇱', name: 'Chile' },
  { code: '57',  flag: '🇨🇴', name: 'Colômbia' },
  { code: '52',  flag: '🇲🇽', name: 'México' },
  { code: '51',  flag: '🇵🇪', name: 'Peru' },
  { code: '595', flag: '🇵🇾', name: 'Paraguai' },
  { code: '598', flag: '🇺🇾', name: 'Uruguai' },
  { code: '591', flag: '🇧🇴', name: 'Bolívia' },
  { code: '34',  flag: '🇪🇸', name: 'Espanha' },
  { code: '44',  flag: '🇬🇧', name: 'Reino Unido' },
  { code: '33',  flag: '🇫🇷', name: 'França' },
  { code: '49',  flag: '🇩🇪', name: 'Alemanha' },
  { code: '39',  flag: '🇮🇹', name: 'Itália' },
]

function PhoneInput({ value = '', onChange }) {
  // Detecta DDI do valor atual (tenta prefixos do mais longo pro mais curto pra evitar conflito ex: 55 vs 595)
  const detectCountry = (v) => {
    const digits = (v || '').replace(/\D/g, '')
    const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length)
    return sorted.find(c => digits.startsWith(c.code))?.code || '55'
  }
  const [country, setCountry] = useState(() => detectCountry(value))
  const [open, setOpen] = useState(false)

  const digitsOnly = (value || '').replace(/\D/g, '')
  const localNumber = digitsOnly.startsWith(country) ? digitsOnly.slice(country.length) : digitsOnly

  function pickCountry(c) {
    setCountry(c.code)
    setOpen(false)
    const oldDigits = (value || '').replace(/\D/g, '')
    const oldCountry = detectCountry(value)
    const local = oldDigits.startsWith(oldCountry) ? oldDigits.slice(oldCountry.length) : oldDigits
    onChange(c.code + local)
  }

  function onLocalChange(e) {
    const localDigits = e.target.value.replace(/\D/g, '')
    onChange(country + localDigits)
  }

  const selected = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]

  return (
    <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '0 9px', border: '1px solid var(--border)',
          borderRight: 'none', borderRadius: '8px 0 0 8px',
          background: '#F8FAFC', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          flexShrink: 0, color: 'var(--text-primary)',
        }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{selected.flag}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>+{selected.code}</span>
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className="nx-input"
        value={localNumber}
        onChange={onLocalChange}
        onKeyDown={e => {
          // Bloqueia letras e simbolos (deixa passar backspace, setas, tab, ctrl+v etc)
          if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
          }
        }}
        onPaste={e => {
          // Limpa o que colar
          e.preventDefault()
          const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '')
          onChange(country + (localNumber + pasted))
        }}
        placeholder="DDD + número"
        style={{ borderRadius: '0 8px 8px 0', flex: 1, minWidth: 0 }}
      />
      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10000 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            zIndex: 10001, minWidth: 220, maxHeight: 280, overflow: 'auto',
          }}>
            {COUNTRIES.map(c => (
              <button key={c.code} type="button" onClick={() => pickCountry(c)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '8px 12px', border: 'none',
                  background: c.code === country ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 12.5,
                  borderBottom: '1px solid #F1F5F9',
                }}
                onMouseEnter={e => { if (c.code !== country) e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={e => { if (c.code !== country) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: 15 }}>{c.flag}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{c.name}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 11.5 }}>+{c.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAIS
// ════════════════════════════════════════════════════════════════════════════
function ContactModal({ modal, setModal, stages, users, onSave }) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
      <div className="nx-card" style={{ width: '100%', maxWidth: 580, maxHeight: '92vh', overflow: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{modal.id ? 'Editar lead' : 'Novo lead'}</div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setModal(null)}><X size={16} /></button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input className="nx-input" autoFocus value={modal.nome || ''} onChange={e => setModal(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <PhoneInput value={modal.phone || ''} onChange={v => setModal(p => ({ ...p, phone: v }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input className="nx-input" type="email" value={modal.email || ''} onChange={e => setModal(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Origem</label>
              <select className="nx-select" value={modal.origem || ''} onChange={e => setModal(p => ({ ...p, origem: e.target.value }))}>
                <option value="">— —</option>
                {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Etapa</label>
              <select className="nx-select" value={modal.stage_id || ''} onChange={e => setModal(p => ({ ...p, stage_id: e.target.value }))}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Temperatura</label>
              <select className="nx-select" value={modal.temperatura || 'morno'} onChange={e => setModal(p => ({ ...p, temperatura: e.target.value }))}>
                {TEMPERATURAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Área</label>
              <select className="nx-select" value={modal.area_pratica || ''} onChange={e => setModal(p => ({ ...p, area_pratica: e.target.value }))}>
                <option value="">— —</option>
                {AREAS_PRATICA.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Nº processo (CNJ)</label>
              <input className="nx-input" value={modal.processo_numero || ''} onChange={e => setModal(p => ({ ...p, processo_numero: e.target.value }))} placeholder="opcional" />
            </div>
            <div>
              <label style={labelStyle}>Valor estimado (R$)</label>
              <input className="nx-input" type="number" step="0.01" value={modal.valor_estimado || ''} onChange={e => setModal(p => ({ ...p, valor_estimado: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Tags (separadas por vírgula)</label>
            <input className="nx-input" value={(modal.tags || []).join(', ')}
              onChange={e => setModal(p => ({ ...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
              placeholder="vip, urgente" />
          </div>
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea className="nx-input" rows={3} value={modal.observacoes || ''} onChange={e => setModal(p => ({ ...p, observacoes: e.target.value }))} />
          </div>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
          <button className="nx-btn-primary" style={{ flex: 1 }} onClick={() => onSave(modal)}>Salvar</button>
        </div>
      </div>
    </div>, document.body)
}

function StagesModal({ funnel, stages, instance, onClose, onUpdate, showToast }) {
  const [edit, setEdit] = useState(stages.map(s => ({ ...s })))
  const [saving, setSaving] = useState(false)

  function addStage() {
    setEdit(prev => [...prev, {
      id: `_new_${Date.now()}`, _new: true,
      instancia: instance, funil_id: funnel.id,
      nome: 'Nova etapa', cor: '#94A3B8',
      posicao: prev.length, alerta_dias: 7, is_won: false, is_lost: false,
    }])
  }
  function removeStage(i) {
    if (!confirm('Excluir essa etapa? Contatos nela ficam sem etapa.')) return
    setEdit(prev => prev.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    const cur = await supabase.from('crm_stages').select('id').eq('funil_id', funnel.id)
    const curIds = new Set((cur.data || []).map(s => s.id))
    const newIds = new Set(edit.filter(s => !s._new).map(s => s.id))
    const toDelete = [...curIds].filter(id => !newIds.has(id))
    if (toDelete.length) await supabase.from('crm_stages').delete().in('id', toDelete)
    const result = []
    for (let i = 0; i < edit.length; i++) {
      const s = { ...edit[i], posicao: i }
      const payload = {
        funil_id: funnel.id, instancia: instance,
        nome: s.nome.trim(), cor: s.cor || '#94A3B8',
        posicao: i, alerta_dias: parseInt(s.alerta_dias) || 7,
        is_won: !!s.is_won, is_lost: !!s.is_lost,
      }
      if (s._new) {
        const { data } = await supabase.from('crm_stages').insert(payload).select().single()
        if (data) result.push(data)
      } else {
        const { data } = await supabase.from('crm_stages').update(payload).eq('id', s.id).select().single()
        if (data) result.push(data)
      }
    }
    onUpdate(result)
    setSaving(false)
    onClose()
    showToast('Etapas salvas')
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
      <div className="nx-card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Editar etapas — {funnel.nome}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '1rem 1.5rem', flex: 1, overflowY: 'auto' }}>
          {edit.map((s, i) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 70px 90px auto auto auto', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
              <input value={s.nome} onChange={e => setEdit(prev => prev.map((x, idx) => idx === i ? { ...x, nome: e.target.value } : x))}
                className="nx-input" style={{ fontSize: 12 }} />
              <input type="color" value={s.cor || '#94A3B8'} onChange={e => setEdit(prev => prev.map((x, idx) => idx === i ? { ...x, cor: e.target.value } : x))}
                style={{ width: '100%', height: 32, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
              <input type="number" value={s.alerta_dias || 7} title="Dias até alerta"
                onChange={e => setEdit(prev => prev.map((x, idx) => idx === i ? { ...x, alerta_dias: e.target.value } : x))}
                className="nx-input" style={{ fontSize: 12 }} />
              <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: '#15803D' }}>
                <input type="checkbox" checked={!!s.is_won} onChange={e => setEdit(prev => prev.map((x, idx) => idx === i ? { ...x, is_won: e.target.checked, is_lost: false } : x))} /> Ganho
              </label>
              <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: '#B91C1C' }}>
                <input type="checkbox" checked={!!s.is_lost} onChange={e => setEdit(prev => prev.map((x, idx) => idx === i ? { ...x, is_lost: e.target.checked, is_won: false } : x))} /> Perdido
              </label>
              <button onClick={() => removeStage(i)} style={{ background: 'none', border: '1px solid #FECACA', borderRadius: 4, color: '#DC2626', cursor: 'pointer', padding: 4 }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <button onClick={addStage} className="nx-btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: 12 }}>
            <Plus size={12} /> Adicionar etapa
          </button>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="nx-btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar etapas'}
          </button>
        </div>
      </div>
    </div>, document.body)
}

function ListaModal({ modal, setModal, stages, onSave }) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
      <div className="nx-card" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{modal.id ? 'Editar lista' : 'Nova lista dinâmica'}</div>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Nome da lista</label>
            <input className="nx-input" autoFocus value={modal.nome || ''} onChange={e => setModal(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Leads quentes do mês" />
          </div>
          <div>
            <label style={labelStyle}>Cor</label>
            <input type="color" value={modal.cor || '#2563EB'} onChange={e => setModal(p => ({ ...p, cor: e.target.value }))} style={{ width: 60, height: 30, border: '1px solid var(--border)', borderRadius: 4 }} />
          </div>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Filtros</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Temperatura</label>
                <select className="nx-select" value={modal.filtros?.temperatura || ''} onChange={e => setModal(p => ({ ...p, filtros: { ...p.filtros, temperatura: e.target.value || undefined } }))}>
                  <option value="">— —</option>
                  {TEMPERATURAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Etapa</label>
                <select className="nx-select" value={modal.filtros?.stage_id || ''} onChange={e => setModal(p => ({ ...p, filtros: { ...p.filtros, stage_id: e.target.value || undefined } }))}>
                  <option value="">— —</option>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Origem</label>
                <select className="nx-select" value={modal.filtros?.origem || ''} onChange={e => setModal(p => ({ ...p, filtros: { ...p.filtros, origem: e.target.value || undefined } }))}>
                  <option value="">— —</option>
                  {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Área de prática</label>
                <select className="nx-select" value={modal.filtros?.area_pratica || ''} onChange={e => setModal(p => ({ ...p, filtros: { ...p.filtros, area_pratica: e.target.value || undefined } }))}>
                  <option value="">— —</option>
                  {AREAS_PRATICA.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tag</label>
                <input className="nx-input" value={modal.filtros?.tag || ''} onChange={e => setModal(p => ({ ...p, filtros: { ...p.filtros, tag: e.target.value || undefined } }))} placeholder="vip" />
              </div>
              <div>
                <label style={labelStyle}>Mínimo de dias na etapa</label>
                <input className="nx-input" type="number" value={modal.filtros?.dias_min ?? ''} onChange={e => setModal(p => ({ ...p, filtros: { ...p.filtros, dias_min: e.target.value ? Number(e.target.value) : undefined } }))} placeholder="ex: 7" />
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
          <button className="nx-btn-primary" style={{ flex: 1 }} onClick={() => onSave(modal)}>Salvar</button>
        </div>
      </div>
    </div>, document.body)
}

const th = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td = { padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }
