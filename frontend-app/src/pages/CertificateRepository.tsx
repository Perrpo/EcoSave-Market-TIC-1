import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import './Dashboard.css'
import './CertificateRepository.css'

interface Certificate {
  id: string
  codigo_certificado: string
  fecha_emision: string
  fecha_recepcion: string | null
  producto: string
  categoria: string
  cantidad: number
  valor_total: number
  estado: 'vigente' | 'anulado' | 'vencido'
  qr_hash: string
  donation_id: number
  donor?: {
    email: string
    profile?: { name: string; business: string }
  }
  recipient?: {
    email: string
    profile?: { name: string; business: string }
  }
}

interface SearchFilters {
  codigo_certificado: string
  fecha_desde: string
  fecha_hasta: string
  estado: string
  producto: string
}

const EMPTY_FILTERS: SearchFilters = {
  codigo_certificado: '',
  fecha_desde: '',
  fecha_hasta: '',
  estado: '',
  producto: '',
}

const CertificateRepository: React.FC = () => {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const limit = 10

  const loadCertificates = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string | number> = {
        limit,
        offset: page * limit,
      }
      if (filters.codigo_certificado) params.codigo_certificado = filters.codigo_certificado
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta
      if (filters.estado) params.estado = filters.estado
      if (filters.producto) params.producto = filters.producto

      const response = await apiService.getCertificates(params)
      if (response.success && response.data) {
        setCertificates(response.data as Certificate[])
        setTotal(response.pagination?.total ?? 0)
      } else {
        setCertificates([])
        setTotal(0)
      }
    } catch (err) {
      console.error('Error loading certificates:', err)
      setCertificates([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    loadCertificates()
  }, [loadCertificates])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    loadCertificates()
  }

  const handleClear = () => {
    setFilters(EMPTY_FILTERS)
    setPage(0)
  }

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id)
    try {
      await apiService.downloadCertificate(cert.id, cert.codigo_certificado)
    } catch (err) {
      console.error('Error downloading certificate:', err)
      alert('Error al descargar el certificado. Inténtalo de nuevo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      vigente: { label: 'Vigente', cls: 'badge-vigente' },
      anulado: { label: 'Anulado', cls: 'badge-anulado' },
      vencido: { label: 'Vencido', cls: 'badge-vencido' },
    }
    return map[estado] ?? { label: estado, cls: '' }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">Repositorio de Certificados</h1>
          <p className="subtitle">Consulta y descarga los certificados de donación generados</p>
        </div>
        <div className="header-meta">
          <div className="user-chip stacked">
            <span className="chip-title">{user?.businessName || 'EcoSave'}</span>
            <span className="chip-sub">Supermercado</span>
          </div>
        </div>
      </div>

      {/* ── Formulario de búsqueda ── */}
      <div className="card cert-search-card">
        <h3 className="main-title" style={{ marginBottom: '1rem' }}>🔍 Buscar Certificados</h3>
        <form onSubmit={handleSearch} className="cert-search-form">
          <div className="cert-search-row">
            <div className="form-group">
              <label>Código de certificado</label>
              <input
                type="text"
                placeholder="Ej: CERT-2026-A1B2"
                value={filters.codigo_certificado}
                onChange={(e) => setFilters({ ...filters, codigo_certificado: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Producto</label>
              <input
                type="text"
                placeholder="Nombre del producto"
                value={filters.producto}
                onChange={(e) => setFilters({ ...filters, producto: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="vigente">Vigente</option>
                <option value="anulado">Anulado</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
          </div>
          <div className="cert-search-row">
            <div className="form-group">
              <label>Fecha desde</label>
              <input
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Fecha hasta</label>
              <input
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
              />
            </div>
            <div className="form-group cert-search-actions">
              <button type="submit" className="btn-primary">Buscar</button>
              <button type="button" className="btn-secondary" onClick={handleClear}>Limpiar</button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Tabla de resultados ── */}
      <div className="card">
        <div className="cert-table-header">
          <span className="subtitle">
            {isLoading ? 'Buscando…' : `${total} certificado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {isLoading ? (
          <div className="loading-message">Cargando certificados…</div>
        ) : certificates.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">📜</div>
            <p>No se encontraron certificados</p>
            <p className="no-products-desc">
              Los certificados se generan automáticamente cuando una donación es confirmada por la ONG.
            </p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="products-table cert-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>ONG Receptora</th>
                    <th>Fecha Emisión</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => {
                    const badge = getEstadoBadge(cert.estado)
                    const recipientName =
                      cert.recipient?.profile?.business ||
                      cert.recipient?.profile?.name ||
                      cert.recipient?.email ||
                      '—'
                    return (
                      <tr key={cert.id}>
                        <td>
                          <span className="cert-code">{cert.codigo_certificado}</span>
                        </td>
                        <td>
                          <div>{cert.producto}</div>
                          <div className="desc">{cert.categoria}</div>
                        </td>
                        <td>{cert.cantidad} uds.</td>
                        <td>{recipientName}</td>
                        <td>{new Date(cert.fecha_emision).toLocaleDateString('es-CO')}</td>
                        <td>
                          <span className={`badge ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td>
                          <div className="actions-inline">
                            <button
                              className="btn-icon-sm"
                              title="Ver detalle"
                              onClick={() => setSelectedCert(cert)}
                            >
                              👁️
                            </button>
                            <button
                              className="btn-icon-sm btn-download"
                              title="Descargar PDF"
                              onClick={() => handleDownload(cert)}
                              disabled={downloadingId === cert.id}
                            >
                              {downloadingId === cert.id ? '⏳' : '⬇️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="cert-pagination">
                <button
                  className="btn-secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span className="subtitle">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal de detalle ── */}
      {selectedCert && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCert(null) }}>
          <div className="modal modal-large cert-detail-modal">
            <div className="modal-header">
              <h3>📜 Detalle del Certificado</h3>
              <button className="icon-btn" onClick={() => setSelectedCert(null)}>×</button>
            </div>

            <div className="cert-detail-grid">
              <div className="cert-detail-section">
                <h4>Identificación</h4>
                <p><strong>Código:</strong> {selectedCert.codigo_certificado}</p>
                <p><strong>Estado:</strong> <span className={`badge ${getEstadoBadge(selectedCert.estado).cls}`}>{getEstadoBadge(selectedCert.estado).label}</span></p>
                <p><strong>Hash de verificación:</strong> <code className="cert-hash">{selectedCert.qr_hash}</code></p>
              </div>

              <div className="cert-detail-section">
                <h4>Donación</h4>
                <p><strong>Producto:</strong> {selectedCert.producto}</p>
                <p><strong>Categoría:</strong> {selectedCert.categoria}</p>
                <p><strong>Cantidad:</strong> {selectedCert.cantidad} unidades</p>
                <p><strong>Valor total:</strong> ${Number(selectedCert.valor_total).toLocaleString('es-CO')}</p>
              </div>

              <div className="cert-detail-section">
                <h4>Donante (Supermercado)</h4>
                <p><strong>Razón social:</strong> {selectedCert.donor?.profile?.business || selectedCert.donor?.profile?.name || '—'}</p>
                <p><strong>Correo:</strong> {selectedCert.donor?.email || '—'}</p>
              </div>

              <div className="cert-detail-section">
                <h4>Donatario (ONG)</h4>
                <p><strong>Entidad:</strong> {selectedCert.recipient?.profile?.business || selectedCert.recipient?.profile?.name || '—'}</p>
                <p><strong>Correo:</strong> {selectedCert.recipient?.email || '—'}</p>
              </div>

              <div className="cert-detail-section">
                <h4>Fechas</h4>
                <p><strong>Emisión:</strong> {new Date(selectedCert.fecha_emision).toLocaleDateString('es-CO')}</p>
                <p><strong>Recepción:</strong> {selectedCert.fecha_recepcion ? new Date(selectedCert.fecha_recepcion).toLocaleDateString('es-CO') : '—'}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSelectedCert(null)}>Cerrar</button>
              <button
                className="btn-primary"
                onClick={() => handleDownload(selectedCert)}
                disabled={downloadingId === selectedCert.id}
              >
                {downloadingId === selectedCert.id ? '⏳ Generando PDF…' : '⬇️ Descargar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificateRepository
