import React from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { MonitorSmartphone, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Modal exibido quando a sessão é encerrada por outro login (limite de 2 acessos).
// Aparece por cima de qualquer tela no momento em que o heartbeat detecta a queda.
export default function SessionEndedModal() {
  const { authNotice, setAuthNotice } = useAuth()
  const navigate = useNavigate()
  if (!authNotice) return null

  function goLogin() {
    setAuthNotice(null)
    navigate('/login', { replace: true })
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden',
        animation: 'nxPop 0.18s ease-out',
      }}>
        <div style={{ padding: '1.75rem 1.75rem 1.25rem', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
            background: '#FEF3C7', border: '1px solid #FCD34D',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MonitorSmartphone size={26} style={{ color: '#B45309' }} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Sessão encerrada
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#475569', margin: 0 }}>
            {authNotice}
          </p>

          <div style={{
            marginTop: 16, padding: '10px 12px', borderRadius: 10,
            background: '#FEF2F2', border: '1px solid #FECACA',
            display: 'flex', gap: 8, alignItems: 'flex-start', textAlign: 'left',
          }}>
            <ShieldAlert size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.45 }}>
              Se não foi você que acessou de outro dispositivo, troque sua senha em <strong>Segurança</strong> após entrar.
            </span>
          </div>
        </div>

        <div style={{ padding: '0 1.75rem 1.5rem' }}>
          <button onClick={goLogin} style={{
            width: '100%', padding: '11px 16px', border: 'none', borderRadius: 10,
            background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Fazer login novamente
          </button>
        </div>
      </div>

      <style>{`@keyframes nxPop { from { transform: scale(0.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>,
    document.body,
  )
}
