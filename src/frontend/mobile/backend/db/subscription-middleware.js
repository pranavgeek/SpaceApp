
// Middleware to check user's subscription tier and limits
const checkSubscriptionLimits = (loadData, saveData) => {
  return async (req, res, next) => {
    try {
      // Get seller ID from various potential sources
      let sellerId = null;
      
      if (req.params && req.params.sellerId) {
        sellerId = parseInt(req.params.sellerId);
      } else if (req.body && req.body.sellerId) {
        sellerId = parseInt(req.body.sellerId);
      } else if (req.body && req.body.user_seller) {
        sellerId = parseInt(req.body.user_seller);
      }
      
      // Log the identified sellerId
      console.log(`[LIMITS] Checking limits for seller ID: ${sellerId}`);
      
      // Skip check if sellerId is not provided
      if (!sellerId) {
        console.log('[LIMITS] No seller ID found, skipping check');
        return next();
      }
      
      // Check if force update is requested
      const forceUpdate = req.body?.force === true;
      if (forceUpdate && req.path.includes('/role')) {
        // Allow force updates to bypass subscription checks
        console.log(`[LIMITS] Force update requested for user ${sellerId}`);
        return next();
      }
      
      // Load data and find seller
      const data = loadData();
      const seller = data.users.find(user => parseInt(user.user_id) === sellerId);
      
      if (!seller) {
        console.log(`[LIMITS] Seller ${sellerId} not found`);
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
      
      // Log the limits for this tier
      console.log(`[LIMITS] Seller ${sellerId} is on ${tier} tier with limits: products=${productLimit}, collaborations=${collaborationLimit}`);
      
      // Get current usage
      const products = data.products || [];
      const collaborations = data.collaboration_requests || [];
      
      const productCount = products.filter(
        product => parseInt(product.user_seller) === sellerId
      ).length;
      
      // IMPORTANT FIX: Count both Pending and Accepted collaborations
      const collaborationCount = collaborations.filter(
        collab => 
          parseInt(collab.sellerId) === sellerId && 
          (collab.status === 'Accepted' || collab.status === 'Pending')
      ).length;
      
      // Log the current usage
      console.log(`[LIMITS] Seller ${sellerId} current usage: products=${productCount}, collaborations=${collaborationCount}`);
      
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
      
      // Check if this is a POST request to create a new collaboration
      if (req.method === 'POST' && req.path.includes('/collaboration-requests')) {
        // Check if the seller has reached their collaboration limit
        if (collaborationCount >= collaborationLimit) {
          console.log(`[LIMITS] Seller ${sellerId} has reached collaboration limit: ${collaborationCount}/${collaborationLimit}`);
          return res.status(403).json({
            error: "Collaboration limit reached",
            message: `Your current plan (${tier}) allows a maximum of ${collaborationLimit} active collaborations. Please upgrade your subscription to add more collaborations.`,
            upgrade_required: true,
            current_tier: tier,
            current_count: collaborationCount,
            max_allowed: collaborationLimit
          });
        }
      }
      
      // Continue with the request
      next();
    } catch (error) {
      console.error('[LIMITS] Error in subscription middleware:', error);
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