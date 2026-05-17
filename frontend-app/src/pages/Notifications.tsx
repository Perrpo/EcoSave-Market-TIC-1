import React from 'react'
import { useNotifications } from '../context/NotificationContext'
import './Notifications.css'

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 10.91 3V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const Notifications: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications()

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'product_expiring':
        return 'urgent'
      case 'donation_requested':
        return 'warning'
      case 'donation_completed':
        return 'success'
      default:
        return 'info'
    }
  }

  const getBadgeText = (type: string) => {
    switch (type) {
      case 'product_expiring':
        return 'Urgente'
      case 'donation_requested':
        return 'Solicitado'
      case 'donation_completed':
        return 'Completado'
      default:
        return 'Info'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    return `Hace ${days} día${days > 1 ? 's' : ''}`
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="notifications-dashboard">
      <div className="page-header">
        <h1>Notificaciones</h1>
        <p className="subtitle muted">Alertas automáticas sobre inventarios y actividades</p>
      </div>

      <div className="action-card">
        <span className="badge-unread">{unreadCount} sin leer</span>
        <div className="action-buttons">
          <button className="ghost-btn" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            Marcar todas como leídas
          </button>
          <button className="outline-danger" onClick={clearAll} disabled={notifications.length === 0}>
            Limpiar todas
          </button>
        </div>
      </div>

      <div className="card config-card">
        <div className="card-header">
          <SettingsIcon />
          <div>
            <h2>Configuración de Alertas</h2>
            <p className="subtitle muted">Personaliza qué notificaciones quieres recibir</p>
          </div>
        </div>
        <div className="divider" />
        <div className="alert-list">
          {['Alertas de vencimiento', 'Confirmaciones de donación', 'Nuevos productos agregados', 'Solicitudes de donación'].map((label) => (
            <div className="alert-item" key={label}>
              <span>{label}</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card recent-card">
        <h2>Notificaciones Recientes</h2>
        <p className="subtitle muted">Historial de alertas y actividades del sistema</p>
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <div className="empty-icon">🔔</div>
              <p>No se encontraron notificaciones</p>
            </div>
          ) : (
            notifications.map((notification, idx) => (
              <div key={notification.id} className={`notification ${getTypeClass(notification.type)}`}>
                <div className="notification-main">
                  <div className="notif-icon">•</div>
                  <div className="notif-content">
                    <div className="notif-title">
                      <b>{notification.title}</b>
                      <span className={`badge ${getTypeClass(notification.type)}`}>
                        {getBadgeText(notification.type)}
                      </span>
                    </div>
                    <div className="notification-body">{notification.message}</div>
                    <div className="notification-footer">{formatTimestamp(new Date(notification.created_at))}</div>
                  </div>
                  <div className="notif-action">
                    {!notification.is_read && (
                      <button className="icon-btn" title="Marcar como leído" onClick={() => markAsRead(notification.id)}>
                        ✔
                      </button>
                    )}
                  </div>
                </div>
                {idx !== notifications.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Notifications
