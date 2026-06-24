import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/ConfirmModal'
import LimitReachedModal from '../../components/LimitReachedModal'
import { getEffectiveLimits, reachedLimit, upgradeMessage, formatLimit } from '../../lib/planLimits'
import { Plus, X, UserMinus, RefreshCw, UserCheck, UserX, Pencil, QrCode, Wifi, WifiOff, LogOut, Trash2, Lock, Bell, BellRing, Check } from 'lucide-react'
import './Company.css'

const SECTOR_COLORS = ['#2563EB', '#16A34A', '#7C3AED', '#DC2626', '#D97706', '#0891B2']

function slugify(name) {
  return (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
}
function generatePassword(base) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return slugify(base).slice(0, 5) + '@' + suffix
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500,
  color: 'var(--text-muted)', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

export default function CompanyAdmin() {
  const { session, setSession } = useAuth()
  const instance  = session?.company?.instance
  const companyId = session?.company?.id
  const limits    = getEffectiveLimits(session?.company)
  const maxUsers  = limits.users
  const [limitModal, setLimitModal] = useState(null)

  const [users, setUsers]               = useState([])
  const [sectors, setSectors]           = useState([])
  const [sectorMembers, setSectorMembers] = useState([])
  const [prosCount, setProsCount]       = useState(0)
  const [agendasCount, setAgendasCount] = useState(0)
  const [saving, setSaving]             = useState(false)

  const [sectorModal, setSectorModal]   = useState(false)
  const [sectorForm, setSectorForm]     = useState({ name: '', color: SECTOR_COLORS[0], is_private: false })
  const [sectorErr, setSectorErr]       = useState('')
  const [assignModal, setAssignModal]   = useState(null)
  const [editSectorModal, setEditSectorModal] = useState(null) // setor sendo editado
  const [editSectorErr, setEditSectorErr] = useState('')

  // Lembretes automáticos
  const [reminderEnabled,  setReminderEnabled]  = useState(() => session?.company?.reminder_enabled ?? false)
  const [reminderOffset,   setReminderOffset]   = useState(() => session?.company?.reminder_offset_minutes ?? 1440)
  const [reminderGroupId,  setReminderGroupId]  = useState(() => session?.company?.reminder_group_id || null)
  const [reminderGroups,   setReminderGroups]   = useState([])
  const [companyTimezone,  setCompanyTimezone]  = useState(() => session?.company?.timezone ?? 'America/Sao_Paulo')
  const [savingReminder,   setSavingReminder]   = useState(false)
  const [reminderSaved,    setReminderSaved]    = useState(false)

  const [userModal, setUserModal]       = useState(false)
  const [userForm, setUserForm]         = useState({ name: '', email: '', password: '', role: 'viewer' })
  const [userErr, setUserErr]           = useState('')
  const [editUserModal, setEditUserModal] = useState(null) // user being edited
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', password: '', role: 'viewer' })
  const [editUserErr, setEditUserErr]   = useState('')
  const [deletingUser, setDeletingUser] = useState(null)
  const [deleteErr, setDeleteErr]       = useState('')

  const DEFAULT_EVOLUTION_URL = 'https://evolutionapi.nexladesenvolvimento.com.br'
  const evolutionUrl = (session?.company?.evolution_url || DEFAULT_EVOLUTION_URL).replace(/\/+$/, '')
  const apiKey       = session?.company?.api_instancia
  const [connState, setConnState]   = useState('unknown') // 'open' | 'connecting' | 'close' | 'unknown'
  const [qrBase64, setQrBase64]     = useState(null)
  const [qrLoading, setQrLoading]   = useState(false)
  const [qrErr, setQrErr]           = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState(null)

  async function fetchState() {
    if (!evolutionUrl || !instance || !apiKey) return null
    try {
      const res = await fetch(`${evolutionUrl}/instance/connectionState/${instance}`, {
        headers: { apikey: apiKey },
      })
      const data = await res.json()
      const state = data?.instance?.state || data?.state || 'unknown'
      setConnState(state)
      return state
    } catch (e) {
      setConnState('unknown')
      return null
    }
  }

  useEffect(() => {
    if (!evolutionUrl || !instance || !apiKey) return
    fetchState()
    const t = setInterval(fetchState, 8000)
    return () => clearInterval(t)
  }, [evolutionUrl, instance, apiKey])

  async function handleGenerateQR() {
    if (!evolutionUrl || !instance || !apiKey) {
      setQrErr('Configuração de Evolution incompleta. Contate o administrador.'); return
    }
    setQrLoading(true)
    setQrErr('')
    setQrBase64(null)
    try {
      const res = await fetch(`${evolutionUrl}/instance/connect/${instance}`, {
        headers: { apikey: apiKey },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const b64 = data?.base64 || data?.qrcode?.base64 || data?.qrcode || null
      if (!b64) throw new Error('QR Code não retornado pela Evolution')
      setQrBase64(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`)
      // Polling rápido enquanto aguarda escaneamento
      let attempts = 0
      const fast = setInterval(async () => {
        attempts++
        const s = await fetchState()
        if (s === 'open' || attempts > 40) {
          clearInterval(fast)
          if (s === 'open') setQrBase64(null)
        }
      }, 3000)
    } catch (e) {
      setQrErr('Erro ao gerar QR Code: ' + e.message)
    } finally {
      setQrLoading(false)
    }
  }

  function handleLogout() {
    if (!evolutionUrl || !instance || !apiKey) return
    setConfirmLogout(true)
  }
  async function confirmLogoutAction() {
    setLoggingOut(true)
    try {
      await fetch(`${evolutionUrl}/instance/logout/${instance}`, {
        method: 'DELETE', headers: { apikey: apiKey },
      })
      setQrBase64(null)
      fetchState()
    } catch (e) {
      setQrErr('Erro ao desconectar: ' + e.message)
    }
    setLoggingOut(false)
    setConfirmLogout(false)
  }

  useEffect(() => {
    if (!companyId) return
    supabase.from('users').select('*').eq('company_id', companyId).order('name')
      .then(({ data }) => { if (data) setUsers(data) })
  }, [companyId])

  useEffect(() => {
    if (!instance) return
    supabase.from('sectors').select('*').eq('instancia', instance).order('created_at')
      .then(({ data }) => { if (data) setSectors(data) })
    supabase.from('professionals').select('id', { count: 'exact' }).eq('instancia', instance).eq('active', true)
      .then(({ count }) => { if (count != null) setProsCount(count) })
    supabase.from('agendas').select('id', { count: 'exact' }).eq('instancia', instance)
      .then(({ count }) => { if (count != null) setAgendasCount(count) })
    // Grupos disponiveis (pra dropdown de "enviar copia do lembrete pra grupo")
    supabase.from('mensagens_geral').select('idgrupo, nomegrupo').eq('instancia', instance)
      .not('idgrupo', 'is', null).limit(500)
      .then(({ data }) => {
        if (!data) return
        const seen = new Set()
        const groups = []
        for (const r of data) {
          if (!r.idgrupo || seen.has(r.idgrupo)) continue
          seen.add(r.idgrupo)
          groups.push({ idgrupo: r.idgrupo, nomegrupo: r.nomegrupo })
        }
        setReminderGroups(groups.sort((a, b) => (a.nomegrupo || '').localeCompare(b.nomegrupo || '')))
      })
  }, [instance])

  useEffect(() => {
    if (!sectors.length) { setSectorMembers([]); return }
    supabase.from('sector_members').select('*').in('sector_id', sectors.map(s => s.id))
      .then(({ data }) => { if (data) setSectorMembers(data) })
  }, [sectors])

  async function handleCreateSector() {
    if (!sectorForm.name.trim()) { setSectorErr('Nome é obrigatório.'); return }
    setSaving(true)
    const { data, error } = await supabase.from('sectors').insert({
      name: sectorForm.name.trim(), instancia: instance, color: sectorForm.color,
      is_private: !!sectorForm.is_private,
    }).select().single()
    setSaving(false)
    if (error) { setSectorErr('Erro: ' + error.message); return }
    setSectors(prev => [...prev, data])
    setSectorModal(false)
    setSectorForm({ name: '', color: SECTOR_COLORS[0], is_private: false })
    setSectorErr('')
  }

  async function handleSaveSectorEdit() {
    if (!editSectorModal) return
    if (!editSectorModal.name?.trim()) { setEditSectorErr('Nome é obrigatório.'); return }
    setSaving(true)
    const { data, error } = await supabase.from('sectors').update({
      name: editSectorModal.name.trim(),
      color: editSectorModal.color,
      is_private: !!editSectorModal.is_private,
    }).eq('id', editSectorModal.id).select().single()
    setSaving(false)
    if (error) { setEditSectorErr('Erro: ' + error.message); return }
    setSectors(prev => prev.map(s => s.id === data.id ? data : s))
    setEditSectorModal(null)
    setEditSectorErr('')
  }

  async function handleDeleteSector(sectorId) {
    await supabase.from('sectors').delete().eq('id', sectorId)
    setSectors(prev => prev.filter(s => s.id !== sectorId))
    setSectorMembers(prev => prev.filter(m => m.sector_id !== sectorId))
  }

  async function handleAssignUser(userId) {
    if (!assignModal) return
    await supabase.from('sector_members').delete().eq('user_id', userId)
    const { data } = await supabase.from('sector_members')
      .insert({ sector_id: assignModal.id, user_id: userId }).select().single()
    if (data) setSectorMembers(prev => [...prev.filter(m => m.user_id !== userId), data])
  }

  async function handleRemoveMember(userId) {
    await supabase.from('sector_members').delete().eq('user_id', userId)
    setSectorMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  async function handleToggleUser(userId, active) {
    await supabase.from('users').update({ active: !active }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !active } : u))
  }

  async function handleDeleteUser() {
    if (!deletingUser) return
    if (deletingUser.id === session?.user?.id) {
      setDeleteErr('Você não pode excluir a si mesmo.'); return
    }
    setSaving(true); setDeleteErr('')
    const { data, error } = await supabase.rpc('delete_user', { p_user_id: deletingUser.id })
    setSaving(false)
    if (error) {
      setDeleteErr('Erro: ' + error.message + ' — peça pra rodar a migração delete_user_rpc no Supabase.')
      return
    }
    if (data && data.ok === false) { setDeleteErr(data.error || 'Não foi possível excluir.'); return }
    setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
    setSectorMembers(prev => prev.filter(m => m.user_id !== deletingUser.id))
    setDeletingUser(null)
  }

  function openEditUser(user) {
    setEditUserForm({ name: user.name, email: user.email, password: '', role: user.role })
    setEditUserErr('')
    setEditUserModal(user)
  }

  async function handleEditUser() {
    if (!editUserForm.name || !editUserForm.email) { setEditUserErr('Nome e e-mail são obrigatórios.'); return }
    setSaving(true)
    const { error } = await supabase.from('users').update({
      name: editUserForm.name,
      email: editUserForm.email,
      role: editUserForm.role,
    }).eq('id', editUserModal.id)
    if (error) { setSaving(false); setEditUserErr(error.message); return }

    if (editUserForm.password?.trim()) {
      const { error: pwErr } = await supabase.rpc('update_user_password', {
        p_user_id: editUserModal.id,
        p_password: editUserForm.password,
      })
      if (pwErr) { setSaving(false); setEditUserErr('Erro ao atualizar senha: ' + pwErr.message); return }
    }
    setSaving(false)
    setUsers(prev => prev.map(u => u.id === editUserModal.id
      ? { ...u, name: editUserForm.name, email: editUserForm.email, role: editUserForm.role }
      : u))
    // Atualiza sessão se o user editado é o próprio logado
    if (editUserModal.id === session?.user?.id) {
      setSession(prev => ({
        ...prev,
        user: { ...prev.user, name: editUserForm.name, email: editUserForm.email, role: editUserForm.role },
      }))
    }
    setEditUserModal(null)
  }

  async function handleCreateUser() {
    if (!userForm.name || !userForm.email || !userForm.password) {
      setUserErr('Preencha todos os campos.'); return
    }
    const activeCount = users.filter(u => u.active !== false).length
    if (activeCount >= maxUsers) {
      setUserErr(`Limite de ${maxUsers} usuários atingido. Contate o administrador para aumentar o limite.`); return
    }
    setSaving(true)
    const { error } = await supabase.rpc('create_user', {
      p_name: userForm.name,
      p_email: userForm.email,
      p_password: userForm.password,
      p_role: userForm.role,
      p_company_id: companyId,
    })
    setSaving(false)
    if (error) { setUserErr(error.message); return }
    const { data } = await supabase.from('users').select('*').eq('company_id', companyId).order('name')
    if (data) setUsers(data)
    setUserModal(false)
    setUserErr('')
  }

  async function handleSaveReminder() {
    if (!companyId) return
    setSavingReminder(true)
    try {
      const { error } = await supabase.from('companies').update({
        reminder_enabled: reminderEnabled,
        reminder_offset_minutes: Number(reminderOffset),
        reminder_group_id: reminderGroupId || null,
        timezone: companyTimezone,
      }).eq('id', companyId)
      if (!error) {
        setSession(prev => ({
          ...prev,
          company: { ...prev.company, reminder_enabled: reminderEnabled, reminder_offset_minutes: Number(reminderOffset), reminder_group_id: reminderGroupId || null, timezone: companyTimezone },
        }))
        setReminderSaved(true)
        setTimeout(() => setReminderSaved(false), 2500)
      }
    } finally {
      setSavingReminder(false)
    }
  }

  const domain = slugify(session?.company?.name || 'empresa') + '.com'
  const activeUsers = users.filter(u => u.active !== false)

  const planColors = { Starter: '#C9A074', Pro: '#2563EB', Business: '#7C3AED' }
  const planBgs    = { Starter: '#FFFBEB', Pro: '#EFF6FF', Business: '#F5F3FF' }
  const planColor  = planColors[limits.plan] || '#C9A074'
  const planBg     = planBgs[limits.plan] || '#FFFBEB'
  const planPrice  = { Starter: 'R$ 199,00/mês', Pro: 'R$ 597,00/mês', Business: 'Sob medida' }

  function UsageBar({ label, icon, used, total }) {
    const pct = total === Infinity ? 0 : Math.min(100, Math.round((used / total) * 100))
    const over = used > total && total !== Infinity
    const barColor = over ? '#DC2626' : pct >= 80 ? '#D97706' : '#16A34A'
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {label}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: over ? '#DC2626' : 'var(--text-primary)' }}>
            {used}/{total === Infinity ? '∞' : total}
          </span>
        </div>
        {total !== Infinity && (
          <div style={{ height: 6, background: '#E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 10, transition: 'width 0.6s ease' }} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-enter">
      {/* Card Plano e Cobrança */}
      <div style={{ padding: '1.5rem 1.5rem 0' }}>
        <div style={{
          background: planBg, border: `1.5px solid ${planColor}33`,
          borderRadius: 16, padding: '1.5rem', marginBottom: 20,
          display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, alignItems: 'start',
        }} className="plan-card-grid">
          {/* Esquerda: plano */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: planColor + '20', border: `1px solid ${planColor}44`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: planColor, letterSpacing: '0.1em', marginBottom: 10 }}>
              ⚡ PLANO ATUAL
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: planColor, lineHeight: 1, marginBottom: 6 }}>
              {limits.plan}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {planPrice[limits.plan]}
              {limits.extra_users > 0 && <span style={{ display: 'block', fontSize: 11, marginTop: 2 }}>+{limits.extra_users} usuário{limits.extra_users > 1 ? 's' : ''} extra</span>}
            </div>
            {limits.plan !== 'Business' && (
              <a
                href={`https://wa.me/5561999999999?text=Ol%C3%A1!%20Quero%20fazer%20upgrade%20do%20plano%20${limits.plan}%20da%20AdvoSac.`}
                target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: planColor, color: '#fff', borderRadius: 8,
                  padding: '9px 18px', fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', boxShadow: `0 2px 8px ${planColor}44`,
                }}>
                ↗ Fazer upgrade {limits.plan === 'Starter' ? 'pro Pro' : 'pro Business'}
              </a>
            )}
          </div>

          {/* Direita: barras de uso */}
          <div>
            <UsageBar label="Advogados" icon="⚖️" used={prosCount} total={limits.professionals} />
            <UsageBar label="Usuários na equipe" icon="👥" used={activeUsers.length} total={limits.users} />
            <UsageBar label="Agendas" icon="📅" used={agendasCount} total={limits.agendas} />
          </div>
        </div>
      </div>

      {/* Conexão WhatsApp */}
      <div className="page-body">
        <div className="section-header">
          <div className="section-title">Conexão WhatsApp</div>
        </div>
        <div className="nx-card" style={{ padding: '1.25rem 1.5rem' }}>
          {!instance || !apiKey ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Instância não configurada. Solicite ao administrador para cadastrar
              <strong> Instância</strong> e <strong>API Instância</strong>.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {connState === 'open' ? (
                    <>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wifi size={16} style={{ color: '#16A34A' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#16A34A' }}>Conectado</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Instância <strong>{instance}</strong> ativa e pronta para receber mensagens.</div>
                      </div>
                    </>
                  ) : connState === 'connecting' ? (
                    <>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={16} style={{ color: '#D97706' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#D97706' }}>Aguardando leitura</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Escaneie o QR Code abaixo no WhatsApp.</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WifiOff size={16} style={{ color: '#DC2626' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#DC2626' }}>Desconectado</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gere o QR Code para conectar a instância <strong>{instance}</strong>.</div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {connState === 'open' ? (
                    <button onClick={handleLogout}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <LogOut size={13} /> Desconectar
                    </button>
                  ) : (
                    <button onClick={handleGenerateQR} disabled={qrLoading}
                      className="nx-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px' }}>
                      <QrCode size={13} /> {qrLoading ? 'Gerando...' : (qrBase64 ? 'Atualizar QR' : 'Gerar QR Code')}
                    </button>
                  )}
                </div>
              </div>

              {qrErr && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626' }}>
                  {qrErr}
                </div>
              )}

              {qrBase64 && connState !== 'open' && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '16px', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10,
                }}>
                  <img src={qrBase64} alt="QR Code WhatsApp"
                    style={{ width: 240, height: 240, borderRadius: 8, background: '#fff', padding: 8 }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380, lineHeight: 1.5 }}>
                    Abra o <strong>WhatsApp</strong> no celular → <strong>Aparelhos conectados</strong> → <strong>Conectar um aparelho</strong> e escaneie o código.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Setores */}
      <div className="page-body">
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-title">Setores / Departamentos</div>
          {instance && (
            <button className="nx-btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={() => { setSectorForm({ name: '', color: SECTOR_COLORS[0] }); setSectorErr(''); setSectorModal(true) }}>
              <Plus size={13} /> Novo setor
            </button>
          )}
        </div>

        {!instance ? (
          <div className="nx-card" style={{ padding: '1.5rem', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            Instância WhatsApp não configurada. Contate o administrador.
          </div>
        ) : !sectors.length ? (
          <div className="nx-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhum setor criado ainda. Crie setores e atribua funcionários.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {sectors.map(sector => {
              const memberUsers = sectorMembers
                .filter(m => m.sector_id === sector.id)
                .map(m => users.find(u => u.id === m.user_id))
                .filter(Boolean)
              return (
                <div key={sector.id} className="nx-card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: sector.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sector.name}</span>
                      {sector.is_private && (
                        <span title="Setor privado — convs só aparecem para membros + admin" style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                          🔒 PRIVADO
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="table-action" onClick={() => { setEditSectorModal({ ...sector }); setEditSectorErr('') }}>
                        Editar
                      </button>
                      <button className="table-action" onClick={() => setAssignModal(sector)}>
                        <Plus size={11} /> Atribuir
                      </button>
                      <button className="table-action danger" onClick={() => handleDeleteSector(sector.id)}>
                        <X size={11} /> Excluir
                      </button>
                    </div>
                  </div>
                  {!memberUsers.length ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum funcionário atribuído.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {memberUsers.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', borderRadius: 6, padding: '5px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: sector.color + '22', border: `1px solid ${sector.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: sector.color }}>
                              {u.name.charAt(0)}
                            </div>
                            {u.name}
                          </div>
                          <button className="table-action danger" style={{ padding: '2px 7px', fontSize: 10 }} onClick={() => handleRemoveMember(u.id)}>
                            <UserMinus size={9} /> Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Usuários */}
      <div className="page-body" style={{ marginTop: 0 }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="section-title">Usuários ({activeUsers.length} / {formatLimit(maxUsers)})</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Plano <strong>{limits.plan}</strong> · {limits.extra_users > 0 ? <>+{limits.extra_users} usuário{limits.extra_users > 1 ? 's' : ''} extras (R$39 cada)</> : <>limite padrão do plano</>}
            </div>
          </div>
          <button
            className="nx-btn-primary"
            style={{ fontSize: 12, padding: '6px 14px', opacity: reachedLimit(activeUsers.length, maxUsers) ? 0.7 : 1 }}
            onClick={() => {
              if (reachedLimit(activeUsers.length, maxUsers)) {
                setLimitModal(upgradeMessage('users', maxUsers, limits.plan))
                return
              }
              setUserForm({ name: '', email: '', password: '', role: 'viewer' }); setUserErr(''); setUserModal(true)
            }}>
            {reachedLimit(activeUsers.length, maxUsers) ? <Lock size={13} /> : <Plus size={13} />} Novo usuário
          </button>
        </div>

        {/* Desktop: tabela */}
        <div className="admin-users-table nx-card" style={{ overflowX: 'auto' }}>
          {!users.length ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum usuário.</div>
          ) : (
            <table className="data-table" style={{ minWidth: 520 }}>
              <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Setor</th><th>Status</th><th>Ação</th></tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const memberSectorId = sectorMembers.find(m => m.user_id === u.id)?.sector_id
                  const userSector = sectors.find(s => s.id === memberSectorId)
                  return (
                    <tr key={u.id}>
                      <td className="td-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#2563EB' }}>
                            {u.name.charAt(0)}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</td>
                      <td><span className={`nx-badge ${u.role === 'admin' ? 'nx-badge-cyan' : 'nx-badge-gray'}`}>{u.role === 'admin' ? 'Admin' : 'Operador'}</span></td>
                      <td>
                        {userSector ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#fff', background: userSector.color }}>{userSector.name}</span>
                        ) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td><span className={`nx-badge ${u.active !== false ? 'nx-badge-green' : 'nx-badge-red'}`}>{u.active !== false ? 'Ativo' : 'Inativo'}</span></td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button className="table-action" onClick={() => openEditUser(u)}><Pencil size={12} /> Editar</button>
                          <button className={`table-action ${u.active !== false ? 'danger' : ''}`} onClick={() => handleToggleUser(u.id, u.active !== false)}>
                            {u.active !== false ? <><UserX size={12} /> Desativar</> : <><UserCheck size={12} /> Ativar</>}
                          </button>
                          {u.id !== session?.user?.id && (
                            <button className="table-action danger" onClick={() => { setDeleteErr(''); setDeletingUser(u) }}><Trash2 size={12} /> Excluir</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile: cards clicáveis */}
        <div className="admin-users-cards">
          {!users.length ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum usuário.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => {
                const memberSectorId = sectorMembers.find(m => m.user_id === u.id)?.sector_id
                const userSector = sectors.find(s => s.id === memberSectorId)
                const isExpanded = expandedUserId === u.id
                return (
                  <div key={u.id} className="nx-card" style={{ overflow: 'hidden' }}>
                    {/* Header do card — sempre visível */}
                    <button
                      onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                        <span className={`nx-badge ${u.role === 'admin' ? 'nx-badge-cyan' : 'nx-badge-gray'}`}>{u.role === 'admin' ? 'Admin' : 'Op.'}</span>
                        <span className={`nx-badge ${u.active !== false ? 'nx-badge-green' : 'nx-badge-red'}`}>{u.active !== false ? '✓' : '✗'}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                    </button>

                    {/* Expandido: detalhes + ações */}
                    {isExpanded && (
                      <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {userSector && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                              <span style={{ color: 'var(--text-muted)', width: 50 }}>Setor</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#fff', background: userSector.color }}>{userSector.name}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          <button className="nx-btn-ghost" style={{ fontSize: 12, padding: '7px 14px', flex: 1 }} onClick={() => { openEditUser(u); setExpandedUserId(null) }}>
                            <Pencil size={13} /> Editar
                          </button>
                          <button className={`nx-btn-ghost ${u.active !== false ? 'danger' : ''}`}
                            style={{ fontSize: 12, padding: '7px 14px', flex: 1, color: u.active !== false ? '#DC2626' : '#16A34A', borderColor: u.active !== false ? '#FECACA' : '#BBF7D0' }}
                            onClick={() => handleToggleUser(u.id, u.active !== false)}>
                            {u.active !== false ? <><UserX size={13} /> Desativar</> : <><UserCheck size={13} /> Ativar</>}
                          </button>
                          {u.id !== session?.user?.id && (
                            <button className="nx-btn-ghost" style={{ fontSize: 12, padding: '7px 14px', color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() => { setDeleteErr(''); setDeletingUser(u); setExpandedUserId(null) }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Lembretes automáticos ───────────────────────────────────────── */}
      <div className="page-body" style={{ marginTop: 0 }}>
        <div className="section-header">
          <div className="section-title">Lembretes automáticos</div>
        </div>
        <div className="nx-card" style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header do card com icone + titulo + descricao + toggle */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BellRing size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Enviar lembrete antes de cada compromisso</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  O sistema envia automaticamente uma mensagem no WhatsApp pra cada cliente agendado, na antecedência que você escolher.
                </div>
              </div>
            </div>
            <button
              onClick={() => setReminderEnabled(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: reminderEnabled ? '#2563EB' : '#CBD5E1',
                position: 'relative', flexShrink: 0, transition: 'background 0.2s',
              }}>
              <span style={{
                position: 'absolute', top: 3, left: reminderEnabled ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {reminderEnabled && (
            <>
              {/* Antecedência em pilulas */}
              <div>
                <label style={labelStyle}>Avisar com antecedência de</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { v: 30,    l: '30 minutos antes' },
                    { v: 60,    l: '1 hora antes' },
                    { v: 1440,  l: '24 horas antes' },
                    { v: 2880,  l: '48 horas antes' },
                    { v: 10080, l: '7 dias antes' },
                  ].map(o => {
                    const active = Number(reminderOffset) === o.v
                    return (
                      <button key={o.v} onClick={() => setReminderOffset(o.v)}
                        style={{
                          padding: '8px 16px', fontSize: 12, fontWeight: 600,
                          border: '1px solid', borderColor: active ? '#2563EB' : 'var(--border)',
                          background: active ? '#EFF6FF' : '#fff',
                          color: active ? '#1D4ED8' : 'var(--text-secondary)',
                          borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        {o.l}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Grupo (opcional) */}
              <div>
                <label style={labelStyle}>Enviar cópia do lembrete para um grupo (opcional)</label>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Além do lembrete individual para o cliente, o sistema pode avisar também um grupo do WhatsApp.
                </div>
                <select className="nx-select" value={reminderGroupId || ''}
                  onChange={e => setReminderGroupId(e.target.value || null)}
                  style={{ maxWidth: 320 }}>
                  <option value="">— Não enviar para grupo —</option>
                  {(reminderGroups || []).map(g => (
                    <option key={g.idgrupo} value={g.idgrupo}>{g.nomegrupo || g.idgrupo}</option>
                  ))}
                </select>
              </div>

              {/* Prévia */}
              <div>
                <label style={labelStyle}>Como a mensagem chega no cliente</label>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                    Olá <strong>Maria</strong>! 📅 Passando pra lembrar do seu compromisso no dia <strong>15/05</strong> às <strong>14:30</strong> com <strong>Dr. Camila</strong>. Até lá! 🚀
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Os campos em <strong>negrito</strong> vêm do agendamento (nome, data, hora e profissional).
                </div>
              </div>

              {/* Fuso horário */}
              <div>
                <label style={labelStyle}>Fuso horário do escritório</label>
                <select
                  className="nx-select"
                  value={companyTimezone}
                  onChange={e => setCompanyTimezone(e.target.value)}
                  style={{ maxWidth: 420 }}>
                  <optgroup label="Brasil">
                    <option value="America/Sao_Paulo">Brasília / São Paulo / Rio (GMT-3)</option>
                    <option value="America/Bahia">Bahia (GMT-3)</option>
                    <option value="America/Fortaleza">Fortaleza / CE / PI / RN / PB / AL / SE (GMT-3)</option>
                    <option value="America/Recife">Recife / PE (GMT-3)</option>
                    <option value="America/Belem">Belém / PA / MA (GMT-3)</option>
                    <option value="America/Manaus">Manaus / AM / MT / MS (GMT-4)</option>
                    <option value="America/Cuiaba">Cuiabá (GMT-4)</option>
                    <option value="America/Porto_Velho">Porto Velho / RO (GMT-4)</option>
                    <option value="America/Boa_Vista">Boa Vista / RR (GMT-4)</option>
                    <option value="America/Rio_Branco">Rio Branco / AC (GMT-5)</option>
                    <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                  </optgroup>
                  <optgroup label="Internacional">
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="Europe/Lisbon">Lisboa / Portugal (GMT+1)</option>
                    <option value="America/New_York">Nova York / EUA Leste (GMT-5)</option>
                    <option value="America/Chicago">Chicago / EUA Central (GMT-6)</option>
                    <option value="America/Los_Angeles">Los Angeles / EUA Oeste (GMT-8)</option>
                  </optgroup>
                </select>
              </div>
            </>
          )}

          {/* Salvar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              className="nx-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140, justifyContent: 'center' }}
              onClick={handleSaveReminder}
              disabled={savingReminder}>
              {reminderSaved
                ? <><Check size={14} /> Salvo!</>
                : savingReminder
                  ? 'Salvando...'
                  : <><Bell size={14} /> Salvar configuração</>}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmLogout}
        variant="warning"
        title="Desconectar WhatsApp"
        message={`Tem certeza que deseja desconectar a instância "${instance}"? Você precisará escanear o QR Code novamente para reconectar.`}
        confirmLabel="Desconectar"
        loading={loggingOut}
        onConfirm={confirmLogoutAction}
        onCancel={() => setConfirmLogout(false)}
      />

      <LimitReachedModal
        open={!!limitModal}
        title={limitModal?.title}
        body={limitModal?.body}
        cta={limitModal?.cta}
        planName={limits.plan}
        onClose={() => setLimitModal(null)}
      />

      {/* Modal criar setor */}
      {sectorModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Novo setor</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSectorModal(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input className="nx-input" placeholder="Ex: Comercial, Suporte..." autoFocus
                  value={sectorForm.name} onChange={e => setSectorForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Cor identificadora</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {SECTOR_COLORS.map(c => (
                    <button key={c} onClick={() => setSectorForm(p => ({ ...p, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: sectorForm.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: 10, background: sectorForm.is_private ? '#FEF3C7' : '#F8FAFC', border: `1px solid ${sectorForm.is_private ? '#FDE68A' : 'var(--border)'}`, borderRadius: 8 }}>
                <input type="checkbox" checked={!!sectorForm.is_private}
                  onChange={e => setSectorForm(p => ({ ...p, is_private: e.target.checked }))}
                  style={{ marginTop: 2 }} />
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🔒 Setor privado</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    Conversas atribuídas a este setor só aparecem pros membros dele e pra você (admin).
                  </div>
                </div>
              </label>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              {sectorErr && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{sectorErr}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setSectorModal(false)}>Cancelar</button>
                <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreateSector} disabled={saving}>
                  {saving ? 'Criando...' : 'Criar setor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal editar setor */}
      {editSectorModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Editar setor</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setEditSectorModal(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input className="nx-input" autoFocus
                  value={editSectorModal.name || ''}
                  onChange={e => setEditSectorModal(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Cor identificadora</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {SECTOR_COLORS.map(c => (
                    <button key={c} onClick={() => setEditSectorModal(p => ({ ...p, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: editSectorModal.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: 10, background: editSectorModal.is_private ? '#FEF3C7' : '#F8FAFC', border: `1px solid ${editSectorModal.is_private ? '#FDE68A' : 'var(--border)'}`, borderRadius: 8 }}>
                <input type="checkbox" checked={!!editSectorModal.is_private}
                  onChange={e => setEditSectorModal(p => ({ ...p, is_private: e.target.checked }))}
                  style={{ marginTop: 2 }} />
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🔒 Setor privado</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    Conversas atribuídas só aparecem pros membros e pra você (admin).
                  </div>
                </div>
              </label>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              {editSectorErr && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{editSectorErr}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setEditSectorModal(null)}>Cancelar</button>
                <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveSectorEdit} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal atribuir usuário ao setor */}
      {assignModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Atribuir ao setor</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: assignModal.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{assignModal.name}</span>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setAssignModal(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
              {users.filter(u => u.role !== 'admin').map(u => {
                const inThisSector = sectorMembers.find(m => m.user_id === u.id)?.sector_id === assignModal.id
                return (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, background: inThisSector ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${inThisSector ? '#BBF7D0' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#2563EB' }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                    {inThisSector ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>✓ Atribuído</span>
                    ) : (
                      <button className="nx-btn-primary" style={{ fontSize: 11, padding: '4px 12px' }} onClick={() => handleAssignUser(u.id)}>
                        Atribuir
                      </button>
                    )}
                  </div>
                )
              })}
              {users.filter(u => u.role !== 'admin').length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Nenhum operador disponível.
                </div>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="nx-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAssignModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal excluir usuário */}
      {deletingUser && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#DC2626' }}>Excluir usuário</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Esta ação não pode ser desfeita.</div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setDeletingUser(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                Excluir permanentemente <strong>{deletingUser.name}</strong> ({deletingUser.email})?
              </div>
              {deleteErr && (
                <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626' }}>
                  {deleteErr}
                </div>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setDeletingUser(null)}>Cancelar</button>
              <button
                style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
                onClick={handleDeleteUser} disabled={saving}>
                <Trash2 size={13} /> {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal editar usuário */}
      {editUserModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Editar usuário</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{editUserModal.name}</div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setEditUserModal(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input className="nx-input" autoFocus value={editUserForm.name}
                  onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input className="nx-input" type="email" value={editUserForm.email}
                  onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Nova senha <span style={{ fontWeight: 400, textTransform: 'none' }}>(deixe em branco para não alterar)</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="nx-input" placeholder="Nova senha..."
                    value={editUserForm.password}
                    onChange={e => setEditUserForm(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" className="nx-btn-ghost" style={{ flexShrink: 0, padding: '0 12px' }}
                    onClick={() => setEditUserForm(p => ({ ...p, password: generatePassword(p.name || 'user') }))}>
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Perfil de acesso</label>
                <select className="nx-select" value={editUserForm.role}
                  onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="viewer">Operador — acesso ao painel de conversas</option>
                  <option value="admin">Admin — acesso completo + configurações</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              {editUserErr && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{editUserErr}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setEditUserModal(null)}>Cancelar</button>
                <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleEditUser} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal criar usuário */}
      {userModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="nx-card" style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Novo usuário</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {activeUsers.length} / {maxUsers} usuários ativos
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setUserModal(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input className="nx-input" placeholder="Nome completo" autoFocus
                  value={userForm.name}
                  onChange={e => {
                    const name = e.target.value
                    const email = name ? `${slugify(name)}@${domain}` : ''
                    setUserForm(p => ({ ...p, name, email }))
                  }} />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input className="nx-input" type="email" value={userForm.email}
                  onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Senha</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="nx-input" value={userForm.password}
                    onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" className="nx-btn-ghost" style={{ flexShrink: 0, padding: '0 12px' }}
                    onClick={() => setUserForm(p => ({ ...p, password: generatePassword(p.name || 'user') }))}>
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Perfil de acesso</label>
                <select className="nx-select" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="viewer">Operador — acesso ao painel de conversas</option>
                  <option value="admin">Admin — acesso completo + configurações</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              {userErr && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{userErr}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="nx-btn-ghost" style={{ flex: 1 }} onClick={() => setUserModal(false)}>Cancelar</button>
                <button className="nx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreateUser} disabled={saving}>
                  {saving ? 'Criando...' : 'Criar acesso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
