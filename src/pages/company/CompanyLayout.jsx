import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import BillingBanner from '../../components/BillingBanner'
import BlockedScreen from '../../components/BlockedScreen'
import SupportWidget from '../../components/SupportWidget'
import { shouldBlockAccess } from '../../lib/billing'
import { MessageSquare, History, BellRing, BarChart2, Settings2, Contact2, Calendar, Sparkles, Kanban, Scale, GraduationCap, Instagram, ShieldCheck, Menu, Headset, MessageSquareHeart, Users, Wallet, Briefcase, X as XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { latestUpdateDate } from '../../data/updates'
import './Company.css'

export default function CompanyLayout() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const blocked = shouldBlockAccess(session?.company)
  const instance = session?.company?.instance
  const [activeCount, setActiveCount] = useState(0)
  const [groupCount, setGroupCount] = useState(0)
  const [pendingAlerts, setPendingAlerts] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Onboarding obrigatório: força usuário novo para o tutorial até concluir
  useEffect(() => {
    const userKey = session?.user?.email
    if (!userKey) return
    const done = localStorage.getItem(`nx_onboarding_done_${userKey}`) === 'true'
    if (!done && location.pathname !== '/painel/tutorial') {
      navigate('/painel/tutorial', { replace: true })
    }
  }, [session?.user?.email, location.pathname, navigate])

  // Garante que a tabela conversations está no Realtime
  useEffect(() => {
    supabase.rpc('ensure_table_setup', { p_table: 'conversations' })
  }, [])

  // Conta conversas ativas = números únicos na mensagens_geral - encerradas
  useEffect(() => {
    if (!instance) return

    async function refresh() {
      // Limita pra ultimos 2000 registros (suficiente pra contar contatos ativos)
      const [{ data: msgs }, { data: closed }] = await Promise.all([
        supabase.from('mensagens_geral')
          .select('numero, idgrupo')
          .eq('instancia', instance)
          .order('id', { ascending: false })
          .limit(2000),
        supabase.from('conversations').select('session_id').eq('instancia', instance),
      ])
      const closedSet = new Set((closed || []).map(r => r.session_id))
      const individuais = new Set()
      const grupos = new Set()
      for (const r of (msgs || [])) {
        const isGroup = !!r.idgrupo || (r.numero || '').includes('@g.us')
        if (isGroup) {
          const gid = r.idgrupo || r.numero
          if (gid) grupos.add(gid)
        } else if (r.numero) {
          individuais.add(r.numero)
        }
      }
      setActiveCount([...individuais].filter(s => !closedSet.has(s)).length)
      setGroupCount(grupos.size)
    }
    refresh()

    // Debounce: agrega chamadas em janelas de 5s pra nao bombardear o banco
    let timer = null
    const debouncedRefresh = () => {
      if (timer) return
      timer = setTimeout(() => { timer = null; refresh() }, 5000)
    }

    const ch = supabase.channel('layout-conversations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens_geral', filter: `instancia=eq.${instance}` },
        debouncedRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `instancia=eq.${instance}` },
        debouncedRefresh)
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(ch)
    }
  }, [instance])

  // Conta alertas pendentes reais (sem IA: conta só encaminhamentos para o usuário)
  const userId = session?.user?.id
  const aiOn = session?.company?.ai_enabled !== false
  useEffect(() => {
    if (!instance) return
    function countQuery() {
      let q = supabase.from('alerts').select('id', { count: 'exact' })
        .eq('instancia', instance).eq('resolved', false)
      if (!aiOn && userId) q = q.eq('forwarded_to_user_id', userId)
      return q
    }
    countQuery().then(({ count }) => setPendingAlerts(count || 0))

    const ch = supabase.channel('layout-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `instancia=eq.${instance}` },
        () => { countQuery().then(({ count }) => setPendingAlerts(count || 0)) })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [instance, aiOn, userId])

  const isAdmin = session?.user?.role === 'admin'
  const aiEnabled = session?.company?.ai_enabled !== false
  const lastSeen = typeof window !== 'undefined' ? localStorage.getItem('nx_news_seen') : null
  const hasNewUpdate = !lastSeen || lastSeen < latestUpdateDate()

  const links = [
    { to: '/painel/conversas', icon: MessageSquare, label: 'Conversas',
      badge: activeCount > 0 ? activeCount : null, badgeColor: 'cyan' },
    { to: '/painel/grupos', icon: Users, label: 'Grupos',
      badge: groupCount > 0 ? groupCount : null, badgeColor: 'violet' },
    ...(aiEnabled ? [{ to: '/painel/historico', icon: History, label: 'Conversas IA' }] : []),
    { to: '/painel/instagram', icon: Instagram,     label: 'Instagram' },
    { to: '/painel/contatos',  icon: Contact2,      label: 'Clientes' },
    { to: '/painel/agenda',    icon: Calendar,      label: 'Agenda' },
    { to: '/painel/atividades', icon: Kanban,       label: 'Atividades' },
    { to: '/painel/financeiro', icon: Wallet,       label: 'Financeiro' },
    ...(isAdmin ? [{ to: '/painel/crm', icon: Briefcase, label: 'CRM' }] : []),
    { to: '/painel/alertas',   icon: BellRing,      label: 'Alertas',
      badge: pendingAlerts > 0 ? pendingAlerts : null, badgeColor: 'amber' },
    { to: '/painel/tutorial',  icon: GraduationCap, label: 'Tutorial' },
    { to: '/painel/novidades', icon: Sparkles,      label: 'Novidades',
      badge: hasNewUpdate ? 'Novo' : null, badgeColor: 'violet' },
    { to: '/painel/feedback',  icon: MessageSquareHeart, label: 'Feedback' },
    { to: '/painel/seguranca', icon: ShieldCheck,   label: 'Segurança' },
    ...(isAdmin ? [
      { to: '/painel/metricas', icon: BarChart2,    label: 'Métricas' },
      { to: '/painel/catalogo', icon: Scale,  label: 'Catálogo Jurídico' },
      { to: '/painel/admin',    icon: Settings2,    label: 'Administração' },
    ] : []),
    { action: () => window.dispatchEvent(new CustomEvent('open-support-widget')),
      icon: Headset, label: 'Suporte' },
  ]

  if (blocked) {
    return <BlockedScreen company={session?.company} onLogout={logout} />
  }

  return (
    <div className="company-root">
      <Sidebar links={links} role="company" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="company-main-wrap">
        <div className="company-topbar">
          <button className="topbar-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
          <div className="company-topbar-name">{session?.company?.name}</div>
          <span className={`nx-badge nx-badge-${session?.company?.plan === 'Business' ? 'violet' : session?.company?.plan === 'Pro' ? 'cyan' : 'gray'}`}>
            {session?.company?.plan}
          </span>
        </div>
        <BillingBanner company={session?.company} />
        <main className="company-main">
          <Outlet />
        </main>
      </div>
      <SupportWidget session={session} />
      <WhatsAppDisconnectedToast session={session} />
    </div>
  )
}

