import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import './Sidebar.css'

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const Logo = () => (
  <div className="logo-mark">
    <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="leaf2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#2D5A27" offset="0%" />
          <stop stopColor="#8DC63F" offset="100%" />
        </linearGradient>
      </defs>
      <path d="M12 34c0-14.36 11.64-26 26-26h14c0 14.36-11.64 26-26 26H12z" fill="url(#leaf2)" />
      <path d="M38 6c-7 10-10 20-10 30 6-6 11-13 18-18" stroke="#2D5A27" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M29 52c0-6 5-11 11-11h4l-4-4" stroke="#2D5A27" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="45" cy="41" r="2.5" fill="#F58220" />
    </svg>
  </div>
)

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const isONG = user?.role === 'ong'
  const isAdmin = user?.role === 'admin'
  const [collapsed, setCollapsed] = useState(false)

  const navItems = isAdmin
    ? [
        { to: '/dashboard-admin', label: 'Panel Administrador', icon: '🛡️' },
        { to: '/map', label: 'Mapa General', icon: '🗺️' },
        { to: '/notifications', label: 'Notificaciones', icon: '🔔', badge: unreadCount },
      ]
    : isONG
    ? [
        { to: '/dashboard-ong', label: 'Dashboard ONG', icon: '🤝' },
        { to: '/map', label: 'Puntos de Recolección', icon: '🗺️' },
        { to: '/notifications', label: 'Notificaciones', icon: '🔔', badge: unreadCount },
        { to: '/profile', label: 'Mi Perfil', icon: '👤' },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard Supermercado', icon: '🛒' },
        { to: '/integracion-inventario', label: 'Integración Inventario', icon: '🔗' },
        { to: '/map', label: 'Mapa de ONGs', icon: '🗺️' },
        { to: '/notifications', label: 'Notificaciones', icon: '🔔', badge: unreadCount },
        { to: '/profile', label: 'Mi Perfil', icon: '👤' },
      ]

  const roleLabel = isAdmin ? 'Administrador' : isONG ? 'ONG' : 'Supermercado'

  const initials = (user?.businessName || user?.email || 'ES')
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2)

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar-top">
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? '☰' : '×'}
          </button>
          <div className="brand">
            <Logo />
            {!collapsed && (
              <div>
                <p className="brand-name">EcoSave Market</p>
                <p className="brand-sub">Sostenibilidad y confianza</p>
              </div>
            )}
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge ? <span className="pill">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="avatar">{initials}</div>
            {!collapsed && (
              <div className="user-stack">
                <p className="chip-title">{user?.businessName || 'EcoSave'}</p>
                <p className="chip-sub">{roleLabel}</p>
              </div>
            )}
            <button className="icon-btn" onClick={logout} aria-label="Salir">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
            {item.badge ? <span className="pill">{item.badge}</span> : null}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default Sidebar
