
// Middleware to check user's subscription tier and limits
const checkSubscriptionLimits = (loadData, saveData) => {
  return async (req, res, next) => {
    try {
      const sellerId = parseInt(req.params.sellerId || req.body?.user_seller);
      
      // Skip check if sellerId is not provided
      if (!sellerId) {
        return next();
      }
      
      // Check if force update is requested
      const forceUpdate = req.body?.force === true;
      if (forceUpdate && req.path.includes('/role')) {
        // Allow force updates to bypass subscription checks
        console.log(`Force update requested for user ${sellerId}`);
        return next();
      }
      
      // Load data and find seller
      const data = loadData();
      const seller = data.users.find(user => parseInt(user.user_id) === sellerId);
      
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      
      // Get subscription tier information
      let tier = seller.tier || 'basic';
      let productLimit = 3;  // Default limit for basic tier
      let collaborationLimit = 1;  // Default limit for basic tier
      let feePercentage = 5;  // Default fee for basic tier
      
      // Set limits based on tier
      switch(tier.toLowerCase()) {
        case 'pro':
          productLimit = 25;
          collaborationLimit = 50;
          feePercentage = 3;
          break;
        case 'enterprise':
          productLimit = Infinity;  // Unlimited
          collaborationLimit = Infinity;  // Unlimited
          feePercentage = 2;
          break;
        default:
          // Basic tier - use defaults
          break;
      }
      
      // Get current usage
      const products = data.products || [];
      const collaborations = data.collaboration_requests || [];
      
      const productCount = products.filter(
        product => parseInt(product.user_seller) === sellerId
      ).length;
      
      const collaborationCount = collaborations.filter(
        collab => 
          parseInt(collab.sellerId) === sellerId && 
          collab.status === 'Accepted'
      ).length;
      
      // Add subscription info to request object
      req.sellerLimits = {
        tier,
        productLimit,
        collaborationLimit,
        feePercentage
      };
      
      req.sellerStats = {
        productCount,
        collaborationCount
      };
      
      // Continue with the request
      next();
    } catch (error) {
      console.error('Error in subscription middleware:', error);
      next();
    }
  };
};
  
  // Helper to count active collaborations for a seller
  function getCollaborationCount(data, sellerId) {
    if (!data.collaboration_requests) return 0;
    
    // Count only active/accepted collaborations
    return data.collaboration_requests.filter(
      collab => String(collab.sellerId) === String(sellerId) && collab.status === 'Accepted'
    ).length;
  }
  
module.exports = { checkSubscriptionLimits };