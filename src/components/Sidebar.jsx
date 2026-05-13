import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, X } from 'lucide-react'
import BrandMark from './BrandMark'
import './Sidebar.css'

export default function Sidebar({ links, role, open, onClose }) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleNav() {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Overlay mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <BrandMark size={36} color="#C9A074" strokeWidth={1.5} />
          <div>
            <div className="sidebar-brand-name">NexlaADV</div>
            <div className="sidebar-brand-tag">{role === 'adm' ? 'ADM Global' : 'Painel'}</div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map((link, i) => link.action ? (
            <button key={'action-' + i} className="sidebar-link"
              onClick={() => { link.action(); handleNav() }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
              <link.icon size={16} />
              {link.label}
              {link.badge ? <span className={`sidebar-badge nx-badge nx-badge-${link.badgeColor || 'cyan'}`}>{link.badge}</span> : null}
            </button>
          ) : (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleNav}>
              <link.icon size={16} />
              {link.label}
              {link.badge ? <span className={`sidebar-badge nx-badge nx-badge-${link.badgeColor || 'cyan'}`}>{link.badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{session?.user?.name}</div>
              <div className="sidebar-user-email">{session?.user?.email}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Sair">
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  )
}

