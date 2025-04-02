import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationList } from './NotificationList';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="ios-button p-2 rounded-full hover:bg-white/5 relative"
      >
        <Bell className="h-6 w-6 text-white/80" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-[10px] text-white font-medium">
              {unreadCount}
            </span>
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-auto modern-card rounded-2xl z-50"
            >
              <NotificationList onClose={() => setIsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}