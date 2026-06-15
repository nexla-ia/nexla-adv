import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { MessageSquare, Bot, User, Users, PhoneCall, CheckCircle2, X, Send, Headset, Sparkles, Inbox, UserCheck, Archive, Mic, Square, Trash2, Paperclip, FileText, Image as ImageIcon, Calendar, UserPlus, BookUser, Lock, ArrowRightLeft, MoreVertical, Tag, Plus, Pencil } from 'lucide-react'
import { TagBadge, tagColor } from '../../components/TagBadge'
import './Company.css'

const CONV_TABLE = 'mensagens_geral'

function formatPhone(val) {
  return (val || '').replace(/@.*$/, '')
}

// Busca contato no mapa tolerando variação do 9 extra BR
function findSaved(savedContacts, cleanNum) {
  if (!cleanNum) return null
  // Lookup direto
  if (savedContacts[cleanNum]) return savedContacts[cleanNum]
  // Tenta sem o 9 extra (55DDD9XXXXXXXX → 55DDDXXXXXXXX)
  if (cleanNum.startsWith('55') && cleanNum.length === 13) {
    const sem9 = cleanNum.slice(0, 4) + cleanNum.slice(5)
    if (savedContacts[sem9]) return savedContacts[sem9]
  }
  // Tenta com o 9 extra (55DDDXXXXXXXX → 55DDD9XXXXXXXX)
  if (cleanNum.startsWith('55') && cleanNum.length === 12) {
    const com9 = cleanNum.slice(0, 4) + '9' + cleanNum.slice(4)
    if (savedContacts[com9]) return savedContacts[com9]
  }
  return null
}

function getMessageContent(row) {
  return (row.mensagem || '').replace(/^\*[^*]+\*:\n/, '').trim()
}

function getMessageType(row) { return (row.type || 'human').toLowerCase() }

function parseTimestamp(val) {
  if (!val) return null
  if (/^\d{2}\/\d{2}\/\d{4}/.test(val)) {
    const [date, time] = val.split(' ')
    const [d, m, y] = date.split('/')
    return new Date(`${y}-${m}-${d}T${time || '00:00:00'}`).toISOString()
  }
  return val
}

function getTimestamp(row) { return parseTimestamp(row.horaLastMessage) || row.created_at || null }

const INJECTED_PROMPT_RE = /responda em portugu[eê]s|de forma objetiva|solicite\s|n[aã]o informar|indicar que|apresentaremos|breve explica[çc][aã]o|orienta[çc][õo]es gerais|avalia[çc][aã]o pr[eé]-operat/i

// Renderiza texto com markdown estilo WhatsApp:
// *bold*, _italic_, ~strike~, `code`, ```block```, URLs clicáveis
function renderRichText(text) {
  if (!text) return null
  const segments = []
  // 1) Primeiro extrai code blocks (``` ```) e inline code (` `)
  //    pra que o conteúdo interno não seja afetado por outros markdowns.
  // Regex que captura: ```...``` | `...` | http(s)://... | www.... | *...* | _..._ | ~...~
  const regex = /```([\s\S]+?)```|`([^`\n]+?)`|(https?:\/\/[^\s]+)|(www\.[^\s]+)|\*([^*\n]+?)\*|_([^_\n]+?)_|~([^~\n]+?)~/g
  let lastIndex = 0
  let m
  let keyIdx = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push(text.slice(lastIndex, m.index))
    }
    const k = `mk-${keyIdx++}`
    if (m[1] !== undefined) {
      // Code block
      segments.push(<pre key={k} style={{
        background: 'rgba(0,0,0,0.06)', padding: '8px 10px', borderRadius: 6,
        fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        margin: '4px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>{m[1]}</pre>)
    } else if (m[2] !== undefined) {
      // Inline code — se o conteúdo for uma URL, deixa clicável dentro do code
      const inner = m[2]
      const urlMatch = inner.match(/^(https?:\/\/\S+|www\.\S+)$/)
      const codeStyle = {
        background: 'rgba(0,0,0,0.08)', padding: '1px 6px', borderRadius: 4,
        fontSize: '0.92em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }
      if (urlMatch) {
        const href = inner.startsWith('http') ? inner : `https://${inner}`
        segments.push(
          <a key={k} href={href} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}>
            <code style={codeStyle}>{inner}</code>
          </a>
        )
      } else {
        segments.push(<code key={k} style={codeStyle}>{inner}</code>)
      }
    } else if (m[3] !== undefined || m[4] !== undefined) {
      // URL
      const raw = m[3] || m[4]
      const href = raw.startsWith('http') ? raw : `https://${raw}`
      segments.push(<a key={k} href={href} target="_blank" rel="noreferrer" style={{
        color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all',
      }}>{raw}</a>)
    } else if (m[5] !== undefined) {
      // Bold
      segments.push(<strong key={k}>{m[5]}</strong>)
    } else if (m[6] !== undefined) {
      // Italic
      segments.push(<em key={k}>{m[6]}</em>)
    } else if (m[7] !== undefined) {
      // Strikethrough
      segments.push(<span key={k} style={{ textDecoration: 'line-through' }}>{m[7]}</span>)
    }
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex))
  }
  return segments
}

// Normaliza foto pra src de img: aceita URL, data: ou base64 cru (detecta tipo)
function toImgSrc(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s
  let mime = 'image/jpeg'
  if (s.startsWith('iVBOR')) mime = 'image/png'
  else if (s.startsWith('UklGR')) mime = 'image/webp'
  else if (s.startsWith('R0lGOD')) mime = 'image/gif'
  return `data:${mime};base64,${s}`
}

function detectMedia(b64) {
  if (!b64 || b64.length < 10) return null
  if (b64.startsWith('T2dn')) return { type: 'audio', mime: 'audio/ogg' }
  if (b64.startsWith('//uQ') || b64.startsWith('SUQz')) return { type: 'audio', mime: 'audio/mpeg' }
  if (b64.startsWith('GkXf')) return { type: 'audio', mime: 'audio/webm' }
  if (b64.startsWith('/9j/')) return { type: 'image', mime: 'image/jpeg' }
  if (b64.startsWith('iVBOR')) return { type: 'image', mime: 'image/png' }
  if (b64.startsWith('UklGR')) return { type: 'image', mime: 'image/webp' }
  if (b64.startsWith('R0lGOD')) return { type: 'image', mime: 'image/gif' }
  if (b64.startsWith('JVBERi')) return { type: 'pdf', mime: 'application/pdf' }
  return null
}

function isToolMessage(row) {
  const type = getMessageType(row)
  const content = row.mensagem || ''
  // Mantem so o filtro de "tool calls" da IA (chamadas internas), que NUNCA sao
  // mensagens reais. Removemos os filtros por tamanho que cortavam msgs validas.
  if (type === 'tool') return true
  if (type === 'ia' && /^Calling \w+ with input:/i.test(content.trim())) return true
  return false
}

function formatMsgTime(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const hhmm = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return hhmm
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Ontem ${hhmm}`
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hhmm}`
}

