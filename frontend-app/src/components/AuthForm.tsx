import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TextureButton } from './ui/texture-button'
import './AuthForm.css'

type Role = 'supermarket' | 'ong' | 'admin'

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
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()
  const auth = useAuth()

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
