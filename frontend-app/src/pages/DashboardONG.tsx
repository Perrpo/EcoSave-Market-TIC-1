import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import apiService from '../services/api';
import './Dashboard.css';
import './DashboardONG.css';
import { MinimalCard, MinimalCardContent, MinimalCardFooter, MinimalCardTitle } from '../components/ui/minimal-card';
import { TextureButton } from '../components/ui/texture-button';

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

const categoryIcons: Record<string, string> = {
  'Frutas': '🍎',
  'Frutas y verduras': '🥦',
  'Verduras': '🥬',
  'Lácteos': '🥛',
  'Lacteos': '🥛',
  'Carnes': '🥩',
  'Panadería': '🍞',
  'Alimentos secos': '🌾',
  'Bebidas': '🥤',
  'Enlatados': '🥫',
};

const getCategoryIcon = (category: string) => {
  return categoryIcons[category] || '📦';
};

const getDaysUntilExpiry = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const getExpiryUrgency = (expiryDate: string): 'urgent' | 'warning' | 'safe' => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days <= 2) return 'urgent';
  if (days <= 5) return 'warning';
  return 'safe';
};

const DashboardONG: React.FC = () => {
  const auth = useAuth();
  const { addNotification } = useNotifications();
  const [availableDonations, setAvailableDonations] = useState<AvailableDonation[]>([]);
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<AvailableDonation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [requestQuantity, setRequestQuantity] = useState<number>(1);

  useEffect(() => {
    if (selectedDonation) {
      setRequestQuantity(selectedDonation.quantity);
    }
  }, [selectedDonation]);

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
        setAvailableDonations(response.data as AvailableDonation[]);
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
        setRequestHistory(response.data as RequestHistory[]);
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

    setRequestingId(donation.id);
    try {
      const response = await apiService.requestDonation(donation.id, requestQuantity);

      if (response.success) {
        addNotification({
          type: 'donation_requested',
          title: 'Solicitud de Donación Enviada',
          message: `Has solicitado ${donation.product_name} (${requestQuantity} unidades) de ${donation.supermarkets?.business_name || 'Supermercado'}.`,
        });
        
        await loadAvailableDonations();
        await loadRequestHistory();
        setSelectedDonation(null);
      } else {
        alert('Error al solicitar donación: ' + response.message);
      }
    } catch (error) {
      console.error('Error requesting donation:', error);
      alert('Error al solicitar donación. Inténtalo de nuevo.');
    } finally {
      setRequestingId(null);
    }
  };

  const handleConfirmReceipt = async (requestId: string) => {
    try {
      const response = await apiService.confirmDonation(requestId);

      if (response.success) {
        const request = requestHistory.find(r => r.id === requestId);
        if (request) {
          addNotification({
            type: 'donation_completed',
            title: 'Recepción Confirmada',
            message: `Has recibido ${request.product_name} (${request.quantity} unidades) de ${request.supermarkets?.business_name || 'Supermercado'}.`,
          });
        }
        
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

  const categoryBreakdownOng = useMemo(() => {
    const map: Record<string, number> = {};
    requestHistory.filter(r => r.status === 'completed').forEach(r => {
      const cat = r.product_category || 'Otros';
      map[cat] = (map[cat] || 0) + r.quantity;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, qty]) => ({ cat, qty, pct: Math.round((qty / total) * 100) }));
  }, [requestHistory]);

  const beneficiariosEstimados = useMemo(() => {
    // Estimado: 1 kg = 2 raciones, 0.5 kg por unidad
    return Math.round(totalItemsReceived * 0.5 * 2);
  }, [totalItemsReceived]);

  const topSupermercado = useMemo(() => {
    const countBySup: Record<string, number> = {};
    requestHistory.filter(r => r.status === 'completed').forEach(r => {
      const name = r.supermarkets?.business_name || 'Desconocido';
      countBySup[name] = (countBySup[name] || 0) + r.quantity;
    });
    return Object.entries(countBySup).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos';
  }, [requestHistory]);

  const urgentAvailableRatio = useMemo(() => {
    const total = availableDonations.length;
    if (total === 0) return 0;
    const urgent = availableDonations.filter(d => {
      const days = getDaysUntilExpiry(d.expiry_date);
      return days <= 2;
    }).length;
    return Math.round((urgent / total) * 100);
  }, [availableDonations]);

  const categories = useMemo(() => {
    const cats = new Set(availableDonations.map(d => d.product_category));
    return ['all', ...Array.from(cats)];
  }, [availableDonations]);

  const filteredDonations = useMemo(() => {
    if (filterCategory === 'all') return availableDonations;
    return availableDonations.filter(d => d.product_category === filterCategory);
  }, [availableDonations, filterCategory]);

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

      {/* ── MÉTRICAS DE IMPACTO SOCIAL ONG ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        margin: '0 0 24px',
      }}>
        {/* Beneficiarios estimados */}
        <div style={{
          background: 'linear-gradient(135deg, #00A99D15, #00A99D05)',
          border: '1.5px solid #00A99D30',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ fontSize: '1.8rem' }}>👨‍👩‍👧‍👦</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#00A99D' }}>{beneficiariosEstimados}</div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>Beneficiarios Estimados</div>
          <div style={{ fontSize: '0.74rem', color: '#9ca3af' }}>2 raciones por kg rescatado</div>
        </div>

        {/* Top Supermercado donante */}
        <div style={{
          background: 'linear-gradient(135deg, #F5822015, #F5822005)',
          border: '1.5px solid #F5822030',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ fontSize: '1.8rem' }}>🏅</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F58220', wordBreak: 'break-word' }}>{topSupermercado}</div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>Supermercado Aliado #1</div>
          <div style={{ fontSize: '0.74rem', color: '#9ca3af' }}>Mayor donante completado</div>
        </div>

        {/* Categorías recibidas */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed15, #7c3aed05)',
          border: '1.5px solid #7c3aed30',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '1.8rem' }}>📈</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Categorías Recibidas</div>
          {categoryBreakdownOng.length === 0
            ? <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>Sin recepciones aún</div>
            : categoryBreakdownOng.map(({ cat, pct }) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#6b7280' }}>
                <span style={{ width: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#7c3aed60', borderRadius: '3px' }} />
                </div>
                <span style={{ fontWeight: 700 }}>{pct}%</span>
              </div>
            ))
          }
        </div>

        {/* % Donaciones urgentes disponibles */}
        <div style={{
          background: urgentAvailableRatio > 40
            ? 'linear-gradient(135deg, #dc262615, #dc262605)'
            : 'linear-gradient(135deg, #2D5A2715, #2D5A2705)',
          border: `1.5px solid ${urgentAvailableRatio > 40 ? '#dc262630' : '#2D5A2730'}`,
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '1.8rem' }}>{urgentAvailableRatio > 40 ? '⚠️' : '✅'}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: urgentAvailableRatio > 40 ? '#dc2626' : '#2D5A27' }}>
            {urgentAvailableRatio}%
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>Donaciones Urgentes</div>
          <div style={{ fontSize: '0.74rem', color: '#9ca3af' }}>
            {urgentAvailableRatio > 40 ? 'Alta urgencia — ¡actuá ya!' : 'Nivel de urgencia bajo'}
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: '#f3f4f6', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${urgentAvailableRatio}%`,
              background: urgentAvailableRatio > 40
                ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                : 'linear-gradient(90deg, #2D5A27, #3a7a32)',
              borderRadius: '3px', transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      </div>

      <div className="action-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          className="btn-secondary" 
          onClick={() => setShowRequestHistory(true)}
        >
          📋 Historial de Recepciones
        </button>
        <button 
          className="btn-secondary" 
          style={{ borderColor: '#00A99D', color: '#00A99D', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => {
            const token = localStorage.getItem('token');
            fetch(`http://localhost:3333/api/v1/donations/certificate/all?role=ong`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            .then(res => {
              if (!res.ok) throw new Error('No valid')
              return res.blob()
            })
            .then(blob => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `reporte-anual-ong.pdf`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
            })
            .catch(err => {
              console.error(err);
              alert('Aún no tienes recepciones completadas para generar el reporte consolidado.');
            });
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Reporte Consolidado
        </button>
        <button 
          className="btn-secondary" 
          style={{ borderColor: '#F58220', color: '#F58220', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => {
            const email = window.prompt("Ingresa el correo electrónico al cual deseas enviar el reporte consolidado:");
            if (!email) return;
            
            if (!email.includes('@') || !email.includes('.')) {
              alert("Por favor, ingresa un correo electrónico válido.");
              return;
            }

            const token = localStorage.getItem('token');
            fetch(`http://localhost:3333/api/v1/donations/certificate/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ email, role: 'ong' })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                alert('✅ Certificado enviado exitosamente a ' + email);
              } else {
                alert('❌ Error: ' + (data.message || 'No se pudo enviar'));
              }
            })
            .catch(err => {
              console.error(err);
              alert('Ocurrió un error al intentar enviar el correo. Verifica tu conexión.');
            });
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Enviar por Correo
        </button>
      </div>

      {/* Sección de Donaciones Disponibles - Rediseñada */}
      <div className="ong-donations-section">
        <div className="ong-section-header">
          <div>
            <h2 className="ong-section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              Alimentos Disponibles
            </h2>
            <p className="ong-section-subtitle">Selecciona los alimentos que tu organización necesita</p>
          </div>
          <div className="ong-donation-count">
            <span className="ong-count-number">{filteredDonations.length}</span>
            <span className="ong-count-label">disponibles</span>
          </div>
        </div>

        {/* Filtros por categoría */}
        <div className="ong-category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`ong-filter-chip ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'all' ? '🏷️ Todas' : `${getCategoryIcon(cat)} ${cat}`}
            </button>
          ))}
        </div>

        {/* Grid de donaciones */}
        <div className="ong-donations-grid">
          {isLoading ? (
            <div className="ong-loading">
              <div className="ong-loading-spinner"></div>
              <p>Cargando donaciones disponibles...</p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="ong-empty-state">
              <div className="ong-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h3>No hay donaciones disponibles</h3>
              <p>Los supermercados aún no han publicado alimentos. Vuelve pronto para ver nuevas donaciones.</p>
            </div>
          ) : (
            filteredDonations.map((donation) => {
              const urgency = getExpiryUrgency(donation.expiry_date);
              const daysLeft = getDaysUntilExpiry(donation.expiry_date);
              const isRequesting = requestingId === donation.id;

              return (
                <MinimalCard key={donation.id} className={`relative overflow-hidden ${urgency === 'urgent' ? 'border-red-500/50 shadow-red-500/20' : ''}`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${urgency === 'urgent' ? 'bg-red-500' : urgency === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  
                  <MinimalCardContent className="pt-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-3xl bg-neutral-100 p-2 rounded-xl">
                        {getCategoryIcon(donation.product_category)}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${urgency === 'urgent' ? 'bg-red-100 text-red-700' : urgency === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {urgency === 'urgent' ? '🔴' : urgency === 'warning' ? '🟡' : '🟢'}
                          {' '}{daysLeft > 0 ? `${daysLeft} días` : 'Vence hoy'}
                        </span>
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{donation.product_category}</span>
                      </div>
                    </div>

                    <MinimalCardTitle className="text-xl mb-1">{donation.product_name}</MinimalCardTitle>
                    
                    <div className="space-y-2 mt-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        <span><strong className="text-neutral-900">{donation.quantity}</strong> unidades</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>Vence: {new Date(donation.expiry_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span className="font-medium">{donation.supermarkets?.business_name || 'Supermercado'}</span>
                      </div>
                    </div>
                  </MinimalCardContent>

                  <MinimalCardFooter className="pb-4">
                    <TextureButton
                      variant={donation.status !== 'available' ? 'secondary' : 'ecosavePrimary'}
                      size="lg"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setSelectedDonation(donation)}
                      disabled={donation.status !== 'available' || isRequesting}
                    >
                      {isRequesting ? (
                        <>
                          <div className="ong-btn-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Solicitando...
                        </>
                      ) : donation.status === 'available' ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          Solicitar Donación
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {donation.status === 'requested' ? 'Ya solicitado' : 'Completado'}
                        </>
                      )}
                    </TextureButton>
                  </MinimalCardFooter>
                </MinimalCard>
              );
            })
          )}
        </div>
      </div>

      {/* Modal para historial de recepciones */}
      {showRequestHistory && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Historial de Recepciones</h3>
              <button className="icon-btn" onClick={() => setShowRequestHistory(false)} aria-label="Cerrar modal" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>
                &times;
              </button>
            </div>
            <div className="donation-list" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
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
                    <div className="donation-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span className={`badge ${request.status}`}>
                        {request.status === 'completed' ? 'Completada' : 
                         request.status === 'requested' ? 'Pendiente' : 'Disponible'}
                      </span>
                      {request.status === 'requested' && (
                        <div style={{ marginTop: '0.5rem', width: '100%' }}>
                          <TextureButton 
                            variant="ecosavePrimary"
                            size="sm"
                            className="w-full"
                            onClick={() => handleConfirmReceipt(request.id)}
                          >
                            ✅ Confirmar Recepción
                          </TextureButton>
                        </div>
                      )}
                      <div style={{ marginTop: '4px', width: '100%' }}>
                        <TextureButton 
                          variant="ecosaveSecondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            fetch(`http://localhost:3333/api/v1/donations/${request.id}/certificate`, {
                              headers: token ? { Authorization: `Bearer ${token}` } : {}
                            })
                            .then(res => res.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `certificado-recepcion-${request.id.slice(0,8)}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                            })
                            .catch(err => {
                              console.error('Error downloading certificate', err);
                              alert('Error al descargar el certificado');
                            });
                          }}
                        >
                          Generar PDF
                        </TextureButton>
                      </div>
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

      {/* Modal de confirmación de solicitud - Rediseñado */}
      {selectedDonation && (
        <div className="modal-overlay">
          <div className="modal ong-confirm-modal">
            <div className="ong-confirm-header">
              <div className="ong-confirm-icon">
                {getCategoryIcon(selectedDonation.product_category)}
              </div>
              <h3>Confirmar Solicitud</h3>
              <p>¿Deseas solicitar esta donación para tu organización?</p>
            </div>
            <div className="ong-confirm-details">
              <div className="ong-confirm-row">
                <span className="ong-confirm-label">Producto</span>
                <span className="ong-confirm-value">{selectedDonation.product_name}</span>
              </div>
              <div className="ong-confirm-row">
                <span className="ong-confirm-label">Categoría</span>
                <span className="ong-confirm-value">{selectedDonation.product_category}</span>
              </div>
              <div className="ong-confirm-row" style={{ alignItems: 'center' }}>
                <span className="ong-confirm-label">Cantidad a solicitar</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    min="1" 
                    max={selectedDonation.quantity} 
                    value={requestQuantity} 
                    onChange={(e) => setRequestQuantity(Math.min(selectedDonation.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    style={{ width: '80px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                  />
                  <span className="ong-confirm-value text-sm text-gray-500">de {selectedDonation.quantity} disp.</span>
                </div>
              </div>
              <div className="ong-confirm-row">
                <span className="ong-confirm-label">Supermercado</span>
                <span className="ong-confirm-value">{selectedDonation.supermarkets?.business_name || 'Supermercado'}</span>
              </div>
              <div className="ong-confirm-row">
                <span className="ong-confirm-label">Vencimiento</span>
                <span className="ong-confirm-value">
                  {new Date(selectedDonation.expiry_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="ong-confirm-actions">
              <button onClick={() => setSelectedDonation(null)} className="ong-confirm-cancel">
                Cancelar
              </button>
              <button 
                onClick={() => handleRequestDonation(selectedDonation)} 
                className="ong-confirm-submit"
                disabled={requestingId === selectedDonation.id}
              >
                {requestingId === selectedDonation.id ? (
                  <>
                    <div className="ong-btn-spinner"></div>
                    Solicitando...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Confirmar Solicitud
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardONG;
