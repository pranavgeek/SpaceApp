export const SUBSCRIPTION_TIERS = {
    basic: {
      productLimit: 3,
      collaborationLimit: 1,
      feePercentage: 5
    },
    pro: {
      productLimit: 25,
      collaborationLimit: 50,
      feePercentage: 3
    },
    enterprise: {
      productLimit: Infinity,
      collaborationLimit: Infinity,
      feePercentage: 2
    }
  };
  
  export const getSubscriptionLimits = (tier = 'basic') => {
    const normalizedTier = tier.toLowerCase();
    return SUBSCRIPTION_TIERS[normalizedTier] || SUBSCRIPTION_TIERS.basic;
  };