import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Twitter, Linkedin, Facebook, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const profileUrl = `https://thespace.app/${user?.id}`;

  const shareOptions = [
    {
      name: 'Twitter',
      icon: Twitter,
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=Check out my profile on THE SPACE&url=${profileUrl}`,
          '_blank'
        );
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${profileUrl}`,
          '_blank'
        );
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${profileUrl}`,
          '_blank'
        );
      }
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
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
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-0 mb-[env(safe-area-inset-bottom)] rounded-2xl modern-card z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light text-white">Share Profile</h2>
                <button onClick={onClose} className="ios-button">
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>

              <div className="flex justify-around mb-8">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="flex flex-col items-center space-y-2 ios-button"
                  >
                    <div className="w-12 h-12 rounded-full modern-card flex items-center justify-center">
                      <option.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-white/60 font-light">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="modern-card p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Link2 className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white/60 font-light truncate">
                    {profileUrl}
                  </span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2 modern-card rounded-xl ios-button"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-white/60" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}