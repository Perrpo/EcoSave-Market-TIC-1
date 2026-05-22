import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import apiService from '../services/api'
import { usePolling } from '../hooks/usePolling'
import './Dashboard.css'
// texture-card imports retained for other usage if any
import { TextureButton } from '../components/ui/texture-button'

const BoxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 16-3.67 2.11L12 13.5 8.67 15.89 5 13.78V8l7-4 7 4z" />
    <path d="m5 8 7 4 7-4" />
    <path d="M12 22V12" />
    <path d="M7 4.5l10 5.5" />
  </svg>
)

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
)

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-6.4-4.35-9-8.58C.95 9.28 1.5 5.5 4.75 4.14 7.1 3.13 9.39 4 12 6.75 14.61 4 16.9 3.13 19.25 4.14 22.5 5.5 23.05 9.28 21 12.42 18.4 16.65 12 21 12 21Z" />
  </svg>
)



const PackageIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 7 12 12l8.5-5M12 22V12M3 7l9-5 9 5-9 5-9-5Z" />
    <path d="m3 7 0 10 9 5 9-5 0-10" />
  </svg>
)

interface Product {
  id: string;
  user_id: string;
  nombre: string;
  estado: string;
  categoria: string;
  unidades: number;
  vencimiento: string;
  created_at: string;
  updated_at?: string;
}

