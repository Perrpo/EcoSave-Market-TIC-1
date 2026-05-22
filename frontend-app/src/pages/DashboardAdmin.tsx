import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardAdmin.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AdminStats {
  supermarkets: number;
  ongs: number;
  admins: number;
  totalUsers: number;
  donationsTotal: number;
  donationsDone: number;
  donationsPending: number;
  donationsAvailable: number;
  productsTotal: number;
  productsAvailable: number;
}

interface UserProfile {
  id: string;
  business: string;
  nombre: string;
  phone?: string;
  nit?: string;
  roles: string;
  created_at?: string;
}

interface Donation {
  id: string;
  product_name: string;
  product_category?: string;
  quantity: number;
  status: 'available' | 'requested' | 'completed';
  created_at: string;
  requested_at?: string;
  completed_at?: string;
  user_id?: string;
  ong_id?: string;
}

type Tab = 'metrics' | 'users' | 'donations';
type RoleFilter = 'all' | 'supermarket' | 'ong' | 'admin';
type DonationFilter = 'all' | 'available' | 'requested' | 'completed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_DB_TO_KEY: Record<string, string> = {
  SUPERMERCADO: 'supermarket',
  ONG: 'ong',
  ADMINISTRADOR: 'admin',
  supermarket: 'supermarket',
  ong: 'ong',
  admin: 'admin',
};

const ROLE_LABELS: Record<string, string> = {
  supermarket: '🏪 Supermercado',
  ong:         '🤝 ONG',
  admin:       '🛡️ Admin',
};

/** Normaliza el campo roles (array o string, mayúsculas o minúsculas) a clave frontend */
function normalizeRole(roles: any): string {
  const raw = Array.isArray(roles) ? roles[0] : roles;
  return ROLE_DB_TO_KEY[raw] || (raw || '').toLowerCase();
}

const STATUS_LABELS: Record<string, string> = {
  available: '🟢 Disponible',
  requested: '⏳ Solicitada',
  completed: '✅ Completada',
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Componente principal ─────────────────────────────────────────────────────

const DashboardAdmin: React.FC = () => {
  const { user } = useAuth();

  // Tab activo
  const [tab, setTab] = useState<Tab>('metrics');

  // ── Métricas
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ── Usuarios
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Donaciones
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsLoaded, setDonationsLoaded] = useState(false);
  const [donationsError, setDonationsError] = useState<string | null>(null);
  const [donFilter, setDonFilter] = useState<DonationFilter>('all');

  // ── Confirm modal (eliminar usuario)
  const [confirmUser, setConfirmUser] = useState<UserProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Cambio de rol inline
  const [roleSaving, setRoleSaving] = useState<string | null>(null);

  // ─── Cargar métricas ────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await apiService.getAdminStats();
      if (res.success && res.data) setStats(res.data as AdminStats);
      else setStatsError(res.message || 'Error al cargar métricas');
    } catch {
      setStatsError('No se pudieron cargar las métricas');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ─── Cargar usuarios (lazy) ─────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    if (usersLoaded) return;
    setUsersLoading(true);
    try {
      const res = await apiService.getAdminUsers();
      if (res.success && res.data) setUsers(res.data as UserProfile[]);
    } catch (e) {
      console.error('Error loading users', e);
    } finally {
      setUsersLoading(false);
      setUsersLoaded(true);
    }
  }, [usersLoaded]);

  // ─── Cargar donaciones (lazy) ───────────────────────────────────────────────
  const loadDonations = useCallback(async () => {
    if (donationsLoaded) return;
    setDonationsLoading(true);
    setDonationsError(null);
    try {
      const res = await apiService.getAdminDonations({ limit: 100 });
      // Asegurar que siempre sea un array (puede venir como objeto si la API falla silenciosamente)
      const arr = Array.isArray(res.data) ? res.data : [];
      setDonations(arr as Donation[]);
      if (!res.success) {
        setDonationsError(res.message || 'Error al cargar donaciones');
      }
    } catch (e: any) {
      setDonationsError(e?.message || 'No se pudieron cargar las donaciones');
    } finally {
      setDonationsLoading(false);
      setDonationsLoaded(true);
    }
  }, [donationsLoaded]);

  // ─── Efectos ────────────────────────────────────────────────────────────────
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (tab === 'users')     loadUsers();
    if (tab === 'donations') loadDonations();
  }, [tab, loadUsers, loadDonations]);

  // ─── Acciones ───────────────────────────────────────────────────────────────

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleSaving(userId);
    try {
      const res = await apiService.updateAdminUserRole(userId, newRole);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRole } : u));
      } else {
        alert('Error al cambiar rol: ' + res.message);
      }
    } catch {
      alert('Error al cambiar el rol');
    } finally {
      setRoleSaving(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmUser) return;
    setDeleteLoading(true);
    try {
      const res = await apiService.deleteAdminUser(confirmUser.id);
      if (res.success) {
        setUsers(prev => prev.filter(u => u.id !== confirmUser.id));
        setConfirmUser(null);
        // Recargar stats
        loadStats();
      } else {
        alert('Error al eliminar: ' + res.message);
      }
    } catch {
      alert('Error al eliminar el usuario');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Filtros aplicados ──────────────────────────────────────────────────────

  const filteredUsers = users.filter(u => {
    const role = normalizeRole(u.roles);
    const matchesRole = roleFilter === 'all' || role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (u.business || u.nombre || '').toLowerCase().includes(q) ||
      role.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const filteredDonations = donations.filter(d =>
    donFilter === 'all' || d.status === donFilter
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="admin-dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">Panel de Administrador</h1>
          <p className="subtitle">Supervisión y control global de EcoSave Market</p>
        </div>
        <div className="header-meta">
          <div className="user-chip stacked">
            <div className="chip-title">{user?.businessName || 'Administrador'}</div>
            <div className="chip-sub">🛡️ Admin · {user?.email || ''}</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'metrics' ? 'active' : ''}`}
          onClick={() => setTab('metrics')}
          id="tab-metrics"
        >
          📊 Métricas
        </button>
        <button
          className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
          id="tab-users"
        >
          👥 Usuarios {users.length > 0 && <span className="pill">{users.length}</span>}
        </button>
        <button
          className={`admin-tab ${tab === 'donations' ? 'active' : ''}`}
          onClick={() => setTab('donations')}
          id="tab-donations"
        >
          📦 Donaciones {donations.length > 0 && <span className="pill">{donations.length}</span>}
        </button>
      </div>

      {/* ════════════════════════════════════
          TAB: MÉTRICAS
          ════════════════════════════════════ */}
      {tab === 'metrics' && (
        <>
          {statsLoading && (
            <div className="admin-loading">
              <div className="spinner" />
              Cargando métricas del sistema…
            </div>
          )}

          {statsError && (
            <div className="card" style={{ borderLeft: '3px solid var(--danger)', color: 'var(--danger)' }}>
              ⚠️ {statsError} — <button className="btn-secondary" style={{ marginLeft: 8 }} onClick={loadStats}>Reintentar</button>
            </div>
          )}

          {stats && !statsLoading && (
            <>
              {/* Fila de usuarios */}
              <div>
                <h2 className="main-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
                  👥 Usuarios registrados
                </h2>
                <div className="admin-stats-grid">
                  <div className="admin-stat admin-stat--green">
                    <div className="admin-stat__icon">🏪</div>
                    <div>
                      <div className="admin-stat__value">{stats.supermarkets}</div>
                      <div className="admin-stat__label">Supermercados</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--cyan">
                    <div className="admin-stat__icon">🤝</div>
                    <div>
                      <div className="admin-stat__value">{stats.ongs}</div>
                      <div className="admin-stat__label">ONGs</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--purple">
                    <div className="admin-stat__icon">🛡️</div>
                    <div>
                      <div className="admin-stat__value">{stats.admins}</div>
                      <div className="admin-stat__label">Administradores</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--lime">
                    <div className="admin-stat__icon">👤</div>
                    <div>
                      <div className="admin-stat__value">{stats.totalUsers}</div>
                      <div className="admin-stat__label">Usuarios totales</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila de donaciones */}
              <div>
                <h2 className="main-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
                  📦 Donaciones y productos
                </h2>
                <div className="admin-stats-grid">
                  <div className="admin-stat admin-stat--green">
                    <div className="admin-stat__icon">✅</div>
                    <div>
                      <div className="admin-stat__value">{stats.donationsDone}</div>
                      <div className="admin-stat__label">Donaciones completadas</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--orange">
                    <div className="admin-stat__icon">⏳</div>
                    <div>
                      <div className="admin-stat__value">{stats.donationsPending}</div>
                      <div className="admin-stat__label">Solicitudes pendientes</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--cyan">
                    <div className="admin-stat__icon">🟢</div>
                    <div>
                      <div className="admin-stat__value">{stats.donationsAvailable}</div>
                      <div className="admin-stat__label">Disponibles</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--lime">
                    <div className="admin-stat__icon">📊</div>
                    <div>
                      <div className="admin-stat__value">{stats.donationsTotal}</div>
                      <div className="admin-stat__label">Donaciones totales</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--green">
                    <div className="admin-stat__icon">🥗</div>
                    <div>
                      <div className="admin-stat__value">{stats.productsAvailable}</div>
                      <div className="admin-stat__label">Productos disponibles</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat--cyan">
                    <div className="admin-stat__icon">📦</div>
                    <div>
                      <div className="admin-stat__value">{stats.productsTotal}</div>
                      <div className="admin-stat__label">Productos en sistema</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen rápido de responsabilidades */}
              <div className="admin-card">
                <div className="admin-card__header">
                  <div>
                    <h3 className="admin-card__title">🧠 Responsabilidades del Administrador</h3>
                    <p className="admin-card__sub">Acceso completo al ecosistema EcoSave Market</p>
                  </div>
                </div>
                <div className="admin-card__body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                    {[
                      { icon: '🔍', title: 'Supervisión', desc: 'Garantizar el correcto funcionamiento de la plataforma' },
                      { icon: '🎛️', title: 'Control', desc: 'Verificar la actividad de usuarios y donaciones' },
                      { icon: '📋', title: 'Trazabilidad', desc: 'Mantener registro de todas las operaciones' },
                      { icon: '📁', title: 'Organización', desc: 'Mantener estructurada la información del sistema' },
                      { icon: '📡', title: 'Monitoreo', desc: 'Detectar problemas o inconsistencias' },
                    ].map(r => (
                      <div key={r.title} style={{
                        background: 'var(--surface-2)',
                        border: 'var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                      }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: 'var(--space-2)' }}>{r.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--ink)', marginBottom: 'var(--space-1)' }}>{r.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════
          TAB: USUARIOS
          ════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="admin-card">
          <div className="admin-card__header">
            <div>
              <h3 className="admin-card__title">👥 Gestión de Usuarios</h3>
              <p className="admin-card__sub">
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="admin-controls">
              <input
                className="admin-search"
                type="search"
                placeholder="Buscar por nombre o rol…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                id="user-search"
              />
              {(['all', 'supermarket', 'ong', 'admin'] as RoleFilter[]).map(f => (
                <button
                  key={f}
                  className={`filter-btn ${roleFilter === f ? 'active' : ''}`}
                  onClick={() => setRoleFilter(f)}
                  id={`filter-${f}`}
                >
                  {f === 'all' ? 'Todos' : f === 'supermarket' ? '🏪 Supermercados' : f === 'ong' ? '🤝 ONGs' : '🛡️ Admins'}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card__body" style={{ padding: 0 }}>
            {usersLoading && (
              <div className="admin-loading">
                <div className="spinner" /> Cargando usuarios…
              </div>
            )}

            {!usersLoading && filteredUsers.length === 0 && (
              <div className="admin-empty">
                <div className="admin-empty__icon">👤</div>
                <div className="admin-empty__text">No se encontraron usuarios con ese filtro</div>
              </div>
            )}

            {!usersLoading && filteredUsers.length > 0 && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre / Negocio</th>
                      <th>ID</th>
                      <th>Rol actual</th>
                      <th>Cambiar rol</th>
                      <th>Fecha registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--text-sm)' }}>
                            {u.business || u.nombre || '—'}
                          </div>
                          {u.nit && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>NIT: {u.nit}</div>}
                        </td>
                        <td>
                          <code style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
                            {u.id.slice(0, 8)}…
                          </code>
                        </td>
                        <td>
                          <span className={`role-badge role-badge--${normalizeRole(u.roles)}`}>
                            {ROLE_LABELS[normalizeRole(u.roles)] || normalizeRole(u.roles)}
                          </span>
                        </td>
                        <td>
                          <select
                            className="role-select"
                            value={normalizeRole(u.roles)}
                            disabled={roleSaving === u.id}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            id={`role-${u.id}`}
                          >
                            <option value="supermarket">Supermercado</option>
                            <option value="ong">ONG</option>
                            <option value="admin">Admin</option>
                          </select>
                          {roleSaving === u.id && <span style={{ marginLeft: 6, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Guardando…</span>}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                          {formatDate(u.created_at)}
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="btn-delete"
                              onClick={() => setConfirmUser(u)}
                              id={`delete-${u.id}`}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          TAB: DONACIONES
          ════════════════════════════════════ */}
      {tab === 'donations' && (
        <div className="admin-card">
          <div className="admin-card__header">
            <div>
              <h3 className="admin-card__title">📦 Monitoreo de Donaciones</h3>
              <p className="admin-card__sub">
                {filteredDonations.length} donacion{filteredDonations.length !== 1 ? 'es' : ''} en el sistema
              </p>
            </div>
            <div className="admin-controls">
              {(['all', 'available', 'requested', 'completed'] as DonationFilter[]).map(f => (
                <button
                  key={f}
                  className={`filter-btn ${donFilter === f ? 'active' : ''}`}
                  onClick={() => setDonFilter(f)}
                  id={`don-filter-${f}`}
                >
                  {f === 'all' ? 'Todas' : STATUS_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card__body" style={{ padding: 0 }}>
            {donationsLoading && (
              <div className="admin-loading">
                <div className="spinner" /> Cargando donaciones…
              </div>
            )}

            {donationsError && (
              <div className="admin-empty" style={{ color: 'var(--danger)' }}>
                <div className="admin-empty__icon">⚠️</div>
                <div className="admin-empty__text">{donationsError}</div>
              </div>
            )}

            {!donationsLoading && !donationsError && filteredDonations.length === 0 && (
              <div className="admin-empty">
                <div className="admin-empty__icon">📦</div>
                <div className="admin-empty__text">No hay donaciones con este filtro</div>
              </div>
            )}

            {!donationsLoading && !donationsError && filteredDonations.length > 0 && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Unidades</th>
                      <th>Estado</th>
                      <th>Fecha creación</th>
                      <th>Última actualización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((d, idx) => (
                      <tr key={d.id ?? idx}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--text-sm)' }}>
                            {d.product_name || '(sin nombre)'}
                          </div>
                          <code style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                            #{String(d.id ?? '').slice(0, 8)}
                          </code>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
                          {d.product_category || '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--ink)' }}>
                          {d.quantity ?? '—'}
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <span className={`status-dot status-dot--${d.status || 'available'}`} />
                            <span className={`status-label--${d.status || 'available'}`} style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                              {d.status === 'completed' ? 'Completada' : d.status === 'requested' ? 'Solicitada' : 'Disponible'}
                            </span>
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                          {formatDate(d.created_at)}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                          {formatDate(d.completed_at || d.requested_at || d.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de confirmación (eliminar usuario) ── */}
      {confirmUser && (
        <div className="confirm-overlay" onClick={() => !deleteLoading && setConfirmUser(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-box__icon">🗑️</div>
            <h3>¿Eliminar usuario?</h3>
            <p>
              Vas a eliminar a <strong>{confirmUser.business || confirmUser.nombre}</strong> del sistema.
              Esta acción no se puede deshacer.
            </p>
            <div className="confirm-box__actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmUser(null)}
                disabled={deleteLoading}
                id="cancel-delete"
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                id="confirm-delete"
              >
                {deleteLoading ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;
