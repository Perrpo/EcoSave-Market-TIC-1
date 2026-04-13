import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthForm.css'

type Role = 'supermarket' | 'ong' | 'admin'

const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
    <defs>
      <linearGradient id="leaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop stopColor="#1a7a4a" offset="0%" />
        <stop stopColor="#24b26e" offset="100%" />
      </linearGradient>
    </defs>
    <path d="M12 34c0-14.36 11.64-26 26-26h14c0 14.36-11.64 26-26 26H12z" fill="url(#leaf)" />
    <path d="M38 6c-7 10-10 20-10 30 6-6 11-13 18-18" stroke="#f7f6f2" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M29 52c0-6 5-11 11-11h4l-4-4" stroke="#1a7a4a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="45" cy="41" r="2.5" fill="#e07b39" />
  </svg>
)

const roleCopy: Record<Role, { title: string; desc: string }> = {
  supermarket: { title: 'Supermercado', desc: 'Publica excedentes y dona antes de que venzan' },
  ong: { title: 'ONG', desc: 'Solicita y recibe donaciones verificadas' },
  admin: { title: 'Admin', desc: 'Supervisa métricas y operaciones' },
}

const AuthForm: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nit, setNit] = useState('')
  const [role, setRole] = useState<Role>('supermarket')
  const [loginRole, setLoginRole] = useState<Role>('supermarket')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()
  const auth = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Email y contraseña son requeridos')
      return
    }

    if (tab === 'register' && (!businessName || !phone || !nit)) {
      setError('Completa todos los campos para registrarte')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      let result
      if (tab === 'login') {
        result = await auth.login(email, password, loginRole)
        if (result.success) {
          if (auth.user?.role === 'admin') navigate('/dashboard-admin')
          else if (auth.user?.role === 'ong') navigate('/dashboard-ong')
          else navigate('/dashboard')
        } else {
          setError(result.error || 'Error desconocido')
        }
      } else {
        result = await auth.register(email, password, businessName, phone, nit, role)
        if (result.success) {
          setSuccessMessage(result.message || 'Registro exitoso. Inicia sesión para continuar.')
          setTab('login')
          setBusinessName('')
          setPhone('')
          setNit('')
          setRole('supermarket')
          setPassword('')
        } else {
          setError(result.error || 'Error desconocido')
        }
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const renderRoleCards = (selected: Role, onSelect: (r: Role) => void) => (
    <div className="role-grid" role="group" aria-label="Selecciona tu rol">
      {(['supermarket', 'ong', 'admin'] as Role[]).map((r) => (
        <button
          type="button"
          key={r}
          className={`role-card ${selected === r ? 'is-active' : ''}`}
          onClick={() => onSelect(r)}
        >
          <div className="role-icon">
            {r === 'supermarket' ? '🛒' : r === 'ong' ? '🤝' : '🛡️'}
          </div>
          <div>
            <p className="role-title">{roleCopy[r].title}</p>
            <p className="role-desc">{roleCopy[r].desc}</p>
          </div>
        </button>
      ))}
    </div>
  )

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="hero-top">
          <Logo size={36} />
          <div>
            <p className="eyebrow">EcoSave Market</p>
            <h1>Conecta alimentos con quienes los necesitan.</h1>
            <p className="hero-copy">
              Supermercados y ONGs colaboran en tiempo real para reducir desperdicio y ampliar el impacto social.
            </p>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="impact-card">
            <p className="impact-title">Impacto en marcha</p>
            <div className="impact-metrics">
              <div>
                <span className="impact-number">+3200kg</span>
                <span className="impact-label">Rescatados</span>
              </div>
              <div>
                <span className="impact-number">140</span>
                <span className="impact-label">Entregas</span>
              </div>
              <div>
                <span className="impact-number">26</span>
                <span className="impact-label">Aliados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="panel-header">
          <Logo />
          <div>
            <p className="eyebrow">Bienvenido</p>
            <h2>{tab === 'login' ? 'Inicia sesión' : 'Crear cuenta'}</h2>
          </div>
          <button
            className="tab-toggle"
            type="button"
            onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
          >
            {tab === 'login' ? 'Quiero registrarme' : 'Ya tengo cuenta'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'login' ? renderRoleCards(loginRole, setLoginRole) : renderRoleCards(role, setRole)}

          {tab === 'register' && (
            <>
              <label className="field">
                <span>Razón Social</span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Mercacentro Laureles"
                  required
                />
              </label>
              <div className="grid two-cols">
                <label className="field">
                  <span>Teléfono</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    required
                  />
                </label>
                <label className="field">
                  <span>NIT</span>
                  <input
                    type="text"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="900123456-1"
                    required
                  />
                </label>
              </div>
            </>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          {error && <div className="alert error">{error}</div>}
          {successMessage && <div className="alert success">{successMessage}</div>}

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Procesando…' : tab === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthForm
