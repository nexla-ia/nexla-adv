import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/ConfirmModal'
import {
  Users, Search, Pencil, Trash2, X, Plus, Phone, Copy, Check, MessageSquare,
  Mail, ShieldCheck, Sparkles, Tag, ChevronDown,
} from 'lucide-react'

const COUNTRY_CODES = [
  { code: '55',  flag: '🇧🇷', name: 'Brasil' },
  { code: '1',   flag: '🇺🇸', name: 'EUA' },
  { code: '351', flag: '🇵🇹', name: 'Portugal' },
  { code: '34',  flag: '🇪🇸', name: 'Espanha' },
  { code: '44',  flag: '🇬🇧', name: 'Reino Unido' },
  { code: '49',  flag: '🇩🇪', name: 'Alemanha' },
  { code: '33',  flag: '🇫🇷', name: 'França' },
  { code: '39',  flag: '🇮🇹', name: 'Itália' },
  { code: '54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '56',  flag: '🇨🇱', name: 'Chile' },
  { code: '598', flag: '🇺🇾', name: 'Uruguai' },
  { code: '595', flag: '🇵🇾', name: 'Paraguai' },
]
import './Company.css'
import { TagBadge, tagColor } from '../../components/TagBadge'

function fmtCpf(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function calcAge(d) {
  if (!d) return null
  const dt = new Date(`${d}T12:00:00`)
  if (isNaN(dt.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dt.getFullYear()
  const m = now.getMonth() - dt.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dt.getDate())) age--
  return age
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500,
  color: 'var(--text-muted)', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

export default function CompanyContacts() {
  const { session } = useAuth()
  const instance = session?.company?.instance
  const navigate = useNavigate()

  const [patients, setPatients] = useState([])
  const [insurancePlans, setInsurancePlans] = useState([])
  const [chatPhones, setChatPhones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState(new Set()) // tags selecionadas pra filtrar
  const [newModal, setNewModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletingNow, setDeletingNow] = useState(false)
  const [phoneFocus, setPhoneFocus] = useState(false)
  const [countryCode, setCountryCode] = useState('55')
  const [showCountryDrop, setShowCountryDrop] = useState(false)

  useEffect(() => {
    if (!instance) return
    setLoading(true)
    Promise.all([
      supabase.from('saved_contacts').select('*').eq('instancia', instance).order('nome', { ascending: true }),
      supabase.from('insurance_plans').select('id, name').eq('instancia', instance).eq('active', true).order('name'),
      supabase.from('mensagens_geral').select('numero').eq('instancia', instance).limit(5000),
    ]).then(([{ data: pat }, { data: plans }, { data: msgs }]) => {
      if (pat) setPatients(pat)
      if (plans) setInsurancePlans(plans)
      if (msgs) {
        // Normaliza pra comparar: pega últimos 8 dígitos (ignora 9 extra BR + DDI)
        const norm = (n) => (n || '').replace(/\D/g, '').slice(-8)
        const savedKeys = new Set((pat || []).map(p => norm(p.numero)).filter(Boolean))
        const uniques = [...new Set(msgs.map(m =>
          m.numero?.replace(/@.*/, '').replace(/\D/g, '')
        ).filter(Boolean))]
        const unsaved = uniques.filter(n => !savedKeys.has(norm(n)))
        setChatPhones(unsaved.slice(0, 200))
      }
      setLoading(false)
    })

    const ch = supabase.channel(`patients-${instance}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_contacts', filter: `instancia=eq.${instance}` },
        (p) => {
          if (p.eventType === 'DELETE') {
            setPatients(prev => prev.filter(c => c.id !== p.old.id))
          } else if (p.new) {
            setPatients(prev => {
              const exists = prev.find(c => c.id === p.new.id)
              if (exists) return prev.map(c => c.id === p.new.id ? p.new : c).sort((a, b) => a.nome.localeCompare(b.nome))
              return [...prev, p.new].sort((a, b) => a.nome.localeCompare(b.nome))
            })
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [instance])

  // Todas as tags únicas de todos os contatos
  const allTags = useMemo(() => {
    const set = new Set()
    patients.forEach(p => (p.tags || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [patients])

  function toggleTagFilter(tag) {
    setTagFilter(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const filtered = useMemo(() => {
    return patients.filter(c => {
      const s = search.toLowerCase()
      const matchSearch = !search || (
        c.nome?.toLowerCase().includes(s) ||
        (c.numero || '').includes(search) ||
        (c.cpf || '').includes(search.replace(/\D/g, '')) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.tags || []).some(t => t.toLowerCase().includes(s))
      )
      const matchTag = tagFilter.size === 0 || (c.tags || []).some(t => tagFilter.has(t))
      return matchSearch && matchTag
    })
  }, [patients, search, tagFilter])

  const phoneSuggestions = useMemo(() => {
    const q = (newModal?.numero || '').replace(/\D/g, '')
    // Sem input: mostra os 8 mais recentes. Com input: filtra
    if (!q) return chatPhones.slice(0, 8)
    return chatPhones.filter(p => p.includes(q)).slice(0, 8)
  }, [newModal?.numero, chatPhones])

  function openNew() { setNewModal({ nome: '', numero: '' }); setErr('') }

  async function handleCreate() {
    if (!newModal.nome?.trim()) { setErr('Nome é obrigatório'); return }
    setSaving(true)
    try {
      let numero = newModal.numero?.toString().replace(/\D/g, '') || ''
      if (numero && !numero.startsWith(countryCode)) numero = countryCode + numero
      const { data, error } = await supabase.from('saved_contacts').insert({
        numero, instancia: instance,
        nome: newModal.nome.trim(),
        created_by_email: session?.user?.email,
      }).select().single()
      if (error) { setErr('Erro: ' + error.message); return }
      setNewModal(null)
      if (data?.id) navigate(`/painel/contatos/${data.id}`)
    } catch (e) {
      setErr('Erro inesperado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(patient) { setConfirmDelete(patient) }
  async function confirmDeleteAction() {
    if (!confirmDelete) return
    setDeletingNow(true)
    await supabase.from('saved_contacts').delete().eq('id', confirmDelete.id)
    setDeletingNow(false)
    setConfirmDelete(null)
  }

  function copyNumber(id, num) {
    navigator.clipboard.writeText(num).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            Clientes
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {loading ? 'Carregando...' : `${filtered.length} de ${patients.length} cliente${patients.length === 1 ? '' : 's'}`}
          </div>
        </div>
        <button className="nx-btn-primary" onClick={openNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Novo cliente
        </button>
      </div>

      {/* Busca */}
      <div className="nx-card" style={{ padding: '10px 14px', marginBottom: allTags.length ? 10 : 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text-primary)' }}
          placeholder="Buscar por nome, telefone, CPF, e-mail ou tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtro por tags */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Tag size={11} /> Filtrar:
          </span>
          {allTags.map(tag => {
            const active = tagFilter.has(tag)
            const { bg, color, border } = tagColor(tag)
            return (
              <button key={tag} onClick={() => toggleTagFilter(tag)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: active ? color : bg,
                color: active ? '#fff' : color,
                border: `1px solid ${active ? color : border}`,
                borderRadius: 20, padding: '3px 10px',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
                boxShadow: active ? `0 2px 8px ${color}44` : 'none',
              }}>
                {tag}
                {active && <X size={9} />}
              </button>
            )
          })}
          {tagFilter.size > 0 && (
            <button onClick={() => setTagFilter(new Set())} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 20,
              padding: '3px 10px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              Limpar filtro
            </button>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="nx-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Users size={28} style={{ opacity: 0.2 }} />
          <div style={{ fontSize: 14 }}>
            {search || tagFilter.size > 0
              ? 'Nenhum cliente encontrado com esse filtro.'
              : 'Nenhum cliente cadastrado. Cadastre o primeiro ou use o botão direito numa conversa para salvar rápido.'}
          </div>
        </div>
      )}

      {/* Tabela */}
      {filtered.length > 0 && (
        <div className="nx-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: 520 }}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tags</th>
                <th>Contato</th>
                <th>Notas</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const age = calcAge(c.birth_date)
                const tags = c.tags || []
                return (
                  <tr key={c.id}>
                    <td className="td-name" onClick={() => navigate(`/painel/contatos/${c.id}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: c.photo ? 'transparent' : '#EFF6FF',
                          border: c.photo ? 'none' : '1px solid #BFDBFE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#2563EB', flexShrink: 0, overflow: 'hidden',
                        }}>
                          {c.photo
                            ? <img src={c.photo} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : c.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#2563EB' }}>{c.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                            {c.cpf && <span>CPF {fmtCpf(c.cpf)}</span>}
                            {age != null && <span>{age} anos</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {tags.length === 0
                          ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          : tags.map(t => <TagBadge key={t} tag={t} small />)
                        }
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {c.numero && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
                          <Phone size={11} style={{ color: '#6B7280' }} />
                          {c.numero}
                          <button onClick={() => copyNumber(c.id, c.numero)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              background: copiedId === c.id ? '#F0FDF4' : 'transparent',
                              border: `1px solid ${copiedId === c.id ? '#BBF7D0' : 'var(--border)'}`,
                              color: copiedId === c.id ? '#16A34A' : '#6B7280',
                              borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            }}>
                            {copiedId === c.id ? <Check size={9} /> : <Copy size={9} />}
                          </button>
                        </div>
                      )}
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', marginTop: 3, fontSize: 11 }}>
                          <Mail size={10} /> {c.email}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.notes || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {c.numero && (
                          <button className="table-action" style={{ background: '#16A34A', color: '#fff', border: 'none' }}
                            onClick={() => navigate(`/painel/conversas?contact=${c.numero}`)}>
                            <MessageSquare size={11} /> Conversar
                          </button>
                        )}
                        <button className="table-action" onClick={() => navigate(`/painel/contatos/${c.id}`)}>
                          <Pencil size={11} /> Abrir ficha
                        </button>
                        <button className="table-action danger" onClick={() => handleDelete(c)}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        variant="delete"
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir o cliente "${confirmDelete?.nome || ''}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir cliente"
        loading={deletingNow}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />

      {newModal && createPortal(
        <div className="nx-modal-bg" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-modal-card nx-card" style={{ width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Novo cliente</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Cadastre o básico — depois você completa a ficha.</div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setNewModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input className="nx-input" autoFocus placeholder="Ex: Maria Silva Santos"
                  value={newModal.nome} onChange={e => setNewModal(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Telefone (WhatsApp)</label>
                <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative' }}>
                  <button type="button"
                    onClick={() => setShowCountryDrop(v => !v)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#F1F5F9', border: '1px solid var(--border)',
                      borderRight: 'none', borderRadius: '8px 0 0 8px',
                      padding: '0 10px', fontSize: 13, fontWeight: 600,
                      color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                    {COUNTRY_CODES.find(c => c.code === countryCode)?.flag || '🌐'} +{countryCode}
                    <ChevronDown size={12} />
                  </button>
                  {showCountryDrop && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, zIndex: 10,
                      background: '#fff', border: '1px solid var(--border)',
                      borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      marginTop: 4, minWidth: 220, maxHeight: 240, overflowY: 'auto',
                    }}>
                      {COUNTRY_CODES.map(c => (
                        <button key={c.code} type="button"
                          onClick={() => { setCountryCode(c.code); setShowCountryDrop(false) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '8px 12px', border: 'none',
                            background: c.code === countryCode ? '#EFF6FF' : '#fff',
                            cursor: 'pointer', fontSize: 13, textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                          onMouseLeave={e => e.currentTarget.style.background = c.code === countryCode ? '#EFF6FF' : '#fff'}>
                          <span>{c.flag}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>+{c.code}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 11 }}>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    className="nx-input"
                    style={{ borderRadius: '0 8px 8px 0', flex: 1 }}
                    placeholder="DDD + número (ex: 6991234567)"
                    value={newModal.numero}
                    onChange={e => setNewModal(p => ({ ...p, numero: e.target.value }))}
                    onFocus={() => setPhoneFocus(true)}
                    onBlur={() => setTimeout(() => setPhoneFocus(false), 180)}
                  />
                </div>
                {phoneFocus && phoneSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5, background: 'white', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, padding: 4, boxShadow: '0 12px 28px -10px rgba(15,14,27,0.18)', maxHeight: 260, overflowY: 'auto' }}>
                    <div style={{ padding: '8px 10px 6px', fontSize: 10, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <Sparkles size={10} style={{ color: '#7C3AED' }} /> Já conversaram · não cadastrados
                    </div>
                    {phoneSuggestions.map(p => {
                      // Strip 55 prefix pra exibir e pra salvar (badge +55 já mostra)
                      const noBR = p.startsWith('55') ? p.slice(2) : p
                      const display = noBR.length === 11
                        ? noBR.slice(0, 2) + ' ' + noBR.slice(2, 7) + '-' + noBR.slice(7)
                        : noBR.length === 10
                          ? noBR.slice(0, 2) + ' ' + noBR.slice(2, 6) + '-' + noBR.slice(6)
                          : noBR
                      return (
                        <button key={p} onMouseDown={e => {
                            e.preventDefault()
                            setNewModal(prev => ({ ...prev, numero: noBR }))
                            setPhoneFocus(false)
                          }}
                          style={{ width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 7, background: 'transparent', border: 'none', fontSize: 13, color: '#0F0E1B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Phone size={12} style={{ color: '#7C3AED', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'monospace' }}>+55 {display}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626', marginBottom: 12 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setNewModal(null)}>Cancelar</button>
                <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreate} disabled={saving}>
                  {saving ? 'Criando...' : 'Continuar para ficha'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
