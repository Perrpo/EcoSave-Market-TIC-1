import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import './Map.css'

type Location = {
  id: string
  nombre: string
  tipo: string
  direccion: string
  especialidades: any
  lat?: number
  lng?: number
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const SearchXIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m13.5 8.5-5 5" /><path d="m8.5 8.5 5 5" />
    <path d="m16 16 5 5" /><path d="m21 16-5 5" />
    <circle cx="11" cy="11" r="8" />
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

const CATEGORY_ICONS: Record<string, string> = {
  'Lácteos': '🥛',
  'Panadería': '🍞',
  'Frutas y verduras': '🥦',
  'Carnes': '🥩',
  'Alimentos secos': '🌾',
  'Bebidas': '🥤',
  'Snacks': '🍿',
  'Enlatados': '🥫',
}

const Map: React.FC = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const isOng = auth.user?.role === 'ong'

  const [locations, setLocations] = useState<Location[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true)
      const response = await apiService.getLocations()
      if (response.success && response.data) {
        const all = response.data as Location[]
        const targetType = isOng ? ['supermercado', 'supermarket'] : ['ong']
        setLocations(all.filter(loc => targetType.includes(loc.tipo?.toLowerCase())))
      }
      setLoading(false)
    }
    fetchLocations()
  }, [isOng])

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

  return (
    <div className="map-dashboard">

      {/* Header */}
      <div className="map-hero">
        <div className="map-hero-badge">
          {isOng ? '🏪' : '🤝'}
        </div>
        <div>
          <h1 className="map-hero-title">
            {isOng ? 'Supermercados Aliados' : 'Puntos de Recolección'}
          </h1>
          <p className="map-hero-sub">
            {isOng
              ? `${filtered.length} supermercado${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''} con donaciones`
              : `${filtered.length} organización${filtered.length !== 1 ? 'es' : ''} lista${filtered.length !== 1 ? 's' : ''} para recibir`}
          </p>
        </div>
      </div>

      {/* Buscador + filtros */}
      <div className="search-card">
        <div className="search-box">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isOng
              ? 'Buscar supermercado, dirección o categoría...'
              : 'Buscar ONG, dirección o categoría aceptada...'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 4px' }}
            >✕</button>
          )}
        </div>
        <div className="filter-row">
          {allFilters.map((f) => (
            <button
              key={f}
              className={`pill ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f !== 'todas' && CATEGORY_ICONS[f] ? `${CATEGORY_ICONS[f]} ` : ''}{f}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="map-loading">
          <div className="map-spinner" />
          <p>Cargando ubicaciones...</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <SearchXIcon />
              <p className="empty-title">
                {isOng ? 'No se encontraron supermercados' : 'No se encontraron ONGs'}
              </p>
              <p className="empty-sub">Intenta con otro término de búsqueda o limpia los filtros</p>
              <button className="pill" onClick={() => { setSearch(''); setActiveFilter('todas') }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            filtered.map((loc) => {
              const tags = parseEspecialidades(loc.especialidades)
              const isExpanded = expandedId === loc.id

              return (
                <div
                  key={loc.id}
                  className={`loc-card ${isOng ? 'loc-card--supermarket' : 'loc-card--ong'} ${isExpanded ? 'loc-card--expanded' : ''}`}
                >
                  {/* Franja de color superior */}
                  <div className={`loc-card-stripe ${isOng ? 'stripe--teal' : 'stripe--green'}`} />

                  <div className="loc-card-body">
                    {/* Cabecera */}
                    <div className="loc-card-head">
                      <div className={`loc-icon ${isOng ? 'icon--teal' : 'icon--green'}`}>
                        {isOng ? '🏪' : '🤝'}
                      </div>
                      <div className="loc-info">
                        <h3 className="loc-name">{loc.nombre}</h3>
                        <div className="loc-address">
                          <PinIcon />
                          <span>{loc.direccion}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badge tipo */}
                    <div className="loc-type-badge">
                      <span className={`type-pill ${isOng ? 'type-pill--teal' : 'type-pill--green'}`}>
                        {isOng ? 'Supermercado' : 'ONG'}
                      </span>
                      {tags.length > 0 && (
                        <span className="type-pill type-pill--gray">
                          {tags.length} categoría{tags.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Categorías */}
                    <div className="tags">
                      {tags.slice(0, isExpanded ? tags.length : 4).map((tag: string) => (
                        <span key={tag} className={`tag ${isOng ? 'tag--teal' : 'tag--green'}`}>
                          {CATEGORY_ICONS[tag] || '📦'} {tag}
                        </span>
                      ))}
                      {!isExpanded && tags.length > 4 && (
                        <button
                          className="tag tag--more"
                          onClick={() => setExpandedId(loc.id)}
                        >
                          +{tags.length - 4} más
                        </button>
                      )}
                    </div>

                    {/* Coordenadas si existen */}
                    {loc.lat && loc.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="loc-maps-link"
                      >
                        <MapPinIcon />
                        Ver en Google Maps
                        <ExternalIcon />
                      </a>
                    )}

                    {/* Acción específica por rol */}
                    <div className="loc-action">
                      {isOng ? (
                        <button
                          className="loc-btn loc-btn--teal"
                          onClick={() => navigate('/dashboard-ong')}
                        >
                          🛒 Ver donaciones disponibles
                        </button>
                      ) : (
                        <button
                          className="loc-btn loc-btn--green"
                          onClick={() => navigate('/dashboard')}
                        >
                          💝 Ir a gestionar donaciones
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Map
