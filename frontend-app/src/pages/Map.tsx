import React, { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import { usePolling } from '../hooks/usePolling'
import './Map.css'

type Location = {
  id: number
  nombre: string
  tipo: string
  direccion: string
  especialidades: any
  lat?: number
  lng?: number
  profile_id?: string
  profiles?: {
    nombre?: string
    phone?: string
    business?: string
    roles?: string[]
    nit?: string
  } | null
}

const CATEGORIAS = [
  'Lácteos', 'Panadería', 'Frutas y verduras', 'Carnes',
  'Alimentos secos', 'Bebidas', 'Snacks', 'Enlatados',
]

const CATEGORY_ICONS: Record<string, string> = {
  'Lácteos': '🥛', 'Panadería': '🍞', 'Frutas y verduras': '🥦',
  'Carnes': '🥩', 'Alimentos secos': '🌾', 'Bebidas': '🥤',
  'Snacks': '🍿', 'Enlatados': '🥫',
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const emptyForm = () => ({
  nombre: '', tipo: '', direccion: '',
  especialidades: [] as string[], lat: '', lng: '',
})

const Map: React.FC = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const isOng = auth.user?.role === 'ong'

  const [locations, setLocations] = useState<Location[]>([])
  const [myLocations, setMyLocations] = useState<Location[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [tab, setTab] = useState<'directorio' | 'mis-ubicaciones'>('directorio')

  const fetchLocations = useCallback(async () => {
    const response = await apiService.getLocations()
    if (response.success && response.data) {
      const all = response.data as Location[]
      const targetType = isOng ? ['supermercado', 'supermarket'] : ['ong']
      setLocations(all.filter(loc => targetType.includes(loc.tipo?.toLowerCase())))
    }
    setLoading(false)
  }, [isOng])

  const fetchMyLocations = useCallback(async () => {
    if (!auth.user?.id) return
    const response = await apiService.getMyLocations()
    if (response.success && response.data) {
      setMyLocations(response.data as Location[])
    }
  }, [auth.user?.id])

  usePolling(fetchLocations, 5000, !!auth.user?.id)
  usePolling(fetchMyLocations, 5000, !!auth.user?.id)

  const parseEspecialidades = (raw: any): string[] => {
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw || '[]') } catch { return [] }
  }

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      const tags = parseEspecialidades(loc.especialidades)
      const matchSearch =
        !search ||
        loc.nombre.toLowerCase().includes(search.toLowerCase()) ||
        loc.direccion.toLowerCase().includes(search.toLowerCase()) ||
        tags.some((e: string) => e.toLowerCase().includes(search.toLowerCase()))
      const matchFilter =
        activeFilter === 'todas' ||
        tags.some((e: string) => e.toLowerCase().includes(activeFilter.toLowerCase()))
      return matchSearch && matchFilter
    })
  }, [locations, search, activeFilter])

  const allFilters = useMemo(() => {
    const cats = new Set<string>()
    locations.forEach(loc => parseEspecialidades(loc.especialidades).forEach((c: string) => cats.add(c)))
    return ['todas', ...Array.from(cats)]
  }, [locations])

  const openCreate = () => {
    setEditingLocation(null)
    setForm({ ...emptyForm(), tipo: isOng ? 'ong' : 'supermercado' })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (loc: Location) => {
    setEditingLocation(loc)
    setForm({
      nombre: loc.nombre,
      tipo: loc.tipo,
      direccion: loc.direccion,
      especialidades: parseEspecialidades(loc.especialidades),
      lat: loc.lat?.toString() ?? '',
      lng: loc.lng?.toString() ?? '',
    })
    setFormError('')
    setShowModal(true)
  }

  const toggleEspecialidad = (cat: string) => {
    setForm(f => ({
      ...f,
      especialidades: f.especialidades.includes(cat)
        ? f.especialidades.filter(e => e !== cat)
        : [...f.especialidades, cat],
    }))
  }

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.tipo.trim() || !form.direccion.trim()) {
      setFormError('Nombre, tipo y dirección son obligatorios.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        nombre: form.nombre.trim(),
        tipo: form.tipo.trim(),
        direccion: form.direccion.trim(),
        especialidades: form.especialidades,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
      }

      const response = editingLocation
        ? await apiService.updateLocation(editingLocation.id, payload)
        : await apiService.createLocation(payload)

      if (response.success) {
        setShowModal(false)
        await fetchMyLocations()
        await fetchLocations()
        setTab('mis-ubicaciones')
      } else {
        setFormError((response as any).message || 'Error al guardar la ubicación.')
      }
    } catch {
      setFormError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) return
    try {
      const response = await apiService.deleteLocation(id)
      if (response.success) {
        await fetchMyLocations()
        await fetchLocations()
      } else {
        alert('Error al eliminar: ' + (response as any).message)
      }
    } catch {
      alert('Error de conexión.')
    }
  }

  const renderCard = (loc: Location, isOwn = false) => {
    const tags = parseEspecialidades(loc.especialidades)
    const isExpanded = expandedId === loc.id
    const accentIsOng = isOwn ? loc.tipo?.toLowerCase() === 'ong' : isOng

    return (
      <div
        key={loc.id}
        className={`loc-card ${accentIsOng ? 'loc-card--ong' : 'loc-card--supermarket'} ${isExpanded ? 'loc-card--expanded' : ''}`}
      >
        <div className={`loc-card-stripe ${accentIsOng ? 'stripe--green' : 'stripe--teal'}`} />
        <div className="loc-card-body">
          <div className="loc-card-head">
            <div className={`loc-icon ${accentIsOng ? 'icon--green' : 'icon--teal'}`}>
              {accentIsOng ? '🤝' : '🏪'}
            </div>
            <div className="loc-info">
              <h3 className="loc-name">{loc.nombre}</h3>
              <div className="loc-address">
                <PinIcon /><span>{loc.direccion}</span>
              </div>
              {loc.profiles?.phone && (
                <div className="loc-address" style={{ marginTop: '4px', opacity: 0.8 }}>
                  <span>📞 {loc.profiles.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="loc-type-badge">
            <span className={`type-pill ${accentIsOng ? 'type-pill--green' : 'type-pill--teal'}`}>
              {accentIsOng ? 'ONG' : 'Supermercado'}
            </span>
            {tags.length > 0 && (
              <span className="type-pill type-pill--gray">
                {tags.length} categoría{tags.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="tags">
            {tags.slice(0, isExpanded ? tags.length : 4).map((tag: string) => (
              <span key={tag} className={`tag ${accentIsOng ? 'tag--green' : 'tag--teal'}`}>
                {CATEGORY_ICONS[tag] || '📦'} {tag}
              </span>
            ))}
            {!isExpanded && tags.length > 4 && (
              <button className="tag tag--more" onClick={() => setExpandedId(loc.id)}>
                +{tags.length - 4} más
              </button>
            )}
          </div>

          {loc.lat && loc.lng && (
            <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
              target="_blank" rel="noopener noreferrer" className="loc-maps-link">
              <MapPinIcon /> Ver en Google Maps <ExternalIcon />
            </a>
          )}

          <div className="loc-action">
            {isOwn ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="loc-btn loc-btn--teal" style={{ flex: 1 }} onClick={() => openEdit(loc)}>
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  style={{
                    flex: 1, border: 'none', borderRadius: '10px', padding: '10px 12px',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                    color: '#fff', transition: 'all 160ms ease',
                  }}
                >
                  🗑 Eliminar
                </button>
              </div>
            ) : isOng ? (
              <button className="loc-btn loc-btn--teal" onClick={() => navigate('/dashboard-ong')}>
                🛒 Ver donaciones disponibles
              </button>
            ) : (
              <button className="loc-btn loc-btn--green" onClick={() => navigate('/dashboard')}>
                💝 Ir a gestionar donaciones
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="map-dashboard">
      {/* Header */}
      <div className="map-hero" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="map-hero-badge">{isOng ? '🏪' : '🤝'}</div>
          <div>
            <h1 className="map-hero-title">
              {isOng ? 'Supermercados Aliados' : 'Puntos de Recolección'}
            </h1>
            <p className="map-hero-sub">
              {isOng
                ? `${filtered.length} supermercado${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`
                : `${filtered.length} organización${filtered.length !== 1 ? 'es' : ''} registrada${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          className="loc-btn loc-btn--teal"
          style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={openCreate}
        >
          + Agregar mi ubicación
        </button>
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--stroke)' }}>
        {(['directorio', 'mis-ubicaciones'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            border: 'none', background: 'none', padding: '10px 18px', fontWeight: 700,
            fontSize: '0.9rem', cursor: 'pointer',
            borderBottom: `3px solid ${tab === t ? '#00A99D' : 'transparent'}`,
            color: tab === t ? '#00A99D' : 'var(--muted)',
            transition: 'all 150ms ease', marginBottom: '-2px',
          }}>
            {t === 'directorio' ? '🗺️ Directorio' : `📍 Mis Ubicaciones (${myLocations.length})`}
          </button>
        ))}
      </div>

      {/* ── Pestaña: Directorio ── */}
      {tab === 'directorio' && (
        <>
          <div className="search-card">
            <div className="search-box">
              <SearchIcon />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isOng ? 'Buscar supermercado, dirección o categoría...' : 'Buscar ONG, dirección o categoría aceptada...'}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 4px' }}>✕</button>
              )}
            </div>
            <div className="filter-row">
              {allFilters.map((f) => (
                <button key={f} className={`pill ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
                  {f !== 'todas' && CATEGORY_ICONS[f] ? `${CATEGORY_ICONS[f]} ` : ''}{f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="map-loading">
              <div className="map-spinner" />
              <p>Cargando ubicaciones...</p>
            </div>
          ) : (
            <div className="grid">
              {filtered.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <p className="empty-title">{isOng ? 'No se encontraron supermercados' : 'No se encontraron ONGs'}</p>
                  <p className="empty-sub">Intenta con otro término o limpia los filtros</p>
                  <button className="pill" onClick={() => { setSearch(''); setActiveFilter('todas') }}>Limpiar filtros</button>
                </div>
              ) : (
                filtered.map(loc => renderCard(loc, false))
              )}
            </div>
          )}
        </>
      )}

      {/* ── Pestaña: Mis Ubicaciones ── */}
      {tab === 'mis-ubicaciones' && (
        <>
          {myLocations.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">Aún no tienes ubicaciones registradas</p>
              <p className="empty-sub">Agrega tu sede o punto de contacto para que otros usuarios puedan encontrarte.</p>
              <button
                className="loc-btn loc-btn--teal"
                style={{ width: 'auto', padding: '10px 24px', marginTop: '8px' }}
                onClick={openCreate}
              >
                + Agregar primera ubicación
              </button>
            </div>
          ) : (
            <div className="grid">
              {myLocations.map(loc => renderCard(loc, true))}
            </div>
          )}
        </>
      )}

      {/* ── Modal crear / editar ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ maxWidth: '520px', width: '100%' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: '1.15rem' }}>
              {editingLocation ? '✏️ Editar ubicación' : '📍 Nueva ubicación'}
            </h3>

            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Sede Principal Centro"
              />
            </div>

            <div className="form-group">
              <label>Tipo *</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="">Selecciona el tipo</option>
                <option value="ong">ONG / Punto de Recolección</option>
                <option value="supermercado">Supermercado / Donante</option>
              </select>
            </div>

            <div className="form-group">
              <label>Dirección *</label>
              <input
                type="text"
                value={form.direccion}
                onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                placeholder="Ej: Calle 72 # 10-34, Bogotá"
              />
            </div>

            <div className="form-group">
              <label>Especialidades / Categorías que manejas</label>
              <div className="filter-row" style={{ marginTop: '8px' }}>
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`pill ${form.especialidades.includes(cat) ? 'active' : ''}`}
                    onClick={() => toggleEspecialidad(cat)}
                    style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                  >
                    {CATEGORY_ICONS[cat] || '📦'} {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Latitud (opcional)</label>
                <input
                  type="number" step="any"
                  value={form.lat}
                  onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                  placeholder="Ej: 4.710989"
                />
              </div>
              <div className="form-group">
                <label>Longitud (opcional)</label>
                <input
                  type="number" step="any"
                  value={form.lng}
                  onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                  placeholder="Ej: -74.072092"
                />
              </div>
            </div>

            {formError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0 0 12px', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>
                ⚠️ {formError}
              </p>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="btn-cancel" disabled={saving}>Cancelar</button>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : editingLocation ? 'Guardar cambios' : 'Crear ubicación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Map
