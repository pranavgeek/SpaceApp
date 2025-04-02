import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import type { MembershipPlan } from '../../types/membership';

interface PricingCardProps {
  plan: MembershipPlan;
  popular?: boolean;
  onSelect: (plan: MembershipPlan) => void;
}

export function PricingCard({ plan, popular, onSelect }: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`modern-card p-6 relative ${popular ? 'ring-2 ring-white' : ''}`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-white text-black text-xs font-light px-3 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-white text-xl font-light mb-2">{plan.name}</h3>
        <p className="text-white/60 text-sm font-light">{plan.bestFor}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-light text-white">
            ${plan.price}
          </span>
          <span className="text-white/60 text-sm ml-2">
            /{plan.billingPeriod}
          </span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center text-sm">
            <Check className="w-4 h-4 text-white/60 mr-3 flex-shrink-0" />
            <span className="text-white/80 font-light">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        className={`w-full py-3 rounded-full flex items-center justify-center space-x-2 text-sm font-light tracking-wide transition-colors ${
          popular
            ? 'bg-white text-black hover:bg-white/90'
            : 'modern-card text-white hover:bg-white/5'
        }`}
      >
        <span>Select Plan</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}