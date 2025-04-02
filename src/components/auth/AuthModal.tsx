import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-4 bottom-0 mb-[env(safe-area-inset-bottom)] rounded-2xl modern-card"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setMode('login')}
                    className={`text-sm font-light ${
                      mode === 'login' ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={`text-sm font-light ${
                      mode === 'signup' ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
                <button onClick={onClose} className="ios-button">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              
              {mode === 'login' ? (
                <LoginForm />
              ) : (
                <SignupForm role="buyer" onComplete={onClose} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}