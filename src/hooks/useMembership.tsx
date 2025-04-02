import React from 'react';
import type { MembershipPlan } from '../types/membership';

interface MembershipState {
  currentPlan: MembershipPlan | null;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
}

interface MembershipContextType extends MembershipState {
  startTrial: (plan: MembershipPlan) => void;
  upgradePlan: (plan: MembershipPlan) => void;
  cancelPlan: () => void;
}

const MembershipContext = React.createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<MembershipState>({
    currentPlan: {
      id: 'free',
      name: 'Free',
      tier: 'free',
      price: 0,
      billingPeriod: 'monthly',
      features: ['Basic features'],
      bestFor: 'Getting started'
    },
    isTrialActive: false,
    trialEndsAt: null,
  });

  const startTrial = React.useCallback((plan: MembershipPlan) => {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    setState({
      currentPlan: plan,
      isTrialActive: true,
      trialEndsAt,
    });
  }, []);

  const upgradePlan = React.useCallback((plan: MembershipPlan) => {
    setState({
      currentPlan: plan,
      isTrialActive: false,
      trialEndsAt: null,
    });
  }, []);

  const cancelPlan = React.useCallback(() => {
    setState({
      currentPlan: null,
      isTrialActive: false,
      trialEndsAt: null,
    });
  }, []);

  const value = React.useMemo(() => ({
    ...state,
    startTrial,
    upgradePlan,
    cancelPlan
  }), [state, startTrial, upgradePlan, cancelPlan]);

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = React.useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}