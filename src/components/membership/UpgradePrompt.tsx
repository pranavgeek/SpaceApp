import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useMembership } from '../../hooks/useMembership';

interface UpgradePromptProps {
  feature: string;
  description: string;
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  const { currentPlan } = useMembership();

  if (currentPlan && currentPlan.tier !== 'free') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 modern-card"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 modern-card rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-light mb-1">{feature}</h3>
          <p className="text-sm text-white/60 font-light mb-4">{description}</p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full py-2 bg-white text-black rounded-full text-sm font-light"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}