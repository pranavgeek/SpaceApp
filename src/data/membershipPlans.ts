import type { CreatorMembership } from '../types/membership';

export const creatorPlans: CreatorMembership[] = [
  {
    id: 'creator-free',
    name: 'Creator Basic',
    tier: 'free',
    price: 0,
    billingPeriod: 'monthly',
    commission: 15, // Platform takes 15%
    maxProducts: 3,
    analyticsAccess: false,
    prioritySupport: false,
    verifiedBadge: false,
    features: [
      'List up to 3 products',
      'Basic analytics',
      'Standard support',
      'Basic product pages',
      'Community access'
    ],
    bestFor: 'Individual creators starting their journey'
  },
  {
    id: 'creator-pro',
    name: 'Creator Pro',
    tier: 'pro',
    price: 29.99,
    billingPeriod: 'monthly',
    commission: 10, // Platform takes 10%
    maxProducts: 25,
    analyticsAccess: true,
    prioritySupport: true,
    verifiedBadge: true,
    features: [
      'List up to 25 products',
      'Advanced analytics',
      'Verified badge',
      'Priority support',
      'Custom product pages',
      'Marketing tools',
      'Early access to features',
      'Influencer collaboration',
      'Reduced platform fees'
    ],
    bestFor: 'Professional creators and small teams'
  },
  {
    id: 'creator-enterprise',
    name: 'Creator Enterprise',
    tier: 'enterprise',
    price: 99.99,
    billingPeriod: 'monthly',
    commission: 5, // Platform takes 5%
    maxProducts: 100,
    analyticsAccess: true,
    prioritySupport: true,
    verifiedBadge: true,
    features: [
      'Unlimited products',
      'Enterprise analytics',
      '24/7 Dedicated support',
      'Custom branding',
      'API access',
      'Team collaboration',
      'Custom integrations',
      'White-label options',
      'Lowest platform fees'
    ],
    bestFor: 'Large teams and established brands'
  }
];