export type MembershipTier = 'free' | 'pro' | 'enterprise';

export interface MembershipPlan {
  id: string;
  name: string;
  tier: MembershipTier;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  bestFor: string;
}

export interface CreatorMembership extends MembershipPlan {
  commission: number;
  maxProducts: number;
  analyticsAccess: boolean;
  prioritySupport: boolean;
  verifiedBadge: boolean;
}

export interface BuyerMembership extends MembershipPlan {
  earlyAccess: boolean;
  exclusiveDeals: boolean;
  prioritySupport: boolean;
  customization: boolean;
}