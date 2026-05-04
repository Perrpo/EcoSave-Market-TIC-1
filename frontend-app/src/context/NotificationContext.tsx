import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  urgent: boolean;
  product_id?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: any) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await apiService.getNotifications({ limit: 50 }) as any;
      if (response.success && response.data) {
        setNotifications(response.data as Notification[]);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch {
      // Silently ignore - notifications are non-critical
    }
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => clearInterval(intervalId);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.id]);

  // Esta función ahora solo agrega localmente y dispara una recarga
  const addNotification = () => {
    fetchNotifications();
  };

  const markAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await apiService.markNotificationAsRead(id.toString());
    } catch (error) {
      console.error('Error marking notification as read:', error);
      fetchNotifications(); // Revert on failure
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await apiService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchNotifications();
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await apiService.clearAllNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
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
