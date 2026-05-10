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
import AsignacionExcedentes from './pages/AsignacionExcedentes';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // Role-based routing
  const getDefaultRoute = () => {
    if (user?.role === 'admin') {
      return '/dashboard-admin';
    }
    if (user?.role === 'ong') {
      return '/dashboard-ong';
    }
    return '/dashboard';
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
          <Route path="/asignacion-excedentes" element={<AsignacionExcedentes />} />
          <Route path="/map" element={<Map />} />
          <Route path="/notifications" element={<Notifications />} />
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
