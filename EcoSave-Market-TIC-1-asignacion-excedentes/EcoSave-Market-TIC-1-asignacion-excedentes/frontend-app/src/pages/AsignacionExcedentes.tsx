import React, { useState, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DonStatus = 'available' | 'assigned' | 'accepted' | 'rejected' | 'sin_asignacion';

interface Donation {
  id: number;
  productName: string;
  category: string;
  quantity: number;
  expiryLabel: string;
  supermarket: string;
  supermarketLat: number;
  supermarketLng: number;
  status: DonStatus;
  assignedOng?: string;
  attempts: number;
}

interface ONG {
  id: number;
  name: string;
  email: string;
  lat: number;
  lng: number;
  priority: number;        // 1–5
  capacity: number;
  usedCapacity: number;
  categories: string[];    // [] = todas
}

interface AssignmentLog {
  donationId: number;
  attempt: number;
  ongName: string;
  action: 'assigned' | 'accepted' | 'rejected' | 'timeout' | 'no_candidates';
  timestamp: Date;
  reason?: string;
}

// ─── Datos mock ───────────────────────────────────────────────────────────────

const INITIAL_DONATIONS: Donation[] = [
  {
    id: 101, productName: 'Pan integral', category: 'Panadería',
    quantity: 25, expiryLabel: 'Hoy',
    supermarket: 'Supermercado El Ahorro',
    supermarketLat: 6.2442, supermarketLng: -75.5812,
    status: 'available', attempts: 0,
  },
  {
    id: 102, productName: 'Manzanas', category: 'Frutas',
    quantity: 8, expiryLabel: '1 día',
    supermarket: 'Market Express',
    supermarketLat: 6.2518, supermarketLng: -75.5636,
    status: 'available', attempts: 0,
  },
  {
    id: 103, productName: 'Yogur natural', category: 'Lácteos',
    quantity: 12, expiryLabel: '2 días',
    supermarket: 'Market Express',
    supermarketLat: 6.2350, supermarketLng: -75.5740,
    status: 'assigned', assignedOng: 'Fundación Esperanza', attempts: 1,
  },
  {
    id: 104, productName: 'Pollo fresco', category: 'Carnes',
    quantity: 5, expiryLabel: 'Vencido',
    supermarket: 'Supermercado El Ahorro',
    supermarketLat: 6.2442, supermarketLng: -75.5812,
    status: 'sin_asignacion', attempts: 3,
  },
];

const ONGS: ONG[] = [
  { id: 1, name: 'Fundación Esperanza',   email: 'contacto@esperanza.org',
    lat: 6.2442, lng: -75.5812, priority: 5, capacity: 200, usedCapacity: 40,  categories: [] },
  { id: 2, name: 'Banco de Alimentos',     email: 'hola@bancodealimentos.org',
    lat: 6.2518, lng: -75.5636, priority: 4, capacity: 500, usedCapacity: 100, categories: ['Lácteos','Panadería','Frutas'] },
  { id: 3, name: 'Hogar San José',         email: 'admin@hogarsanjose.org',
    lat: 6.2350, lng: -75.5740, priority: 3, capacity: 150, usedCapacity: 80,  categories: ['Verduras','Carnes','Frutas'] },
  { id: 4, name: 'Red de Solidaridad',     email: 'red@solidaridad.org',
    lat: 6.2600, lng: -75.5900, priority: 2, capacity: 300, usedCapacity: 250, categories: [] },
];

const INIT_LOGS: AssignmentLog[] = [
  { donationId: 103, attempt: 1, ongName: 'Fundación Esperanza', action: 'assigned',      timestamp: new Date(Date.now() - 10 * 60000) },
  { donationId: 104, attempt: 1, ongName: 'Hogar San José',      action: 'rejected',      timestamp: new Date(Date.now() - 90 * 60000), reason: 'Sin capacidad' },
  { donationId: 104, attempt: 2, ongName: 'Banco de Alimentos',  action: 'timeout',       timestamp: new Date(Date.now() - 60 * 60000) },
  { donationId: 104, attempt: 3, ongName: 'Red de Solidaridad',  action: 'no_candidates', timestamp: new Date(Date.now() - 5  * 60000) },
];

// ─── Algoritmo de asignación (Haversine + score) ──────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcScore(ong: ONG, donation: Donation): number {
  const catOk = ong.categories.length === 0 || ong.categories.includes(donation.category);
  const libre  = ong.capacity - ong.usedCapacity;
  if (!catOk || libre < donation.quantity) return -1;
  const dist   = haversineKm(donation.supermarketLat, donation.supermarketLng, ong.lat, ong.lng);
  return (ong.priority / 5) * 40 + (1 / (dist + 1)) * 400 + (libre / ong.capacity) * 20;
}

