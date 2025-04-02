export type OnboardingStep = 'role' | 'details' | 'verification' | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  role?: 'seller' | 'buyer' | 'influencer';
  details?: {
    name: string;
    bio: string;
    location: string;
    avatar?: string;
  };
  verification?: {
    email: string;
    phone?: string;
    documents?: string[];
  };
}

export interface SellerVerification {
  businessName?: string;
  registrationNumber?: string;
  taxId?: string;
  documents: string[];
}

export interface InfluencerVerification {
  socialProfiles: {
    platform: string;
    handle: string;
    followers: number;
  }[];
  contentSamples: string[];
  engagementMetrics?: {
    averageLikes: number;
    averageComments: number;
    reachRate: number;
  };
}