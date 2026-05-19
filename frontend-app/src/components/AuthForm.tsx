import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TextureButton } from './ui/texture-button'
import './AuthForm.css'

type Role = 'supermarket' | 'ong' | 'admin'

// Password requirement checks
const getPasswordChecks = (pwd: string) => [
  { label: 'Mínimo 8 caracteres', met: pwd.length >= 8 },
  { label: 'Al menos una mayúscula (A-Z)', met: /[A-Z]/.test(pwd) },
  { label: 'Al menos una minúscula (a-z)', met: /[a-z]/.test(pwd) },
  { label: 'Al menos un número (0-9)', met: /[0-9]/.test(pwd) },
  { label: 'Al menos un carácter especial (@#$*!)', met: /[^A-Za-z0-9]/.test(pwd) },
]

// Password strength calculation
const calculateStrength = (pwd: string): { score: number; label: string; color: string } => {
  if (!pwd) return { score: 0, label: '', color: '' }
  const checks = getPasswordChecks(pwd)
  const passed = checks.filter(c => c.met).length

  if (passed <= 2) return { score: 1, label: 'Débil', color: '#ef4444' }
  if (passed <= 3) return { score: 2, label: 'Media', color: '#f59e0b' }
  if (passed <= 4) return { score: 2, label: 'Media', color: '#f59e0b' }
  return { score: 3, label: 'Fuerte', color: '#22c55e' }
}

const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
    <defs>
      <linearGradient id="leaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop stopColor="#2D5A27" offset="0%" />
        <stop stopColor="#8DC63F" offset="100%" />
      </linearGradient>
    </defs>
    <path d="M12 34c0-14.36 11.64-26 26-26h14c0 14.36-11.64 26-26 26H12z" fill="url(#leaf)" />
    <path d="M38 6c-7 10-10 20-10 30 6-6 11-13 18-18" stroke="#F8F9FA" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M29 52c0-6 5-11 11-11h4l-4-4" stroke="#2D5A27" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="45" cy="41" r="2.5" fill="#F58220" />
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
  const [missionArea, setMissionArea] = useState('')  // TSK-006: solo para ONG
  const [role, setRole] = useState<Role>('supermarket')
  const [loginRole, setLoginRole] = useState<Role>('supermarket')
  const [password, setPassword] = useState('')
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: '', color: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()
  const auth = useAuth()

  useEffect(() => {
    if (tab === 'register') {
      setPwdStrength(calculateStrength(password))
    }
  }, [password, tab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ── Validaciones detalladas ──────────────────────────────────────────────
    if (!email || !password) {
      setError('Email y contraseña son requeridos.')
      return
    }

    if (tab === 'register') {
      if (!businessName.trim()) {
        setError('El nombre o razón social es requerido.')
        return
      }
      const phoneClean = phone.replace(/\s/g, '')
      if (!phoneClean || !/^[+]?[0-9]{7,15}$/.test(phoneClean)) {
        setError('Ingresa un número de teléfono válido (7–15 dígitos).')
        return
      }
      if (!nit.trim() || !/^[0-9]{6,12}(-[0-9])?$/.test(nit.trim())) {
        setError('Ingresa un NIT válido (ej. 900123456-1).')
        return
      }
      if (role === 'ong' && !missionArea.trim()) {
        setError('El área de misión es requerida para ONGs.')
        return
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.')
        return
      }
      if (!/[A-Z]/.test(password)) {
        setError('La contraseña debe tener al menos una letra mayúscula.')
        return
      }
      if (!/[0-9]/.test(password)) {
        setError('La contraseña debe tener al menos un número.')
        return
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        setError('La contraseña debe tener al menos un caracter especial (ej. @, #, $, *, etc).')
        return
      }
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      let result
      if (tab === 'login') {
        result = await auth.login(email, password, loginRole)
        if (result.success) {
          // Usar el usuario retornado directamente, no auth.user que puede estar desactualizado
          const loggedUser = result.user
          if (loggedUser?.role === 'admin') navigate('/dashboard-admin')
          else if (loggedUser?.role === 'ong') navigate('/dashboard-ong')
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
          setMissionArea('')
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
      {(['supermarket', 'ong'] as Role[]).map((r) => (
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
            type="button"
            onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
            style={{
              background: 'transparent',
              border: '1.5px solid #00A99D',
              color: '#00A99D',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background 150ms ease, color 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#00A99D'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#00A99D'
            }}
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
              {role === 'ong' && (
                <label className="field">
                  <span>Área de misión</span>
                  <select
                    value={missionArea}
                    onChange={(e) => setMissionArea(e.target.value)}
                    required
                  >
                    <option value="">Selecciona el área principal</option>
                    <option value="Seguridad alimentaria">Seguridad alimentaria</option>
                    <option value="Infancia y familia">Infancia y familia</option>
                    <option value="Adulto mayor">Adulto mayor</option>
                    <option value="Comunidades vulnerables">Comunidades vulnerables</option>
                    <option value="Educación">Educación</option>
                    <option value="Salud">Salud</option>
                    <option value="Medio ambiente">Medio ambiente</option>
                  </select>
                </label>
              )}
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
                placeholder={tab === 'register' ? "Mínimo 8 caracteres" : "Contraseña"}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            {tab === 'register' && password && (
              <>
                {/* ── Strength Bars ── */}
                <div className="pwd-meter-container">
                  <div className="pwd-bars">
                    <div className="pwd-bar" style={{ background: pwdStrength.score >= 1 ? pwdStrength.color : '#e5e7eb' }}></div>
                    <div className="pwd-bar" style={{ background: pwdStrength.score >= 2 ? pwdStrength.color : '#e5e7eb' }}></div>
                    <div className="pwd-bar" style={{ background: pwdStrength.score >= 3 ? pwdStrength.color : '#e5e7eb' }}></div>
                  </div>
                  <div className="pwd-label" style={{ color: pwdStrength.color }}>
                    {pwdStrength.label}
                  </div>
                </div>

                {/* ── Requirements Checklist ── */}
                <ul className="pwd-checklist">
                  {getPasswordChecks(password).map((check, i) => (
                    <li key={i} className={`pwd-check-item ${check.met ? 'met' : 'unmet'}`}>
                      <span className="pwd-check-icon">
                        {check.met ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        )}
                      </span>
                      <span>{check.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </label>

          {error && <div className="alert error">{error}</div>}
          {successMessage && <div className="alert success">{successMessage}</div>}

          <div className="mt-4">
            <TextureButton variant="accent" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? 'Procesando…' : tab === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </TextureButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthForm
