import React from 'react';

const DashboardAdmin: React.FC = () => {
  return (
    <div className="dashboard-admin">
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">Panel de Administrador</h1>
          <p className="subtitle">Gestión general del sistema EcoSave Market</p>
        </div>
        <div className="user-info">
          <div>
            <b>EcoSave Market</b>
            <div className="email">admin@ecosave.com</div>
          </div>
          <button className="logout">Salir</button>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-icon stat-cube">🏪</span>
          <div>
            <div className="stat-title">Total Supermercados</div>
            <div className="stat-value">12</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-heart">🤝</span>
          <div>
            <div className="stat-title">Total ONGs</div>
            <div className="stat-value">8</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-alert">📦</span>
          <div>
            <div className="stat-title">Donaciones Activas</div>
            <div className="stat-value">24</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-percent">👥</span>
          <div>
            <div className="stat-title">Usuarios Totales</div>
            <div className="stat-value">20</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="main-title">Gestión de Usuarios</h2>
        <p className="subtitle">Administra todos los usuarios del sistema</p>
        <div className="admin-actions">
          <div className="action-section">
            <h3>🏪 Supermercados</h3>
            <div className="user-list">
              <div className="user-item">
                <span className="user-name">Supermercado El Ahorro</span>
                <span className="user-email">super@ahorro.com</span>
                <span className="badge active">Activo</span>
                <button className="action-btn">Ver</button>
              </div>
              <div className="user-item">
                <span className="user-name">Market Express</span>
                <span className="user-email">info@express.com</span>
                <span className="badge active">Activo</span>
                <button className="action-btn">Ver</button>
              </div>
            </div>
          </div>

          <div className="action-section">
            <h3>🤝 ONGs</h3>
            <div className="user-list">
              <div className="user-item">
                <span className="user-name">Fundación Esperanza</span>
                <span className="user-email">contacto@esperanza.org</span>
                <span className="badge active">Activo</span>
                <button className="action-btn">Ver</button>
              </div>
              <div className="user-item">
                <span className="user-name">Banco de Alimentos</span>
                <span className="user-email">hola@bancodealimentos.org</span>
                <span className="badge active">Activo</span>
                <button className="action-btn">Ver</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="main-title">Donaciones Recientes</h2>
        <p className="subtitle">Monitorea las últimas donaciones del sistema</p>
        <div className="donation-list">
          <div className="donation-item">
            <div className="donation-info">
              <span className="donation-name">Productos de panadería</span>
              <span className="donation-from">Supermercado El Ahorro → Fundación Esperanza</span>
              <div className="donation-desc">
                <span className="calendar-icon">📅</span>
                Hace 2 horas
              </div>
            </div>
            <span className="badge success">Completada</span>
          </div>
          <div className="donation-item">
            <div className="donation-info">
              <span className="donation-name">Frutas y verduras</span>
              <span className="donation-from">Market Express → Banco de Alimentos</span>
              <div className="donation-desc">
                <span className="calendar-icon">📅</span>
                Hace 5 horas
              </div>
            </div>
            <span className="badge pending">Pendiente</span>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-admin {
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 2rem;
          background: #1a1a2e;
          min-height: 100vh;
          border-radius: 12px;
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
          background: linear-gradient(45deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 2px 14px rgba(0, 212, 255, 0.3));
        }

        .dashboard-header .subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        .user-info .email {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .logout {
          background: #2d3748;
          border: 1px solid #4a5568;
          border-radius: 8px;
          padding: 0.5rem 1.2rem;
          font-weight: 500;
          cursor: pointer;
          color: #e2e8f0;
          transition: all 160ms ease;
        }

        .logout:hover {
          background: #4a5568;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .stats-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .stat-box {
          background: #2d3748;
          border-radius: 14px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          border: 1px solid #4a5568;
          padding: 1.2rem 2rem;
          display: flex;
          align-items: center;
          min-width: 180px;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2rem;
          margin-right: 0.5rem;
        }

        .stat-cube {
          color: #00d4ff;
        }

        .stat-heart {
          color: #ef4444;
        }

        .stat-alert {
          color: #f59e0b;
        }

        .stat-percent {
          color: #a855f7;
        }

        .stat-title {
          color: #94a3b8;
          font-size: 1rem;
        }

        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #f1f5f9;
        }

        .card {
          background: #2d3748;
          border-radius: 14px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          border: 1px solid #4a5568;
          padding: 2rem;
          margin-top: 1rem;
        }

        .card h2 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 0.2rem;
          color: #f1f5f9;
        }

        .card .subtitle {
          color: #94a3b8;
          font-size: 1rem;
          margin-bottom: 1.2rem;
        }

        .admin-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .action-section h3 {
          color: #f1f5f9;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .user-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .user-item {
          background: #1e293b;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #475569;
        }

        .user-name {
          font-weight: 500;
          color: #f1f5f9;
        }

        .user-email {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .badge.active {
          background: #059669;
          color: #d1fae5;
        }

        .badge.success {
          background: #059669;
          color: #d1fae5;
        }

        .badge.pending {
          background: #d97706;
          color: #fef3c7;
        }

        .action-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 160ms ease;
        }

        .action-btn:hover {
          background: #2563eb;
        }

        .donation-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .donation-item {
          background: #1e293b;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #475569;
        }

        .donation-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .donation-name {
          font-weight: 500;
          color: #f1f5f9;
        }

        .donation-from {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .donation-desc {
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .calendar-icon {
          margin-right: 4px;
        }

        @media (max-width: 900px) {
          .stats-row {
            flex-direction: column;
            gap: 1rem;
          }
          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
          }
          .card {
            padding: 1rem;
          }
          .admin-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardAdmin;