// Formata data pra separador entre msgs: "Hoje", "Ontem", "dd 'de' MMMM" ou "dd/MM/yyyy"
function formatDayDivider(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Hoje'
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  const sameYear = date.getFullYear() === now.getFullYear()
  if (sameYear) {
    // 09 de junho (mês por extenso)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatApptShort(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const hh = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d >= today && d < new Date(today.getTime() + 86400000)) return `hoje ${hh}`
  if (d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000)) return `amanhã ${hh}`
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hh}`
}

function formatContactTime(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const diffMin = Math.floor((now - date) / 60000)
  const diffH = Math.floor(diffMin / 60)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  if (diffH < 24) return `${diffH}h`
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const REASONS = [
  { value: 'agendado',       label: 'Agendado',    color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { value: 'resolvido',      label: 'Resolvido',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { value: 'encaminhado',    label: 'Encaminhado', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { value: 'desistiu',       label: 'Desistiu',    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  { value: 'auto_encerrado', label: 'Expirado',    color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
]

const AUTO_CLOSE_HOURS = 2
const MANUAL_REASONS = REASONS.filter(r => r.value !== 'auto_encerrado')

export default function CompanyConversations({ mode = 'individual' }) {
  const isGroupMode = mode === 'grupo'
  const { session } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const instance     = session?.company?.instance
  const apiInstancia = session?.company?.api_instancia

  const isAdmin = session?.user?.role === 'admin'
  const userSector = session?.user?.sector // { id, name, color } or null
  const aiEnabled = session?.company?.ai_enabled !== false

  const [contacts, setContacts]         = useState([])
  const [closedMap, setClosedMap]       = useState({}) // session_id → reason
  const [attendancesMap, setAttendancesMap] = useState({}) // numero → attendance record
  const [attendancesLoaded, setAttendancesLoaded] = useState(false)
  const [assuming, setAssuming]         = useState(null)
  const [transferModal, setTransferModal] = useState(null)
  const [transferringTo, setTransferringTo] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [companyUsers, setCompanyUsers] = useState([]) // outros atendentes pra transferir
  const [tab, setTab]                 = useState(() => sessionStorage.getItem('nx_conv_tab') || 'recepcao')
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [search, setSearch]           = useState('')
  const [selected, setSelected]       = useState(null)
  const [messages, setMessages]       = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [hasMoreMsgs, setHasMoreMsgs] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const MSG_PAGE_SIZE = 35
  const [closeModal, setCloseModal]   = useState(null)
  const [reason, setReason]           = useState('')
  const [closing, setClosing]         = useState(false)
  const [toast, setToast]             = useState(null)
  const [msgText, setMsgText]         = useState('')
  const [editingMsg, setEditingMsg]   = useState(null) // { id, originalContent, newText }
  const [savingEdit, setSavingEdit]   = useState(false)
  const [sending, setSending]         = useState(false)
  const [closedLoaded, setClosedLoaded] = useState(false)
  const [lightbox, setLightbox]       = useState(null)
  const [recording, setRecording]     = useState(false)
  const [recordedAudio, setRecordedAudio] = useState(null) // { base64, mime, duration }
  const [recordTime, setRecordTime]   = useState(0)
  const [attachedFile, setAttachedFile] = useState(null) // { base64, mime, name, size, kind: 'image'|'pdf'|'file' }
  const [savedContacts, setSavedContacts] = useState({}) // numero (só dígitos) → { id, nome, notes }
  const [clientesMap, setClientesMap]     = useState({}) // session_id → nome (fallback da tabela clientes)
  const [clientesFotoMap, setClientesFotoMap] = useState({}) // session_id → foto (base64 ou URL)
  const [futureAppts, setFutureAppts]     = useState({}) // numero (só dígitos) → { starts_at, status, agenda_name }
  const [contextMenu, setContextMenu] = useState(null) // { x, y, contact }
  const [mutedGroups, setMutedGroups] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nx_muted_groups') || '[]')) } catch { return new Set() }
  })
  const [unreadCounts, setUnreadCounts] = useState({}) // { session_id: count }

  function toggleMuteGroup(sid) {
    setMutedGroups(prev => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid); else next.add(sid)
      localStorage.setItem('nx_muted_groups', JSON.stringify([...next]))
      return next
    })
    setContextMenu(null)
  }
  const [chatActionsOpen, setChatActionsOpen] = useState(false)
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [savingTag, setSavingTag] = useState(false)

  // Todas as tags já usadas em qualquer contato (para sugestão)
  const allKnownTags = useMemo(() => {
    const set = new Set()
    Object.values(savedContacts).forEach(c => (c?.tags || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [savedContacts])
  const [saveContactModal, setSaveContactModal] = useState(null) // { numero, nome, notes }
  const [savingContact, setSavingContact] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const recordTimerRef   = useRef(null)
  const recordStartRef   = useRef(0)
  const fileInputRef     = useRef(null)
  const bottomRef    = useRef(null)
  const chatBodyRef  = useRef(null)
  const isPrependingRef = useRef(false)
  const selectedRef  = useRef(null)
  const autoCloseDone = useRef(false)

  function changeTab(t) { sessionStorage.setItem('nx_conv_tab', t); setTab(t) }

  useEffect(() => { selectedRef.current = selected }, [selected])

  // Carrega agendamentos futuros (próximo por contato)
  useEffect(() => {
    if (!instance) return
    const now = new Date().toISOString()
    supabase.from('appointments')
      .select('contact_numero, starts_at, status, agenda_id, agendas(name)')
      .eq('instancia', instance)
      .gte('starts_at', now)
      .neq('status', 'cancelado')
      .neq('status', 'concluido')
      .order('starts_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const map = {}
          data.forEach(a => {
            if (!a.contact_numero) return
            if (!map[a.contact_numero]) map[a.contact_numero] = {
              starts_at: a.starts_at, status: a.status,
              agenda_name: a.agendas?.name || '',
            }
          })
          setFutureAppts(map)
        }
      })

    const ch = supabase.channel(`convs-appts-${instance}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `instancia=eq.${instance}` },
        () => {
          const ts = new Date().toISOString()
          supabase.from('appointments')
            .select('contact_numero, starts_at, status, agendas(name)')
            .eq('instancia', instance)
            .gte('starts_at', ts)
            .neq('status', 'cancelado')
            .neq('status', 'concluido')
            .order('starts_at', { ascending: true })
            .then(({ data }) => {
              if (data) {
                const map = {}
                data.forEach(a => {
                  if (!a.contact_numero) return
                  if (!map[a.contact_numero]) map[a.contact_numero] = {
                    starts_at: a.starts_at, status: a.status,
                    agenda_name: a.agendas?.name || '',
                  }
                })
                setFutureAppts(map)
              }
            })
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [instance])

  // Carrega contatos salvos
  useEffect(() => {
    if (!instance) return
    supabase.from('saved_contacts').select('*').eq('instancia', instance)
      .then(({ data }) => {
        if (data) {
          const map = {}
          data.forEach(c => { map[c.numero] = c })
          setSavedContacts(map)
        }
      })
    const ch = supabase.channel(`convs-saved-contacts-${instance}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_contacts', filter: `instancia=eq.${instance}` },
        (p) => {
          if (p.eventType === 'DELETE') {
            setSavedContacts(prev => { const n = { ...prev }; delete n[p.old.numero]; return n })
          } else if (p.new) {
            setSavedContacts(prev => ({ ...prev, [p.new.numero]: p.new }))
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [instance])

  // Carrega nomes da tabela clientes (populada pelo n8n) como fallback de nome
  useEffect(() => {
    if (!instance) return
    // Cada empresa pode ter sua propria tabela de contatos (campo companies.contacts_table)
    const contactsTable = session?.company?.contacts_table || 'clientes'
    // Carrega em 2 passos: 1) so nome/session_id/numero (rapido, sem foto)
    //                     2) foto separado em background (nao bloqueia render)
    supabase.from(contactsTable).select('session_id, numero, nome').eq('instancia', instance)
      .then(({ data, error }) => {
        if (error) {
          console.warn('[clientes] erro nomes:', error.message)
          return
        }
        if (!data?.length) return
        const nomeMap = {}
        data.forEach(c => {
          const keys = new Set()
          if (c.session_id) keys.add(c.session_id)
          if (c.numero) {
            keys.add(c.numero)
            const clean = c.numero.replace(/@.*/, '').replace(/\D/g, '')
            if (clean) {
              keys.add(clean)
              keys.add(`${clean}@s.whatsapp.net`)
            }
          }
          keys.forEach(k => {
            if (c.nome && !nomeMap[k]) nomeMap[k] = c.nome
          })
        })
        setClientesMap(nomeMap)
      })

    // Carrega fotos em background (não bloqueia render — UI vai aparecer com avatares
    // padrão e a foto vai preenchendo conforme chega)
    supabase.from(contactsTable).select('session_id, numero, foto').eq('instancia', instance).not('foto', 'is', null)
      .then(({ data, error }) => {
        if (error || !data?.length) return
        const fotoMap = {}
        data.forEach(c => {
          if (!c.foto) return
          const keys = new Set()
          if (c.session_id) keys.add(c.session_id)
          if (c.numero) {
            keys.add(c.numero)
            const clean = c.numero.replace(/@.*/, '').replace(/\D/g, '')
            if (clean) {
              keys.add(clean)
              keys.add(`${clean}@s.whatsapp.net`)
            }
          }
          keys.forEach(k => { if (!fotoMap[k]) fotoMap[k] = c.foto })
        })
        setClientesFotoMap(fotoMap)
      })
  }, [instance, session?.company?.contacts_table])

  // Abre conversa via ?contact=xxxx (vindo da página Contatos)
  useEffect(() => {
    const target = searchParams.get('contact')
    if (!target || loadingContacts) return
    const cleanTarget = target.replace(/\D/g, '')
    const sessionId = `${cleanTarget}@s.whatsapp.net`
    const existing = contacts.find(c => c.session_id === sessionId || c.phone === cleanTarget)
    if (existing) {
      setSelected(existing)
      // Se está finalizada, força aba certa para visualizar
      if (closedMap[existing.session_id]) changeTab('finalizados')
      else if (attendancesMap[existing.session_id]) changeTab('meu-setor')
      else changeTab('recepcao')
    } else {
      const synthetic = { session_id: sessionId, phone: cleanTarget, lastTs: null }
      setContacts(prev => [synthetic, ...prev])
      setSelected(synthetic)
      changeTab('recepcao')
    }
    searchParams.delete('contact')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, loadingContacts])

  // Fecha menu de contexto ao clicar fora
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [contextMenu])

  function openSaveContact(contact) {
    const numero = contact.phone.replace(/\D/g, '')
    const existing = findSaved(savedContacts, numero)
    setSaveContactModal({
      id: existing?.id || null,
      numero,
      nome: existing?.nome || clientesMap[contact.session_id] || '',
      notes: existing?.notes || '',
    })
    setContextMenu(null)
  }

  async function handleSaveContact() {
    if (!saveContactModal?.nome.trim()) return
    setSavingContact(true)
    const { id, numero, nome, notes } = saveContactModal
    const { error } = id
      ? await supabase.from('saved_contacts').update({ nome: nome.trim(), notes: notes?.trim() || null }).eq('id', id)
      : await supabase.from('saved_contacts').insert({
          numero, instancia: instance,
          nome: nome.trim(), notes: notes?.trim() || null,
          created_by_email: session?.user?.email,
        })
    setSavingContact(false)
    if (!error) setSaveContactModal(null)
    else setToast({ message: 'Erro ao salvar: ' + error.message, color: '#DC2626' })
  }

  // Carrega atendimentos ativos (quem está em qual setor + atendente)
  useEffect(() => {
    if (!instance) return
    supabase.from('attendances').select('*').eq('instancia', instance)
      .then(({ data }) => {
        const map = {}
        if (data) data.forEach(r => { map[r.numero] = r })
        setAttendancesMap(map)
        setAttendancesLoaded(true)
      })
  }, [instance])

  // Carrega outros usuários da empresa pra opção de transferir conversa
  useEffect(() => {
    const companyId = session?.company?.id
    if (!companyId) return
    supabase.from('users').select('id, name, email, role').eq('company_id', companyId)
      .then(({ data }) => setCompanyUsers(data || []))
  }, [session?.company?.id])

  // Realtime: attendances
  useEffect(() => {
    if (!instance) return
    const ch = supabase.channel(`convs-attendances-${instance}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances', filter: `instancia=eq.${instance}` },
        (p) => {
          if (p.eventType === 'DELETE') {
            setAttendancesMap(prev => { const n = { ...prev }; delete n[p.old.numero]; return n })
          } else if (p.new) {
            setAttendancesMap(prev => ({ ...prev, [p.new.numero]: p.new }))
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [instance])

  // Carrega todos os contatos únicos da mensagens_geral (apenas WhatsApp)
  useEffect(() => {
    if (!instance) return
    setLoadingContacts(true)
    // Carrega só colunas leves (sem base64/mensagem) das ultimas 2000 mensagens
    // pra montar lista de contatos. Reduz payload em 50-100x.
    supabase.from(CONV_TABLE)
      .select('id, numero, idgrupo, nomegrupo, nome, type, created_at, horaLastMessage, aplicativo, mensagem')
      .eq('instancia', instance)
      .or('aplicativo.eq.whatsapp,aplicativo.is.null')
      .order('id', { ascending: false })
      .limit(2000)
      .then(({ data, error }) => {
        if (!error && data) {
          const seen = new Set()
          const unique = []
          // Indexa quem teve resposta de atendente humano em algum momento
          const hasOutsideHuman = new Set()
          // Mapeia idgrupo → melhor nomegrupo encontrado em qualquer mensagem
          const groupNames = {}
          for (const row of data) {
            const t = (row.type || '').toLowerCase()
            if ((t === 'atendente' || t === 'humano') && row.numero) {
              hasOutsideHuman.add(row.numero)
            }
            if (row.idgrupo && row.nomegrupo) {
              groupNames[row.idgrupo] = row.nomegrupo
            }
          }
          for (const row of data) {
            // Grupo: tem coluna idgrupo OU o numero termina em @g.us (formato antigo)
            const isGroup = !!row.idgrupo || (row.numero || '').includes('@g.us')
            // session_id do contato: pro grupo é o idgrupo (ou numero se vier no formato antigo)
            const sid = isGroup ? (row.idgrupo || row.numero) : row.numero
            if (!sid || seen.has(sid)) continue
            if (isGroupMode !== isGroup) continue
            seen.add(sid)
            const groupNameResolved = isGroup ? (groupNames[sid] || row.nomegrupo || 'Grupo') : null
            // Preview da última msg (primeira linha, 60 chars max, com prefixo do tipo se for atendente)
            const rawMsg = (row.mensagem || '').toString().trim()
            const firstLine = rawMsg.split('\n')[0].replace(/^[^\n:]{1,40}:\s+/, '') // tira prefixo "Nome: "
            const tLow = (row.type || '').toLowerCase()
            const prefix = (tLow === 'atendente' || tLow === 'humano') ? 'Você: ' : (isGroup && row.nome ? `${row.nome}: ` : '')
            const lastMessage = firstLine ? (prefix + firstLine).slice(0, 80) : ''
            unique.push({
              session_id: sid,
              phone: isGroup ? groupNameResolved : formatPhone(sid),
              isGroup,
              groupName: groupNameResolved,
              lastTs: getTimestamp(row),
              lastMessage,
              outsideAssumed: hasOutsideHuman.has(sid),
            })
          }
          setContacts(unique)
        }
        setLoadingContacts(false)
      })
  }, [instance])

  // Carrega sessões encerradas com motivo
  useEffect(() => {
    if (!instance) return
    supabase.from('conversations').select('session_id, reason').eq('instancia', instance)
      .then(({ data }) => {
        if (data) {
          const map = {}
          data.forEach(r => { map[r.session_id] = r.reason || 'resolvido' })
          setClosedMap(map)
        }
        setClosedLoaded(true)
      })
  }, [instance])

  // Auto-encerra tickets sem atividade após AUTO_CLOSE_HOURS horas
  useEffect(() => {
    if (isGroupMode) return  // grupos não encerram automaticamente
    if (autoCloseDone.current || loadingContacts || !closedLoaded || !attendancesLoaded || !instance || !contacts.length) return
    autoCloseDone.current = true

    const cutoff = Date.now() - AUTO_CLOSE_HOURS * 3600_000
    const toClose = contacts.filter(c =>
      !closedMap[c.session_id] &&
      !attendancesMap[c.session_id] &&
      c.lastTs &&
      new Date(c.lastTs).getTime() < cutoff
    )
    if (!toClose.length) return

    toClose.forEach(c => {
      supabase.from('conversations').insert({
        session_id: c.session_id,
        instancia: instance,
        reason: 'auto_encerrado',
        closed_at: new Date().toISOString(),
      }).then(() => {})
      supabase.from('attendances').delete().eq('numero', c.session_id).eq('instancia', instance).then(() => {})
    })

    setClosedMap(prev => {
      const next = { ...prev }
      toClose.forEach(c => { next[c.session_id] = 'auto_encerrado' })
      return next
    })
    setAttendancesMap(prev => {
      const next = { ...prev }
      toClose.forEach(c => { delete next[c.session_id] })
      return next
    })
  }, [loadingContacts, closedLoaded, attendancesLoaded, contacts, closedMap, instance])

  // Realtime: nova mensagem
  useEffect(() => {
    if (!instance) return
    const ch = supabase.channel(`convs-msgs-${instance}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: CONV_TABLE, filter: `instancia=eq.${instance}` },
        (p) => {
          const row = p.new
          if (!row || isToolMessage(row)) return
          // Ignora mensagens que não são do WhatsApp (Instagram tem tela separada)
          if (row.aplicativo && row.aplicativo !== 'whatsapp') return
          const isGroup = !!row.idgrupo || (row.numero || '').includes('@g.us')
          const sid = isGroup ? (row.idgrupo || row.numero) : row.numero
          if (!sid) return
          if (isGroupMode !== isGroup) return
          const ts = getTimestamp(row)

          // Incrementa contador de não-lidas se não esta com essa conversa aberta
          // e (no caso de grupos) se não esta silenciado
          const incomingTypeForUnread = (row.type || '').toLowerCase()
          const isFromMe = incomingTypeForUnread === 'atendente' || incomingTypeForUnread === 'humano'
          const isSilenced = isGroup && mutedGroups.has(sid)
          const isOpen = selectedRef.current?.session_id === sid
          if (!isFromMe && !isOpen && !isSilenced) {
            setUnreadCounts(prev => ({ ...prev, [sid]: (prev[sid] || 0) + 1 }))
          }

          // Reabre ticket encerrado: remove do closed (mantém attendance se já assumido)
          setClosedMap(prev => {
            if (!prev[sid]) return prev
            supabase.from('conversations').delete().eq('session_id', sid).eq('instancia', instance)
            const next = { ...prev }; delete next[sid]; return next
          })

          setContacts(prev => {
            const exists = prev.find(c => c.session_id === sid)
            const incomingType = (row.type || '').toLowerCase()
            const isOutsideHuman = incomingType === 'atendente' || incomingType === 'humano'
            // Preview da última msg
            const rawMsg = (row.mensagem || '').toString().trim()
            const firstLine = rawMsg.split('\n')[0].replace(/^[^\n:]{1,40}:\s+/, '')
            const prefix = isOutsideHuman ? 'Você: ' : (isGroup && row.nome ? `${row.nome}: ` : '')
            const lastMessage = firstLine ? (prefix + firstLine).slice(0, 80) : ''
            if (exists) {
              return [
                { ...exists, lastTs: ts, lastMessage, outsideAssumed: exists.outsideAssumed || isOutsideHuman },
                ...prev.filter(c => c.session_id !== sid)
              ]
            }
            return [{ session_id: sid, phone: isGroup ? (row.nomegrupo || row.nome || 'Grupo') : formatPhone(sid), isGroup, groupName: isGroup ? (row.nomegrupo || row.nome || 'Grupo') : null, lastTs: ts, lastMessage, outsideAssumed: isOutsideHuman }, ...prev]
          })


          if (selectedRef.current?.session_id === sid) {
            const type = getMessageType(row)
            setMessages(msgs => {
              // Dedup: já existe por id
              if (msgs.some(m => m.id === row.id)) return msgs
              // Se é mensagem do atendente, substitui o optimistic pendente
              if (type === 'atendente') {
                const optIdx = msgs.findIndex(m => m._optimistic)
                if (optIdx !== -1) {
                  const next = [...msgs]
                  next[optIdx] = { id: row.id, id_mensagem: row.id_mensagem || null, type, content: getMessageContent(row), base64: row.base64 || null, ts, nome: row.nome || null, mine: row.fromMe === true || row['minha?'] === true || row.minha === true, visualizada: row.visualizada === true }
                  return next
                }
              }
              return [...msgs, { id: row.id, id_mensagem: row.id_mensagem || null, type, content: getMessageContent(row), base64: row.base64 || null, ts, nome: row.nome || null, mine: row.fromMe === true || row['minha?'] === true || row.minha === true, visualizada: row.visualizada === true }]
            })
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: CONV_TABLE, filter: `instancia=eq.${instance}` },
        (p) => {
          const row = p.new
          if (!row) return
          // Atualiza msg local (principalmente pra refletir visualizada=true)
          setMessages(msgs => msgs.map(m => m.id === row.id
            ? { ...m, visualizada: row.visualizada === true, mine: row.fromMe === true || row['minha?'] === true || row.minha === true }
            : m
          ))
        }
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [instance])

  // Realtime: conversa encerrada por outro usuário
  useEffect(() => {
    if (!instance) return
    const ch = supabase.channel(`convs-closed-${instance}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations', filter: `instancia=eq.${instance}` },
        (p) => {
          if (!p.new) return
          setClosedMap(prev => ({ ...prev, [p.new.session_id]: p.new.reason || 'resolvido' }))
          setSelected(prev => prev?.session_id === p.new.session_id ? null : prev)
        }
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [instance])

  // Helper: monta filtro base de mensagens da conversa selecionada
  function buildMessagesQuery() {
    let q = supabase.from(CONV_TABLE).select('*').eq('instancia', instance)
    if (selected.isGroup) {
      q = q.or(`idgrupo.eq.${selected.session_id},numero.eq.${selected.session_id}`)
    } else {
      q = q.eq('numero', selected.session_id).is('idgrupo', null)
    }
    return q
  }

  // Carrega mais mensagens antigas (paginacao) preservando a posicao do scroll
  async function loadMoreMessages() {
    if (!selected || !instance || loadingMore || !messages.length) return
    setLoadingMore(true)
    const oldestId = messages[0]?.id
    // Guarda altura ANTES de prepender pra calcular o delta depois
    const body = chatBodyRef.current
    const prevScrollHeight = body?.scrollHeight || 0
    const prevScrollTop = body?.scrollTop || 0

    const { data, error } = await buildMessagesQuery()
      .lt('id', oldestId)
      .order('id', { ascending: false })
      .limit(MSG_PAGE_SIZE)
    if (!error && data) {
      const ordered = [...data].reverse()
      const novas = ordered.filter(r => !isToolMessage(r)).map(r => ({
        id: r.id,
        id_mensagem: r.id_mensagem || null,
        type: getMessageType(r),
        content: getMessageContent(r),
        base64: r.base64 || null,
        ts: getTimestamp(r),
        nome: r.nome || null,
        mine: r.fromMe === true || r['minha?'] === true || r.minha === true,
        visualizada: r.visualizada === true,
      }))
      isPrependingRef.current = true   // sinaliza pra useEffect nao rolar pro fundo
      setMessages(prev => [...novas, ...prev])
      setHasMoreMsgs(data.length === MSG_PAGE_SIZE)
      // Restaura posicao do scroll: novo scrollTop = (nova altura - antiga) + antigo scrollTop
      requestAnimationFrame(() => {
        if (body) {
          const newScrollHeight = body.scrollHeight
          body.scrollTop = (newScrollHeight - prevScrollHeight) + prevScrollTop
        }
      })
    }
    setLoadingMore(false)
  }

  // Carrega mensagens da conversa selecionada (paginacao: 35 iniciais)
  useEffect(() => {
    if (!selected || !instance) return
    setLoadingMsgs(true)
    setMessages([])
    setHasMoreMsgs(false)
    buildMessagesQuery()
      .order('id', { ascending: false })
      .limit(MSG_PAGE_SIZE)
      .then(({ data, error }) => {
        if (!error && data) {
          const ordered = [...data].reverse()  // volta pra ordem antigas→novas
          setMessages(ordered.filter(r => !isToolMessage(r)).map(r => ({
            id: r.id,
            id_mensagem: r.id_mensagem || null,
            type: getMessageType(r),
            content: getMessageContent(r),
            base64: r.base64 || null,
            ts: getTimestamp(r),
            nome: r.nome || null,
            mine: r.fromMe === true || r['minha?'] === true || r.minha === true,
            visualizada: r.visualizada === true,
          })))
          setHasMoreMsgs(data.length === MSG_PAGE_SIZE)

          // Dispara webhook de presença: avisa o n8n que o atendente abriu a conversa
          // remoteJid = numero do contato ou idgrupo do grupo
          // id_mensagem = última mensagem com id_mensagem preenchido (data vem desc, pega o primeiro)
          const remoteJid = selected.session_id
          const lastIdMensagem = data.find(r => r.id_mensagem)?.id_mensagem || null
          const params = new URLSearchParams({
            instancia: instance || '',
            apikey: apiInstancia || '',
            remoteJid: remoteJid || '',
            id_mensagem: lastIdMensagem || '',
          })
          const url = `https://n8n.nexladesenvolvimento.com.br/webhook/presencademensagem?${params.toString()}`
          console.log('[presenca] disparando GET', url)
          fetch(url, { method: 'GET', mode: 'no-cors' })
            .then(() => console.log('[presenca] ok'))
            .catch(e => console.warn('[presenca] erro:', e))
        }
        setLoadingMsgs(false)
      })
  }, [selected, instance])

  useEffect(() => {
    // Nao rola pro fundo quando estamos prependo msgs antigas (paginacao)
    if (isPrependingRef.current) { isPrependingRef.current = false; return }
    if (!loadingMsgs) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loadingMsgs])

  // Detecta se o usuario rolou pra cima — mostra botao "ir pro fundo"
  useEffect(() => {
    const body = chatBodyRef.current
    if (!body) return
    function onScroll() {
      const distanceFromBottom = body.scrollHeight - body.scrollTop - body.clientHeight
      setShowScrollDown(distanceFromBottom > 200)  // 200px de tolerancia
    }
    body.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => body.removeEventListener('scroll', onScroll)
  }, [selected, messages.length])

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollDown(false)
  }

  // ESC: fecha modais abertos primeiro, depois sai da conversa
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return
      // Não interfere se usuário tá digitando em input/textarea
      const tag = (e.target?.tagName || '').toUpperCase()
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable
      if (isTyping) return

      // Prioridade: fecha modais abertos primeiro
      if (editingMsg)        { setEditingMsg(null); return }
      if (tagPopoverOpen)    { setTagPopoverOpen(false); return }
      if (saveContactModal)  { setSaveContactModal(null); return }
      if (transferModal)     { setTransferModal(null); return }
      if (closeModal)        { setCloseModal(null); return }
      if (contextMenu)       { setContextMenu(null); return }

      // Sem modal aberto: sai da conversa
      if (selected) setSelected(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, editingMsg, tagPopoverOpen, saveContactModal, transferModal, closeModal, contextMenu])

  async function handleAssume(contact, e) {
    e?.stopPropagation()
    if (attendancesMap[contact.session_id] || assuming === contact.session_id) return
    setAssuming(contact.session_id)
    const name = session?.user?.name || 'Atendente'
    const sectorLabel = userSector ? ` (${userSector.name})` : ''

    const attendancePayload = {
      numero: contact.session_id,
      instancia: instance,
      sector_id: userSector?.id || null,
      sector_name: userSector?.name || null,
      sector_color: userSector?.color || '#6B7280',
      attendant_name: name,
      attendant_email: session?.user?.email,
      assumed_at: new Date().toISOString(),
    }
    const { error: attErr } = await supabase.from('attendances').insert(attendancePayload)
    if (attErr) {
      // Já existe — atualiza
      await supabase.from('attendances')
        .update(attendancePayload)
        .eq('numero', contact.session_id)
        .eq('instancia', instance)
    }

    const assumeMsg = `▶ Atendimento assumido por ${name}${sectorLabel}`
    await supabase.rpc('send_mensagem_geral', {
      p_instancia: instance,
      p_numero: contact.session_id,
      p_mensagem: assumeMsg,
      p_type: 'atendente',
      p_hora: new Date().toISOString(),
    })

    // Dispara o webhook do n8n pra mensagem realmente sair pro WhatsApp
    // e a IA travar (a IA só bloqueia quando há envio efetivo de mensagem do atendente)
    fetch('https://n8n.nexladesenvolvimento.com.br/webhook/envioNexla', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: assumeMsg,
        session_id: contact.session_id,
        phone: contact.phone,
        instancia: instance,
        api_instancia: apiInstancia,
        ai_enabled: session?.company?.ai_enabled !== false,
        company: session?.company?.name,
        sender_name: name,
        sender_email: session?.user?.email,
        is_assume_event: true,
      }),
    }).catch(e => console.warn('webhook assumir:', e))

    setAttendancesMap(prev => ({
      ...prev,
      [contact.session_id]: {
        numero: contact.session_id, instancia: instance,
        sector_id: userSector?.id, sector_name: userSector?.name,
        sector_color: userSector?.color || '#6B7280',
        attendant_name: name, attendant_email: session?.user?.email,
      }
    }))
    changeTab('meu-setor')
    setAssuming(null)
  }

  async function handleTransfer() {
    if (!transferModal || !transferringTo || transferring) return
    const target = companyUsers.find(u => u.email === transferringTo)
    if (!target) return
    setTransferring(true)

    // Tenta achar o setor do novo atendente
    const { data: memberData } = await supabase
      .from('sector_members')
      .select('sector_id, sectors(id, name, color)')
      .eq('user_id', target.id)
      .maybeSingle()
    const targetSector = memberData?.sectors || null

    const updated = {
      attendant_name: target.name,
      attendant_email: target.email,
      sector_id:    targetSector?.id ?? null,
      sector_name:  targetSector?.name ?? null,
      sector_color: targetSector?.color ?? '#6B7280',
    }

    const { error } = await supabase
      .from('attendances')
      .update(updated)
      .eq('numero', transferModal.session_id)
      .eq('instancia', instance)

    if (error) {
      setTransferring(false)
      setToast({ message: 'Erro ao transferir: ' + error.message, color: '#DC2626' })
      setTimeout(() => setToast(null), 3500)
      return
    }

    // Mensagem-marco no histórico
    const meName = session?.user?.name || 'Atendente'
    const handoverMsg = `↪ Atendimento transferido por ${meName} para ${target.name}`
    await supabase.rpc('send_mensagem_geral', {
      p_instancia: instance,
      p_numero: transferModal.session_id,
      p_mensagem: handoverMsg,
      p_type: 'atendente',
      p_hora: new Date().toISOString(),
    })

    setAttendancesMap(prev => ({
      ...prev,
      [transferModal.session_id]: {
        ...(prev[transferModal.session_id] || {}),
        ...updated,
      },
    }))
    setTransferring(false)
    setTransferModal(null)
    setTransferringTo('')
    setToast({ message: `Conversa transferida pra ${target.name}`, color: '#7C3AED' })
    setTimeout(() => setToast(null), 3500)
  }

  async function startRecording() {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm'
      const mr = new MediaRecorder(stream, { mimeType })
      mr._stream = stream
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorderRef.current = mr
      recordStartRef.current = Date.now()
      mr.start()
      setRecording(true)
      setRecordTime(0)
      recordTimerRef.current = setInterval(() => {
        setRecordTime(Math.floor((Date.now() - recordStartRef.current) / 1000))
      }, 500)
    } catch (e) {
      console.error('Erro ao acessar microfone:', e)
      setToast({ message: 'Não foi possível acessar o microfone', color: '#DC2626' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  function stopRecording({ persistPreview = true } = {}) {
    return new Promise(resolve => {
      const mr = mediaRecorderRef.current
      if (!mr) return resolve(null)
      mr.onstop = async () => {
        const mimeType = mr.mimeType
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const buf = await blob.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let bin = ''
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
        const base64 = btoa(bin)
        const duration = Math.floor((Date.now() - recordStartRef.current) / 1000)
        const audioData = { base64, mime: mimeType, duration }
        if (persistPreview) setRecordedAudio(audioData)
        mr._stream?.getTracks().forEach(t => t.stop())
        resolve(audioData)
      }
      mr.stop()
      if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null }
      setRecording(false)
    })
  }

  function discardAudio() {
    setRecordedAudio(null)
    setRecordTime(0)
  }

  async function handlePickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const MAX = 15 * 1024 * 1024 // 15 MB
    if (file.size > MAX) {
      setToast({ message: 'Arquivo muito grande (máx 15 MB)', color: '#DC2626' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
    }
    const base64 = btoa(bin)
    const kind = file.type.startsWith('image/') ? 'image'
      : file.type === 'application/pdf' ? 'pdf'
      : 'file'
    setAttachedFile({ base64, mime: file.type || 'application/octet-stream', name: file.name, size: file.size, kind })
  }

  function discardFile() {
    setAttachedFile(null)
  }

  // Helper: usuário atual pode responder essa conversa?
  // Regra: dono da conversa OU admin OU conversa ainda sem atendimento.
  function canRespond(contact) {
    if (!contact) return false
    // Modo grupo: sempre pode responder, sem assumir/encerrar
    if (isGroupMode) return true
    if (closedMap[contact.session_id]) return false
    const att = attendancesMap[contact.session_id]
    if (!att) return true
    if (isAdmin) return true
    return att.attendant_email === session?.user?.email
  }

  async function handleSaveEdit() {
    if (!editingMsg || savingEdit) return
    const newText = (editingMsg.newText || '').trim()
    if (!newText) return
    setSavingEdit(true)

    // Mantém o prefixo "atendente: " se a mensagem original tinha
    const attendantName = session?.user?.name || 'Atendente'
    const finalDb = `${attendantName}: ${newText}`

    // 1) Atualiza no banco
    const { error } = await supabase.from('mensagens_geral')
      .update({ mensagem: finalDb })
      .eq('id', editingMsg.id)

    if (error) {
      setSavingEdit(false)
      setToast({ message: 'Erro ao editar: ' + error.message, color: '#DC2626' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    // 2) Atualiza estado local imediatamente
    setMessages(prev => prev.map(m => m.id === editingMsg.id
      ? { ...m, content: newText, mensagem: finalDb }
      : m))

    // 3) Dispara webhook n8n pra editar no WhatsApp
    const cleanPhone = (selected.session_id || '').replace(/@.*$/, '').replace(/\D/g, '')
    const webhookBody = {
      id: editingMsg.id,
      id_mensagem: editingMsg.id_mensagem || null,
      message: newText,
      session_id: selected.session_id,
      phone: cleanPhone,
      instancia: instance,
      api_instancia: apiInstancia,
      ai_enabled: session?.company?.ai_enabled !== false,
      company: session?.company?.name,
      sender_name: session?.user?.name,
      sender_email: session?.user?.email,
    }
    console.log('[editar] webhook payload:', webhookBody)
    fetch('https://n8n.nexladesenvolvimento.com.br/webhook/envioNexlaeditar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody),
    }).then(r => console.log('[editar] webhook status:', r.status))
      .catch(e => console.warn('[editar] webhook erro:', e))

    setSavingEdit(false)
    setEditingMsg(null)
  }

  async function handleSend() {
    if (sending || !selected) return
    if (!canRespond(selected)) {
      const att = attendancesMap[selected.session_id]
      setToast({
        message: `Conversa em atendimento por ${att?.attendant_name || 'outro atendente'}. Peça pra ele transferir ou finalize antes.`,
        color: '#DC2626',
      })
      setTimeout(() => setToast(null), 4000)
      return
    }
    let audio = recordedAudio
    if (recording) {
      audio = await stopRecording({ persistPreview: false })
    }
    if (!msgText.trim() && !audio && !attachedFile) return
    setSending(true)
    try {
      // Auto-assume se ainda não está atribuído a ninguém
      if (!attendancesMap[selected.session_id] && !closedMap[selected.session_id]) {
        const name = session?.user?.name || 'Atendente'
        const newAtt = {
          numero: selected.session_id, instancia: instance,
          sector_id: userSector?.id || null,
          sector_name: userSector?.name || null,
          sector_color: userSector?.color || '#6B7280',
          attendant_name: name, attendant_email: session?.user?.email,
          assumed_at: new Date().toISOString(),
        }
        await supabase.from('attendances').upsert(newAtt, { onConflict: 'numero,instancia' })
        setAttendancesMap(prev => ({ ...prev, [selected.session_id]: newAtt }))
        changeTab('meu-setor')
      }
      const text = msgText.trim()
      const file = attachedFile
      setMsgText('')
      setRecordedAudio(null)
      setRecordTime(0)
      setAttachedFile(null)

      const filePrefix = file
        ? (file.kind === 'image' ? '🖼️ ' : file.kind === 'pdf' ? '📄 ' : '📎 ') + file.name
        : null
      const attendantName = session?.user?.name || 'Atendente'
      const rawPayload = audio
        ? (text || '🎤 Áudio')
        : file
          ? (text ? `${filePrefix}\n${text}` : filePrefix)
          : text
      // Salva com prefixo do atendente no banco (exibido no histórico)
      const mensagemPayload = `${attendantName}: ${rawPayload}`
      const mediaBase64 = audio?.base64 || file?.base64 || null

      // Optimistic update: mostra a mensagem imediatamente sem esperar o Realtime round-trip
      const optId = `opt-${Date.now()}`
      setMessages(msgs => [...msgs, {
        id: optId,
        id_mensagem: null,
        type: 'atendente',
        content: mensagemPayload,
        base64: mediaBase64,
        ts: new Date().toISOString(),
        _optimistic: true,
      }])

      const { error: insErr } = await supabase.rpc('send_mensagem_geral', {
        p_instancia: instance,
        p_numero: selected.session_id,
        p_mensagem: mensagemPayload,
        p_type: 'atendente',
        p_hora: new Date().toISOString(),
        p_base64: mediaBase64,
      })
      if (insErr) console.error('send_mensagem_geral:', insErr)

      // fromMe e marcado automaticamente pela trigger do banco
      // (trg_mensagens_geral_set_frommemine) quando type='atendente'

      // Se for envio pra grupo, complementa idgrupo/nomegrupo na linha recem inserida
      // (o RPC nao tem esses campos, entao patcheamos aqui)
      if (selected.isGroup) {
        try {
          await new Promise(r => setTimeout(r, 150))
          const { data: latest } = await supabase.from(CONV_TABLE)
            .select('id')
            .eq('instancia', instance)
            .eq('numero', selected.session_id)
            .eq('type', 'atendente')
            .is('idgrupo', null)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (latest?.id) {
            await supabase.from(CONV_TABLE)
              .update({ idgrupo: selected.session_id, nomegrupo: selected.groupName || null })
              .eq('id', latest.id)
          }
        } catch (e) { console.warn('[grupo] patch idgrupo:', e) }
      }

      fetch('https://n8n.nexladesenvolvimento.com.br/webhook/envioNexla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawPayload,
          audio_base64: audio?.base64 || null,
          audio_mime: audio?.mime || null,
          audio_duration: audio?.duration || null,
          file_base64: file?.base64 || null,
          file_mime: file?.mime || null,
          file_name: file?.name || null,
          file_kind: file?.kind || null,
          session_id: selected.session_id,
          phone: selected.phone,
          instancia: instance,
          api_instancia: apiInstancia,
          ai_enabled: session?.company?.ai_enabled !== false,
          company: session?.company?.name,
          sender_name: session?.user?.name,
          sender_email: session?.user?.email,
        }),
      })
      .then(r => r.text())
      .then(async raw => {
        // n8n retorna 3 linhas: instancia, mensagem, id_mensagem
        const lines = (raw || '').split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 3) { console.warn('[envio] resposta n8n inesperada:', raw); return }
        const [respInstancia, respMensagem, respIdMensagem] = lines
        if (!respIdMensagem) return
        // Acha a linha mais recente em mensagens_geral matching (instancia + numero + mensagem)
        const { data: rows, error: findErr } = await supabase
          .from('mensagens_geral')
          .select('id')
          .eq('instancia', respInstancia)
          .eq('numero', selected.session_id)
          .eq('type', 'atendente')
          .is('id_mensagem', null)
          .like('mensagem', `%${respMensagem}`)
          .order('id', { ascending: false })
          .limit(1)
        if (findErr || !rows?.length) {
          console.warn('[envio] linha nao encontrada pra atualizar id_mensagem:', { respInstancia, respMensagem, findErr })
          return
        }
        const rowId = rows[0].id
        await supabase.from('mensagens_geral').update({ id_mensagem: respIdMensagem }).eq('id', rowId)
        // Atualiza estado local pra edição funcionar imediatamente (inclui optimistic ainda pendente)
        setMessages(prev => prev.map(m =>
          (m.id === rowId || m._optimistic) ? { ...m, id: rowId, id_mensagem: respIdMensagem, _optimistic: false } : m
        ))
        console.log('[envio] id_mensagem gravado:', respIdMensagem, 'row:', rowId)
      })
      .catch(e => console.warn('webhook envio:', e))
    } finally {
      setSending(false)
    }
  }

  async function handleReopen(contact) {
    if (!contact || !instance) return
    await supabase.from('conversations').delete().eq('session_id', contact.session_id).eq('instancia', instance)
    await supabase.from('attendances').delete().eq('numero', contact.session_id).eq('instancia', instance)
    setClosedMap(prev => { const n = { ...prev }; delete n[contact.session_id]; return n })
    setAttendancesMap(prev => { const n = { ...prev }; delete n[contact.session_id]; return n })
    changeTab('recepcao')
    setToast({ message: 'Conversa reaberta', color: '#16A34A' })
    setTimeout(() => setToast(null), 2500)
  }

  async function handleClose() {
    if (!reason || !closeModal) return
    setClosing(true)
    const { error } = await supabase.from('conversations').insert({
      session_id: closeModal.session_id,
      instancia: instance,
      reason,
      closed_at: new Date().toISOString(),
    })
    setClosing(false)
    if (error) return
    const closedId = closeModal.session_id
    setClosedMap(prev => ({ ...prev, [closedId]: reason }))
    supabase.from('attendances').delete().eq('numero', closedId).eq('instancia', instance)
    setAttendancesMap(prev => { const n = { ...prev }; delete n[closedId]; return n })
    if (selected?.session_id === closedId) setSelected(null)
    setCloseModal(null)
    setReason('')
    changeTab('finalizados')
    const label = REASONS.find(r => r.value === reason)?.label || reason
    setToast({ message: `Conversa finalizada — ${label}`, color: REASONS.find(r => r.value === reason)?.color || '#16A34A' })
    setTimeout(() => setToast(null), 3500)
  }

  const closed = new Set(Object.keys(closedMap))
  const recepcao    = contacts.filter(c => !closed.has(c.session_id) && !attendancesMap[c.session_id])
  const meuSetor    = contacts.filter(c => !closed.has(c.session_id) && attendancesMap[c.session_id] &&
    (isAdmin || !userSector || attendancesMap[c.session_id].sector_id === userSector.id))
  const finalizados = contacts.filter(c => closed.has(c.session_id))

  const tabList = [
    { id: 'recepcao',    label: 'Recepção',              icon: Inbox,      count: recepcao.length },
    { id: 'meu-setor',  label: isAdmin ? 'Setores' : 'Meu setor', icon: UserCheck, count: meuSetor.length },
    { id: 'finalizados', label: 'Finalizados',            icon: Archive,    count: finalizados.length },
  ]

  const currentList = isGroupMode
    ? contacts  // tela de grupos mostra todos sem distincao de tabs
    : tab === 'recepcao' ? recepcao : tab === 'meu-setor' ? meuSetor : finalizados
  const filtered = currentList.filter(c => c.phone.toLowerCase().includes(search.toLowerCase()))
  const isClosed = (selected && !isGroupMode) ? closed.has(selected.session_id) : false

  return (
    <div className={`contacts-root${selected ? ' has-chat' : ''}`}>
      <div className="contacts-list">
        {/* Header dedicado para grupos */}
        {isGroupMode && (
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Users size={16} style={{ color: '#7C3AED' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Grupos
            </div>
            {contacts.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE',
              }}>
                {contacts.length}
              </span>
            )}
          </div>
        )}

        {/* Abas só no modo individual */}
        {!isGroupMode && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          {tabList.map(t => (
            <button
              key={t.id}
              onClick={() => { changeTab(t.id); setSelected(null) }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: tab === t.id ? '2px solid #2563EB' : '2px solid transparent',
                color: tab === t.id ? '#2563EB' : 'var(--text-muted)',
                fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              <t.icon size={14} />
              {t.label}
              {t.count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 20, padding: '0 4px',
                  background: tab === t.id ? '#2563EB' : '#E2E8F0',
                  color: tab === t.id ? '#fff' : 'var(--text-muted)',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        )}

        <div className="contacts-list-header" style={{ paddingTop: 10 }}>
          <input
            className="contacts-search"
            placeholder={isGroupMode ? "Buscar grupo..." : "Buscar por telefone..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="contacts-list-body">
          {loadingContacts && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
          )}
          {!loadingContacts && filtered.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Nenhuma conversa aqui.
            </div>
          )}
          {filtered.map(c => {
            const att = attendancesMap[c.session_id]
            const isAssuming = assuming === c.session_id
            const closedReason = closedMap[c.session_id]
            const rs = closedReason ? REASONS.find(r => r.value === closedReason) : null
            const cleanNum = c.phone.replace(/\D/g, '')
            const saved = findSaved(savedContacts, cleanNum)
            const clienteNome = !saved ? (clientesMap[c.session_id] || null) : null
            const clienteFoto = clientesFotoMap[c.session_id] || clientesFotoMap[cleanNum] || null
            const photoSrc = saved?.photo || (clienteFoto ? toImgSrc(clienteFoto) : null)
            const displayName = saved?.nome || clienteNome || null
            const nextAppt = futureAppts[cleanNum]
            return (
              <div
                key={c.session_id}
                className={`contact-item ${selected?.session_id === c.session_id ? 'selected' : ''}`}
                onClick={() => { setSelected(c); setUnreadCounts(prev => { if (!prev[c.session_id]) return prev; const next = { ...prev }; delete next[c.session_id]; return next }) }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ x: e.clientX, y: e.clientY, contact: c })
                }}
              >
                <div className="contact-avatar" style={
                  photoSrc ? { background: 'transparent', overflow: 'hidden' } :
                  c.isGroup ? { background: '#EDE9FE', color: '#7C3AED' } : {}
                }>
                  {photoSrc
                    ? <img src={photoSrc} alt={displayName || c.phone} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : c.isGroup
                      ? <Users size={14} />
                      : displayName
                        ? <span style={{ fontWeight: 700, fontSize: 12, color: '#2563EB' }}>{displayName.charAt(0).toUpperCase()}</span>
                        : <User size={14} style={{ opacity: 0.4 }} />}
                </div>
                <div className="contact-info" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <div className="contact-name" style={(displayName || c.isGroup) ? { fontWeight: 600 } : {}}>
                      {displayName || c.phone}
                    </div>
                    {c.isGroup && !isGroupMode && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', lineHeight: '16px' }}>
                        <Users size={9} /> Grupo
                      </span>
                    )}
                    {displayName && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.phone}</span>
                    )}
                    {nextAppt && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                        color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE',
                        lineHeight: '16px',
                      }}>
                        <Calendar size={9} /> {formatApptShort(nextAppt.starts_at)}
                      </span>
                    )}
                    {!isGroupMode && tab === 'recepcao' && c.outsideAssumed && (
                      <span title="Alguém respondeu direto pelo WhatsApp, fora da plataforma" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', lineHeight: '16px' }}>
                        <PhoneCall size={9} /> Atendido fora
                      </span>
                    )}
                    {!isGroupMode && tab === 'recepcao' && aiEnabled && !c.outsideAssumed && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', lineHeight: '16px' }}>
                        <Sparkles size={9} /> IA
                      </span>
                    )}
                    {!isGroupMode && tab === 'meu-setor' && att && (
                      <>
                        {att.sector_name && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, color: '#fff', background: att.sector_color || '#6B7280', lineHeight: '16px' }}>
                            {att.sector_name}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', lineHeight: '16px' }}>
                          <Headset size={9} /> {att.attendant_name?.split(' ')[0]}
                        </span>
                      </>
                    )}
                    {!isGroupMode && tab === 'finalizados' && rs && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, color: rs.color, background: rs.bg, border: `1px solid ${rs.border}`, lineHeight: '16px' }}>{rs.label}</span>
                    )}
                  </div>
                  {c.lastMessage && (
                    <div style={{
                      fontSize: 12, color: 'var(--text-muted)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}>
                      {c.lastMessage}
                    </div>
                  )}
                  {!isGroupMode && tab === 'recepcao' && (
                    <button
                      onClick={e => handleAssume(c, e)}
                      disabled={isAssuming}
                      style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: '#16A34A', color: '#fff', border: 'none', cursor: 'pointer', opacity: isAssuming ? 0.6 : 1 }}
                    >
                      <Headset size={10} />
                      {isAssuming ? 'Assumindo...' : 'Assumir atendimento'}
                    </button>
                  )}
                </div>
                <div className="contact-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {c.lastTs && <div className="contact-time">{formatContactTime(c.lastTs)}</div>}
                  {unreadCounts[c.session_id] > 0 && (
                    <span style={{
                      minWidth: 18, height: 18, padding: '0 6px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 20, background: '#2563EB', color: '#fff',
                      fontSize: 10, fontWeight: 700, lineHeight: 1,
                    }}>{unreadCounts[c.session_id]}</span>
                  )}
                  {c.isGroup && mutedGroups.has(c.session_id) && (
                    <span title="Grupo silenciado" style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔕</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="chat-panel">
        {!selected ? (
          <div className="chat-empty">
            <MessageSquare size={32} style={{ opacity: 0.2 }} />
            <div style={{ fontSize: 14 }}>Selecione uma conversa</div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => setSelected(null)} aria-label="Voltar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              {(() => {
                const cleanNum = selected.phone.replace(/\D/g, '')
                const saved = findSaved(savedContacts, cleanNum)
                const headerName = saved?.nome || clientesMap[selected.session_id] || null
                const headerFotoRaw = clientesFotoMap[selected.session_id] || clientesFotoMap[cleanNum] || null
                const headerPhoto = saved?.photo || (headerFotoRaw ? toImgSrc(headerFotoRaw) : null)
                return (
                  <>
                    <div className="contact-avatar"
                      style={{
                        width: 38, height: 38,
                        background: headerPhoto ? 'transparent' : undefined,
                        overflow: 'hidden',
                        cursor: saved ? 'pointer' : 'default',
                      }}
                      onClick={() => saved && navigate(`/painel/contatos/${saved.id}`)}
                      title={saved ? 'Abrir ficha do cliente' : ''}
                    >
                      {headerPhoto
                        ? <img src={headerPhoto} alt={headerName || selected.phone} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : headerName
                          ? <span style={{ fontWeight: 700, fontSize: 14, color: '#2563EB' }}>{headerName.charAt(0).toUpperCase()}</span>
                          : <User size={14} style={{ opacity: 0.4 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)', cursor: saved ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => saved && navigate(`/painel/contatos/${saved.id}`)}
                      >
                        {headerName || selected.phone}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                        <span style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>
                          {headerName ? selected.phone : ''}
                        </span>
                        {!loadingMsgs && <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{messages.length} msg</span>}
                      </div>
                    </div>
                  </>
                )
              })()}
              {!isClosed && !isGroupMode && (() => {
                const cleanNum = selected.phone.replace(/\D/g, '')
                const saved = findSaved(savedContacts, cleanNum)
                const nome = saved?.nome || clientesMap[selected.session_id] || ''
                const hasContact = !!saved
                const att = attendancesMap[selected.session_id]
                const isOwner = att && att.attendant_email === session?.user?.email
                const canClose = !att || isAdmin || att.attendant_email === session?.user?.email
                const canTransfer = att && (isOwner || isAdmin)
                return (
                  <>
                    {/* Desktop: botões com texto */}
                    <div className="chat-header-actions-desktop">
                      <button className="nx-btn-ghost"
                        style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, color: hasContact ? '#16A34A' : '#C9A074', borderColor: hasContact ? '#BBF7D0' : '#F0E0B6', background: hasContact ? '#F0FDF4' : '#FFFBEB' }}
                        title={hasContact ? `Já salvo como ${saved.nome}` : 'Salvar contato'}
                        onClick={() => openSaveContact(selected)}>
                        {hasContact ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        {hasContact ? `Editar ${saved.nome.split(' ')[0]}` : 'Salvar'}
                      </button>
                      <button className="nx-btn-ghost"
                        style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, color: '#7C3AED' }}
                        onClick={() => navigate(`/painel/agenda?numero=${cleanNum}${nome ? `&nome=${encodeURIComponent(nome)}` : ''}`)}>
                        <Calendar size={14} /> Agendar
                      </button>
                      {canTransfer && (
                        <button className="nx-btn-ghost"
                          style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, color: '#0891B2' }}
                          onClick={() => { setTransferModal(selected); setTransferringTo('') }}>
                          <ArrowRightLeft size={14} /> Transferir
                        </button>
                      )}
                      {canClose && (
                        <button className="nx-btn-ghost"
                          style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => { setCloseModal(selected); setReason('') }}>
                          <CheckCircle2 size={14} /> Finalizar
                        </button>
                      )}
                    </div>

                    {/* Botão Tag — aparece pra todos os contatos */}
                    {(() => {
                      const tags = (saved?.tags) || []
                      async function ensureSavedAndGetId() {
                        if (saved?.id) return saved.id
                        // Verifica se já existe antes de inserir (evita duplicata)
                        const { data: existing } = await supabase.from('saved_contacts')
                          .select('*').eq('numero', cleanNum).eq('instancia', instance).maybeSingle()
                        if (existing) {
                          setSavedContacts(prev => ({ ...prev, [cleanNum]: existing }))
                          return existing.id
                        }
                        // Auto-salva com o número como nome temporário
                        const { data } = await supabase.from('saved_contacts').insert({
                          numero: cleanNum, instancia: instance,
                          nome: cleanNum,
                          created_by_email: session?.user?.email,
                        }).select().single()
                        if (data) {
                          setSavedContacts(prev => ({ ...prev, [cleanNum]: data }))
                          return data.id
                        }
                        return null
                      }
                      async function addTag() {
                        const t = tagInput.trim().toLowerCase()
                        if (!t || tags.includes(t)) { setTagInput(''); return }
                        setSavingTag(true)
                        const id = await ensureSavedAndGetId()
                        if (!id) { setSavingTag(false); return }
                        const newTags = [...tags, t]
                        await supabase.from('saved_contacts').update({ tags: newTags }).eq('id', id)
                        setSavedContacts(prev => ({ ...prev, [cleanNum]: { ...prev[cleanNum], tags: newTags } }))
                        setSavingTag(false)
                        setTagInput('')
                      }
                      async function removeTag(tag) {
                        if (!saved?.id) return
                        const newTags = tags.filter(x => x !== tag)
                        await supabase.from('saved_contacts').update({ tags: newTags }).eq('id', saved.id)
                        setSavedContacts(prev => ({ ...prev, [cleanNum]: { ...prev[cleanNum], tags: newTags } }))
                      }
                      return (
                        <div style={{ position: 'relative' }}>
                          <button
                            title="Gerenciar tags"
                            onClick={() => { setTagPopoverOpen(v => !v); setTagInput('') }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: tags.length ? '#F5F3FF' : 'var(--bg-hover)',
                              border: `1px solid ${tags.length ? '#DDD6FE' : 'var(--border)'}`,
                              borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
                              color: tags.length ? '#7C3AED' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                            }}>
                            <Tag size={14} />
                            <span className="tag-btn-label">{tags.length > 0 ? tags.length : 'Tag'}</span>
                          </button>
                          {tagPopoverOpen && (() => {
                            const q = tagInput.trim().toLowerCase()
                            const suggestions = allKnownTags
                              .filter(t => !tags.includes(t))
                              .filter(t => !q || t.includes(q))
                              .slice(0, 8)
                            return (
                              <>
                                {/* Backdrop só no mobile */}
                                <div className="tag-popover-backdrop" onClick={() => setTagPopoverOpen(false)} />
                                <div className="tag-popover" style={{ overflow: 'hidden' }}>
                                {/* Header */}
                                <div style={{
                                  padding: '12px 14px 8px',
                                  background: 'linear-gradient(180deg, #FAFAFF 0%, #fff 100%)',
                                  borderBottom: tags.length > 0 ? '1px solid var(--border)' : 'none',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Tag size={12} style={{ color: '#7C3AED' }} />
                                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Tags · {saved?.nome?.split(' ')[0] || cleanNum?.slice(-4)}
                                      </span>
                                    </div>
                                    {tags.length > 0 && (
                                      <span style={{ fontSize: 10, color: 'var(--text-muted)', background: '#F1F5F9', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>
                                        {tags.length}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Tags atuais */}
                                {tags.length > 0 && (
                                  <div style={{ padding: '10px 14px', display: 'flex', gap: 5, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
                                    {tags.map(t => (
                                      <TagBadge key={t} tag={t} onRemove={() => removeTag(t)} />
                                    ))}
                                  </div>
                                )}

                                {/* Input */}
                                <div style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                      autoFocus
                                      style={{
                                        flex: 1, fontSize: 13, padding: '8px 12px',
                                        background: '#F8FAFC', border: '1px solid var(--border)',
                                        borderRadius: 8, outline: 'none', color: 'var(--text-primary)',
                                        transition: 'all 0.15s',
                                      }}
                                      onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
                                      onBlur={e => { e.target.style.background = '#F8FAFC'; e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                                      placeholder={tags.length ? 'Adicionar outra...' : 'Ex: vip, urgente, trabalhista'}
                                      value={tagInput}
                                      onChange={e => setTagInput(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && addTag()}
                                    />
                                    <button
                                      onClick={addTag}
                                      disabled={savingTag || !tagInput.trim()}
                                      style={{
                                        padding: '0 14px',
                                        background: tagInput.trim() ? '#7C3AED' : '#E2E8F0',
                                        color: tagInput.trim() ? '#fff' : '#94A3B8',
                                        border: 'none', borderRadius: 8,
                                        cursor: tagInput.trim() ? 'pointer' : 'not-allowed',
                                        fontWeight: 700, fontSize: 13,
                                        transition: 'all 0.15s',
                                        boxShadow: tagInput.trim() ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
                                      }}>
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Sugestões */}
                                {suggestions.length > 0 && (
                                  <div style={{ padding: '0 14px 12px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                      {q ? 'Sugestões' : 'Já usadas'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                      {suggestions.map(t => {
                                        const { bg, color, border } = tagColor(t)
                                        return (
                                          <button key={t}
                                            onClick={() => { setTagInput(t); setTimeout(addTag, 0) }}
                                            style={{
                                              display: 'inline-flex', alignItems: 'center', gap: 3,
                                              background: bg, color, border: `1px dashed ${border}`,
                                              borderRadius: 20, padding: '3px 10px',
                                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                              transition: 'all 0.15s', opacity: 0.85,
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderStyle = 'solid' }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.borderStyle = 'dashed' }}>
                                            <Plus size={9} /> {t}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Footer dica */}
                                {!tags.length && !suggestions.length && (
                                  <div style={{ padding: '0 14px 12px', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    Tags ajudam a categorizar clientes.
                                    Ex: <strong style={{ color: 'var(--text-secondary)' }}>vip</strong>, <strong style={{ color: 'var(--text-secondary)' }}>trabalhista</strong>, <strong style={{ color: 'var(--text-secondary)' }}>urgente</strong>.
                                  </div>
                                )}
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      )
                    })()}

                    {/* Mobile: ícones compactos + menu ⋮ */}
                    <div className="chat-header-actions-mobile">
                      <button style={{ background: hasContact ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${hasContact ? '#BBF7D0' : '#F0E0B6'}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: hasContact ? '#16A34A' : '#C9A074' }}
                        onClick={() => openSaveContact(selected)} title={hasContact ? 'Editar contato' : 'Salvar contato'}>
                        {hasContact ? <UserCheck size={16} /> : <UserPlus size={16} />}
                      </button>
                      <button style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#7C3AED' }}
                        onClick={() => navigate(`/painel/agenda?numero=${cleanNum}${nome ? `&nome=${encodeURIComponent(nome)}` : ''}`)}>
                        <Calendar size={16} />
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                          onClick={() => setChatActionsOpen(v => !v)}>
                          <MoreVertical size={16} />
                        </button>
                        {chatActionsOpen && (
                          <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 180, overflow: 'hidden' }}
                            onMouseLeave={() => setChatActionsOpen(false)}>
                            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#7C3AED', textAlign: 'left' }}
                              onClick={() => { setTagPopoverOpen(true); setChatActionsOpen(false) }}>
                              <Tag size={14} /> Gerenciar tags
                            </button>
                            {canTransfer && (
                              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#0891B2', textAlign: 'left', borderTop: hasContact ? '1px solid var(--border)' : 'none' }}
                                onClick={() => { setTransferModal(selected); setTransferringTo(''); setChatActionsOpen(false) }}>
                                <ArrowRightLeft size={14} /> Transferir
                              </button>
                            )}
                            {canClose && (
                              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left', borderTop: (hasContact || canTransfer) ? '1px solid var(--border)' : 'none' }}
                                onClick={() => { setCloseModal(selected); setReason(''); setChatActionsOpen(false) }}>
                                <CheckCircle2 size={14} /> Finalizar conversa
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )
              })()}
              {isClosed && (() => {
                const rs = REASONS.find(r => r.value === closedMap[selected.session_id])
                return rs ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    color: rs.color, background: rs.bg, border: `1px solid ${rs.border}`,
                  }}>{rs.label}</span>
                ) : null
              })()}
            </div>

            {/* Banner: conversa assumida por outro atendente (não-dono e não-admin) */}
            {(() => {
              if (isClosed) return null
              const att = attendancesMap[selected.session_id]
              if (!att) return null
              const isOwner = att.attendant_email === session?.user?.email
              if (isOwner || isAdmin) return null
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  background: 'linear-gradient(90deg, #FEF3C7 0%, #FED7AA 100%)',
                  borderBottom: '1px solid #FDBA74',
                  padding: '10px 20px', flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#92400E' }}>
                    <Lock size={14} style={{ color: '#D97706' }} />
                    <span>
                      Conversa em atendimento por <strong>{att.attendant_name}</strong> — você não pode responder.
                      Peça pra ele <strong>transferir</strong> ou aguarde a conversa ser finalizada pra abrir novo ticket.
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* Banner Recepção: botão assumir
                Nova lógica: se já tem mensagem de atendente/humano no histórico,
                significa que alguém respondeu por fora (direto no WhatsApp) — mostra
                aviso laranja em vez do banner azul "sob IA". */}
            {(() => {
              if (isGroupMode) return null
              if (isClosed || attendancesMap[selected.session_id]) return null
              const respondidaPorFora = messages.some(m => {
                const t = (m.type || '').toLowerCase()
                return t === 'atendente' || t === 'humano'
              })
              if (respondidaPorFora) {
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(90deg, #FFFBEB 0%, #FEF3C7 100%)',
                    borderBottom: '1px solid #FDE68A',
                    padding: '10px 20px', flexShrink: 0, gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#92400E' }}>
                      <PhoneCall size={15} style={{ color: '#D97706' }} />
                      <span>Conversa atendida <strong>direto no WhatsApp</strong> (fora da plataforma) — IA não está mais respondendo</span>
                    </div>
                    <button
                      onClick={e => handleAssume(selected, e)}
                      disabled={assuming === selected.session_id}
                      title="Trazer essa conversa pro seu setor pra continuar dentro da plataforma"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        background: 'transparent', color: '#92400E',
                        border: '1.5px solid #D97706',
                        borderRadius: 8, padding: '8px 16px',
                        fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        opacity: assuming === selected.session_id ? 0.6 : 1,
                        flexShrink: 0,
                      }}>
                      <UserCheck size={14} />
                      {assuming === selected.session_id ? 'Trazendo...' : 'Trazer pro meu setor'}
                    </button>
                  </div>
                )
              }
              return (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: aiEnabled ? '#EFF6FF' : '#F8FAFC',
                borderBottom: `1px solid ${aiEnabled ? '#BFDBFE' : 'var(--border)'}`,
                padding: '10px 20px', flexShrink: 0, gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: aiEnabled ? '#1E40AF' : 'var(--text-secondary)' }}>
                  {aiEnabled ? (
                    <>
                      <Sparkles size={15} style={{ color: '#2563EB' }} />
                      <span>Conversa sob atendimento da <strong>IA</strong></span>
                    </>
                  ) : (
                    <>
                      <Inbox size={15} style={{ color: '#64748B' }} />
                      <span>Conversa aguardando atendimento</span>
                    </>
                  )}
                </div>
                <button
                  onClick={e => handleAssume(selected, e)}
                  disabled={assuming === selected.session_id}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#16A34A', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px 22px',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                    opacity: assuming === selected.session_id ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  <Headset size={16} />
                  {assuming === selected.session_id ? 'Assumindo...' : 'Assumir atendimento'}
                </button>
              </div>
              )
            })()}

            {/* Banner Finalizados */}
            {isClosed && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#F8FAFC', borderBottom: '1px solid var(--border)',
                padding: '8px 18px', flexShrink: 0,
                fontSize: 12, color: 'var(--text-muted)',
              }}>
                <Archive size={13} />
                <span style={{ flex: 1 }}>
                  Conversa encerrada. Se o cliente enviar nova mensagem, um novo ticket será aberto automaticamente.
                </span>
                <button
                  onClick={() => handleReopen(selected)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: '#2563EB', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '5px 12px',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <MessageSquare size={11} /> Reabrir conversa
                </button>
              </div>
            )}

            <div className="chat-body" ref={chatBodyRef}>
              {loadingMsgs && (
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: '2rem' }}>
                  Carregando mensagens...
                </div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: '2rem' }}>Sem mensagens.</div>
              )}
              {!loadingMsgs && hasMoreMsgs && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 12px' }}>
                  <button
                    onClick={loadMoreMessages}
                    disabled={loadingMore}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#fff', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '6px 16px',
                      fontSize: 12, fontWeight: 600, color: '#2563EB',
                      cursor: loadingMore ? 'wait' : 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      opacity: loadingMore ? 0.7 : 1,
                    }}>
                    {loadingMore ? 'Carregando...' : '↑ Carregar mais mensagens'}
                  </button>
                </div>
              )}
              {messages.map((msg, mi) => {
                // Divisor de data: mostra antes do 1o msg do dia
                const prev = mi > 0 ? messages[mi - 1] : null
                const curDay = msg.ts ? new Date(msg.ts).toDateString() : null
                const prevDay = prev?.ts ? new Date(prev.ts).toDateString() : null
                const showDayDivider = curDay && curDay !== prevDay

                const isCliente    = msg.type === 'cliente'
                const isAtendente  = msg.type === 'atendente'

                // Extrai nome do prefixo "Nome: " do conteudo (msgs enviadas pelo painel/grupo)
                const prefixMatch = (msg.content || '').match(/^([^\n:]{1,40}):\s+/)
                const senderFromPrefix = prefixMatch ? prefixMatch[1].trim() : null
                // Em grupo: minha mensagem (atendente cujo nome bate com o user logado) vai pra direita
                // Regra: atendente / fromMe = direita | cliente = esquerda | IA = direita
                // msg.mine inclui fromMe (envio direto pelo WhatsApp)
                const isMine       = msg.mine === true || isAtendente
                const isMineInGroup = isGroupMode && isMine
                const isLeft       = isGroupMode
                  ? !isMineInGroup                  // grupo: minha = direita, outros = esquerda
                  : (isCliente && !msg.mine)        // individual: cliente = esquerda, exceto se fromMe=true
                const isImage      = isCliente && /^(esta imagem|a imagem|esse documento|este documento|essa imagem|o documento|a foto|essa foto)/i.test(msg.content.trim())
                const labelColor   = isGroupMode ? '#2563EB' : (isCliente ? 'var(--text-muted)' : isAtendente ? '#16A34A' : '#2563EB')
                return (
                  <div key={msg.id}>
                    {showDayDivider && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '16px 0 12px',
                      }}>
                        <span style={{
                          background: 'rgba(15,23,42,0.06)', color: 'var(--text-secondary)',
                          fontSize: 11, fontWeight: 600, padding: '4px 12px',
                          borderRadius: 20, letterSpacing: 0.2,
                          textTransform: 'capitalize',
                        }}>
                          {formatDayDivider(msg.ts)}
                        </span>
                      </div>
                    )}
                    <div className="msg-label" style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      justifyContent: isLeft ? 'flex-start' : 'flex-end',
                      color: labelColor,
                    }}>
                      {isGroupMode
                        ? <><User size={10} /> {senderFromPrefix || msg.nome || 'Participante'}</>
                        : isCliente
                          ? <><User size={10} /> Cliente</>
                          : isAtendente
                            ? <><Headset size={10} /> {senderFromPrefix || msg.nome || 'Atendente'}</>
                            : <><Bot size={10} /> IA</>}
                    </div>
                    <div className={`msg-row ${isLeft ? 'ai' : 'client'}`}>
                      {(() => {
                        const media = detectMedia(msg.base64)
                        // Remove prefixo "Nome: " do conteudo (ja exibido no label)
                        const rawContent = senderFromPrefix
                          ? (msg.content || '').slice(prefixMatch[0].length)
                          : (msg.content || '')
                        const fileLineMatch = rawContent.match(/^(🎤 Áudio|🖼️ [^\n]+|📄 [^\n]+|📎 [^\n]+)(\n([\s\S]*))?$/)
                        const fileLine = fileLineMatch?.[1] || null
                        const extraText = fileLineMatch?.[3]?.trim() || ''
                        const isPlaceholder = !!fileLine
                        const displayContent = isPlaceholder ? extraText : rawContent
                        const hasOnlyMedia = media && !displayContent
                        // Bolha azul pra qualquer mensagem do lado direito (minha/atendente/IA/etc)
                        const bubbleStyle = !isLeft
                          ? hasOnlyMedia
                            ? { background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' }
                            : { background: '#2563EB', color: '#fff', borderBottomRightRadius: 4 }
                          : hasOnlyMedia
                            ? { background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' }
                            : {}
                        const isEditing = editingMsg?.id === msg.id
                        return (
                          <div className="msg-bubble" style={{ ...bubbleStyle, position: 'relative' }}
                            onMouseEnter={e => { if (isAtendente && !isEditing) e.currentTarget.querySelector('.msg-edit-btn')?.style.setProperty('opacity', '1') }}
                            onMouseLeave={e => { if (isAtendente && !isEditing) e.currentTarget.querySelector('.msg-edit-btn')?.style.setProperty('opacity', '0') }}>
                            {isAtendente && !isEditing && !hasOnlyMedia && !msg._optimistic && (
                              <button
                                className="msg-edit-btn"
                                onClick={() => {
                                  // Strip prefixo "Nome: " ao iniciar edição (só fica o conteúdo)
                                  const clean = displayContent.replace(/^[^\n:]{1,40}:\s+/, '')
                                  setEditingMsg({ id: msg.id, id_mensagem: msg.id_mensagem, newText: clean })
                                }}
                                title="Editar mensagem"
                                style={{
                                  position: 'absolute', top: -10, right: -10,
                                  width: 26, height: 26, borderRadius: '50%',
                                  background: '#fff', border: '1px solid #2563EB',
                                  color: '#2563EB', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  opacity: 0, transition: 'opacity 0.15s',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)', zIndex: 2,
                                }}>
                                <Pencil size={11} />
                              </button>
                            )}
                            {media && (() => {
                              const src = `data:${media.mime};base64,${msg.base64}`
                              if (media.type === 'audio') return (
                                <audio controls src={src} style={{ width: 280, maxWidth: '100%', display: 'block', marginBottom: hasOnlyMedia ? 0 : 6 }} />
                              )
                              if (media.type === 'image') return (
                                <img src={src} alt="mídia" style={{ maxWidth: 280, width: '100%', borderRadius: 8, display: 'block', marginBottom: hasOnlyMedia ? 0 : 6, cursor: 'zoom-in' }}
                                  onClick={() => setLightbox(src)} />
                              )
                              if (media.type === 'pdf') {
                                const fileName = (fileLine || '').replace(/^📄\s*/, '').trim() || 'documento.pdf'
                                return (
                                  <a href={src} download={fileName} target="_blank" rel="noreferrer"
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 10,
                                      background: '#FEF2F2', border: '1px solid #FECACA',
                                      borderRadius: 8, padding: '10px 14px', textDecoration: 'none',
                                      minWidth: 220, marginBottom: hasOnlyMedia ? 0 : 6,
                                    }}>
                                    <div style={{
                                      width: 36, height: 36, borderRadius: 6, background: '#FEE2E2',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: '#DC2626', fontWeight: 700, fontSize: 11, flexShrink: 0,
                                    }}>PDF</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {fileName}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#6B7280' }}>Clique para baixar/abrir</div>
                                    </div>
                                  </a>
                                )
                              }
                              return null
                            })()}
                            {isImage && !msg.base64 && (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                fontSize: 11, fontWeight: 600, color: '#6B7280',
                                background: '#F3F4F6', border: '1px solid #E5E7EB',
                                borderRadius: 6, padding: '2px 8px', marginBottom: 6,
                              }}>🖼️ Imagem enviada</div>
                            )}
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                                <textarea
                                  autoFocus
                                  value={editingMsg.newText}
                                  onChange={e => setEditingMsg(p => ({ ...p, newText: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit() }
                                    if (e.key === 'Escape') setEditingMsg(null)
                                  }}
                                  rows={Math.min(4, (editingMsg.newText || '').split('\n').length)}
                                  style={{
                                    width: '100%', resize: 'vertical', minHeight: 60,
                                    background: 'rgba(255,255,255,0.95)', color: '#0F172A',
                                    border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8,
                                    padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                                  }}
                                />
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <button onClick={() => setEditingMsg(null)}
                                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                                    Cancelar
                                  </button>
                                  <button onClick={handleSaveEdit} disabled={savingEdit || !editingMsg.newText?.trim()}
                                    style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', background: '#fff', color: '#2563EB', cursor: 'pointer', opacity: savingEdit ? 0.6 : 1 }}>
                                    {savingEdit ? 'Salvando...' : 'Salvar'}
                                  </button>
                                </div>
                              </div>
                            ) : displayContent && (
                              <span style={{ whiteSpace: 'pre-wrap' }}>{renderRichText(displayContent)}</span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    {msg.ts && (
                      <div className="msg-time" style={{ textAlign: isLeft ? 'left' : 'right' }}>
                        {formatMsgTime(msg.ts)}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
              {showScrollDown && (
                <button
                  onClick={scrollToBottom}
                  title="Ir para o fim"
                  style={{
                    position: 'sticky', bottom: 12, left: '100%',
                    marginLeft: -52, marginTop: -56, marginBottom: 8,
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#fff', border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    color: '#2563EB', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10,
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
              )}
            </div>

            {!isClosed && (
              <div className="chat-input-bar" style={{ padding: '12px 18px', borderTop: '0.5px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                {attachedFile && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#EFF6FF', border: '1px solid #BFDBFE',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 8,
                  }}>
                    {attachedFile.kind === 'image' ? (
                      <img src={`data:${attachedFile.mime};base64,${attachedFile.base64}`}
                        alt={attachedFile.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 6,
                        background: attachedFile.kind === 'pdf' ? '#FEE2E2' : '#E5E7EB',
                        color: attachedFile.kind === 'pdf' ? '#DC2626' : '#6B7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <FileText size={20} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {attachedFile.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {(attachedFile.size / 1024).toFixed(0)} KB · {attachedFile.kind === 'pdf' ? 'PDF' : attachedFile.kind === 'image' ? 'Imagem' : 'Arquivo'}
                      </div>
                    </div>
                    <button onClick={discardFile} title="Remover arquivo"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        color: '#DC2626', borderRadius: 6, padding: '5px 10px',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                      }}>
                      <Trash2 size={11} /> Remover
                    </button>
                  </div>
                )}
                {recordedAudio && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 8,
                  }}>
                    <audio controls src={`data:${recordedAudio.mime};base64,${recordedAudio.base64}`}
                      style={{ flex: 1, height: 32 }} />
                    <button onClick={discardAudio} title="Descartar áudio"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        color: '#DC2626', borderRadius: 6, padding: '5px 10px',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                      }}>
                      <Trash2 size={11} /> Descartar
                    </button>
                  </div>
                )}
                {recording && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 8,
                    fontSize: 12, color: '#DC2626', fontWeight: 600,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'pulse-dot 1.2s infinite' }} />
                    Gravando... {String(Math.floor(recordTime / 60)).padStart(2, '0')}:{String(recordTime % 60).padStart(2, '0')}
                    <button onClick={() => stopRecording()} style={{
                      marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#DC2626', color: '#fff', border: 'none',
                      borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>
                      <Square size={11} /> Parar
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    className="nx-input"
                    style={{ flex: 1, fontSize: 13 }}
                    placeholder={
                      !canRespond(selected) ? "Conversa está com outro atendente — você não pode responder"
                      : recordedAudio ? "Mensagem opcional para acompanhar o áudio..."
                      : attachedFile ? "Mensagem opcional para acompanhar o arquivo..."
                      : "Digite uma mensagem..."
                    }
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={sending || recording || !canRespond(selected)}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handlePickFile}
                  />
                  {!recording && !recordedAudio && !attachedFile && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Anexar imagem ou PDF"
                        disabled={!canRespond(selected)}
                        style={{
                          padding: '0 14px', flexShrink: 0,
                          background: '#fff', border: '1px solid var(--border)',
                          borderRadius: 8, color: '#6B7280',
                          cursor: canRespond(selected) ? 'pointer' : 'not-allowed',
                          opacity: canRespond(selected) ? 1 : 0.45,
                          display: 'inline-flex', alignItems: 'center',
                        }}
                      >
                        <Paperclip size={15} />
                      </button>
                      <button
                        onClick={startRecording}
                        title="Gravar áudio"
                        disabled={!canRespond(selected)}
                        style={{
                          padding: '0 14px', flexShrink: 0,
                          background: '#fff', border: '1px solid var(--border)',
                          borderRadius: 8, color: '#6B7280',
                          cursor: canRespond(selected) ? 'pointer' : 'not-allowed',
                          opacity: canRespond(selected) ? 1 : 0.45,
                          display: 'inline-flex', alignItems: 'center',
                        }}
                      >
                        <Mic size={15} />
                      </button>
                    </>
                  )}
                  <button
                    className="nx-btn-primary"
                    style={{ padding: '0 16px', flexShrink: 0 }}
                    onClick={handleSend}
                    disabled={(!msgText.trim() && !recordedAudio && !attachedFile && !recording) || sending || !canRespond(selected)}
                  >
                    <Send size={14} />
                  </button>
                </div>
                {!isGroupMode && (
                  <a
                    href={`https://wa.me/${selected.phone}`}
                    target="_blank" rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#25D366', color: '#fff', borderRadius: 8,
                      padding: '9px 18px', fontSize: 13, fontWeight: 600,
                      textDecoration: 'none', boxShadow: '0 1px 4px rgba(37,211,102,0.3)',
                    }}
                  >
                    <PhoneCall size={15} /> WhatsApp
                  </a>
                )}
                {!isGroupMode && session?.company?.digisac_url && (
                  <a
                    href={session.company.digisac_url}
                    target="_blank" rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#7C3AED', color: '#fff', borderRadius: 8,
                      padding: '9px 18px', fontSize: 13, fontWeight: 600,
                      textDecoration: 'none', boxShadow: '0 1px 4px rgba(124,58,237,0.3)',
                    }}
                  >
                    <PhoneCall size={15} /> Digisac
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {contextMenu && createPortal(
        <div style={{
          position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 99998,
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          padding: 4, minWidth: 180,
        }}
        onClick={e => e.stopPropagation()}
        >
          {(() => {
            const cleanNum = contextMenu.contact.phone.replace(/\D/g, '')
            const saved = findSaved(savedContacts, cleanNum)
            const isGroup = contextMenu.contact.isGroup
            const isMuted = isGroup && mutedGroups.has(contextMenu.contact.session_id)
            const btnStyle = {
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 12px', border: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer',
              borderRadius: 6, textAlign: 'left',
            }
            const onEnter = e => e.currentTarget.style.background = '#F8FAFC'
            const onLeave = e => e.currentTarget.style.background = 'transparent'
            if (isGroup) {
              return (
                <button
                  onClick={() => toggleMuteGroup(contextMenu.contact.session_id)}
                  style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}
                >
                  <span style={{ fontSize: 14 }}>{isMuted ? '🔔' : '🔕'}</span>
                  {isMuted ? 'Reativar notificações' : 'Silenciar grupo'}
                </button>
              )
            }
            return (
              <button
                onClick={() => openSaveContact(contextMenu.contact)}
                style={btnStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}
              >
                <User size={13} />
                {saved ? 'Editar cliente' : 'Salvar cliente'}
              </button>
            )
          })()}
        </div>
      , document.body)}

      {saveContactModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(4px)', padding: '1.5rem',
        }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                  {saveContactModal.id ? 'Editar cliente' : 'Salvar cliente'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                  {saveContactModal.numero}
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSaveContactModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</label>
                <input className="nx-input" autoFocus placeholder="Ex: João Silva"
                  value={saveContactModal.nome}
                  onChange={e => setSaveContactModal(p => ({ ...p, nome: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSaveContact()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notas (opcional)</label>
                <textarea className="nx-input" rows={3} placeholder="Anotações sobre este contato..."
                  value={saveContactModal.notes || ''}
                  onChange={e => setSaveContactModal(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setSaveContactModal(null)}>Cancelar</button>
              <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleSaveContact}
                disabled={!saveContactModal.nome.trim() || savingContact}>
                {savingContact ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {lightbox && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, cursor: 'zoom-out' }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="mídia" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
        </div>
      , document.body)}

      {toast && createPortal(
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
          background: '#fff', border: `1.5px solid ${toast.color}`,
          borderRadius: 10, padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, fontWeight: 600, color: toast.color,
        }}>
          <CheckCircle2 size={16} />
          {toast.message}
        </div>
      , document.body)}

      {transferModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem',
        }} onClick={() => !transferring && setTransferModal(null)}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 440, maxHeight: 'calc(100vh - 3rem)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowRightLeft size={16} style={{ color: '#0891B2' }} /> Transferir conversa
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  Pra qual atendente passar essa conversa?
                </div>
              </div>
              <button onClick={() => !transferring && setTransferModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '1rem 1.5rem', flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {(() => {
                const others = companyUsers.filter(u => u.email !== session?.user?.email && u.role !== 'admin')
                if (!others.length) {
                  return (
                    <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                      Não tem outro atendente cadastrado nessa empresa pra receber.
                    </div>
                  )
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {others.map(u => (
                      <label key={u.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        border: `1.5px solid ${transferringTo === u.email ? '#0891B2' : 'var(--border)'}`,
                        background: transferringTo === u.email ? '#ECFEFF' : '#fff',
                        transition: 'all 0.15s',
                      }}>
                        <input type="radio" name="transfer-target" checked={transferringTo === u.email}
                          onChange={() => setTransferringTo(u.email)}
                          style={{ width: 16, height: 16 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 10 }}>
              <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setTransferModal(null)} disabled={transferring}>Cancelar</button>
              <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#0891B2', borderColor: '#0891B2' }}
                onClick={handleTransfer} disabled={!transferringTo || transferring}>
                {transferring ? 'Transferindo...' : 'Transferir conversa'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {closeModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem',
        }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Finalizar conversa</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {closeModal.phone} — qual foi o resultado?
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, cursor: 'pointer' }}
                onClick={() => setCloseModal(null)}><X size={16} /></button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MANUAL_REASONS.map(r => (
                <label key={r.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${reason === r.value ? r.border : 'var(--border)'}`,
                  background: reason === r.value ? r.bg : 'var(--bg-surface)',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" style={{ display: 'none' }} value={r.value}
                    checked={reason === r.value} onChange={() => setReason(r.value)} />
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                    background: reason === r.value ? r.color : 'var(--border)',
                  }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: reason === r.value ? r.color : 'var(--text-primary)' }}>
                    {r.label}
                  </div>
                </label>
              ))}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setCloseModal(null)}>Cancelar</button>
              <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: reason ? 1 : 0.5 }}
                onClick={handleClose} disabled={!reason || closing}>
                <CheckCircle2 size={13} /> {closing ? 'Finalizando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
