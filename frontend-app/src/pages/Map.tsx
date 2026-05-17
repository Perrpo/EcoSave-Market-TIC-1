import React, { useEffect, useMemo, useState } from 'react'
import apiService from '../services/api'
import './Map.css'

type Location = {
  id: string
  nombre: string
  tipo: string
  direccion: string
  especialidades: any
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="3" width="12" height="18" rx="2" />
    <path d="M9 7h6M9 11h6M9 15h6" />
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
    <path d="m13.5 8.5-5 5" />
    <path d="m8.5 8.5 5 5" />
    <path d="m16 16 5 5" />
    <path d="m21 16-5 5" />
    <circle cx="11" cy="11" r="8" />
  </svg>
)

const Map: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('todas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true)
      const response = await apiService.getLocations({ tipo: 'ONG' })
      if (response.success && response.data) {
        setLocations(response.data as Location[])
      }
      setLoading(false)
    }
    fetchLocations()
  }, [])

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      const especialidades = Array.isArray(loc.especialidades)
        ? loc.especialidades
        : JSON.parse((loc.especialidades as any) || '[]')

      const matchSearch =
        !search ||
        loc.nombre.toLowerCase().includes(search.toLowerCase()) ||
        loc.direccion.toLowerCase().includes(search.toLowerCase()) ||
        especialidades.some((e: string) => e.toLowerCase().includes(search.toLowerCase()))

      const matchFilter =
        activeFilter === 'todas' ||
        especialidades.some((e: string) => e.toLowerCase().includes(activeFilter.toLowerCase()))

      return matchSearch && matchFilter
    })
  }, [locations, search, activeFilter])

  const filters = ['todas', 'Alimentos secos', 'Lácteos', 'Frutas y verduras', 'Carnes']

  return (
    <div className="map-dashboard">
      <div className="page-header">
        <h1>Puntos de Recolección</h1>
        <p className="subtitle muted">ONGs aliadas disponibles</p>
      </div>

      <div className="search-card">
        <div className="search-box">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, dirección o especialidad..."
          />
        </div>
        <div className="filter-row">
          {filters.map((f) => (
            <button
              key={f}
              className={`pill ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : (
        <div className="grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <SearchXIcon />
              <p className="empty-title">No se encontraron ONGs</p>
              <p className="empty-sub">Intenta con otro término de búsqueda</p>
              <button className="pill" onClick={() => { setSearch(''); setActiveFilter('todas'); }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            filtered.map((loc) => {
              const especialidades = Array.isArray(loc.especialidades)
                ? loc.especialidades
                : JSON.parse((loc.especialidades as any) || '[]')
              return (
                <div key={loc.id} className="ong-card">
                  <div className="ong-head">
                    <BuildingIcon />
                    <div>
                      <p className="ong-name">{loc.nombre}</p>
                      <div className="ong-address"><PinIcon /> {loc.direccion}</div>
                    </div>
                  </div>
                  <div className="tags">
                    {especialidades.map((tag: string) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
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
