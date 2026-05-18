import React, { useState } from 'react'
import './Dashboard.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Provider = 'siigo' | 'alegra' | 'sheets'
type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

interface Connection {
  provider: Provider
  connected: boolean
  lastSync: string | null
  status: SyncStatus
  productosSincronizados: number
}

interface SyncLog {
  id: number
  provider: Provider
  timestamp: Date
  result: 'ok' | 'error'
  message: string
  productos: number
}

interface Credentials {
  siigo:  { clientId: string; clientSecret: string; company: string }
  alegra: { token: string; email: string }
  sheets: { spreadsheetId: string; range: string }
}

// ─── Estado inicial ───────────────────────────────────────────────────────────

const INITIAL_CONNECTIONS: Connection[] = [
  { provider: 'siigo',  connected: false, lastSync: null, status: 'idle', productosSincronizados: 0 },
  { provider: 'alegra', connected: false, lastSync: null, status: 'idle', productosSincronizados: 0 },
  { provider: 'sheets', connected: false, lastSync: null, status: 'idle', productosSincronizados: 0 },
]

const INITIAL_CREDENTIALS: Credentials = {
  siigo:  { clientId: '', clientSecret: '', company: '' },
  alegra: { token: '', email: '' },
  sheets: { spreadsheetId: '', range: 'Hoja1!A1:F100' },
}

const INITIAL_LOGS: SyncLog[] = []

// ─── Helpers de presentación ──────────────────────────────────────────────────

const PROVIDER_LABEL: Record<Provider, string> = {
  siigo:  'Siigo',
  alegra: 'Alegra',
  sheets: 'Google Sheets',
}

const PROVIDER_ICON: Record<Provider, string> = {
  siigo:  '🧾',
  alegra: '📊',
  sheets: '📋',
}

const PROVIDER_DESC: Record<Provider, string> = {
  siigo:  'ERP contable colombiano. Sincroniza productos próximos a vencer desde tu inventario Siigo.',
  alegra: 'Software de facturación y contabilidad. Importa automáticamente tu inventario desde Alegra.',
  sheets: 'Hoja de cálculo de Google. Conecta una hoja con tu inventario y sincroniza con un clic.',
}

// ─── Componente ───────────────────────────────────────────────────────────────

