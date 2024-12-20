import React from 'react';
import type { Notification, NotificationType } from '../types/notification';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationsContextType extends NotificationsState {
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  getNotifications: () => Promise<void>;
}

const NotificationsContext = React.createContext<NotificationsContextType | undefined>(undefined);

// Demo notifications
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    type: 'order',
    title: 'Order Shipped',
    message: 'Your order #ORD123 has been shipped via DHL',
    read: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    metadata: {
      orderId: 'ORD123'
    }
  },
  {
    id: 'notif_2',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Payment of $299.99 was successfully processed',
    read: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    metadata: {
      paymentId: 'PAY456'
    }
  },
  {
    id: 'notif_3',
    type: 'message',
    title: 'New Message',
    message: 'Sarah Chen sent you a message about AI Development Kit',
    read: false,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    metadata: {
      messageId: 'MSG789'
    }
  }
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<NotificationsState>({
    notifications: DEMO_NOTIFICATIONS,
    unreadCount: DEMO_NOTIFICATIONS.filter(n => !n.read).length,
    isLoading: false,
    error: null
  });

  const markAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ),
      unreadCount: prev.notifications.filter(n => !n.read && n.id !== id).length
    }));
  };

  const markAllAsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif => ({ ...notif, read: true })),
      unreadCount: 0
    }));
  };

  const clearNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(notif => notif.id !== id),
      unreadCount: prev.notifications.filter(n => !n.read && n.id !== id).length
    }));
  };

  const getNotifications = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // In a real app, fetch notifications from API
      setState(prev => ({ ...prev, notifications: DEMO_NOTIFICATIONS }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to fetch notifications' 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const value = React.useMemo(() => ({
    ...state,
    markAsRead,
    markAllAsRead,
    clearNotification,
    getNotifications
  }), [state]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}