function bestCandidate(donation: Donation, excluded: number[]): ONG | null {
  return ONGS
    .filter(o => !excluded.includes(o.id))
    .map(o => ({ ong: o, score: calcScore(o, donation) }))
    .filter(c => c.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.ong ?? null;
}

// ─── Helpers de presentación ──────────────────────────────────────────────────

const STATUS_LABEL: Record<DonStatus, string> = {
  available:      'Disponible',
  assigned:       'Asignada',
  accepted:       'Aceptada',
  rejected:       'Rechazada',
  sin_asignacion: 'Sin asignación',
};

const STATUS_BADGE: Record<DonStatus, string> = {
  available:      'badge active',
  assigned:       'badge pending',
  accepted:       'badge success',
  rejected:       'badge danger',
  sin_asignacion: 'badge danger',
};

const ACTION_ICON: Record<AssignmentLog['action'], string> = {
  assigned:      '🔔',
  accepted:      '✅',
  rejected:      '❌',
  timeout:       '⏱️',
  no_candidates: '🚫',
};

// ─── Componente ───────────────────────────────────────────────────────────────

const AsignacionExcedentes: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>(INITIAL_DONATIONS);
  const [logs, setLogs]           = useState<AssignmentLog[]>(INIT_LOGS);
  const [tried, setTried]         = useState<Record<number, number[]>>({});
  const [running, setRunning]     = useState<number | null>(null);
  const [showONGs, setShowONGs]   = useState(false);
  const [showLogs, setShowLogs]   = useState(false);
  const [detail, setDetail]       = useState<Donation | null>(null);

  const assign = useCallback((donation: Donation) => {
    setRunning(donation.id);
    const excluded = tried[donation.id] ?? [];

    setTimeout(() => {
      const candidate = bestCandidate(donation, excluded);

      if (!candidate || donation.attempts >= 3) {
        setDonations(prev => prev.map(d =>
          d.id === donation.id ? { ...d, status: 'sin_asignacion', attempts: d.attempts + 1 } : d
        ));
        setLogs(prev => [{ donationId: donation.id, attempt: donation.attempts + 1,
          ongName: 'N/A', action: 'no_candidates', timestamp: new Date() }, ...prev]);
      } else {
        setDonations(prev => prev.map(d =>
          d.id === donation.id
            ? { ...d, status: 'assigned', assignedOng: candidate.name, attempts: d.attempts + 1 }
            : d
        ));
        setLogs(prev => [{ donationId: donation.id, attempt: donation.attempts + 1,
          ongName: candidate.name, action: 'assigned', timestamp: new Date() }, ...prev]);
      }
      setRunning(null);
    }, 1400);
  }, [tried]);

  // Simula rechazo de ONG y reasignación automática
  const simulateReject = useCallback((donation: Donation) => {
    if (!donation.assignedOng) return;
    const ong = ONGS.find(o => o.name === donation.assignedOng);
    if (!ong) return;

    const excluded = [...(tried[donation.id] ?? []), ong.id];
    setTried(prev => ({ ...prev, [donation.id]: excluded }));
    setLogs(prev => [{ donationId: donation.id, attempt: donation.attempts,
      ongName: donation.assignedOng!, action: 'rejected', timestamp: new Date(), reason: 'ONG rechazó la solicitud' }, ...prev]);

    const updated: Donation = { ...donation, status: 'available', assignedOng: undefined };
    setDonations(prev => prev.map(d => d.id === donation.id ? updated : d));

    setRunning(donation.id);
    setTimeout(() => {
      const next = bestCandidate(updated, excluded);
      if (!next || updated.attempts >= 3) {
        setDonations(prev => prev.map(d =>
          d.id === donation.id ? { ...d, status: 'sin_asignacion' } : d
        ));
        setLogs(prev => [{ donationId: donation.id, attempt: donation.attempts + 1,
          ongName: 'N/A', action: 'no_candidates', timestamp: new Date() }, ...prev]);
      } else {
        setDonations(prev => prev.map(d =>
          d.id === donation.id ? { ...d, status: 'assigned', assignedOng: next.name } : d
        ));
        setLogs(prev => [{ donationId: donation.id, attempt: donation.attempts + 1,
          ongName: next.name, action: 'assigned', timestamp: new Date() }, ...prev]);
      }
      setRunning(null);
    }, 1400);
  }, [tried]);

  const available      = donations.filter(d => d.status === 'available').length;
  const assigned       = donations.filter(d => d.status === 'assigned').length;
  const accepted       = donations.filter(d => d.status === 'accepted').length;
  const sinAsignacion  = donations.filter(d => d.status === 'sin_asignacion').length;

  return (
    <div className="dashboard-admin">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">Asignación de Excedentes</h1>
          <p className="subtitle">TSK-007 · Algoritmo automático de distribución de donaciones</p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button className="action-btn" onClick={() => setShowONGs(true)}>🏢 Ver ONGs</button>
          <button className="action-btn" onClick={() => setShowLogs(true)}>📋 Historial</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-icon stat-cube">📦</span>
          <div>
            <div className="stat-title">Disponibles</div>
            <div className="stat-value">{available}</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-alert">🔔</span>
          <div>
            <div className="stat-title">Asignadas</div>
            <div className="stat-value">{assigned}</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-heart">✅</span>
          <div>
            <div className="stat-title">Aceptadas</div>
            <div className="stat-value">{accepted}</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-percent">🚫</span>
          <div>
            <div className="stat-title">Sin Asignación</div>
            <div className="stat-value">{sinAsignacion}</div>
          </div>
        </div>
      </div>

      {/* ── Donaciones ── */}
      <div className="card">
        <h2 className="main-title">Donaciones en curso</h2>
        <p className="subtitle">Ejecuta el algoritmo de asignación automática por donación</p>
        <div className="donation-list">
          {donations.map(d => (
            <div key={d.id} className="donation-item" style={{ opacity: running === d.id ? 0.6 : 1 }}>
              <div className="donation-info">
                <span className="donation-name">{d.productName}</span>
                <span className="donation-from">
                  {d.category} · {d.quantity} unidades · Vence: {d.expiryLabel}
                </span>
                <div className="donation-desc">🏪 {d.supermarket}</div>
                {d.assignedOng && (
                  <div className="donation-desc">🤝 Asignada a: <strong>{d.assignedOng}</strong></div>
                )}
                <div className="donation-desc">Intentos: {d.attempts} / 3</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span className={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {(d.status === 'available' || d.status === 'rejected') && (
                    <button
                      className="action-btn"
                      onClick={() => assign(d)}
                      disabled={running === d.id}
                    >
                      {running === d.id ? '⏳ Asignando…' : '🤖 Auto-asignar'}
                    </button>
                  )}
                  {d.status === 'assigned' && (
                    <button
                      className="action-btn"
                      style={{ background: '#d97706' }}
                      onClick={() => simulateReject(d)}
                      disabled={running === d.id}
                    >
                      {running === d.id ? '⏳ Reasignando…' : '↩️ Simular rechazo'}
                    </button>
                  )}
                  <button
                    className="action-btn"
                    style={{ background: '#475569' }}
                    onClick={() => setDetail(d)}
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal: ONGs candidatas ── */}
      {showONGs && (
        <div className="asig-overlay">
          <div className="asig-modal asig-modal-lg">
            <h3>🏢 ONGs candidatas</h3>
            <p className="subtitle">
              Score = prioridad (40 %) + distancia inversa (40 %) + capacidad libre (20 %)
            </p>
            <div className="donation-list">
              {ONGS.map(o => {
                const libre = o.capacity - o.usedCapacity;
                return (
                  <div key={o.id} className="donation-item">
                    <div className="donation-info">
                      <span className="donation-name">{o.name}</span>
                      <span className="donation-from">{o.email}</span>
                      <div className="donation-desc">
                        Prioridad: {'⭐'.repeat(o.priority)} &nbsp;·&nbsp;
                        Capacidad libre: {libre} uds &nbsp;·&nbsp;
                        Categorías: {o.categories.length === 0 ? 'Todas' : o.categories.join(', ')}
                      </div>
                    </div>
                    <span className="badge success">Activo</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="action-btn" onClick={() => setShowONGs(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Historial de logs ── */}
      {showLogs && (
        <div className="asig-overlay">
          <div className="asig-modal asig-modal-lg">
            <h3>📋 Historial de asignaciones</h3>
            <div className="donation-list">
              {logs.length === 0 && (
                <p className="donation-desc">Sin registros aún.</p>
              )}
              {logs.map((log, i) => (
                <div key={i} className="donation-item">
                  <div className="donation-info">
                    <span className="donation-name">
                      {ACTION_ICON[log.action]} Donación #{log.donationId} → {log.ongName}
                    </span>
                    <span className="donation-from">
                      Acción: {log.action} · Intento #{log.attempt}
                    </span>
                    {log.reason && (
                      <div className="donation-desc">Motivo: {log.reason}</div>
                    )}
                    <div className="donation-desc">
                      <span className="calendar-icon">📅</span>
                      {log.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="action-btn" onClick={() => setShowLogs(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Detalle de donación ── */}
      {detail && (
        <div className="asig-overlay">
          <div className="asig-modal">
            <h3>Detalle — {detail.productName}</h3>
            <div className="donation-list">
              <div className="donation-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                <span className="donation-from"><strong>Categoría:</strong> {detail.category}</span>
                <span className="donation-from"><strong>Cantidad:</strong> {detail.quantity} unidades</span>
                <span className="donation-from"><strong>Vencimiento:</strong> {detail.expiryLabel}</span>
                <span className="donation-from"><strong>Supermercado:</strong> {detail.supermarket}</span>
                <span className="donation-from"><strong>Estado:</strong> {STATUS_LABEL[detail.status]}</span>
                <span className="donation-from"><strong>Intentos:</strong> {detail.attempts} / 3</span>
                {detail.assignedOng && (
                  <span className="donation-from"><strong>ONG asignada:</strong> {detail.assignedOng}</span>
                )}
              </div>
              <div className="donation-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="donation-name" style={{ fontSize: '0.9rem' }}>ℹ️ Reglas de reasignación</span>
                <span className="donation-desc">
                  Si la ONG rechaza o no responde en 30 min, el sistema reasigna automáticamente a la siguiente candidata según score. Máximo 3 intentos.
                </span>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button className="action-btn" style={{ background: '#475569' }} onClick={() => setDetail(null)}>
                Cerrar
              </button>
              {detail.status === 'available' && (
                <button className="action-btn" onClick={() => { assign(detail); setDetail(null); }}>
                  🤖 Auto-asignar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .asig-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .asig-modal {
          background: #1e293b;
          border: 1px solid #475569;
          border-radius: 14px;
          padding: 2rem;
          max-width: 500px;
          width: 92vw;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          color: #f1f5f9;
        }
        .asig-modal h3 {
          font-size: 1.2rem;
          margin: 0 0 0.5rem;
          color: #f1f5f9;
        }
        .asig-modal-lg {
          max-width: 680px;
        }
      `}</style>
    </div>
  );
};

export default AsignacionExcedentes;
