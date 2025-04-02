export type InfluencerTier = 'rising' | 'established' | 'elite';

export interface InfluencerProgram {
  id: string;
  tier: InfluencerTier;
  requirements: {
    minFollowers: number;
    minEngagementRate: number;
    monthlyPromotions: number;
  };
  benefits: {
    commissionRate: number;
    referralBonus: number;
    productAllowance: number;
    exclusiveAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
  };
  earnings: {
    baseRate: number;
    bonusThresholds: {
      sales: number;
      bonus: number;
    }[];
  };
}

export interface InfluencerMetrics {
  totalSales: number;
  activeReferrals: number;
  engagementRate: number;
  revenueGenerated: number;
  productPromotions: number;
}