import React from 'react';
import { motion } from 'framer-motion';
import { PricingCard } from '../components/membership/PricingCard';
import { creatorPlans } from '../data/membershipPlans';
import { useMembership } from '../hooks/useMembership';
import type { MembershipPlan } from '../types/membership';

export function Pricing() {
  const { currentPlan, isTrialActive, startTrial, upgradePlan } = useMembership();
  
  const handleSelectPlan = (plan: MembershipPlan) => {
    if (plan.tier === 'free') {
      upgradePlan(plan);
    } else if (!currentPlan || currentPlan.tier === 'free') {
      startTrial(plan);
    } else {
      upgradePlan(plan);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)] px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-light text-white mb-2">
            Creator Plans
          </h1>
          <p className="text-white/60 text-sm font-light mb-2">
            {isTrialActive ? '14-day free trial, no credit card required' : 'Start monetizing your innovations'}
          </p>
          {currentPlan && (
            <p className="text-white/80 text-sm font-light">
              Current Plan: {currentPlan.name}
            </p>
          )}
        </motion.div>

        <div className="space-y-8">
          {creatorPlans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              popular={index === 1}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </div>
    </div>
  );
}