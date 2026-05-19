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
import IntegracionInventario from './pages/IntegracionInventario'
import Profile from './pages/Profile';

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

  // Guard component that redirects users to their correct dashboard
  const RoleGuard: React.FC<{ allowedRole: string; children: React.ReactNode }> = ({ allowedRole, children }) => {
    if (
      (allowedRole === 'supermarket' && (user.role === 'ong' || user.role === 'admin')) ||
      (allowedRole === 'ong' && user.role !== 'ong') ||
      (allowedRole === 'admin' && user.role !== 'admin')
    ) {
      return <Navigate to={getDefaultRoute()} replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="/dashboard" element={<RoleGuard allowedRole="supermarket"><Dashboard /></RoleGuard>} />
          <Route path="/dashboard-ong" element={<RoleGuard allowedRole="ong"><DashboardONG /></RoleGuard>} />
          <Route path="/dashboard-admin" element={<RoleGuard allowedRole="admin"><DashboardAdmin /></RoleGuard>} />
          <Route path="/map" element={<Map />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/integracion-inventario" element={<IntegracionInventario />} />
          <Route path="/profile" element={<Profile />} />

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
