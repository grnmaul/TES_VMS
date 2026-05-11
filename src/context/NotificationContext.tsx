'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRealtime } from '@/src/lib/useRealtime';
import { useAuth } from './AuthContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'success' | 'info';
  timestamp: string;
  is_read: number;
}

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  decrementUnreadCount: () => {},
  resetUnreadCount: () => {},
  refreshUnreadCount: async () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();

  const refreshUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', { 
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const count = data.filter((n: Notification) => n.is_read === 0).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications count:', error);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUnreadCount();
    }
  }, [token]);

  useRealtime((event) => {
    if (event.type === 'notification:new') {
      const notification = event.payload as Notification;
      
      setUnreadCount(prev => prev + 1);

      // Trigger global toast
      const toastMsg = `${notification.title}: ${notification.message}`;
      switch (notification.type) {
        case 'error':
          toast.error(toastMsg, { duration: 5000 });
          break;
        case 'warning':
          toast(toastMsg, { icon: '⚠️', duration: 4000 });
          break;
        case 'success':
          toast.success(toastMsg, { duration: 3000 });
          break;
        default:
          toast(toastMsg, { duration: 3000 });
          break;
      }
    }
  });

  const decrementUnreadCount = () => setUnreadCount(prev => Math.max(0, prev - 1));
  const resetUnreadCount = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, decrementUnreadCount, resetUnreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
