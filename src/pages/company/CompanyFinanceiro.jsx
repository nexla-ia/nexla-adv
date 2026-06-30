import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Wallet, Plus, X, Trash2, Pencil, Calendar, FileText, Clock,
  TrendingUp, ArrowUpCircle, ArrowDownCircle, AlertCircle, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronDown, PieChart as PieIcon, BarChart3,
  FileBarChart, Scale, Repeat,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ComposedChart, Bar, Line, BarChart, PieChart, Pie, Cell,
} from 'recharts'

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (typeof n === 'number' ? n : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtCompact = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1000) return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k'
  return fmt(v)
}
const fmtDate = (d) => {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')) : d
  return dt.toLocaleDateString('pt-BR')
}
const todayISO = () => new Date().toISOString().slice(0, 10)
const monthKey = (d) => (d || '').slice(0, 7)
const addMonthsISO = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}
const monthLabel = (key) => {
  const [y, m] = key.split('-')
  const names = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${names[parseInt(m) - 1]}/${y.slice(2)}`
}
const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }

const FORMAS_PAGAMENTO = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Boleto', 'Convênio', 'Transferência', 'Cheque']
const STATUS_COLORS = {
  pendente:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Pendente' },
  pago:      { bg: '#F0FDF4', color: '#15803D', label: 'Pago' },
  cancelado: { bg: '#F1F5F9', color: '#64748B', label: 'Cancelado' },
}
const COR_RECEITA = '#16A34A'
const COR_DESPESA = '#DC2626'
const COR_SALDO_POS = '#2563EB'
const COR_SALDO_NEG = '#DC2626'

// Mascara CNJ: 20 dígitos → 0000000-00.0000.0.00.0000
function formatCNJ(raw) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 20)
  let out = d
  if (d.length > 7)  out = `${d.slice(0,7)}-${d.slice(7)}`
  if (d.length > 9)  out = `${d.slice(0,7)}-${d.slice(7,9)}.${d.slice(9)}`
  if (d.length > 13) out = `${d.slice(0,7)}-${d.slice(7,9)}.${d.slice(9,13)}.${d.slice(13)}`
  if (d.length > 14) out = `${d.slice(0,7)}-${d.slice(7,9)}.${d.slice(9,13)}.${d.slice(13,14)}.${d.slice(14)}`
  if (d.length > 16) out = `${d.slice(0,7)}-${d.slice(7,9)}.${d.slice(9,13)}.${d.slice(13,14)}.${d.slice(14,16)}.${d.slice(16)}`
  return out
}

// MoneyInput: digita só dígitos → centavos primeiro
function MoneyInput({ value, onChange, autoFocus, placeholder = 'R$ 0,00', style }) {
  const cents = Math.round(Number(value || 0) * 100)
  const display = (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return (
    <input
      className="nx-input" type="text" inputMode="numeric"
      autoFocus={autoFocus} placeholder={placeholder}
      value={cents === 0 ? '' : display}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '')
        const num = digits ? Number(digits) / 100 : 0
        onChange(num)
      }}
      style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...style }}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function CompanyFinanceiro() {
  const { session } = useAuth()
  const instance = session?.company?.instance
  const isAdmin = session?.user?.role === 'admin'
  const modules = session?.company?.modules || {}
  const moduleEnabled = modules.financeiro !== false
  const [tab, setTab] = useState('visao')
  const [loading, setLoading] = useState(true)
  const [categorias, setCategorias] = useState([])
  const [transactions, setTransactions] = useState([])
  const [crmContatos, setCrmContatos] = useState([]) // pra autocomplete de cliente no modal
  const [modal, setModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null) // { t, groupSize, groupKey, groupType }
  const [toast, setToast] = useState(null)

  function showToast(msg, color = '#16A34A') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    if (!instance) return
    setLoading(true)
    Promise.all([
      supabase.from('financial_categories').select('*').or(`instancia.eq.${instance},instancia.eq._default_`).order('nome'),
      supabase.from('financial_transactions').select('*').eq('instancia', instance).order('vencimento', { ascending: false }).limit(5000),
      supabase.from('crm_contacts').select('nome, phone, email').eq('instancia', instance).order('nome').limit(2000),
    ]).then(([c, t, ct]) => {
      if (c.data) setCategorias(c.data)
      if (t.data) setTransactions(t.data)
      if (ct.data) setCrmContatos(ct.data)
      setLoading(false)
    })
  }, [instance])

  if (!isAdmin) return <Blocked icon={Wallet} msg="Módulo Financeiro disponível apenas pra administradores." />
  if (!moduleEnabled) return <Blocked icon={Wallet} msg="Módulo Financeiro desativado pra essa empresa. Contate o suporte pra liberar." />

  function openNew(tipo = 'receita') {
    setModal({
      id: null, tipo, descricao: '', valor: 0, vencimento: todayISO(),
      categoria_id: '', forma_pagamento: '', contato_nome: '', centro_custo: '',
      processo_numero: '', parcela_total: 1, recorrente: false,
      recorrencia_meses: 12, status: 'pendente', observacoes: '',
    })
  }
  function openEdit(t) {
    setModal({ ...t, valor: Number(t.valor) || 0 })
  }

  async function handleSave(m) {
    if (!m.descricao?.trim()) return showToast('Descrição obrigatória', '#DC2626')
    if (!m.valor || m.valor <= 0) return showToast('Valor inválido', '#DC2626')
    if (!m.vencimento) return showToast('Vencimento obrigatório', '#DC2626')

    const base = {
      instancia: instance, tipo: m.tipo,
      descricao: m.descricao.trim(),
      valor: Number(m.valor),
      vencimento: m.vencimento,
      categoria_id: m.categoria_id || null,
      forma_pagamento: m.forma_pagamento || null,
      contato_nome: m.contato_nome?.trim() || null,
      centro_custo: m.centro_custo?.trim() || null,
      processo_numero: m.processo_numero?.trim() || null,
      status: m.status || 'pendente',
      pago_em: m.status === 'pago' ? (m.pago_em || todayISO()) : null,
      observacoes: m.observacoes?.trim() || null,
      criado_por_email: session?.user?.email,
    }

    if (m.id) {
      const { data, error } = await supabase.from('financial_transactions').update(base).eq('id', m.id).select().single()
      if (error) return showToast(error.message, '#DC2626')
      setTransactions(prev => prev.map(t => t.id === data.id ? data : t))
      showToast('Atualizado')
      setModal(null)
      return
    }

    const parcelaTotal = Math.max(1, parseInt(m.parcela_total) || 1)
    if (parcelaTotal > 1 && !m.recorrente) {
      const grupoParc = crypto.randomUUID()
      const rows = []
      const valorParc = Number(m.valor) / parcelaTotal
      for (let i = 1; i <= parcelaTotal; i++) {
        rows.push({
          ...base, valor: valorParc,
          vencimento: addMonthsISO(base.vencimento, i - 1),
          descricao: `${base.descricao} (${i}/${parcelaTotal})`,
          grupo_parcelas: grupoParc, parcela_num: i, parcela_total: parcelaTotal,
        })
      }
      const { data, error } = await supabase.from('financial_transactions').insert(rows).select()
      if (error) return showToast(error.message, '#DC2626')
      setTransactions(prev => [...(data || []), ...prev])
      showToast(`${parcelaTotal} parcelas criadas`)
      setModal(null)
      return
    }

    if (m.recorrente) {
      const grupoRec = crypto.randomUUID()
      const meses = Math.max(1, parseInt(m.recorrencia_meses) || 12)
      const rows = []
      for (let i = 0; i < meses; i++) {
        rows.push({
          ...base, vencimento: addMonthsISO(base.vencimento, i),
          recorrente: true, recorrencia_tipo: 'mensal', grupo_recorrencia: grupoRec,
        })
      }
      const { data, error } = await supabase.from('financial_transactions').insert(rows).select()
      if (error) return showToast(error.message, '#DC2626')
      setTransactions(prev => [...(data || []), ...prev])
      showToast(`${meses} lançamentos recorrentes criados`)
      setModal(null)
      return
    }

    const { data, error } = await supabase.from('financial_transactions').insert(base).select().single()
    if (error) return showToast(error.message, '#DC2626')
    setTransactions(prev => [data, ...prev])
    showToast('Lançamento criado')
    setModal(null)
  }

  async function markPago(t) {
    const { data, error } = await supabase.from('financial_transactions')
      .update({ status: 'pago', pago_em: todayISO() }).eq('id', t.id).select().single()
    if (error) return showToast(error.message, '#DC2626')
    setTransactions(prev => prev.map(x => x.id === data.id ? data : x))
    showToast(t.tipo === 'receita' ? 'Recebido' : 'Pago')
  }

  function handleDelete(t) {
    // Se faz parte de uma serie (parcelado ou recorrente), oferece escolha
    if (t.grupo_recorrencia) {
      const irmaos = transactions.filter(x => x.grupo_recorrencia === t.grupo_recorrencia)
      setDeleteModal({ t, groupKey: 'grupo_recorrencia', groupId: t.grupo_recorrencia, groupSize: irmaos.length, groupType: 'recorrente' })
      return
    }
    if (t.grupo_parcelas) {
      const irmaos = transactions.filter(x => x.grupo_parcelas === t.grupo_parcelas)
      setDeleteModal({ t, groupKey: 'grupo_parcelas', groupId: t.grupo_parcelas, groupSize: irmaos.length, groupType: 'parcelas' })
      return
    }
    // Sem grupo: confirm simples
    if (!confirm('Excluir esse lançamento?')) return
    deleteSingle(t)
  }
  async function deleteSingle(t) {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', t.id)
    if (error) return showToast('Erro: ' + error.message, '#DC2626')
    setTransactions(prev => prev.filter(x => x.id !== t.id))
    showToast('Excluído')
    setDeleteModal(null)
  }
  async function deleteGroup(groupKey, groupId) {
    const { error } = await supabase.from('financial_transactions').delete().eq(groupKey, groupId)
    if (error) return showToast('Erro: ' + error.message, '#DC2626')
    setTransactions(prev => prev.filter(x => x[groupKey] !== groupId))
    showToast('Série excluída')
    setDeleteModal(null)
  }

  const mesAtual = monthKey(todayISO())
  const resumo = useMemo(() => {
    let aReceber = 0, aPagar = 0, recebido = 0, pago = 0
    transactions.forEach(t => {
      if (monthKey(t.vencimento) !== mesAtual) return
      if (t.status === 'cancelado') return
      const v = Number(t.valor || 0)
      if (t.tipo === 'receita') {
        if (t.status === 'pago') recebido += v
        else aReceber += v
      } else {
        if (t.status === 'pago') pago += v
        else aPagar += v
      }
    })
    return { aReceber, aPagar, recebido, pago, saldo: recebido - pago }
  }, [transactions, mesAtual])

  const sharedProps = { instance, session, categorias, transactions, setTransactions, showToast, openEdit, markPago, handleDelete }

  // Contadores de pendentes pra mostrar badge nas tabs
  const pendingReceitas = transactions.filter(t => t.tipo === 'receita' && t.status === 'pendente').length
  const pendingDespesas = transactions.filter(t => t.tipo === 'despesa' && t.status === 'pendente').length

  const TABS = [
    { id: 'visao',         label: 'Visão Geral',   icon: BarChart3,       color: '#0F172A' },
    { id: 'a-receber',     label: 'A Receber',     icon: ArrowUpCircle,   color: COR_RECEITA, count: pendingReceitas },
    { id: 'a-pagar',       label: 'A Pagar',       icon: ArrowDownCircle, color: COR_DESPESA, count: pendingDespesas },
    { id: 'fluxo',         label: 'Fluxo de Caixa',icon: TrendingUp,      color: '#2563EB' },
    { id: 'dre',           label: 'DRE',           icon: FileBarChart,    color: '#7C3AED' },
    { id: 'inadimplencia', label: 'Inadimplência', icon: AlertCircle,     color: '#D97706' },
    { id: 'por-categoria', label: 'Por Categoria', icon: PieIcon,         color: '#0891B2' },
  ]

  return (
    <div style={{ padding: '1.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#16A34A22', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={18} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>Financeiro</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {transactions.filter(t => monthKey(t.vencimento) === mesAtual).length} lançamentos · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())}
            </div>
          </div>
        </div>
        <button onClick={() => openNew('receita')} className="nx-btn-primary" style={{ fontSize: 12 }}>
          <Plus size={13} /> Novo lançamento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
        <KPI title="A receber (mês)" value={resumo.aReceber} color={COR_RECEITA} icon={ArrowUpCircle} />
        <KPI title="A pagar (mês)"   value={resumo.aPagar}   color={COR_DESPESA} icon={ArrowDownCircle} />
        <KPI title="Recebido"        value={resumo.recebido} color="#15803D" icon={CheckCircle2} />
        <KPI title="Saldo do mês"    value={resumo.saldo}    color={resumo.saldo >= 0 ? COR_SALDO_POS : COR_SALDO_NEG} icon={TrendingUp} />
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: active ? '2px solid #0F172A' : '2px solid transparent',
                display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}>
              {t.id === 'visao' && <Icon size={12} />}
              {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando…</div>
      ) : (
        <>
          {tab === 'visao' && <TabVisaoGeral {...sharedProps} setTab={setTab} openNew={openNew} />}
          {tab === 'a-receber' && <TabLista tipo="receita" {...sharedProps} />}
          {tab === 'a-pagar' && <TabLista tipo="despesa" {...sharedProps} />}
          {tab === 'fluxo' && <TabFluxo {...sharedProps} />}
          {tab === 'dre' && <TabDRE {...sharedProps} />}
          {tab === 'inadimplencia' && <TabInadimplencia {...sharedProps} />}
          {tab === 'por-categoria' && <TabPorCategoria {...sharedProps} />}
        </>
      )}

      {modal && <ModalLancamento modal={modal} setModal={setModal} categorias={categorias} onSave={handleSave}
        clientes={(() => {
          // Combina nomes unicos de transactions + crm_contacts (case-insensitive dedup)
          const seen = new Map()
          for (const t of transactions) {
            if (t.contato_nome?.trim()) {
              const k = t.contato_nome.trim().toLowerCase()
              if (!seen.has(k)) seen.set(k, { nome: t.contato_nome.trim(), source: 'fin' })
            }
          }
          for (const c of crmContatos) {
            if (c.nome?.trim()) {
              const k = c.nome.trim().toLowerCase()
              if (!seen.has(k)) seen.set(k, { nome: c.nome.trim(), source: 'crm', phone: c.phone })
            }
          }
          return [...seen.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        })()}
      />}

      {deleteModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Excluir {deleteModal.groupType === 'parcelas' ? 'parcela' : 'ocorrência'}?
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {deleteModal.t.descricao} · {fmtDate(deleteModal.t.vencimento)}
                </div>
              </div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', fontSize: 13, color: 'var(--text-secondary)' }}>
              Esse lançamento faz parte de uma <strong>série {deleteModal.groupType === 'parcelas' ? 'parcelada' : 'recorrente'}</strong> com <strong>{deleteModal.groupSize}</strong> {deleteModal.groupType === 'parcelas' ? 'parcelas' : 'ocorrências'} no total. O que você quer fazer?
            </div>
            <div style={{ padding: '0 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => deleteSingle(deleteModal.t)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Só essa</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Apaga só este lançamento, mantém o resto da série.</div>
                </div>
                <ChevronRight size={16} style={{ color: '#94A3B8' }} />
              </button>
              <button onClick={() => deleteGroup(deleteModal.groupKey, deleteModal.groupId)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>Toda a série ({deleteModal.groupSize})</div>
                  <div style={{ fontSize: 11, color: '#DC2626' }}>Apaga essa e todas as outras {deleteModal.groupType === 'parcelas' ? 'parcelas' : 'ocorrências'} de uma vez.</div>
                </div>
                <ChevronRight size={16} style={{ color: '#DC2626' }} />
              </button>
            </div>
            <div style={{ padding: '0 1.5rem 1.25rem' }}>
              <button className="nx-btn-ghost" style={{ width: '100%' }} onClick={() => setDeleteModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>, document.body)}

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
// TAB: VISÃO GERAL
// ════════════════════════════════════════════════════════════════════════════
function TabVisaoGeral({ transactions, categorias, setTab, openNew }) {
  const mesAtual = monthKey(todayISO())
  const ano = new Date().getFullYear()

  // YTD totals
  const ytd = useMemo(() => {
    let r = 0, d = 0
    transactions.forEach(t => {
      if (t.status === 'cancelado') return
      if (!t.vencimento?.startsWith(String(ano))) return
      const v = Number(t.valor || 0)
      if (t.tipo === 'receita') r += v; else d += v
    })
    return { r, d, res: r - d }
  }, [transactions, ano])

  // Inadimplência (receita pendente vencida)
  const inadimp = useMemo(() => {
    const today = todayISO()
    return transactions
      .filter(t => t.tipo === 'receita' && t.status === 'pendente' && t.vencimento < today)
      .reduce((s, t) => s + Number(t.valor || 0), 0)
  }, [transactions])

  // Mês atual
  const mes = useMemo(() => {
    let aR = 0, aP = 0
    transactions.forEach(t => {
      if (monthKey(t.vencimento) !== mesAtual) return
      if (t.status !== 'pendente') return
      const v = Number(t.valor || 0)
      if (t.tipo === 'receita') aR += v; else aP += v
    })
    return { aR, aP }
  }, [transactions, mesAtual])

  // 6 meses pro chart
  const chart6m = useMemo(() => {
    const today = todayISO()
    const arr = []
    for (let i = -5; i <= 0; i++) {
      const mk = monthKey(addMonthsISO(today, i))
      let r = 0, d = 0, rR = 0, dR = 0
      transactions.forEach(t => {
        if (monthKey(t.vencimento) !== mk) return
        if (t.status === 'cancelado') return
        const v = Number(t.valor || 0)
        if (t.tipo === 'receita') { r += v; if (t.status === 'pago') rR += v }
        else { d += v; if (t.status === 'pago') dR += v }
      })
      arr.push({ mes: mk, mesLabel: monthLabel(mk), receita: r, despesa: d, saldoReal: rR - dR })
    }
    return arr
  }, [transactions])

  // Receitas por categoria (mês atual)
  const recByCat = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      if (t.tipo !== 'receita') return
      if (t.status === 'cancelado') return
      if (monthKey(t.vencimento) !== mesAtual) return
      const cat = categorias.find(c => c.id === t.categoria_id)
      const k = cat?.id || '_sem_'
      if (!map[k]) map[k] = { nome: cat?.nome || 'Sem categoria', cor: cat?.cor || '#94A3B8', total: 0 }
      map[k].total += Number(t.valor || 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [transactions, categorias, mesAtual])
  const recTotal = recByCat.reduce((s, c) => s + c.total, 0)

  // Top clientes do mês (receitas pagas)
  const topClientes = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      if (t.tipo !== 'receita' || t.status !== 'pago') return
      if (monthKey(t.vencimento) !== mesAtual) return
      const k = t.contato_nome || 'Sem cliente'
      map[k] = (map[k] || 0) + Number(t.valor || 0)
    })
    return Object.entries(map).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [transactions, mesAtual])

  const KPI_YTD = [
    { label: 'Receita YTD',    value: ytd.r,   color: COR_RECEITA, bg: '#F0FDF4', icon: TrendingUp },
    { label: 'Despesa YTD',    value: ytd.d,   color: COR_DESPESA, bg: '#FEF2F2', icon: ArrowDownCircle },
    { label: 'Resultado YTD',  value: ytd.res, color: ytd.res >= 0 ? COR_SALDO_POS : COR_DESPESA, bg: ytd.res >= 0 ? '#EFF6FF' : '#FEF2F2', icon: Wallet },
    { label: 'Inadimplência',  value: inadimp, color: '#D97706', bg: '#FFFBEB', icon: AlertCircle },
    { label: 'A Receber mês',  value: mes.aR,  color: COR_RECEITA, bg: '#F0FDF4', icon: ArrowUpCircle },
    { label: 'A Pagar mês',    value: mes.aP,  color: COR_DESPESA, bg: '#FEF2F2', icon: ArrowDownCircle },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 6 KPIs em pastels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {KPI_YTD.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{
              background: k.bg, border: `1px solid ${k.color}22`,
              borderRadius: 12, padding: '12px 14px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                <Icon size={12} /> {k.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color, fontFamily: 'var(--font-display)' }}>{fmt(k.value)}</div>
            </div>
          )
        })}
      </div>

      {/* Chart 6 meses Receita x Despesa */}
      <div className="nx-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Receita × Despesa</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Últimos 6 meses · previsto e realizado</div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: COR_RECEITA, borderRadius: 2 }} /> Receita</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: COR_DESPESA, borderRadius: 2 }} /> Despesa</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#2563EB', borderRadius: 2 }} /> Saldo real</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chart6m}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="receita" fill={COR_RECEITA} radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" fill={COR_DESPESA} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="saldoReal" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Categoria + Top clientes lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
        <div className="nx-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Receitas por categoria</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())}
          </div>
          {recByCat.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sem receitas este mês.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'center' }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={recByCat} dataKey="total" nameKey="nome" cx="50%" cy="50%" innerRadius={32} outerRadius={56} paddingAngle={2}>
                    {recByCat.map((d, i) => <Cell key={i} fill={d.cor} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recByCat.map(c => {
                  const pct = recTotal > 0 ? (c.total / recTotal) * 100 : 0
                  return (
                    <div key={c.nome}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c.cor }} />
                          <span style={{ fontWeight: 600 }}>{c.nome}</span>
                        </span>
                        <span style={{ fontWeight: 700, color: c.cor }}>{fmt(c.total)} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 10 }}>{pct.toFixed(0)}%</span></span>
                      </div>
                      <div style={{ height: 3, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: c.cor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="nx-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Top clientes · receita</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())}
          </div>
          {topClientes.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sem receitas pagas este mês.</div>
          ) : topClientes.map((c, i) => (
            <div key={c.nome} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i === topClientes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#16A34A' : '#F1F5F9', color: i === 0 ? '#fff' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
              <span style={{ fontWeight: 700, color: COR_RECEITA, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.total)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Acoes rapidas — pills coloridas */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ActionPill label="+ Nova receita" color={COR_RECEITA} bg="#F0FDF4" onClick={() => openNew('receita')} />
        <ActionPill label="+ Nova despesa" color={COR_DESPESA} bg="#FEF2F2" onClick={() => openNew('despesa')} />
        <ActionPill label="Fluxo de caixa" color="#2563EB" bg="#EFF6FF" onClick={() => setTab('fluxo')} />
        <ActionPill label="DRE" color="#7C3AED" bg="#F5F3FF" onClick={() => setTab('dre')} />
        <ActionPill label="Inadimplência" color="#D97706" bg="#FFFBEB" onClick={() => setTab('inadimplencia')} />
      </div>
    </div>
  )
}

// Pill de filtro: visual de chip claro com texto + chevron, esconde o <select> nativo por cima
const hiddenSelect = {
  position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%',
}
function FilterPill({ icon: Icon, value, children }) {
  return (
    <div style={{
      position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
      padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)',
      cursor: 'pointer', height: 36,
    }}>
      {Icon && <Icon size={12} style={{ color: 'var(--text-muted)' }} />}
      <span>{value}</span>
      <ChevronDown size={11} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
      {children}
    </div>
  )
}

function ActionPill({ label, color, bg, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        background: bg, color, border: `1px solid ${color}33`,
        borderRadius: 999, padding: '8px 18px', fontSize: 12, fontWeight: 700,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color }}>
      {label}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: A RECEBER / A PAGAR
// ════════════════════════════════════════════════════════════════════════════
function TabLista({ tipo, transactions, categorias, openEdit, markPago, handleDelete }) {
  // Default "Todos meses" + "Pendente" pra mostrar de cara tudo que ainda precisa ser quitado
  const [filter, setFilter] = useState({ mes: '', status: 'pendente', forma: '', search: '' })

  const filtered = useMemo(() => transactions.filter(t => {
    if (t.tipo !== tipo) return false
    if (filter.mes && monthKey(t.vencimento) !== filter.mes) return false
    if (filter.status !== 'todos' && t.status !== filter.status) return false
    if (filter.forma && t.forma_pagamento !== filter.forma) return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (!t.descricao?.toLowerCase().includes(q)
        && !t.contato_nome?.toLowerCase().includes(q)
        && !t.processo_numero?.toLowerCase().includes(q)) return false
    }
    return true
  }).sort((a, b) => a.vencimento.localeCompare(b.vencimento)), [transactions, tipo, filter])

  const monthsAvail = useMemo(() => {
    const set = new Set()
    transactions.forEach(t => set.add(monthKey(t.vencimento)))
    set.add(monthKey(todayISO()))
    return Array.from(set).sort().reverse()
  }, [transactions])

  const catMap = useMemo(() => Object.fromEntries(categorias.map(c => [c.id, c])), [categorias])
  const totalFilt = filtered.reduce((s, t) => s + Number(t.valor || 0), 0)
  const corPrincipal = tipo === 'receita' ? COR_RECEITA : COR_DESPESA

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filter pills + search + Novo lancamento */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterPill icon={Calendar} value={filter.mes ? monthLabel(filter.mes) : 'Todos meses'}>
          <select value={filter.mes} onChange={e => setFilter(p => ({ ...p, mes: e.target.value }))} style={hiddenSelect}>
            <option value="">Todos meses</option>
            {monthsAvail.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </FilterPill>
        <FilterPill value={filter.status === 'todos' ? 'Todos status' : (filter.status === 'pago' ? (tipo === 'receita' ? 'Recebido' : 'Pago') : filter.status.charAt(0).toUpperCase() + filter.status.slice(1))}>
          <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))} style={hiddenSelect}>
            <option value="todos">Todos status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">{tipo === 'receita' ? 'Recebido' : 'Pago'}</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </FilterPill>
        <FilterPill value={filter.forma || 'Todas formas'}>
          <select value={filter.forma} onChange={e => setFilter(p => ({ ...p, forma: e.target.value }))} style={hiddenSelect}>
            <option value="">Todas formas</option>
            {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </FilterPill>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>🔍</span>
          <input
            placeholder="Buscar descrição ou paciente..."
            value={filter.search} onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
            style={{
              width: '100%', height: 36, paddingLeft: 32, paddingRight: 12,
              borderRadius: 8, border: '1px solid var(--border)', background: '#fff',
              fontSize: 12, outline: 'none',
            }} />
        </div>
      </div>

      {/* Lista de lancamentos — estilo row card ao inves de table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div className="nx-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum lançamento neste filtro.</div>
        ) : filtered.map(t => {
          const cat = catMap[t.categoria_id]
          const vencido = t.status === 'pendente' && t.vencimento < todayISO()
          // Bolinha colorida: verde p/ receita, vermelha p/ despesa
          const dotColor = t.tipo === 'receita' ? COR_RECEITA : COR_DESPESA
          return (
            <div key={t.id} className="nx-card"
              style={{
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                background: vencido ? '#FFF7ED' : '#fff',
                borderLeft: vencido ? '3px solid #D97706' : undefined,
              }}>
              {/* Bolinha colorida */}
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: dotColor, flexShrink: 0,
              }} />

              {/* Descricao + tags inline */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {t.descricao}
                  {(t.recorrente || t.grupo_recorrencia) && (
                    <span title="Recorrente" style={{ fontSize: 9, color: '#7C3AED', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <Repeat size={9}/>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {t.contato_nome && <span>{t.contato_nome}</span>}
                  {cat && <>
                    {t.contato_nome && <span style={{ opacity: 0.5 }}>•</span>}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: cat.cor || '#475569', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.cor || '#94A3B8' }} />
                      {cat.nome}
                    </span>
                  </>}
                  {t.centro_custo && <>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>{t.centro_custo}</span>
                  </>}
                  {t.forma_pagamento && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', marginLeft: 2 }}>
                      {t.forma_pagamento.toUpperCase()}
                    </span>
                  )}
                  {t.processo_numero && <>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Scale size={9} /> {t.processo_numero}
                    </span>
                  </>}
                </div>
              </div>

              {/* Data + parcela */}
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                <div style={{ fontSize: 12, color: vencido ? '#D97706' : 'var(--text-secondary)', fontWeight: vencido ? 700 : 500 }}>
                  {fmtDate(t.vencimento)}
                </div>
                {t.parcela_total > 1 && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {t.parcela_num}/{t.parcela_total}
                  </div>
                )}
                {vencido && (
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#D97706', marginTop: 2 }}>VENCIDO</div>
                )}
              </div>

              {/* Valor */}
              <div style={{ fontWeight: 700, color: corPrincipal, fontSize: 14, minWidth: 90, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(Number(t.valor))}
              </div>

              {/* Status badge */}
              <div style={{ minWidth: 86, textAlign: 'center' }}>
                <StatusBadge status={t.status} tipo={t.tipo} />
              </div>

              {/* Acoes em pilulas coloridas */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {t.status === 'pendente' && (
                  <button onClick={() => markPago(t)} title={tipo === 'receita' ? 'Marcar como recebido' : 'Marcar como pago'}
                    style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ✓
                  </button>
                )}
                <button onClick={() => openEdit(t)} title="Editar"
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#2563EB', display: 'inline-flex' }}>
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleDelete(t)} title="Excluir"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#DC2626', display: 'inline-flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: FLUXO DE CAIXA
// ════════════════════════════════════════════════════════════════════════════
function TabFluxo({ transactions }) {
  const data = useMemo(() => {
    const today = todayISO()
    const meses = []
    for (let i = -6; i <= 3; i++) meses.push(monthKey(addMonthsISO(today, i)))
    return meses.map(mes => {
      let receitaPrev = 0, despesaPrev = 0, receitaReal = 0, despesaReal = 0
      transactions.forEach(t => {
        if (monthKey(t.vencimento) !== mes) return
        if (t.status === 'cancelado') return
        const v = Number(t.valor || 0)
        if (t.tipo === 'receita') { receitaPrev += v; if (t.status === 'pago') receitaReal += v }
        else { despesaPrev += v; if (t.status === 'pago') despesaReal += v }
      })
      return {
        mes, mesLabel: monthLabel(mes),
        receitaPrev, despesaPrev, saldoPrev: receitaPrev - despesaPrev,
        receitaReal, despesaReal, saldoReal: receitaReal - despesaReal,
        isAtual: mes === monthKey(todayISO()),
      }
    })
  }, [transactions])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="nx-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TrendingUp size={16} style={{ color: '#2563EB' }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Fluxo de caixa — 10 meses</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>6 passados · atual · 3 futuros</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="receitaPrev" name="Receita prevista" stroke={COR_RECEITA} fill={COR_RECEITA} fillOpacity={0.15} />
            <Area type="monotone" dataKey="despesaPrev" name="Despesa prevista" stroke={COR_DESPESA} fill={COR_DESPESA} fillOpacity={0.15} />
            <Area type="monotone" dataKey="saldoPrev" name="Saldo previsto" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="nx-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#F8FAFC' }}>
            <tr>
              <th style={th}>Mês</th>
              <th style={th}>Rec. Prevista</th>
              <th style={th}>Desp. Prevista</th>
              <th style={th}>Saldo Previsto</th>
              <th style={th}>Rec. Recebida</th>
              <th style={th}>Desp. Paga</th>
              <th style={th}>Saldo Real</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.mes} style={{ borderBottom: '1px solid #F1F5F9', background: d.isAtual ? '#EFF6FF' : 'transparent' }}>
                <td style={{ ...td, fontWeight: d.isAtual ? 700 : 600, color: d.isAtual ? '#2563EB' : 'inherit' }}>{d.mesLabel}{d.isAtual ? ' · atual' : ''}</td>
                <td style={{ ...td, color: COR_RECEITA }}>{fmt(d.receitaPrev)}</td>
                <td style={{ ...td, color: COR_DESPESA }}>{fmt(d.despesaPrev)}</td>
                <td style={{ ...td, fontWeight: 700, color: d.saldoPrev >= 0 ? COR_SALDO_POS : COR_SALDO_NEG }}>{fmt(d.saldoPrev)}</td>
                <td style={{ ...td, color: '#15803D' }}>{fmt(d.receitaReal)}</td>
                <td style={{ ...td, color: '#B91C1C' }}>{fmt(d.despesaReal)}</td>
                <td style={{ ...td, fontWeight: 700, color: d.saldoReal >= 0 ? COR_SALDO_POS : COR_SALDO_NEG }}>{fmt(d.saldoReal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: DRE
// ════════════════════════════════════════════════════════════════════════════
function TabDRE({ transactions, categorias }) {
  const [ano, setAno] = useState(new Date().getFullYear())

  const noAno = useMemo(() =>
    transactions.filter(t => t.vencimento.startsWith(String(ano)) && t.status !== 'cancelado'),
    [transactions, ano])

  const totais = useMemo(() => {
    let r = 0, d = 0
    noAno.forEach(t => {
      const v = Number(t.valor || 0)
      if (t.tipo === 'receita') r += v; else d += v
    })
    const res = r - d
    return { receitas: r, despesas: d, resultado: res, margem: r > 0 ? (res / r) * 100 : 0 }
  }, [noAno])

  const mensal = useMemo(() => {
    const arr = []
    for (let m = 1; m <= 12; m++) {
      const key = `${ano}-${String(m).padStart(2, '0')}`
      let r = 0, d = 0
      noAno.forEach(t => {
        if (!t.vencimento.startsWith(key)) return
        const v = Number(t.valor || 0)
        if (t.tipo === 'receita') r += v; else d += v
      })
      arr.push({ mes: key, mesLabel: monthLabel(key), receita: r, despesa: d, resultado: r - d, margem: r > 0 ? ((r - d) / r) * 100 : 0 })
    }
    return arr
  }, [noAno, ano])

  const porCategoria = useMemo(() => {
    const map = {}
    noAno.forEach(t => {
      const cat = categorias.find(c => c.id === t.categoria_id)
      const k = cat?.id || '_sem_'
      if (!map[k]) map[k] = { nome: cat?.nome || 'Sem categoria', tipo: t.tipo, cor: cat?.cor || '#94A3B8', total: 0 }
      map[k].total += Number(t.valor || 0)
    })
    return Object.values(map)
  }, [noAno, categorias])

  const totalReceitas = porCategoria.filter(c => c.tipo === 'receita').reduce((s, c) => s + c.total, 0)
  const totalDespesas = porCategoria.filter(c => c.tipo === 'despesa').reduce((s, c) => s + c.total, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="nx-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setAno(a => a - 1)} className="nx-btn-ghost" style={{ fontSize: 12 }}>
          <ChevronLeft size={14} /> {ano - 1}
        </button>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{ano}</div>
        <button onClick={() => setAno(a => a + 1)} className="nx-btn-ghost" style={{ fontSize: 12 }}>
          {ano + 1} <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <KPI title="Receitas do ano" value={totais.receitas} color={COR_RECEITA} icon={ArrowUpCircle} />
        <KPI title="Despesas do ano" value={totais.despesas} color={COR_DESPESA} icon={ArrowDownCircle} />
        <KPI title="Resultado" value={totais.resultado} color={totais.resultado >= 0 ? COR_SALDO_POS : COR_SALDO_NEG} icon={TrendingUp} />
        <div className="nx-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Margem</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: totais.margem >= 0 ? COR_SALDO_POS : COR_SALDO_NEG, marginTop: 4 }}>
            {totais.margem.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="nx-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BarChart3 size={16} style={{ color: '#7C3AED' }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>DRE — {ano}</div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={mensal}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="receita" name="Receita" fill={COR_RECEITA} />
            <Bar dataKey="despesa" name="Despesa" fill={COR_DESPESA} />
            <Line type="monotone" dataKey="resultado" name="Resultado" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
        <CategoriaPanel title="Receitas por categoria" data={porCategoria.filter(c => c.tipo === 'receita').sort((a, b) => b.total - a.total)} total={totalReceitas} corPadrao={COR_RECEITA} />
        <CategoriaPanel title="Despesas por categoria" data={porCategoria.filter(c => c.tipo === 'despesa').sort((a, b) => b.total - a.total)} total={totalDespesas} corPadrao={COR_DESPESA} />
      </div>

      <div className="nx-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#F8FAFC' }}>
            <tr>
              <th style={th}>Mês</th>
              <th style={th}>Receita</th>
              <th style={th}>Despesa</th>
              <th style={th}>Resultado</th>
              <th style={th}>Margem</th>
            </tr>
          </thead>
          <tbody>
            {mensal.map(m => (
              <tr key={m.mes} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={td}>{m.mesLabel}</td>
                <td style={{ ...td, color: COR_RECEITA }}>{fmt(m.receita)}</td>
                <td style={{ ...td, color: COR_DESPESA }}>{fmt(m.despesa)}</td>
                <td style={{ ...td, fontWeight: 700, color: m.resultado >= 0 ? COR_SALDO_POS : COR_SALDO_NEG }}>{fmt(m.resultado)}</td>
                <td style={{ ...td, color: m.margem >= 0 ? COR_SALDO_POS : COR_SALDO_NEG }}>{m.margem.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function CategoriaPanel({ title, data, total, corPadrao }) {
  return (
    <div className="nx-card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sem dados.</div>
      ) : data.map(c => {
        const pct = total > 0 ? (c.total / total) * 100 : 0
        return (
          <div key={c.nome} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{c.nome}</span>
              <span style={{ fontWeight: 700, color: c.cor || corPadrao }}>{fmt(c.total)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {pct.toFixed(1)}%</span></span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: c.cor || corPadrao, transition: 'width 0.3s' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: INADIMPLENCIA
// ════════════════════════════════════════════════════════════════════════════
function TabInadimplencia({ transactions, markPago, openEdit }) {
  const today = todayISO()
  const buckets = useMemo(() => {
    const b = {
      '1-30':  { label: '1–30 dias',  total: 0, items: [], cor: '#D97706', bg: '#FFFBEB', icon: Clock,         severity: 'recente' },
      '31-60': { label: '31–60 dias', total: 0, items: [], cor: '#EA580C', bg: '#FFF7ED', icon: Calendar,      severity: 'atenção' },
      '61-90': { label: '61–90 dias', total: 0, items: [], cor: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle, severity: 'risco' },
      '90+':   { label: '+90 dias',   total: 0, items: [], cor: '#7F1D1D', bg: '#FEF2F2', icon: AlertCircle,   severity: 'crítico' },
    }
    transactions.forEach(t => {
      if (t.tipo !== 'receita' || t.status !== 'pendente') return
      const dias = Math.floor((new Date(today).getTime() - new Date(t.vencimento).getTime()) / 86400000)
      if (dias <= 0) return
      const v = Number(t.valor || 0)
      const item = { ...t, dias }
      let k
      if (dias <= 30) k = '1-30'
      else if (dias <= 60) k = '31-60'
      else if (dias <= 90) k = '61-90'
      else k = '90+'
      b[k].total += v
      b[k].items.push(item)
    })
    return b
  }, [transactions, today])

  const total = Object.values(buckets).reduce((s, b) => s + b.total, 0)
  const hasInadimp = total > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Titulo + subtitulo simples */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Aging — Contas a Receber Vencidas</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Distribuição de inadimplência por tempo de vencimento</div>
      </div>

      {/* 4 cards "Severity Arc" */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {Object.entries(buckets).map(([k, b], idx) => {
          const Icon = b.icon
          const active = b.total > 0
          return (
            <div key={k}
              style={{
                position: 'relative', overflow: 'hidden',
                background: active ? b.bg : '#fff',
                border: `1px solid ${active ? b.cor + '33' : 'var(--border)'}`,
                borderRadius: 12, padding: '16px 18px 14px 22px',
                animation: `aging-card-in 0.4s ease ${idx * 0.06}s both`,
                transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                cursor: 'default',
                boxShadow: active ? `0 4px 14px -6px ${b.cor}55` : '0 1px 2px rgba(0,0,0,0.03)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = active
                  ? `0 10px 24px -8px ${b.cor}66`
                  : '0 4px 12px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = active
                  ? `0 4px 14px -6px ${b.cor}55`
                  : '0 1px 2px rgba(0,0,0,0.03)'
              }}>
              {/* Barra vertical de severidade na esquerda */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
                background: active
                  ? `linear-gradient(180deg, ${b.cor} 0%, ${b.cor}99 100%)`
                  : '#E2E8F0',
              }} />

              {/* Header: icone em chip + label + severity badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 7,
                    background: active ? '#fff' : '#F1F5F9',
                    border: active ? `1px solid ${b.cor}33` : '1px solid transparent',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: active ? b.cor : '#94A3B8',
                  }}>
                    <Icon size={12} strokeWidth={2.2} />
                  </div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    color: active ? b.cor : 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {b.label.toUpperCase()}
                  </span>
                </div>
                {active && (
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    padding: '2px 7px', borderRadius: 4,
                    background: '#fff', color: b.cor,
                    border: `1px solid ${b.cor}44`,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {b.severity}
                  </span>
                )}
              </div>

              {/* Big number — monospaced feeling com tabular-nums */}
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 26,
                color: active ? b.cor : '#94A3B8',
                letterSpacing: '-0.025em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 8,
              }}>
                {fmt(b.total)}
              </div>

              {/* Footer com qtd lançamentos */}
              <div style={{
                fontSize: 11, color: active ? b.cor : 'var(--text-muted)',
                opacity: active ? 0.85 : 1, fontWeight: active ? 600 : 500,
              }}>
                {b.items.length} {b.items.length === 1 ? 'lançamento' : 'lançamentos'}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes aging-card-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }`}</style>

      {/* Estado vazio simples */}
      {!hasInadimp ? (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0', borderRadius: 12,
          padding: '44px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: '#fff',
            border: '1px solid #BBF7D0',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <CheckCircle2 size={22} style={{ color: '#16A34A' }} strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#15803D', marginBottom: 4 }}>Sem inadimplência</div>
          <div style={{ fontSize: 13, color: '#16A34A' }}>Todas as contas a receber estão em dia.</div>
        </div>
      ) : (
        Object.entries(buckets).filter(([_, b]) => b.items.length > 0).map(([k, b]) => (
          <div key={k} className="nx-card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.cor }} />
                <strong style={{ fontSize: 13 }}>{b.label}</strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {b.items.length} lançamentos</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: b.cor }}>{fmt(b.total)}</div>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <tbody>
                {b.items.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{t.descricao}</div>
                      {t.contato_nome && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.contato_nome}</div>}
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(t.vencimento)}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: b.cor, whiteSpace: 'nowrap' }}>{t.dias}d atraso</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(Number(t.valor))}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <button onClick={() => markPago(t)}
                        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', marginRight: 4 }}>
                        ✓ Recebido
                      </button>
                      <button onClick={() => openEdit(t)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: 3, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <Pencil size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: POR CATEGORIA
// ════════════════════════════════════════════════════════════════════════════
function TabPorCategoria({ transactions, categorias }) {
  const [mes, setMes] = useState(monthKey(todayISO()))
  const [tipo, setTipo] = useState('receita')

  const dados = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      if (t.tipo !== tipo) return
      if (t.status === 'cancelado') return
      if (mes && monthKey(t.vencimento) !== mes) return
      const cat = categorias.find(c => c.id === t.categoria_id)
      const k = cat?.id || '_sem_'
      if (!map[k]) map[k] = { nome: cat?.nome || 'Sem categoria', cor: cat?.cor || '#94A3B8', total: 0, count: 0 }
      map[k].total += Number(t.valor || 0)
      map[k].count += 1
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [transactions, categorias, tipo, mes])

  const total = dados.reduce((s, c) => s + c.total, 0)

  const monthsAvail = useMemo(() => {
    const set = new Set()
    transactions.forEach(t => set.add(monthKey(t.vencimento)))
    set.add(monthKey(todayISO()))
    return Array.from(set).sort().reverse()
  }, [transactions])

  const corAtiva = tipo === 'receita' ? COR_RECEITA : COR_DESPESA
  const totalCount = dados.reduce((s, c) => s + c.count, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filtro mes + toggle Receitas/Despesas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FilterPill icon={Calendar} value={mes ? monthLabel(mes) : 'Todos meses'}>
          <select value={mes} onChange={e => setMes(e.target.value)} style={hiddenSelect}>
            <option value="">Todos meses</option>
            {monthsAvail.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </FilterPill>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setTipo('receita')}
            style={{
              background: tipo === 'receita' ? COR_RECEITA : '#fff',
              color: tipo === 'receita' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${tipo === 'receita' ? COR_RECEITA : 'var(--border)'}`,
              borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
            <ArrowUpCircle size={12} /> Receitas
          </button>
          <button onClick={() => setTipo('despesa')}
            style={{
              background: tipo === 'despesa' ? COR_DESPESA : '#fff',
              color: tipo === 'despesa' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${tipo === 'despesa' ? COR_DESPESA : 'var(--border)'}`,
              borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
            <ArrowDownCircle size={12} /> Despesas
          </button>
        </div>
      </div>

      {dados.length === 0 ? (
        <div className="nx-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Sem lançamentos nesse filtro.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 14 }}>
          {/* Donut com Total centralizado */}
          <div className="nx-card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Distribuição</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{mes ? monthLabel(mes) : 'Todos meses'}</div>
            <div style={{ position: 'relative', width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dados} dataKey="total" nameKey="nome" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {dados.map((d, i) => <Cell key={i} fill={d.cor} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: corAtiva, fontFamily: 'var(--font-display)' }}>{fmt(total)}</div>
              </div>
            </div>
          </div>

          {/* Tabela com CATEGORIA / QTD / TOTAL / % */}
          <div className="nx-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ ...th, padding: '12px 16px' }}>Categoria</th>
                  <th style={{ ...th, padding: '12px 16px', textAlign: 'right' }}>Qtd</th>
                  <th style={{ ...th, padding: '12px 16px', textAlign: 'right' }}>Total</th>
                  <th style={{ ...th, padding: '12px 16px', textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {dados.map(c => {
                  const pct = total > 0 ? (c.total / total) * 100 : 0
                  return (
                    <tr key={c.nome} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '12px 16px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{c.nome}</span>
                        </div>
                        {/* barra de progresso no fundo da row */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, width: `${pct}%`, background: c.cor, opacity: 0.7 }} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{c.count}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: c.cor }}>{fmt(c.total)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC', borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>Total</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{totalCount}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: corAtiva }}>{fmt(total)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL DE LANÇAMENTO
// ════════════════════════════════════════════════════════════════════════════
function ModalLancamento({ modal, setModal, categorias, onSave, clientes = [] }) {
  const catsFiltered = categorias.filter(c => c.tipo === modal.tipo)
  const isReceita = modal.tipo === 'receita'
  const isEdit = !!modal.id
  const [clienteOpen, setClienteOpen] = useState(false)
  const filteredClientes = useMemo(() => {
    const q = (modal.contato_nome || '').trim().toLowerCase()
    if (!q) return clientes.slice(0, 8)
    return clientes.filter(c => c.nome.toLowerCase().includes(q)).slice(0, 8)
  }, [modal.contato_nome, clientes])
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
      <div className="nx-card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isReceita ? <ArrowUpCircle size={18} style={{ color: COR_RECEITA }} /> : <ArrowDownCircle size={18} style={{ color: COR_DESPESA }} />}
            <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? 'Editar' : 'Nova'} {isReceita ? 'receita' : 'despesa'}</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setModal(null)}><X size={16} /></button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isEdit && (
            <div style={{ display: 'flex', gap: 6 }}>
              {['receita', 'despesa'].map(t => (
                <button key={t} onClick={() => setModal(p => ({ ...p, tipo: t, categoria_id: '' }))}
                  style={{
                    flex: 1, padding: '8px', border: '2px solid',
                    borderColor: modal.tipo === t ? (t === 'receita' ? COR_RECEITA : COR_DESPESA) : 'var(--border)',
                    background: modal.tipo === t ? (t === 'receita' ? '#F0FDF4' : '#FEF2F2') : '#fff',
                    color: modal.tipo === t ? (t === 'receita' ? COR_RECEITA : COR_DESPESA) : 'var(--text-secondary)',
                    borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  {t === 'receita' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                  {t}
                </button>
              ))}
            </div>
          )}
          <div>
            <label style={labelStyle}>Descrição *</label>
            <input className="nx-input" autoFocus value={modal.descricao}
              onChange={e => setModal(p => ({ ...p, descricao: e.target.value }))}
              placeholder={isReceita ? 'Honorário inicial - cliente X' : 'Aluguel do escritório'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Valor *</label>
              <MoneyInput value={modal.valor} onChange={v => setModal(p => ({ ...p, valor: v }))} />
            </div>
            <div>
              <label style={labelStyle}>Vencimento *</label>
              <input className="nx-input" type="date" value={modal.vencimento}
                onChange={e => setModal(p => ({ ...p, vencimento: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select className="nx-select" value={modal.categoria_id || ''}
                onChange={e => setModal(p => ({ ...p, categoria_id: e.target.value }))}>
                <option value="">— sem categoria —</option>
                {catsFiltered.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Forma de pagamento</label>
              <select className="nx-select" value={modal.forma_pagamento || ''}
                onChange={e => setModal(p => ({ ...p, forma_pagamento: e.target.value }))}>
                <option value="">— —</option>
                {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>{isReceita ? 'Cliente' : 'Fornecedor'}</label>
              <input className="nx-input" value={modal.contato_nome || ''}
                onChange={e => { setModal(p => ({ ...p, contato_nome: e.target.value })); setClienteOpen(true) }}
                onFocus={() => setClienteOpen(true)}
                onBlur={() => setTimeout(() => setClienteOpen(false), 150)}
                placeholder={clientes.length ? `Digite ou escolha (${clientes.length} cadastrados)` : 'Nome livre'}
                autoComplete="off" />
              {clienteOpen && filteredClientes.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  zIndex: 10001, maxHeight: 240, overflow: 'auto',
                }}>
                  {filteredClientes.map((c, i) => (
                    <button key={`${c.nome}-${i}`} type="button"
                      onMouseDown={e => { e.preventDefault(); setModal(p => ({ ...p, contato_nome: c.nome })); setClienteOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '8px 12px', border: 'none', background: 'transparent',
                        cursor: 'pointer', textAlign: 'left', fontSize: 12.5,
                        borderBottom: '1px solid #F1F5F9',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                        background: c.source === 'crm' ? '#EFF6FF' : '#F0FDF4',
                        color: c.source === 'crm' ? '#1D4ED8' : '#15803D',
                        letterSpacing: '0.05em',
                      }}>
                        {c.source === 'crm' ? 'CRM' : 'FIN'}
                      </span>
                      <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.nome}
                      </span>
                      {c.phone && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Centro de custo</label>
              <input className="nx-input" value={modal.centro_custo || ''}
                onChange={e => setModal(p => ({ ...p, centro_custo: e.target.value }))}
                placeholder="Ex: Trabalhista, Sócio X" />
            </div>
          </div>
          {isReceita && (
            <div>
              <label style={labelStyle}>Nº do processo (CNJ)</label>
              <input className="nx-input" value={modal.processo_numero || ''}
                onChange={e => setModal(p => ({ ...p, processo_numero: formatCNJ(e.target.value) }))}
                placeholder="0000000-00.0000.0.00.0000"
                maxLength={25} />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                20 dígitos, formato CNJ. Opcional.
              </div>
            </div>
          )}
          {!isEdit && (
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Parcelado em</label>
                <input className="nx-input" type="number" min="1" max="60"
                  value={modal.parcela_total || 1}
                  onChange={e => setModal(p => ({ ...p, parcela_total: e.target.value, recorrente: false }))}
                  disabled={modal.recorrente} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>1 = à vista. Gera (1/N), (2/N)…</div>
              </div>
              <div>
                <label style={labelStyle}>Recorrência (mensal)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!modal.recorrente}
                    onChange={e => setModal(p => ({ ...p, recorrente: e.target.checked, parcela_total: 1 }))} />
                  <span style={{ fontSize: 12 }}>Recorrente todo mês</span>
                </label>
                {modal.recorrente && (
                  <input className="nx-input" type="number" min="1" max="60"
                    value={modal.recorrencia_meses || 12}
                    onChange={e => setModal(p => ({ ...p, recorrencia_meses: e.target.value }))}
                    placeholder="Quantos meses?" style={{ marginTop: 6 }} />
                )}
              </div>
            </div>
          )}
          {isEdit && (
            <div>
              <label style={labelStyle}>Status</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['pendente', 'pago', 'cancelado'].map(s => (
                  <button key={s} onClick={() => setModal(p => ({ ...p, status: s, pago_em: s === 'pago' && !p.pago_em ? todayISO() : p.pago_em }))}
                    style={{
                      border: '1px solid', borderColor: modal.status === s ? '#2563EB' : 'var(--border)',
                      background: modal.status === s ? '#EFF6FF' : '#fff',
                      color: modal.status === s ? '#2563EB' : 'var(--text-secondary)',
                      borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    }}>
                    {STATUS_COLORS[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea className="nx-input" rows={2} value={modal.observacoes || ''}
              onChange={e => setModal(p => ({ ...p, observacoes: e.target.value }))} />
          </div>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
          <button className="nx-btn-primary" style={{ flex: 1 }} onClick={() => onSave(modal)}>Salvar</button>
        </div>
      </div>
    </div>, document.body)
}

// ─── Helpers de render ──────────────────────────────────────────────────────
function KPI({ title, value, color, icon: Icon, raw }) {
  return (
    <div className="nx-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 4 }}>{raw ? value : fmt(value)}</div>
        </div>
        {Icon && <div style={{ color, opacity: 0.7 }}><Icon size={18} /></div>}
      </div>
    </div>
  )
}
function StatusBadge({ status, tipo }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pendente
  const label = (status === 'pago' && tipo === 'receita') ? 'Recebido' : s.label
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: s.bg, color: s.color }}>{label}</span>
}
function Blocked({ icon: Icon, msg }) {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Icon size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
      <div>{msg}</div>
    </div>
  )
}

const th = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td = { padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }
