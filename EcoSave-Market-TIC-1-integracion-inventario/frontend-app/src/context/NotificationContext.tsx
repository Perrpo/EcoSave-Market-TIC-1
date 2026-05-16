import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'product_added' | 'donation_completed' | 'donation_requested' | 'product_expiring' | 'new_user_registered' | 'admin_system_update' | 'user_role_changed';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Notificaciones de ejemplo iniciales para que ningún rol tenga el panel vacío
  const initialNotifications: Notification[] = [
    // Notificaciones comunes para todos los roles
    {
      id: '1',
      type: 'product_expiring',
      title: 'Productos próximos a vencer',
      message: 'Tienes 5 productos que vencerán en los próximos 3 días',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
      read: false,
    },
    {
      id: '2',
      type: 'donation_completed',
      title: 'Donación completada',
      message: 'La donación de productos lácteos ha sido recogida exitosamente',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // Hace 5 horas
      read: false,
    },
    {
      id: '3',
      type: 'donation_requested',
      title: 'Nueva solicitud de donación',
      message: 'Fundación Esperanza ha solicitado productos de tu inventario',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hace 1 día
      read: true,
    },
    {
      id: '4',
      type: 'product_added',
      title: 'Nuevo producto agregado',
      message: 'Se han agregado 20 unidades de pan integral al inventario',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // Hace 2 días
      read: true,
    },
    // Notificaciones específicas para administradores
    {
      id: '5',
      type: 'new_user_registered',
      title: 'Nuevo usuario registrado',
      message: 'Supermercado La Buena Comida se ha unido a la plataforma',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // Hace 3 horas
      read: false,
    },
    {
      id: '6',
      type: 'admin_system_update',
      title: 'Actualización del sistema',
      message: 'El sistema ha sido actualizado a la versión 2.1.0 con mejoras de rendimiento',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // Hace 12 horas
      read: false,
    },
    {
      id: '7',
      type: 'user_role_changed',
      title: 'Cambio de rol',
      message: 'El usuario maria@ong.org ha sido asignado como coordinadora de ONG',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // Hace 1.5 días
      read: true,
    },
  ];

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearAll,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
