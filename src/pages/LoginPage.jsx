import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader2, ArrowLeft, Sparkles, Calendar, Bot, MessageSquare, Scale } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import './LoginPage.css'

export default function LoginPage() {
  const { login, authNotice, setAuthNotice } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('empresa')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    if (authNotice) setAuthNotice(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Preencha todos os campos.'); return }
    setLoading(true)
    const result = await login(form.email, form.password, tab)
    setLoading(false)
    if (result.ok) {
      navigate(tab === 'adm' ? '/adm' : '/painel')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-root">
      <Link to="/" className="login-back">
        <ArrowLeft size={13} /> Voltar
      </Link>

      <div className="login-shell">
        {/* ── Coluna esquerda — branding (oculta no mobile) ── */}
        <div className="login-left">
          <Link to="/" className="login-brand">
            <BrandMark size={34} />
            <div className="login-brand-text">
              <span>Advo<span style={{color:'#2563EB'}}>Sac</span></span>
              <small>Ética e eficiência não brigam</small>
            </div>
          </Link>

          <div className="login-eyebrow">
            <span className="login-pulse" />
            Central de controle do escritório
          </div>

          <h1 className="login-headline">
            Bem-vindo de volta ao <em>seu escritório digital</em>.
          </h1>

          <p className="login-sub">
            Sofia atende, classifica, agenda e lembra. Você acessa aqui o
            painel que mostra tudo — captação, reuniões, honorários e equipe
            num lugar só.
          </p>

          <div className="login-features">
            {[
              { icon: <Bot size={13} />,         bg: '#FEF3C7', border: '#FCD34D', label: 'Sofia 24/7' },
              { icon: <Calendar size={13} />,     bg: '#DCFCE7', border: '#86EFAC', label: 'Agenda integrada' },
              { icon: <MessageSquare size={13} />,bg: '#DBEAFE', border: '#93C5FD', label: 'Caixa unificada' },
              { icon: <Scale size={13} />,        bg: '#FCE7F3', border: '#F9A8D4', label: 'Métricas jurídicas' },
            ].map(f => (
              <div key={f.label} className="login-feat" style={{ background: f.bg, borderColor: f.border }}>
                {f.icon} <span>{f.label}</span>
              </div>
            ))}
          </div>

          <div className="login-decor login-decor-1" />
          <div className="login-decor login-decor-2" />
          <div className="login-decor login-decor-3" />
        </div>

        {/* ── Coluna direita — formulário ── */}
        <div className="login-right">
          <form className="login-card" onSubmit={handleSubmit}>

            {/* Logo só no mobile */}
            <div className="login-mobile-brand">
              <div className="login-mobile-brand-mark">
                <BrandMark size={20} />
              </div>
              <div>
                <div className="login-mobile-brand-text">Advo<span style={{color:'#2563EB'}}>Sac</span></div>
                <span className="login-mobile-brand-sub">Ética e eficiência não brigam</span>
              </div>
            </div>

            <div className="login-card-header">
              <h2 className="login-card-title">Acesso ao painel</h2>
              <p className="login-card-sub">Entre com suas credenciais</p>
            </div>

            <div className="login-tabs">
              <button type="button" className={`login-tab ${tab === 'empresa' ? 'active' : ''}`}
                onClick={() => { setTab('empresa'); setError('') }}>
                Empresa
              </button>
              <button type="button" className={`login-tab ${tab === 'adm' ? 'active' : ''}`}
                onClick={() => { setTab('adm'); setError('') }}>
                ADM Global
              </button>
            </div>

            {tab === 'adm' && (
              <div className="adm-notice">
                <span className="adm-dot" />
                Acesso administrativo global — todas as empresas
              </div>
            )}

            <div className="login-field">
              <label className="login-label">E-mail</label>
              <input
                className="login-input"
                type="email"
                name="email"
                placeholder={tab === 'adm' ? 'admin@nexla.ai' : 'usuario@escritorio.com'}
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="login-label">Senha</label>
              <div className="login-input-wrap">
                <input
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button type="button" className="login-eye" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {tab === 'empresa' && (
              <div className="login-forgot"><a href="#">Esqueceu a senha?</a></div>
            )}

            {authNotice && (
              <div className="login-error" style={{ background: '#FFFBEB', borderColor: '#FCD34D', color: '#92400E' }}>
                {authNotice}
              </div>
            )}

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? <><Loader2 size={15} className="spin" /> Verificando...</>
                : tab === 'adm' ? 'Acesso administrativo' : 'Entrar no painel →'}
            </button>

            <div className="login-footer">AdvoSac · Plataforma exclusiva · Acesso restrito</div>
          </form>
        </div>
      </div>
    </div>
  )
}