const IntegracionInventario: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS)
  const [creds, setCreds]             = useState<Credentials>(INITIAL_CREDENTIALS)
  const [logs, setLogs]               = useState<SyncLog[]>(INITIAL_LOGS)
  const [configuring, setConfiguring] = useState<Provider | null>(null)
  const [showLogs, setShowLogs]       = useState(false)
  const [webhookActive, setWebhookActive] = useState(false)
  const [webhookInterval, setWebhookInterval] = useState(30)

  const updateConnection = (provider: Provider, patch: Partial<Connection>) =>
    setConnections(prev => prev.map(c => c.provider === provider ? { ...c, ...patch } : c))

  // Simula conectar una cuenta
  const handleConnect = (provider: Provider) => {
    // Validar campos mínimos según proveedor
    // const c = connections.find(c => c.provider === provider)!
    if (provider === 'siigo'  && (!creds.siigo.clientId   || !creds.siigo.clientSecret)) {
      alert('Completa Client ID y Client Secret de Siigo.')
      return
    }
    if (provider === 'alegra' && (!creds.alegra.email     || !creds.alegra.token)) {
      alert('Completa el email y token de Alegra.')
      return
    }
    if (provider === 'sheets' && !creds.sheets.spreadsheetId) {
      alert('Completa el ID de la hoja de cálculo.')
      return
    }

    updateConnection(provider, { status: 'syncing' })

    setTimeout(() => {
      updateConnection(provider, {
        connected: true,
        status: 'ok',
        lastSync: new Date().toLocaleString('es-CO'),
        productosSincronizados: Math.floor(Math.random() * 40) + 5,
      })
      addLog(provider, 'ok', `Conexión establecida con ${PROVIDER_LABEL[provider]}.`, Math.floor(Math.random() * 40) + 5)
      setConfiguring(null)
    }, 1800)
  }

  // Simula sincronización manual
  const handleSync = (provider: Provider) => {
    updateConnection(provider, { status: 'syncing' })

    setTimeout(() => {
      const ok      = Math.random() > 0.15
      const nuevos  = ok ? Math.floor(Math.random() * 20) + 1 : 0
      updateConnection(provider, {
        status:    ok ? 'ok' : 'error',
        lastSync:  ok ? new Date().toLocaleString('es-CO') : connections.find(c => c.provider === provider)!.lastSync,
        productosSincronizados: ok
          ? (connections.find(c => c.provider === provider)!.productosSincronizados + nuevos)
          : connections.find(c => c.provider === provider)!.productosSincronizados,
      })
      addLog(
        provider,
        ok ? 'ok' : 'error',
        ok ? `Sincronización exitosa: ${nuevos} productos próximos a vencer importados.`
           : 'Error al sincronizar. Verifica las credenciales o intenta más tarde.',
        nuevos,
      )
    }, 2000)
  }

  const handleDisconnect = (provider: Provider) => {
    if (!confirm(`¿Desconectar ${PROVIDER_LABEL[provider]}?`)) return
    updateConnection(provider, { connected: false, status: 'idle', lastSync: null, productosSincronizados: 0 })
    addLog(provider, 'error', `Conexión con ${PROVIDER_LABEL[provider]} desconectada.`, 0)
  }

  const addLog = (provider: Provider, result: SyncLog['result'], message: string, productos: number) => {
    setLogs(prev => [{
      id: Date.now(), provider, timestamp: new Date(), result, message, productos,
    }, ...prev].slice(0, 50))
  }

  const totalSynced   = connections.reduce((s, c) => s + c.productosSincronizados, 0)
  const connectedCount = connections.filter(c => c.connected).length
  const errorCount     = connections.filter(c => c.status === 'error').length

  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">Integración de Inventarios</h1>
          <p className="subtitle strong">Conecta tus herramientas externas</p>
          <p className="subtitle small">TSK-006 · Siigo · Alegra · Google Sheets</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setShowLogs(true)}>📋 Ver logs</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-icon">🔗</span>
          <div>
            <div className="stat-value">{connectedCount}</div>
            <div className="stat-title">Conectados</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">📦</span>
          <div>
            <div className="stat-value">{totalSynced}</div>
            <div className="stat-title">Productos sincronizados</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">⚠️</span>
          <div>
            <div className="stat-value">{errorCount}</div>
            <div className="stat-title">Con errores</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">🔄</span>
          <div>
            <div className="stat-value">{webhookActive ? 'ON' : 'OFF'}</div>
            <div className="stat-title">Auto-sync</div>
          </div>
        </div>
      </div>

      {/* ── Tarjetas de conectores ── */}
      <div className="donations-grid">
        {connections.map(conn => (
          <div key={conn.provider} className="donation-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.6rem' }}>{PROVIDER_ICON[conn.provider]}</span>
              <span className={`tag ${conn.status === 'ok' ? 'green' : conn.status === 'error' ? 'red' : conn.status === 'syncing' ? 'orange' : 'green'}`}
                style={{ opacity: conn.status === 'idle' ? 0 : 1 }}>
                {conn.status === 'ok' ? 'Conectado' : conn.status === 'error' ? 'Error' : conn.status === 'syncing' ? 'Sincronizando…' : ''}
              </span>
            </div>

            <div>
              <p className="title" style={{ fontWeight: 700, margin: '4px 0 2px', color: 'var(--ink)' }}>
                {PROVIDER_LABEL[conn.provider]}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                {PROVIDER_DESC[conn.provider]}
              </p>
            </div>

            {conn.connected && (
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'grid', gap: 2 }}>
                <span>📦 {conn.productosSincronizados} productos importados</span>
                {conn.lastSync && <span>🕐 Última sincronización: {conn.lastSync}</span>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!conn.connected ? (
                <button
                  className="donar"
                  onClick={() => setConfiguring(conn.provider)}
                  disabled={conn.status === 'syncing'}
                >
                  {conn.status === 'syncing' ? 'Conectando…' : 'Conectar'}
                </button>
              ) : (
                <>
                  <button
                    className="donar"
                    onClick={() => handleSync(conn.provider)}
                    disabled={conn.status === 'syncing'}
                  >
                    {conn.status === 'syncing' ? 'Sincronizando…' : '🔄 Sincronizar'}
                  </button>
                  <button
                    className="descuento"
                    onClick={() => handleDisconnect(conn.provider)}
                    disabled={conn.status === 'syncing'}
                  >
                    Desconectar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Panel de configuración de webhooks ── */}
      <div className="card">
        <h2 className="main-title" style={{ fontSize: '1.1rem' }}>⚙️ Configuración de sincronización automática</h2>
        <p className="subtitle" style={{ marginBottom: '1rem' }}>
          Activa el webhook para que el sistema importe automáticamente los productos próximos a vencer cada cierto tiempo.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={webhookActive}
              onChange={e => setWebhookActive(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#1a7a4a' }}
            />
            Activar sincronización automática (webhook)
          </label>

          {webhookActive && (
            <div className="form-group" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <label style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: 'var(--muted)' }}>Intervalo:</label>
              <select
                value={webhookInterval}
                onChange={e => setWebhookInterval(+e.target.value)}
                style={{ padding: '6px 28px 6px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111827', fontSize: '0.9rem' }}
              >
                <option value={15}>Cada 15 minutos</option>
                <option value={30}>Cada 30 minutos</option>
                <option value={60}>Cada hora</option>
                <option value={360}>Cada 6 horas</option>
                <option value={1440}>Cada día</option>
              </select>
            </div>
          )}
        </div>

        {webhookActive && connectedCount === 0 && (
          <p style={{ color: '#c65a13', fontSize: '0.85rem', marginTop: '0.8rem' }}>
            ⚠️ Conecta al menos un proveedor para que el webhook funcione.
          </p>
        )}
        {webhookActive && connectedCount > 0 && (
          <p style={{ color: '#1a7a4a', fontSize: '0.85rem', marginTop: '0.8rem' }}>
            ✅ Webhook activo. Se sincronizarán automáticamente los inventarios de {connectedCount} proveedor{connectedCount > 1 ? 'es' : ''}.
          </p>
        )}
      </div>

      {/* ── Modal: Configurar credenciales ── */}
      {configuring && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setConfiguring(null) }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>{PROVIDER_ICON[configuring]} Conectar {PROVIDER_LABEL[configuring]}</h3>
              <button className="btn-cancel" onClick={() => setConfiguring(null)} style={{ border: 'none', fontSize: '1.2rem', padding: '0 4px' }}>×</button>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '8px 0 16px' }}>
              {PROVIDER_DESC[configuring]}
            </p>

            {/* Siigo */}
            {configuring === 'siigo' && (
              <>
                <div className="form-group">
                  <label>Client ID</label>
                  <input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
                    value={creds.siigo.clientId}
                    onChange={e => setCreds(p => ({ ...p, siigo: { ...p.siigo, clientId: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label>Client Secret</label>
                  <input type="password" placeholder="••••••••"
                    value={creds.siigo.clientSecret}
                    onChange={e => setCreds(p => ({ ...p, siigo: { ...p.siigo, clientSecret: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label>Empresa (NIT)</label>
                  <input type="text" placeholder="900123456-7"
                    value={creds.siigo.company}
                    onChange={e => setCreds(p => ({ ...p, siigo: { ...p.siigo, company: e.target.value } }))} />
                </div>
              </>
            )}

            {/* Alegra */}
            {configuring === 'alegra' && (
              <>
                <div className="form-group">
                  <label>Email de la cuenta Alegra</label>
                  <input type="email" placeholder="usuario@empresa.com"
                    value={creds.alegra.email}
                    onChange={e => setCreds(p => ({ ...p, alegra: { ...p.alegra, email: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label>Token de API</label>
                  <input type="password" placeholder="••••••••"
                    value={creds.alegra.token}
                    onChange={e => setCreds(p => ({ ...p, alegra: { ...p.alegra, token: e.target.value } }))} />
                </div>
              </>
            )}

            {/* Google Sheets */}
            {configuring === 'sheets' && (
              <>
                <div className="form-group">
                  <label>ID de la hoja de cálculo</label>
                  <input type="text" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                    value={creds.sheets.spreadsheetId}
                    onChange={e => setCreds(p => ({ ...p, sheets: { ...p.sheets, spreadsheetId: e.target.value } }))} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Lo encuentras en la URL de tu hoja: docs.google.com/spreadsheets/d/<b>ID</b>/edit
                  </span>
                </div>
                <div className="form-group">
                  <label>Rango de celdas</label>
                  <input type="text" placeholder="Hoja1!A1:F100"
                    value={creds.sheets.range}
                    onChange={e => setCreds(p => ({ ...p, sheets: { ...p.sheets, range: e.target.value } }))} />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfiguring(null)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() => handleConnect(configuring)}
              >
                Conectar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Logs de sincronización ── */}
      {showLogs && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowLogs(false) }}
        >
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>📋 Historial de sincronizaciones</h3>
              <button className="btn-cancel" onClick={() => setShowLogs(false)} style={{ border: 'none', fontSize: '1.2rem', padding: '0 4px' }}>×</button>
            </div>

            <div className="donation-list" style={{ marginTop: 12, maxHeight: '55vh', overflowY: 'auto' }}>
              {logs.length === 0 && (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>
                  Sin registros aún. Conecta un proveedor y sincroniza para ver el historial.
                </p>
              )}
              {logs.map(log => (
                <div key={log.id} className="donation-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'var(--ink)' }}>
                      {PROVIDER_ICON[log.provider]} {PROVIDER_LABEL[log.provider]}
                    </p>
                    <p style={{ margin: '0 0 2px', fontSize: '0.9rem', color: 'var(--muted)' }}>{log.message}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                      📅 {log.timestamp.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <span className={`tag ${log.result === 'ok' ? 'green' : 'red'}`}>
                    {log.result === 'ok' ? '✓ OK' : '✗ Error'}
                  </span>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowLogs(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntegracionInventario
