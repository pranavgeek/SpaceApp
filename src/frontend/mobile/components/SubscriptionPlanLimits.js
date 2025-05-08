// Defines subscription plan limits and features

const SUBSCRIPTION_PLANS = {
    basic: {
      maxProducts: 3,
      maxCollaborations: 1,
      feePercentage: 5,
      name: 'Seller Basic',
      description: 'Basic seller plan with limited features'
    },
    pro: {
      maxProducts: 25,
      maxCollaborations: 50,
      feePercentage: 3,
      name: 'Seller Pro',
      description: 'Advanced seller plan with more products and collaborations'
    },
    enterprise: {
      maxProducts: Infinity, // Unlimited
      maxCollaborations: Infinity, // Unlimited
      feePercentage: 2,
      name: 'Seller Enterprise',
      description: 'Enterprise seller plan with unlimited features'
    }
  };
  
  // Function to get plan limits based on user's tier
  export const getPlanLimits = (tier = 'basic') => {
    return SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.basic;
  };
  
  // Calculate platform fee based on user's subscription tier
  export const calculatePlatformFee = (price, tier = 'basic') => {
    const { feePercentage } = getPlanLimits(tier);
    return (price * feePercentage) / 100;
  };
  
  // Check if user can add more products
  export const canAddMoreProducts = async (userId, currentTier = 'basic', api) => {
    try {
      // Get the user's current product count from the API
      const userProducts = await api.getUserProducts(userId);
      const productCount = userProducts?.length || 0;
      
      // Get the user's plan limits
      const { maxProducts } = getPlanLimits(currentTier);
      
      // Check if the user can add more products
      const canAdd = productCount < maxProducts;
      
      return {
        canAdd,
        currentCount: productCount,
        maxAllowed: maxProducts,
        remainingSlots: Math.max(0, maxProducts - productCount)
      };
    } catch (error) {
      console.error('Error checking product limits:', error);
      // Default to not allowing in case of errors
      return {
        canAdd: false,
        error: 'Could not verify subscription limits'
      };
    }
  };
  
  // Check if user can add more collaborations
  export const canAddMoreCollaborations = async (userId, currentTier = 'basic', api) => {
    try {
      // Get the user's current collaboration count from the API
      const userCollaborations = await api.getUserCollaborations(userId);
      const collaborationCount = userCollaborations?.length || 0;
      
      // Get the user's plan limits
      const { maxCollaborations } = getPlanLimits(currentTier);
      
      // Check if the user can add more collaborations
      const canAdd = collaborationCount < maxCollaborations;
      
      return {
        canAdd,
        currentCount: collaborationCount,
        maxAllowed: maxCollaborations,
        remainingSlots: Math.max(0, maxCollaborations - collaborationCount)
      };
    } catch (error) {
      console.error('Error checking collaboration limits:', error);
      // Default to not allowing in case of errors
      return {
        canAdd: false,
        error: 'Could not verify subscription limits'
      };
    }
  };
  
  export default {
    SUBSCRIPTION_PLANS,
    getPlanLimits,
    calculatePlatformFee,
    canAddMoreProducts,
    canAddMoreCollaborations
  };