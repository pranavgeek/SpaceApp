import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Bell, Globe, Lock, CreditCard, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile Information', action: 'profile' },
      { icon: Lock, label: 'Security & Privacy', action: 'security' },
      { icon: CreditCard, label: 'Payment Methods', action: 'payments' }
    ]
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', action: 'notifications' },
      { icon: Moon, label: 'Appearance', action: 'appearance' },
      { icon: Globe, label: 'Language & Region', action: 'language' }
    ]
  }
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-0 mb-[env(safe-area-inset-bottom)] rounded-2xl modern-card z-50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light text-white">Settings</h2>
                <button onClick={onClose} className="ios-button">
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>

              {user && (
                <div className="flex items-center space-x-3 mb-6">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div>
                    <h3 className="text-white font-light">{user.name}</h3>
                    <p className="text-sm text-white/60 capitalize">{user.role}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {settingsSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-light tracking-wider text-white/40 mb-2">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.action}
                          onClick={() => setActiveSection(item.action)}
                          className="w-full flex items-center justify-between p-3 modern-card rounded-xl ios-button group"
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="w-5 h-5 text-white/60" />
                            <span className="text-white font-light">{item.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}