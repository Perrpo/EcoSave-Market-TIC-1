import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import './Profile.css'

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth()

  const [businessName, setBusinessName] = useState(user?.businessName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [nit, setNit] = useState(user?.nit ?? '')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName ?? '')
      setPhone(user.phone ?? '')
      setNit(user.nit ?? '')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      await apiService.updateProfile({ businessName, phone, nit })
      updateUser({ businessName, phone, nit })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = user?.role === 'ong' ? 'ONG' : 'Supermercado'

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Mi Perfil</h1>
        <p className="subtitle muted">Actualiza los datos de tu organización</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {(businessName || user?.email || 'ES')
              .split(' ')
              .map((w) => w[0]?.toUpperCase())
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="profile-name">{businessName || user?.businessName}</p>
            <span className="profile-role-badge">{roleLabel}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="input-readonly"
            />
            <span className="field-hint">El correo no puede modificarse</span>
          </div>

          <div className="form-group">
            <label htmlFor="businessName">Nombre de la organización</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="Nombre comercial o razón social"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Ej. 3001234567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nit">NIT</label>
              <input
                id="nit"
                type="text"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                required
                placeholder="Ej. 900123456-1"
              />
            </div>
          </div>

          {success && (
            <div className="profile-alert profile-alert--success">
              Perfil actualizado correctamente.
            </div>
          )}
          {error && (
            <div className="profile-alert profile-alert--error">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
