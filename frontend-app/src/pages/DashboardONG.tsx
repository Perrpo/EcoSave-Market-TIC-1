import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import apiService from '../services/api';
import './Dashboard.css';

interface AvailableDonation {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  expiry_date: string;
  supermarket_id: string;
  status: 'available' | 'requested' | 'completed';
  created_at: string;
  supermarkets?: {
    business_name: string;
    email: string;
    phone: string;
  };
}

interface RequestHistory {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  supermarket_id: string;
  ong_id?: string;
  status: 'available' | 'requested' | 'completed';
  created_at: string;
  requested_at?: string;
  completed_at?: string;
  supermarkets?: {
    business_name: string;
    email: string;
    phone: string;
  };
}

const DashboardONG: React.FC = () => {
  const auth = useAuth();
  const { addNotification } = useNotifications();
  const [availableDonations, setAvailableDonations] = useState<AvailableDonation[]>([]);
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<AvailableDonation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (auth.user?.id) {
      loadAvailableDonations();
      loadRequestHistory();
    }
  }, [auth.user?.id]);

  const loadAvailableDonations = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAvailableDonations();
      
      if (response.success && response.data) {
        setAvailableDonations(response.data);
      } else {
        setAvailableDonations([]);
      }
    } catch (error) {
      console.error('Error loading available donations:', error);
      setAvailableDonations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequestHistory = async () => {
    if (!auth.user?.id) return;
    
    try {
      const response = await apiService.getDonations({
        ong_id: auth.user.id,
      });
      
      if (response.success && response.data) {
        setRequestHistory(response.data);
      } else {
        setRequestHistory([]);
      }
    } catch (error) {
      console.error('Error loading request history:', error);
      setRequestHistory([]);
    }
  };

  const handleRequestDonation = async (donation: AvailableDonation) => {
    if (!auth.user?.id) {
      alert('Error: usuario no autenticado');
      return;
    }

    try {
      const response = await apiService.requestDonation(donation.id);

      if (response.success) {
        // Send notification
        addNotification({
          type: 'donation_requested',
          title: 'Solicitud de Donación Enviada',
          message: `Has solicitado ${donation.product_name} (${donation.quantity} unidades) de ${donation.supermarkets?.business_name || 'Supermercado'}.`,
        });
        
        // Reload data
        await loadAvailableDonations();
        await loadRequestHistory();
      } else {
        alert('Error al solicitar donación: ' + response.message);
      }
    } catch (error) {
      console.error('Error requesting donation:', error);
      alert('Error al solicitar donación. Inténtalo de nuevo.');
    }
  };

  const handleConfirmReceipt = async (requestId: string) => {
    try {
      const response = await apiService.confirmDonation(requestId);

      if (response.success) {
        // Generar certificado automáticamente al completar la donación
        try {
          const request = requestHistory.find(r => r.id === requestId)
          if (request) {
            await apiService.generateCertificate(Number(requestId))
          }
        } catch (certErr) {
          console.warn('No se pudo generar el certificado automáticamente:', certErr)
        }

        // Send notification
        const request = requestHistory.find(r => r.id === requestId);
        if (request) {
          addNotification({
            type: 'donation_completed',
            title: 'Recepción Confirmada',
            message: `Has recibido ${request.product_name} (${request.quantity} unidades) de ${request.supermarkets?.business_name || 'Supermercado'}.`,
          });
        }
        
        // Reload data
        await loadRequestHistory();
      } else {
        alert('Error al confirmar recepción: ' + response.message);
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert('Error al confirmar recepción. Inténtalo de nuevo.');
    }
  };

  // Estadísticas dinámicas
  const totalAvailable = useMemo(() => {
    return availableDonations.filter(d => d.status === 'available').length;
  }, [availableDonations]);

  const totalRequested = useMemo(() => {
    return availableDonations.filter(d => d.status === 'requested').length;
  }, [availableDonations]);

  const completedRequests = useMemo(() => {
    return requestHistory.filter(r => r.status === 'completed').length;
  }, [requestHistory]);

  const totalItemsReceived = useMemo(() => {
    return requestHistory
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.quantity, 0);
  }, [requestHistory]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">Dashboard ONG</h1>
          <p className="subtitle">Gestiona tus solicitudes de donaciones</p>
        </div>
        <div className="header-meta">
          <div className="user-chip">
            <b>{auth.user?.businessName || 'ONG Solidaria'}</b>
            <div className="subtitle">{auth.user?.email || 'ong@ecosave.com'}</div>
          </div>
          <button className="btn-secondary" onClick={auth.logout}>Salir</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-icon stat-cube">📦</span>
          <div>
            <div className="stat-title">Donaciones Disponibles</div>
            <div className="stat-value">{totalAvailable}</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-alert">⏰</span>
          <div>
            <div className="stat-title">Solicitudes Pendientes</div>
            <div className="stat-value">{totalRequested}</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-heart">✅</span>
          <div>
            <div className="stat-title">Recepciones Completadas</div>
            <div className="stat-value">{completedRequests}</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon stat-percent">🛒</span>
          <div>
            <div className="stat-title">Total Artículos Recibidos</div>
            <div className="stat-value">{totalItemsReceived}</div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="btn-secondary" 
          onClick={() => setShowRequestHistory(true)}
        >
          📋 Historial de Recepciones
        </button>
      </div>

      <div className="card">
        <h2 className="main-title">Donaciones Disponibles</h2>
        <p className="subtitle">Alimentos disponibles para recolección inmediata</p>
        <div className="product-list">
          {isLoading ? (
            <div className="loading-message">Cargando donaciones...</div>
          ) : availableDonations.length === 0 ? (
            <div className="no-products">
              <div className="no-products-icon">📦</div>
              <p>No hay donaciones disponibles</p>
              <p className="no-products-desc">
                Vuelve pronto para ver nuevas donaciones
              </p>
            </div>
          ) : (
            availableDonations.map((donation) => (
              <div key={donation.id} className="product">
                <div className="product-info">
                  <span className={`dot ${donation.status === 'available' ? 'verde' : donation.status === 'requested' ? 'amarillo' : 'azul'}`}></span>
                  <span className="product-name">{donation.product_name}</span>
                  <span className={`badge ${donation.status}`}>
                    {donation.status === 'available' ? 'Disponible' : 
                     donation.status === 'requested' ? 'Solicitado' : 'Completado'}
                  </span>
                  <div className="desc">
                    {donation.product_category} • {donation.quantity} unidades
                  </div>
                  <div className="desc">
                    <span className="calendar-icon">📅</span>
                    Vence: {donation.expiry_date}
                  </div>
                  <div className="desc">
                    <span className="location-icon">📍</span>
                    {donation.supermarkets?.business_name || 'Supermercado'}
                  </div>
                </div>
                <div className="actions">
                  <button 
                    className="solicitar" 
                    onClick={() => handleRequestDonation(donation)}
                    disabled={donation.status !== 'available'}
                  >
                    <span>🤝</span> Solicitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para historial de recepciones */}
      {showRequestHistory && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h3>Historial de Recepciones</h3>
            <div className="donation-list">
              {requestHistory.length === 0 ? (
                <p>No hay recepciones registradas</p>
              ) : (
                requestHistory.map((request) => (
                  <div key={request.id} className="donation-item">
                    <div className="donation-info">
                      <h4>{request.product_name}</h4>
                      <p>Cantidad: {request.quantity} unidades</p>
                      <p>Fecha solicitud: {new Date(request.requested_at || request.created_at).toLocaleDateString()}</p>
                      <p>Fecha recolección: {request.completed_at ? new Date(request.completed_at).toLocaleDateString() : 'Pendiente'}</p>
                      <p>Supermercado: {request.supermarkets?.business_name || 'Supermercado'}</p>
                    </div>
                    <div className="donation-status">
                      <span className={`badge ${request.status}`}>
                        {request.status === 'completed' ? 'Completada' : 
                         request.status === 'requested' ? 'Pendiente' : 'Disponible'}
                      </span>
                      {request.status === 'requested' && (
                        <button 
                          className="btn-confirm" 
                          onClick={() => handleConfirmReceipt(request.id)}
                          style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                        >
                          ✅ Confirmar Recepción
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowRequestHistory(false)} className="btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de solicitud */}
      {selectedDonation && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirmar Solicitud</h3>
            <p>¿Estás seguro que quieres solicitar esta donación?</p>
            <div className="donation-summary">
              <p><strong>Producto:</strong> {selectedDonation.product_name}</p>
              <p><strong>Cantidad:</strong> {selectedDonation.quantity} unidades</p>
              <p><strong>Supermercado:</strong> {selectedDonation.supermarkets?.business_name || 'Supermercado'}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedDonation(null)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={() => handleRequestDonation(selectedDonation)} className="btn-primary">
                Confirmar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardONG;

