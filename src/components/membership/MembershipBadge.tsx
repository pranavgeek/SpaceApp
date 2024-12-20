import React from 'react';
import { Crown } from 'lucide-react';
import { useMembership } from '../../hooks/useMembership';

export function MembershipBadge() {
  const { currentPlan } = useMembership();

  if (!currentPlan || currentPlan.tier === 'free') {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
      <Crown className="w-3 h-3 text-white" />
      <span className="text-xs font-light text-white">
        {currentPlan.tier === 'enterprise' ? 'Enterprise' : 'Pro'}
      </span>
    </div>
  );
}