import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Book, FileQuestion, Mail, ExternalLink } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const supportOptions = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our support team',
    action: 'chat'
  },
  {
    icon: Book,
    title: 'Documentation',
    description: 'Browse our guides and tutorials',
    action: 'docs'
  },
  {
    icon: FileQuestion,
    title: 'FAQs',
    description: 'Find answers to common questions',
    action: 'faqs'
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message',
    action: 'email'
  }
];

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const handleAction = (action: string) => {
    // Handle different support actions
    switch (action) {
      case 'chat':
        // Open live chat
        break;
      case 'docs':
        window.open('/docs', '_blank');
        break;
      case 'faqs':
        window.open('/faqs', '_blank');
        break;
      case 'email':
        window.location.href = 'mailto:support@thespace.app';
        break;
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
                <h2 className="text-xl font-light text-white">Help & Support</h2>
                <button onClick={onClose} className="ios-button">
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>

              <div className="grid gap-4">
                {supportOptions.map((option) => (
                  <motion.button
                    key={option.action}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleAction(option.action)}
                    className="w-full modern-card p-4 ios-button group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl modern-card flex items-center justify-center">
                        <option.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-white font-light">{option.title}</h3>
                          <ExternalLink className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-sm text-white/60 font-light">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-white/40 font-light">
                  Need immediate assistance? Our support team is available 24/7
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}