interface Donation {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  user_id: string;
  ong_id?: string;
  status: 'available' | 'requested' | 'completed';
  created_at: string;
  requested_at?: string;
  completed_at?: string;
}

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const { addNotification } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showDonationHistory, setShowDonationHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'productos' | 'historial'>('productos');
  const [isLoading, setIsLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    categoria: '',
    unidades: 1,
    vencimiento: ''
  });

  // Track whether the initial load has completed to avoid flickering on poll
  const hasLoadedProducts = useRef(false);
  const hasLoadedDonations = useRef(false);

  const loadProducts = useCallback(async () => {
    if (!auth.user?.id) return;
    
    try {
      if (!hasLoadedProducts.current) setIsLoading(true);
      const response = await apiService.getProducts();
      
      if (response.success && response.data) {
        setProducts(response.data as Product[]);
      } else {
        setProducts([]);
      }
    } finally {
      hasLoadedProducts.current = true;
      setIsLoading(false);
    }
  }, [auth.user?.id]);

  const loadDonations = useCallback(async () => {
    if (!auth.user?.id) return;
    
    try {
      if (!hasLoadedDonations.current) setIsLoading(true);
      const response = await apiService.getDonations();
      
      if (response.success && response.data) {
        setDonations(response.data as Donation[]);
      } else {
        setDonations([]);
      }
    } catch (error) {
      console.error('Error loading donations:', error);
      setDonations([]);
    } finally {
      hasLoadedDonations.current = true;
      setIsLoading(false);
    }
  }, [auth.user?.id]);

  // Polling cada 5 s para que los cambios de otros usuarios (ONG solicitando)
  // aparezcan en tiempo real sin necesidad de recargar la página.
  usePolling(loadProducts, 5000, !!auth.user?.id);
  usePolling(loadDonations, 5000, !!auth.user?.id);

  const handleAddProduct = async () => {
    if (!newProduct.nombre || !newProduct.categoria || !newProduct.vencimiento) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (!auth.user?.id) {
      alert('Error: usuario no autenticado');
      return;
    }


    //--------------------------------------------------------------------
    console.log('Enviando producto:', {
      nombre: newProduct.nombre,
      categoria: newProduct.categoria,
      unidades: newProduct.unidades,
      vencimiento: newProduct.vencimiento,
    })
    //--------------------------------------------------------------------

    try {
      const response = await apiService.createProduct({
        nombre: newProduct.nombre,
        categoria: newProduct.categoria,
        unidades: newProduct.unidades,
        vencimiento: newProduct.vencimiento,
      });

      if (response.success) {
        // Send notification
        addNotification({
          type: 'product_added',
          title: 'Nuevo Producto Agregado',
          message: `${newProduct.nombre} (${newProduct.unidades} unidades) ha sido agregado al inventario.`,
        });

        // Reload products
        await loadProducts();

        // Reset form
        setNewProduct({ nombre: '', categoria: '', unidades: 1, vencimiento: '' });
        setShowAddProduct(false);
      } else {
        alert('Error al crear producto: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error al crear producto. Inténtalo de nuevo.');
    }
  };

  const handleDonate = async (productId: string) => {
    if (!auth.user?.id) {
      alert('Error: usuario no autenticado');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      alert('Producto no encontrado');
      return;
    }

    try {
      const response = await apiService.createDonation({
        product_id: productId,
        quantity: product.unidades,
        status: 'available'
      });

      if (response.success) {
        // Send notification
        addNotification({
          type: 'donation_completed',
          title: 'Donación Completada',
          message: `${product.nombre} (${product.unidades} unidades) ha sido donado exitosamente.`,
        });
        
        // Reload products and donations
        await loadProducts();
        await loadDonations();
      } else {
        alert('Error al crear donación: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      alert('Error al crear donación. Inténtalo de nuevo.');
    }
  };

  // Estadísticas dinámicas
  const totalProducts = useMemo(() => products.length, [products]);

  // Active products: exclude 'Donado' from the main table (they appear in donation history)
  const activeProducts = useMemo(() => products.filter(p => p.estado !== 'Donado'), [products]);

  const urgentProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.estado === 'Urgente' ||
        p.vencimiento.includes('HOY') ||
        p.vencimiento.includes('VENCIDO') ||
        p.vencimiento.includes('1 día')
    ).length;
  }, [products]);

  const donatedProducts = useMemo(() => {
    return donations.filter(d => d.status === 'completed').length;
  }, [donations]);

  // --- MÉTRICAS DE IMPACTO ---
  const kgRescatados = useMemo(() => {
    // Estimado: 0.5 kg promedio por unidad donada
    return donations
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + d.quantity * 0.5, 0);
  }, [donations]);

  const co2Evitado = useMemo(() => {
    // Ref: 2.5 kg CO2 por kg de alimento no desperdiciado
    return (kgRescatados * 2.5).toFixed(1);
  }, [kgRescatados]);

  const tasaDonacion = useMemo(() => {
    if (totalProducts === 0) return 0;
    const donados = products.filter(p => p.estado === 'Donado').length;
    return Math.round((donados / totalProducts) * 100);
  }, [products, totalProducts]);

  const topCategory = useMemo(() => {
    const completedDonations = donations.filter(d => d.status === 'completed');
    if (completedDonations.length === 0) return 'Sin datos';
    const countByCategory: Record<string, number> = {};
    completedDonations.forEach(d => {
      const cat = d.product_category || 'Otros';
      countByCategory[cat] = (countByCategory[cat] || 0) + 1;
    });
    return Object.entries(countByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos';
  }, [donations]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    donations.filter(d => d.status === 'completed').forEach(d => {
      const cat = d.product_category || 'Otros';
      map[cat] = (map[cat] || 0) + d.quantity;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, qty]) => ({ cat, qty, pct: Math.round((qty / total) * 100) }));
  }, [donations]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getExpiryClass = (vencimiento: string) => {
    const diffDays = Math.ceil((new Date(vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'red';
    if (diffDays <= 3) return 'orange';
    return 'green';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">Dashboard {auth.user?.role === 'ong' ? 'ONG' : auth.user?.role === 'admin' ? 'Admin' : 'Supermercado'}</h1>
          <p className="subtitle strong">Gestiona tus productos y donaciones</p>
          <p className="subtitle muted small">{formattedDate}</p>
        </div>
        <div className="header-meta">
          <div className="user-chip stacked">
            <span className="chip-title">{auth.user?.businessName || 'EcoSave Market'}</span>
            <span className="chip-sub">{auth.user?.email || 'demo@ecosave.com'}</span>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-icon"><BoxIcon /></span>
          <div>
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-title">Total Productos</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon"><AlertIcon /></span>
          <div>
            <div className="stat-value">{urgentProducts}</div>
            <div className="stat-title">Expiran Pronto</div>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon"><HeartIcon /></span>
          <div>
            <div className="stat-value">{donatedProducts}</div>
            <div className="stat-title">Donados</div>
          </div>
        </div>

      </div>

      {/* ── MÉTRICAS DE IMPACTO AMBIENTAL Y SOCIAL ── */}
      <div className="impact-grid">
        {/* Kg Rescatados */}
        <div className="impact-card impact-card--cyan">
          <div className="impact-card__emoji">🌿</div>
          <div className="impact-card__value">{kgRescatados.toFixed(1)} kg</div>
          <div className="impact-card__label">Alimentos Rescatados</div>
          <div className="impact-card__sub">Estimado a 0.5 kg/unidad</div>
        </div>

        {/* CO₂ Evitado */}
        <div className="impact-card impact-card--green">
          <div className="impact-card__emoji">☁️</div>
          <div className="impact-card__value">{co2Evitado} kg</div>
          <div className="impact-card__label">CO₂ Evitado</div>
          <div className="impact-card__sub">Ref: 2.5 kg CO₂ por kg rescatado</div>
        </div>

        {/* Tasa de Donación */}
        <div className="impact-card impact-card--orange">
          <div className="impact-card__emoji">📊</div>
          <div className="impact-card__value">{tasaDonacion}%</div>
          <div className="impact-card__label">Tasa de Donación</div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${tasaDonacion}%` }} />
          </div>
        </div>

        {/* Categoría más donada + mini-breakdown */}
        <div className="impact-card impact-card--purple">
          <div className="impact-card__emoji">🏆</div>
          <div className="impact-card__value">{topCategory}</div>
          <div className="impact-card__label">Categoría más donada</div>
          {categoryBreakdown.map(({ cat, pct }) => (
            <div key={cat} className="category-row">
              <span className="category-row__name">{cat}</span>
              <div className="category-row__bar">
                <div className="category-row__fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="category-row__pct">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="side-grid">
        <div className="card">
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'productos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('productos');
                setShowAddProduct(true);
              }}
            >
              Agregar Producto
            </button>
            <button
              className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('historial');
                setShowDonationHistory(true);
              }}
            >
              Historial de Donaciones
            </button>
            <button
              className="tab-btn"
              style={{ color: '#00A99D', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                const token = localStorage.getItem('token');
                fetch(`http://localhost:3333/api/v1/donations/certificate/all?role=supermarket`, {
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
                  a.download = `reporte-anual-supermercado.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                })
                .catch(err => {
                  console.error(err);
                  alert('Aún no tienes donaciones completadas para generar el reporte consolidado.');
                });
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Reporte Consolidado
            </button>
            <button
              className="tab-btn"
              style={{ color: '#F58220', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                  body: JSON.stringify({ email, role: 'supermarket' })
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
          <div className="content-divider" />
          <div className="table-wrap">
            {isLoading ? (
              <div className="loading-message">Cargando productos...</div>
            ) : activeProducts.length === 0 ? (
              <div className="no-products">
                <PackageIcon />
                <p className="empty-title">No hay productos activos</p>
                <p className="empty-sub">Todos los productos fueron donados o agrega nuevos</p>
                <TextureButton variant="ecosavePrimary" size="lg" onClick={() => setShowAddProduct(true)}>Agregar producto</TextureButton>
              </div>
            ) : (
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Unidades</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activeProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td>{p.categoria}</td>
                      <td>{p.unidades}</td>
                      <td>
                        <span className={`tag ${getExpiryClass(p.vencimiento)}`}>
                          {new Date(p.vencimiento).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${p.estado === 'Urgente' || p.estado === 'Vencido' ? 'red' : p.estado === 'Advertencia' ? 'orange' : 'green'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td>
                        <div className="actions-inline" style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ width: '100px' }}>
                            <TextureButton variant="ecosavePrimary" size="sm" onClick={() => handleDonate(p.id)} disabled={p.estado === 'Donado' || p.estado === 'Vencido'}>
                              Donar
                            </TextureButton>
                          </div>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="notif-list">
          <div className="alerts-card">
            <div className="alerts-card__header">
              <h3 className="alerts-card__title">⚠️ Alertas de vencimiento</h3>
              <p className="alerts-card__sub">Productos que requieren acción</p>
            </div>
            <div className="alerts-card__body">
              {activeProducts.filter(p => getExpiryClass(p.vencimiento) !== 'green').map(p => (
                <div key={p.id} className="alert-row">
                  <div className="alert-row__meta">
                    <div className="alert-row__cat">{p.categoria}</div>
                    <div className="alert-row__name">{p.nombre}</div>
                  </div>
                  <span className={`tag ${getExpiryClass(p.vencimiento)}`}>{new Date(p.vencimiento).toLocaleDateString()}</span>
                </div>
              ))}
              {activeProducts.filter(p => getExpiryClass(p.vencimiento) !== 'green').length === 0 && (
                <p className="no-alerts">Sin alertas por ahora ✅</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de solicitudes de ONGs */}
      {donations.filter(d => d.status === 'requested').length > 0 && (
        <div className="ong-requests-card">
          <div className="ong-requests-header">
            <div>
              <h3 className="ong-requests-title">
                🔔 Solicitudes de ONGs
              </h3>
              <p className="ong-requests-sub">ONGs que han solicitado tus donaciones — confirma la entrega</p>
            </div>
            <span className="ong-pending-badge">
              {donations.filter(d => d.status === 'requested').length} pendiente(s)
            </span>
          </div>
          <div className="ong-requests-list">
            {donations.filter(d => d.status === 'requested').map(donation => (
              <div key={donation.id} className="ong-request-row">
                <div className="ong-request-info">
                  <div className="ong-request-name">{donation.product_name}</div>
                  <div className="ong-request-meta">
                    {donation.product_category} · {donation.quantity} unidades · Solicitado el{' '}
                    {new Date(donation.requested_at || donation.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="ong-request-actions">
                  <span className="status-pending">⏳ Pendiente</span>
                  <button
                    className="btn-confirm"
                    onClick={async () => {
                      try {
                        const resp = await apiService.confirmDonation(donation.id);
                        if (resp.success) {
                          addNotification({
                            type: 'donation_completed',
                            title: 'Donación Entregada',
                            message: `Has confirmado la entrega de ${donation.product_name}.`,
                          });
                          await loadDonations();
                        } else {
                          alert('Error: ' + resp.message);
                        }
                      } catch {
                        alert('Error al confirmar la entrega.');
                      }
                    }}
                  >
                    ✅ Confirmar Entrega
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setShowAddProduct(true)} aria-label="Agregar producto">+</button>

      {/* Modal para agregar producto */}
      {showAddProduct && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddProduct(false)
          }}
        >
          <div className="modal">
            <h3>Agregar Nuevo Producto</h3>
            <div className="form-group">
              <label>Nombre del Producto:</label>
              <input
                type="text"
                value={newProduct.nombre}
                onChange={(e) => setNewProduct({...newProduct, nombre: e.target.value})}
                placeholder="Ej: Pan integral"
              />
            </div>
            <div className="form-group">
              <label>Categoría:</label>
              <select
                value={newProduct.categoria}
                onChange={(e) => setNewProduct({...newProduct, categoria: e.target.value})}
              >
                <option value="">Selecciona una categoría</option>
                <option value="Panadería">Panadería</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Frutas">Frutas</option>
                <option value="Verduras">Verduras</option>
                <option value="Carnes">Carnes</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
            <div className="form-group">
              <label>Unidades:</label>
              <input
                type="number"
                min="1"
                value={newProduct.unidades}
                onChange={(e) => setNewProduct({...newProduct, unidades: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label>Fecha de Vencimiento:</label>
              <input
                type="date"
                value={newProduct.vencimiento}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const selected = new Date(e.target.value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (selected < today) {
                    alert('La fecha de vencimiento no puede ser una fecha pasada.');
                    return;
                  }
                  setNewProduct({...newProduct, vencimiento: e.target.value});
                }}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddProduct(false)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={handleAddProduct} className="btn-primary">
                Agregar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para historial de donaciones */}
      {showDonationHistory && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDonationHistory(false)
          }}
        >
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Historial de Donaciones</h3>
              <button className="icon-btn" onClick={() => setShowDonationHistory(false)} aria-label="Cerrar modal">
                ×
              </button>
            </div>
            <div className="donation-list">
              {donations.length === 0 ? (
                <p>No hay donaciones registradas</p>
              ) : (
                donations.map((donation) => {
                  const statusLabel =
                    donation.status === 'completed' ? '✅ Completada' :
                    donation.status === 'requested' ? '⏳ Solicitada' :
                    '🟢 Disponible';
                  const statusColor =
                    donation.status === 'completed' ? '#2D5A27' :
                    donation.status === 'requested' ? '#F58220' :
                    '#00A99D';
                  return (
                  <div key={donation.id} className="donation-item">
                    <div className="donation-info">
                      <h4>{donation.product_name}</h4>
                      <p>Cantidad: {donation.quantity} unidades</p>
                      <p>Categoría: {donation.product_category || 'N/A'}</p>
                      <p>Fecha: {new Date(donation.created_at).toLocaleDateString()}</p>
                      {donation.ong_id && <p>ONG asignada: Sí</p>}
                    </div>
                    <div className="donation-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{
                        background: statusColor + '18',
                        color: statusColor,
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        border: `1px solid ${statusColor}30`,
                      }}>
                        {statusLabel}
                      </span>
                      {donation.status === 'completed' && (
                      <button 
                        className="action-btn" 
                        style={{ background: '#00A99D', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          fetch(`http://localhost:3333/api/v1/donations/${donation.id}/certificate`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                          })
                          .then(res => res.blob())
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `certificado-${String(donation.id).slice(0,8)}.pdf`;
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
                      </button>
                      )}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDonationHistory(false)} className="btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

