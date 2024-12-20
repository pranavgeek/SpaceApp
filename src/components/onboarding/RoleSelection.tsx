import React from 'react';
import { motion } from 'framer-motion';
import { Store, ShoppingBag, Star } from 'lucide-react';
import type { OnboardingState } from '../../types/onboarding';

interface RoleSelectionProps {
  onSelect: (role: OnboardingState['role']) => void;
}

export function RoleSelection({ onSelect }: RoleSelectionProps) {
  const roles = [
    {
      id: 'seller',
      icon: Store,
      title: 'Seller',
      description: 'List and sell your innovative products',
      benefits: ['Product listings', 'Analytics dashboard', 'Direct messaging']
    },
    {
      id: 'buyer',
      icon: ShoppingBag,
      title: 'Buyer',
      description: 'Discover and purchase unique innovations',
      benefits: ['Early access', 'Exclusive deals', 'Secure payments']
    },
    {
      id: 'influencer',
      icon: Star,
      title: 'Influencer',
      description: 'Promote products and earn commissions',
      benefits: ['High commission rates', 'Performance bonuses', 'Exclusive campaigns']
    }
  ];

  return (
    <div className="space-y-4">
      {roles.map((role, index) => (
        <motion.button
          key={role.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(role.id as OnboardingState['role'])}
          className="w-full modern-card p-6 text-left ios-button"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 modern-card rounded-xl">
              <role.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-light mb-1">{role.title}</h3>
              <p className="text-sm text-white/60 font-light mb-3">
                {role.description}
              </p>
              <ul className="space-y-2">
                {role.benefits.map((benefit) => (
                  <li key={benefit} className="text-xs text-white/40 font-light">
                    • {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}