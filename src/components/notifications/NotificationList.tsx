import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Package, CreditCard, MessageCircle, Megaphone, X, Check } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationType } from '../../types/notification';

interface NotificationListProps {
  onClose: () => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  order: Package,
  payment: CreditCard,
  message: MessageCircle,
  system: Bell,
  promotion: Megaphone
};

export function NotificationList({ onClose }: NotificationListProps) {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    clearNotification,
    unreadCount 
  } = useNotifications();

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // In a real app, navigate to the relevant page based on notification type
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-white font-light">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-white/60 font-light">
              {unreadCount} unread
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-2 text-white/60 hover:text-white ios-button"
            >
              <Check className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white ios-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 text-white/40 mx-auto mb-2" />
            <p className="text-white/60 font-light">No notifications</p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`modern-card p-4 ${
                  !notification.read ? 'ring-1 ring-white/10' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 modern-card rounded-xl">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-light">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-white/60 font-light mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="p-1 text-white/40 hover:text-white/60 ios-button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-white/40">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-white/60 hover:text-white ios-button"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}