import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Settings, HelpCircle } from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';
import { SettingsModal } from '../settings/SettingsModal';
import { SupportModal } from '../support/SupportModal';
import { useAuth } from '../../hooks/useAuth';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showSupportModal, setShowSupportModal] = React.useState(false);

  const handleLogout = () => {
    logout();
    onClose();
  };

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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-black z-50 pt-[env(safe-area-inset-top)]"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light text-white tracking-wide">Menu</h2>
                <button onClick={onClose} className="ios-button">
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>
              
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
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
              ) : null}
            </div>

            {isAuthenticated && (
              <div className="p-4">
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full flex items-center space-x-3 p-3 text-white/60 hover:text-white modern-card rounded-xl ios-button"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-light">Settings</span>
                  </button>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="w-full flex items-center space-x-3 p-3 text-white/60 hover:text-white modern-card rounded-xl ios-button"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-sm font-light">Help & Support</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 text-red-500 hover:text-red-400 modern-card rounded-xl ios-button"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-light">Logout</span>
                  </button>
                </div>
              </div>
            )}
            {!isAuthenticated && (
              <div className="p-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-3 bg-white text-black rounded-full text-sm font-light"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </motion.div>
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
          <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
          <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
        </>
      )}
    </AnimatePresence>
  );
}