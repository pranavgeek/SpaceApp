import type { InfluencerProgram } from '../types/influencer';

export const influencerTiers: InfluencerProgram[] = [
  {
    id: 'rising-star',
    tier: 'rising',
    requirements: {
      minFollowers: 10000,
      minEngagementRate: 3,
      monthlyPromotions: 2
    },
    benefits: {
      commissionRate: 15,
      referralBonus: 50,
      productAllowance: 200,
      exclusiveAccess: false,
      customBranding: false,
      prioritySupport: false
    },
    earnings: {
      baseRate: 100,
      bonusThresholds: [
        { sales: 10, bonus: 200 },
        { sales: 25, bonus: 500 }
      ]
    }
  },
  {
    id: 'established',
    tier: 'established',
    requirements: {
      minFollowers: 50000,
      minEngagementRate: 4,
      monthlyPromotions: 4
    },
    benefits: {
      commissionRate: 20,
      referralBonus: 100,
      productAllowance: 500,
      exclusiveAccess: true,
      customBranding: true,
      prioritySupport: true
    },
    earnings: {
      baseRate: 250,
      bonusThresholds: [
        { sales: 25, bonus: 500 },
        { sales: 50, bonus: 1000 },
        { sales: 100, bonus: 2500 }
      ]
    }
  },
  {
    id: 'elite',
    tier: 'elite',
    requirements: {
      minFollowers: 250000,
      minEngagementRate: 5,
      monthlyPromotions: 8
    },
    benefits: {
      commissionRate: 25,
      referralBonus: 250,
      productAllowance: 1000,
      exclusiveAccess: true,
      customBranding: true,
      prioritySupport: true
    },
    earnings: {
      baseRate: 1000,
      bonusThresholds: [
        { sales: 50, bonus: 1500 },
        { sales: 100, bonus: 3000 },
        { sales: 250, bonus: 7500 },
        { sales: 500, bonus: 15000 }
      ]
    }
  }
];