// Toast no canto direito quando WhatsApp esta desconectado
function WhatsAppDisconnectedToast({ session }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [connected, setConnected] = useState(true) // assume conectado ate provar contrario (evita flash)
  const [dismissed, setDismissed] = useState(() => {
    // Dismiss expira em 30min (antes ficava sessao toda — atrapalhava muito)
    const raw = sessionStorage.getItem('nx_wa_toast_dismissed')
    if (!raw) return false
    const ts = parseInt(raw, 10)
    if (isNaN(ts)) return false
    return Date.now() - ts < 30 * 60 * 1000
  })

  const instance = session?.company?.instance
  const apiKey = session?.company?.api_instancia
  const evolutionUrl = (session?.company?.evolution_url || 'https://evolutionapi.nexladesenvolvimento.com.br').replace(/\/+$/, '')
  const isAdminPage = location.pathname === '/painel/admin'

  useEffect(() => {
    if (!instance || !apiKey) return
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(`${evolutionUrl}/instance/connectionState/${instance}`, { headers: { apikey: apiKey } })
        if (cancelled) return
        if (!res.ok) {
          // API erro (404/500) = instancia provavelmente fora do ar = desconectado
          setConnected(false)
          localStorage.setItem('nx_wa_connected', '0')
          return
        }
        const data = await res.json()
        const state = data?.instance?.state || data?.state
        if (cancelled) return
        const isConn = state === 'open'
        setConnected(isConn)
        localStorage.setItem('nx_wa_connected', isConn ? '1' : '0')
        // Se reconectou, reseta o dismissed pra reaparecer da proxima desconexao
        if (isConn) {
          sessionStorage.removeItem('nx_wa_toast_dismissed')
          setDismissed(false)
        }
      } catch {
        // fetch falhou (rede/CORS/timeout) = trate como desconectado
        if (!cancelled) {
          setConnected(false)
          localStorage.setItem('nx_wa_connected', '0')
        }
      }
    }
    check()
    // Polling a cada 20s (antes era 60s — muito lento pra detectar disconnect)
    const id = setInterval(check, 20_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [instance, apiKey, evolutionUrl])

  if (connected || dismissed || isAdminPage || !instance) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
      maxWidth: 360, background: '#fff',
      border: '1px solid #FECACA', borderLeft: '4px solid #DC2626',
      borderRadius: 12, boxShadow: '0 10px 30px rgba(220,38,38,0.15), 0 2px 6px rgba(0,0,0,0.06)',
      padding: '14px 16px', display: 'flex', gap: 12, animation: 'wa-toast-in 0.25s ease',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: '#FEF2F2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#B91C1C', marginBottom: 2 }}>
          Você está desconectado
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
          Seu WhatsApp parou de receber mensagens. Reconecte pra voltar a atender.
        </div>
        <button onClick={() => navigate('/painel/admin')}
          style={{
            background: '#DC2626', color: '#fff', border: 'none',
            borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>
          Reconectar agora →
        </button>
      </div>
      <button
        onClick={() => { sessionStorage.setItem('nx_wa_toast_dismissed', String(Date.now())); setDismissed(true) }}
        title="Esconder por 30 min"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, alignSelf: 'flex-start' }}>
        <XIcon size={14} />
      </button>
      <style>{`@keyframes wa-toast-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}
