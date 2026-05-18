import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DashboardONG from './pages/DashboardONG';
import DashboardAdmin from './pages/DashboardAdmin';
import Map from './pages/Map';
import Notifications from './pages/Notifications';
import IntegracionInventario from './pages/IntegracionInventario';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isReady } = useAuth();

  // Esperar a que se restaure la sesión desde localStorage
  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg, #F8F9FA)',
        color: 'var(--ink, #333)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthForm />;
  }

  // Role-based default route
  const getDefaultRoute = () => {
    switch (user.role) {
      case 'admin': return '/dashboard-admin';
      case 'ong': return '/dashboard-ong';
      default: return '/dashboard';
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard-ong" element={<DashboardONG />} />
          <Route path="/dashboard-admin" element={<DashboardAdmin />} />
          <Route path="/map" element={<Map />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Fallback: redirige al dashboard correcto */}
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
