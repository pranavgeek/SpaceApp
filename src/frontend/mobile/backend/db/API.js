import AsyncStorage from "@react-native-async-storage/async-storage";
import userData from "./data.json";
import { Platform } from "react-native";

// Dynamically choose the BASE_URL based on platform
const BASE_URL = Platform.OS === "web" 
  ? "http://localhost:5001/api"
  : "http://10.0.0.25:5001/api";

// const BASE_URL = Platform.OS === "web" 
//   ? "http://3.99.169.179/api"
//   : "http://3.99.169.179/api";


console.log(`Using API base URL: ${BASE_URL}`);

//LOGIN
export const apiLogin = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {  // Simulate network delay
      // Fetch all users from the mock data
      const user = userData.users.find(u => u.email === email && u.password === password);
      
      if (user) {
        console.log("User found:", user.name, "Role:", user.account_type);
        resolve(user);  // Return the found user
      } else {
        console.log("Login failed: Invalid credentials");
        reject(new Error('Invalid credentials'));
      }
    }, 1000);
  });
};

export const requestOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/request-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Failed to send OTP");
  return res.json();
};

export const verifyOtp = async (email, otp) => {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw new Error("Invalid or expired OTP");
  return res.json();
};

export const resetPassword = async (email, new_password) => {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, new_password }),
  });
  if (!res.ok) throw new Error("Failed to reset password");
  return res.json();
};


// Add these functions to your API.js file

/**
 * Create a new subscription with Moneris
 * @param {Object} subscriptionData - Subscription details
 * @returns {Promise<Object>} - The created subscription
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const response = await fetch('/api/subscription-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error creating subscription:', errorData);
      throw new Error('Failed to create subscription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in createSubscription:', error);
    throw error;
  }
};

/**
 * Get all subscriptions for a user
 * @param {number|string} userId - The user ID
 * @returns {Promise<Array>} - Array of subscriptions
 */
export const getUserSubscriptions = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/subscriptions`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return [];
  }
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId - The subscription ID to cancel
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<Object>} - Result of cancellation
 */
export const cancelSubscription = async (subscriptionId, reason = 'User requested cancellation') => {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Retrieve a token from Moneris using the receipt ticket
 * @param {string} ticket - The Moneris receipt ticket
 * @param {number|string} userId - The user ID
 * @returns {Promise<Object>} - The token data
 */
export const retrievePaymentToken = async (ticket, userId) => {
  try {
    const response = await fetch('/api/retrieve-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ticket,
        userId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error retrieving token:', errorData);
      throw new Error('Failed to retrieve payment token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in retrievePaymentToken:', error);
    throw error;
  }
};

/**
 * Check if a user has an active subscription for a specific plan
 * @param {number|string} userId - The user ID
 * @param {string} planId - The plan ID to check
 * @returns {Promise<boolean>} - Whether the user has an active subscription
 */
export const hasActiveSubscription = async (userId, planId) => {
  try {
    const subscriptions = await getUserSubscriptions(userId);
    return subscriptions.some(
      sub => sub.plan_id === planId && sub.status === 'active'
    );
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return false;
  }
};

/**
 * Get all available subscription plans
 * @returns {Array} - Array of subscription plans
 */
export const getSubscriptionPlans = () => {
  return [
    {
      id: 'basic',
      title: 'Seller Basic',
      price: '$0',
      priceMonthly: '$0',
      originalPrice: '$0',
      bullets: [
        '3 Products',
        '1 Collaboration feature',
        'Fees 5%',
        'Basic analytics',
        'Minimal branding',
        'Community access',
      ],
    },
    {
      id: 'pro',
      title: 'Seller Pro',
      price: '$359.99',
      priceMonthly: '$29.99',
      originalPrice: '$359.88',
      bullets: [
        'All sellers features',
        '25 Products',
        '50 Collaboration features',
        'Fees 3%',
        'Advanced analytics',
        'Custom branding',
        'Priority support',
        'More robust tools',
      ],
    },
    {
      id: 'enterprise',
      title: 'Seller Enterprise',
      price: '$1199.99',
      priceMonthly: '$99.99',
      originalPrice: '$1199.88',
      bullets: [
        'Unlimited Pro features + advanced tools',
        'Unlimited Products',
        'Unlimited Collaboration features',
        'Fees 2%',
        'Dedicated account manager',
        'White label solution',
        'Extended usage & resources',
        'Enterprise-level support',
      ],
    },
  ];
};


export const createOrder = async (buyerId, orderData) => {
  try {
    console.log(`Creating order at: ${BASE_URL}/users/${buyerId}/orders/create`);
    console.log("Order data:", JSON.stringify(orderData));
    
    const response = await fetch(`${BASE_URL}/users/${buyerId}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Server responded with:", errText);
      throw new Error("Failed to create order");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const cancelOrder = async (orderId) => {
  try {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error cancelling order: ${errorData}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error cancelling order:", error);
    return false;
  }
};

export const getUserOrders = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}/orders`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return await res.json();
};

export const getSellerReceivedOrders = async (userId) => {
  const response = await fetch(`${BASE_URL}/users/${userId}/received-orders`);
  if (!response.ok) throw new Error("Failed to fetch received orders");
  return await response.json();
};


//Tracking API
export const submitTrackingLink = async (orderId, trackingLink) => {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/submit-tracking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tracking_link: trackingLink,
      submitted_by: "seller",
    }),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Failed to submit tracking: ${errorMsg}`);
  }

  return await response.json();
};

export const fetchPendingTrackingLinks = async () => {
  const response = await fetch(`${BASE_URL}/admin/pending-trackings`);
  if (!response.ok) throw new Error("Failed to fetch pending tracking links");
  return await response.json();
};

export const approveTrackingLink = async (orderId, trackingUrl) => {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/approve-tracking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tracking_url: trackingUrl })
  });
  if (!response.ok) throw new Error("Failed to approve tracking URL");
  return await response.json();
};

// USERS
export const fetchUsers = async () => {
  const response = await fetch(`${BASE_URL}/users`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
};

export const fetchUserById = async (id) => {
  const response = await fetch(`${BASE_URL}/users/${id}`);
  if (!response.ok) throw new Error("User not found");
  return response.json();
};

export const createUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error("Failed to create user");
  return response.json();
};

export const updateUser = async (id, userData) => {
  // Create a shallow copy and remove _preventReload if present
  const dataToSend = { ...userData };
  delete dataToSend._preventReload;

  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataToSend),
  });

  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
};

export const deleteUser = async (id) => {
  const response = await fetch(`${BASE_URL}/users/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete user");
  return response.json();
};

// PRODUCTS
export const fetchProducts = async () => {
  const response = await fetch(`${BASE_URL}/products`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
};

export const fetchProductById = async (id) => {
  const response = await fetch(`${BASE_URL}/products/${id}`);
  if (!response.ok) throw new Error("Product not found");
  return response.json();
};

export const createProduct = async (productData) => {
  const response = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to create product");
  return response.json();
};

export const verifyProduct = async (productId, productName) => {
  try {
    // Make sure productId is a number
    const id = parseInt(productId, 10);
    
    // Log the verification attempt
    console.log(`Attempting to verify product with ID: ${id}, Name: ${productName || 'Not specified'}`);
    
    // API endpoint URL - adjusted to match your server structure
    const apiUrl = `${BASE_URL}/verify-product/${id}`;
    
    // Make the API request with proper headers and method
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include both verification flag and product name to handle duplicates
      body: JSON.stringify({
        verified: true,
        productName: productName
      }),
    });
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Verify the response indicates success
    if (!data.success) {
      throw new Error(`API returned failure: ${data.message || 'Unknown error'}`);
    }
    
    // Log success
    console.log('Product verified successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error in verifyProduct:', error);
    throw error; // Re-throw to allow handling in the UI
  }
};


export const updateProduct = async (id, productData) => {
  const response = await fetch(`${BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
};

export const deleteProduct = async (id) => {
  const response = await fetch(`${BASE_URL}/products/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete product");
  return response.json();
};

// Function to find product ID by name
export const findProductIdByName = async (productName) => {
  if (!productName) return null;
  
  try {
    // Fetch all products from the API
    const products = await fetchProducts();
    
    if (!Array.isArray(products)) {
      console.error("Products data is not an array:", products);
      return null;
    }
    
    // First try exact name match
    let matchedProduct = products.find(
      p => p.product_name?.toLowerCase() === productName.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!matchedProduct) {
      matchedProduct = products.find(
        p => p.product_name?.toLowerCase().includes(productName.toLowerCase()) ||
             productName.toLowerCase().includes(p.product_name?.toLowerCase())
      );
    }
    
    if (matchedProduct) {
      console.log(`Found product match: ${matchedProduct.product_name} (ID: ${matchedProduct.product_id})`);
      return matchedProduct.product_id;
    }
    
    console.log(`No product found matching name: ${productName}`);
    return null;
  } catch (error) {
    console.error("Error finding product by name:", error);
    return null;
  }
};

export const getSellerProducts = async (sellerId) => {
  const response = await fetch(`${BASE_URL}/seller/${sellerId}/products`);
  if (!response.ok) throw new Error("Failed to fetch seller products");
  return response.json();
};

export const getVerifiedProductsCount = async (sellerId) => {
  try {
    // Fetch all products from the API
    const products = await fetchProducts();
    
    if (!Array.isArray(products)) {
      console.error("Products data is not an array:", products);
      return 0;
    }
    
    // Filter products by seller ID and verified status
    const verifiedProducts = products.filter(
      product => product.user_seller === sellerId && product.verified === true
    );
    
    return verifiedProducts.length;
  } catch (error) {
    console.error("Error counting verified products:", error);
    return 0;
  }
};

// REVIEWS
export const createReview = async (reviewData) => {
  try {
    // Make sure we have a user_name in the review data
    if (!reviewData.user_name) {
      // If user_name is not provided, fetch it from the users endpoint
      try {
        const response = await fetch(`${BASE_URL}/users/${reviewData.user_id}`);
        const userData = await response.json();
        
        if (userData && userData.name) {
          reviewData.user_name = userData.name;
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        // Continue with the review creation even if we couldn't get the name
      }
    }

    // Send the review data to your API endpoint
    const response = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      throw new Error(`Error creating review: ${response.status}`);
    }

    const createdReview = await response.json();
    return createdReview;
  } catch (error) {
    console.error("Error in createReview:", error);
    throw error;
  }
};

// Modified fetchReviews function in your API.js file
export const fetchReviews = async (productId) => {
  try {
    // Fetch reviews for the product
    const reviewsResponse = await fetch(`${BASE_URL}/reviews?product_id=${productId}`);
    
    if (!reviewsResponse.ok) {
      throw new Error(`Error fetching reviews: ${reviewsResponse.status}`);
    }
    
    const reviews = await reviewsResponse.json();
    
    // If there are reviews, fetch user data to get names
    if (reviews && reviews.length > 0) {
      // Get unique user IDs from reviews
      const userIds = [...new Set(reviews.map(review => review.user_id))];
      
      // Fetch user details for all these users
      const usersResponse = await fetch(`${BASE_URL}/users?${userIds.map(id => `id=${id}`).join('&')}`);
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        
        // Create a map of user_id to user name
        const userMap = {};
        users.forEach(user => {
          userMap[user.user_id] = user.name;
        });
        
        // Enhance review objects with user names
        reviews.forEach(review => {
          review.user_name = userMap[review.user_id] || `User ${review.user_id}`;
        });
      }
    }
    
    return reviews;
  } catch (error) {
    console.error("Error in fetchReviews:", error);
    throw error;
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    
    if (!response.ok) throw new Error(`Failed to update review ${reviewId}`);
    return response.json();
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error(`Failed to delete review ${reviewId}`);
    return response.json();
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// MESSAGES
export const fetchMessages = async () => {
  try {
    const local = await AsyncStorage.getItem("messages");
    const localMessages = local ? JSON.parse(local) : [];

    const response = await fetch(`${BASE_URL}/messages`);
    const serverMessages = (await response.json()) || [];

    return [...serverMessages, ...localMessages];
  } catch (error) {
    console.error("Fetch messages error:", error);
    return [];
  }
};

// Fetch messages between two users
export const fetchMessagesBetweenUsers = async (user1Id, user2Id) => {
  try {
    const response = await fetch(`${BASE_URL}/messages/between/${user1Id}/${user2Id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching messages between users:", error);
    return [];
  }
};

// Fetch all conversations for a user
export const fetchUserConversations = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/messages/conversations/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    return [];
  }
};

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    const response = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...messageData,
        date_timestamp_sent: new Date().toISOString(),
        is_read: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }
    
    return new Promise((resolve) => {
      console.log("Mock sendMessage called", messageData);
      setTimeout(() => resolve({ status: 'ok' }), 500);
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId) => {
  try {
    const response = await fetch(`${BASE_URL}/messages/${messageId}/read`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark message as read: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
};

// Mark all messages from a specific user as read
export const markAllMessagesAsRead = async (fromUserId, toUserId) => {
  try {
    const response = await fetch(`${BASE_URL}/messages/mark-all-read/${fromUserId}/${toUserId}`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark messages as read: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error marking all messages as read:", error);
    return false;
  }
};

// Get unread messages count
export const getUnreadMessagesCount = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/messages/unread-count/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get unread count: ${response.status}`);
    }
    
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    return 0;
  }
};

// NOTIFICATIONS
export const fetchNotifications = async (userId) => {
  const response = await fetch(`${BASE_URL}/notifications/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
};

export const createNotification = async (notificationData) => {
  const response = await fetch(`${BASE_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notificationData),
  });
  if (!response.ok) throw new Error("Failed to create notification");
  return response.json();
};

export const deleteNotification = async (id) => {
  const response = await fetch(`${BASE_URL}/notifications/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete notification");
  return response.json();
};

// ADMIN DATA
export const fetchAdminData = async () => {
  const response = await fetch(`${BASE_URL}/admin`);
  if (!response.ok) throw new Error("Failed to fetch admin data");
  return response.json();
};

// Create a new admin action for approval
export const createAdminAction = async (actionData) => {
  try {
    console.log("[ADMIN] Creating admin action:", actionData);
    
    // Make sure the action has all required fields
    const enhancedAction = {
      ...actionData,
      status: actionData.status || "pending", // Default status is pending
      date_timestamp: actionData.date_timestamp || new Date().toISOString()
    };
    
    // Try to send to the backend
    try {
      const response = await fetch(`${BASE_URL}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedAction),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ADMIN] Failed to create admin action: ${errorText}`);
        throw new Error(`Failed to create admin action: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[ADMIN] Successfully created admin action with ID: ${result.admin_id}`);
      
      return result;
    } catch (apiError) {
      console.error("[ADMIN] Backend API error:", apiError);
      
      // For fallback, could store in local storage if needed
      // But most important is to show the error to the user
      throw apiError;
    }
  } catch (error) {
    console.error("[ADMIN] Error creating admin action:", error);
    throw error;
  }
};

// Get all admin actions (for admin dashboard)
export const fetchAdminActions = async () => {
  try {
    console.log("[ADMIN] Fetching all admin actions");
    
    const response = await fetch(`${BASE_URL}/admin`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch admin actions: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[ADMIN] Fetched ${data.length} admin actions`);
    
    return data;
  } catch (error) {
    console.error("[ADMIN] Error fetching admin actions:", error);
    return [];
  }
};

// Get pending admin actions (for admin dashboard)
export const fetchPendingAdminActions = async () => {
  try {
    console.log("[ADMIN] Fetching pending admin actions");
    
    // Since many APIs don't have a filter option,
    // we'll fetch all and filter on the client
    const allActions = await fetchAdminActions();
    
    const pendingActions = allActions.filter(action => 
      action.status === "pending" || action.status === "Pending"
    );
    
    console.log(`[ADMIN] Found ${pendingActions.length} pending admin actions`);
    
    return pendingActions;
  } catch (error) {
    console.error("[ADMIN] Error fetching pending admin actions:", error);
    return [];
  }
};

export const updateAdminStatus = async (adminId, status) => {
  try {
    console.log(`[ADMIN] Updating admin action ${adminId} to status: ${status}`);
    
    const response = await fetch(`${BASE_URL}/admin/${adminId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[ADMIN] Server returned error: ${response.status} ${errorData}`);
      throw new Error(`Failed to update admin status: ${errorData}`);
    }
    
    const result = await response.json();
    console.log(`[ADMIN] Successfully updated admin action status to: ${status}`);
    
    return result;
  } catch (error) {
    console.error("[ADMIN] Error updating admin status:", error);
    throw error;
  }
};

export const updateUserRole = async (userId, role, tier = null, force = false) => {
  try {
    console.log(`Updating user ${userId} to role: ${role} with tier: ${tier || 'none'}, force: ${force}`);
    
    // Normalize the role and create the appropriate account_type
    const normalizedRole = role.toLowerCase();
    let accountType;
    
    // Map the normalized role to the appropriate account_type format
    switch(normalizedRole) {
      case 'influencer':
        accountType = 'Influencer';
        break;
      case 'seller':
        accountType = 'Seller';
        break;
      case 'buyer':
        accountType = 'Buyer';
        break;
      case 'admin':
        accountType = 'Admin';
        break;
      default:
        accountType = 'Buyer'; // Default fallback
    }
    
    // Create a payload with both role and account_type
    const payload = { 
      role: normalizedRole,
      account_type: accountType,
      force: force // Add force flag to bypass any server-side validation
    };
    
    // Add tier if provided
    if (tier) {
      payload.tier = tier;
    }
    
    console.log("Sending update payload:", JSON.stringify(payload));
    
    // Send the update request
    const response = await fetch(`${BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Server returned error: ${response.status} ${errorData}`);
      throw new Error(`Failed to update user role: ${errorData}`);
    }
    
    const result = await response.json();
    console.log("User role update result:", result);
    
    // Also update in AsyncStorage to ensure consistency
    await AsyncStorage.setItem('userRole', normalizedRole);
    if (tier) {
      await AsyncStorage.setItem('userTier', tier);
    }
    
    return result;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// SECURITY SETTINGS
export const getUserSecuritySettings = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/security-settings`);
    
    if (!response.ok) {
      throw new Error(`Failed to get security settings: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error getting security settings:", error);
    throw error;
  }
};

// Update user security settings
export const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      message: data.message
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "An error occurred while updating password"
    };
  }
};

// Enable or disable two-factor authentication
export const requestVerificationCode = async (userId, phoneNumber) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/2fa/request-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        phoneNumber
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to send verification code"
      };
    }
    
    // For development, log the verification code
    if (data.dev_code) {
      console.log(`Development 2FA code: ${data.dev_code}`);
    }
    
    return {
      success: true,
      verificationId: data.verificationId,
      message: "Verification code sent successfully"
    };
  } catch (error) {
    console.error("Error requesting verification code:", error);
    return {
      success: false,
      message: "An error occurred while requesting verification code"
    };
  }
};

// Enable two-factor authentication
export const verifyTwoFACode = async (userId, verificationId, code, phoneNumber) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        verificationId,
        code,
        phoneNumber
      })
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      message: data.message
    };
  } catch (error) {
    console.error("Error verifying 2FA code:", error);
    return {
      success: false,
      message: "An error occurred while verifying the code"
    };
  }
};

// Enable two-factor authentication
export const disableTwoFA = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      message: data.message
    };
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return {
      success: false,
      message: "An error occurred while disabling two-factor authentication"
    };
  }
};

// Update privacy settings
export const updatePrivacySettings = async (userId, settings) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/privacy-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      message: data.message
    };
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return {
      success: false,
      message: "An error occurred while updating privacy settings"
    };
  }
};

// Get all campaign requests
export const fetchCampaignRequests = async () => {
  try {
    const response = await fetch(`${BASE_URL}/campaign-requests`);
    if (!response.ok) {
      throw new Error(`Failed to fetch campaign requests: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching campaign requests:", error);
    // Fall back to local storage
    return getLocalCampaignRequests();
  }
};

// Get campaign requests for a specific influencer
export const fetchInfluencerCampaignRequests = async (influencerId) => {
  try {
    // Try fetching from the backend API
    const response = await fetch(`${BASE_URL}/campaign-requests/influencer/${influencerId}`);
    
    if (!response.ok) {
      // If API fails, fall back to local storage
      throw new Error(`Failed to fetch influencer campaign requests: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching influencer campaign requests:", error);
    
    // Fall back to local storage
    try {
      // Get stored campaign requests
      const stored = await AsyncStorage.getItem("campaignRequests");
      const allRequests = stored ? JSON.parse(stored) : [];
      
      // Filter for the specified influencer
      return allRequests.filter(req => String(req.influencerId) === String(influencerId));
    } catch (storageError) {
      console.error("Error fetching from local storage:", storageError);
      // Return empty array if all attempts fail
      return [];
    }
  }
};

// Get campaign requests for a specific seller
export const fetchSellerCampaignRequests = async (sellerId) => {
  try {
    const response = await fetch(`${BASE_URL}/campaign-requests/seller/${sellerId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch seller campaign requests: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching seller campaign requests:", error);
    // Fall back to local storage
    const allRequests = await getLocalCampaignRequests();
    return allRequests.filter(req => String(req.sellerId) === String(sellerId));
  }
};

// Create a new campaign request
export const createCampaignRequest = async (campaignRequest) => {
  try {
    console.log("[CAMPAIGN] Creating campaign request:", campaignRequest);
    
    // First try to create on the backend
    try {
      const response = await fetch(`${BASE_URL}/campaign-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignRequest),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create campaign request: ${response.status}`);
      }
      
      const createdCampaign = await response.json();
      console.log("[CAMPAIGN] Successfully created campaign on backend:", createdCampaign);
      
      // Also store in local storage for offline access
      try {
        const stored = await AsyncStorage.getItem("campaignRequests");
        const existingRequests = stored ? JSON.parse(stored) : [];
        
        // Check for duplicates
        const duplicate = existingRequests.find(
          req => req.requestId === createdCampaign.requestId
        );
        
        if (!duplicate) {
          const updatedRequests = [...existingRequests, createdCampaign];
          await AsyncStorage.setItem("campaignRequests", JSON.stringify(updatedRequests));
        }
      } catch (storageError) {
        console.error("[CAMPAIGN] Error updating local storage:", storageError);
      }
      
      return createdCampaign;
    } catch (apiError) {
      console.error("[CAMPAIGN] Error creating campaign on backend:", apiError);
      
      // Fallback to local storage only
      const stored = await AsyncStorage.getItem("campaignRequests");
      const existingRequests = stored ? JSON.parse(stored) : [];
      
      // Check for duplicates
      const duplicate = existingRequests.find(
        req => req.influencerId === campaignRequest.influencerId && 
               req.sellerId === campaignRequest.sellerId && 
               req.productId === campaignRequest.productId &&
               req.status === "Pending"
      );
      
      if (duplicate) {
        throw new Error("Duplicate campaign request found");
      }
      
      // Add to campaign requests
      const updatedRequests = [...existingRequests, campaignRequest];
      await AsyncStorage.setItem("campaignRequests", JSON.stringify(updatedRequests));
      console.log("[CAMPAIGN] Successfully created campaign in local storage only");
      
      return campaignRequest;
    }
  } catch (error) {
    console.error("[CAMPAIGN] Error in createCampaignRequest:", error);
    throw error;
  }
};

// Update campaign request status
export const updateCampaignRequestStatus = async (requestId, status) => {
  try {
    // Try to update in backend first
    const response = await fetch(`${BASE_URL}/campaign-requests/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update campaign request: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating campaign request:", error);
    
    // Fall back to local storage if backend fails
    try {
      const requests = await getLocalCampaignRequests();
      const updatedRequests = requests.map(req => 
        req.requestId === requestId 
          ? { 
              ...req, 
              status, 
              statusUpdatedAt: new Date().toISOString() 
            } 
          : req
      );
      
      await saveLocalCampaignRequests(updatedRequests);
      return updatedRequests.find(req => req.requestId === requestId);
    } catch (storageError) {
      console.error("Error updating in local storage:", storageError);
      throw storageError;
    }
  }
};

export const fetchApprovedCampaigns = async () => {
  try {
      const response = await fetch(`${BASE_URL}/campaigns/approved`);
      if (!response.ok) throw new Error("Failed to fetch approved campaigns");
      return response.json();
  } catch (error) {
      console.error("Error fetching approved campaigns:", error);
      return [];
  }
};

// Delete a campaign request
export const deleteCampaignRequest = async (requestId) => {
  try {
    // Try to delete from backend first
    const response = await fetch(`${BASE_URL}/campaign-requests/${requestId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete campaign request: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting campaign request:", error);
    
    // Fall back to local storage if backend fails
    try {
      const requests = await getLocalCampaignRequests();
      const filteredRequests = requests.filter(req => req.requestId !== requestId);
      
      if (requests.length === filteredRequests.length) {
        throw new Error("Campaign request not found");
      }
      
      await saveLocalCampaignRequests(filteredRequests);
      return { message: "Campaign request deleted successfully" };
    } catch (storageError) {
      console.error("Error deleting from local storage:", storageError);
      throw storageError;
    }
  }
};

// Fetch collaboration requests for a seller
export const fetchCollaborationRequests = async (sellerId) => {
  try {
    // Ensure sellerId is a string for consistent comparison
    const sellerIdStr = String(sellerId);
    console.log(`Fetching collaboration requests for seller ID: ${sellerIdStr}`);
    
    // First try the backend API
    try {
      const response = await fetch(`${BASE_URL}/collaboration-requests/seller/${sellerIdStr}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[API] Fetched ${data.length} collaboration requests from backend for seller ${sellerIdStr}`);
        
        // Additional check to ensure the data is properly filtered for this seller
        const properlyFilteredData = data.filter(req => String(req.sellerId) === sellerIdStr);
        
        if (data.length !== properlyFilteredData.length) {
          console.log(`[API] Warning: Backend returned ${data.length} requests, but only ${properlyFilteredData.length} are for seller ${sellerIdStr}`);
        }
        
        return properlyFilteredData;
      } else {
        console.log(`[API] Backend request failed with status: ${response.status}`);
        throw new Error(`Failed to fetch collaboration requests: ${response.status}`);
      }
    } catch (apiError) {
      console.error("[API] Error fetching collaboration requests from backend:", apiError);
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const allRequests = stored ? JSON.parse(stored) : [];
      
      console.log(`[LOCAL] Found ${allRequests.length} total collaboration requests in local storage`);
      
      // Filter requests for this seller, with detailed logging
      const sellerRequests = allRequests.filter(req => {
        // Check if the request has the sellerId field
        if (!req || !req.sellerId) {
          console.log(`[LOCAL] Skipping invalid request: ${JSON.stringify(req)}`);
          return false;
        }
        
        // Compare seller IDs as strings
        const isMatch = String(req.sellerId) === sellerIdStr;
        if (isMatch) {
          console.log(`[LOCAL] Found matching request: ${req.requestId} for seller ${sellerIdStr}`);
        }
        return isMatch;
      });
      
      console.log(`[LOCAL] Found ${sellerRequests.length} collaboration requests in local storage for seller ${sellerIdStr}`);
      return sellerRequests;
    }
  } catch (error) {
    console.error("Error in fetchCollaborationRequests:", error);
    return [];
  }
};

// Update collaboration request status
export const updateCollaborationRequestStatus = async (requestId, status) => {
  try {
    // Try to update on the backend first
    const response = await fetch(`${BASE_URL}/collaboration-requests/${requestId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update request status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating collaboration request status:", error);
    
    // Fallback to local storage
    try {
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const allRequests = stored ? JSON.parse(stored) : [];
      
      const updatedRequests = allRequests.map(req => {
        if (req.requestId === requestId) {
          return {
            ...req,
            status,
            statusUpdatedAt: new Date().toISOString()
          };
        }
        return req;
      });
      
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));
      
      return updatedRequests.find(req => req.requestId === requestId);
    } catch (storageError) {
      console.error("Error updating in local storage:", storageError);
      throw storageError;
    }
  }
};

// Create a new collaboration request
export const createCollaborationRequest = async (requestData) => {
  try {
    // Ensure consistent data types for IDs
    const enhancedRequest = {
      ...requestData,
      sellerId: String(requestData.sellerId),
      influencerId: String(requestData.influencerId),
      requestId: requestData.requestId || Date.now().toString(),
      timestamp: requestData.timestamp || new Date().toISOString(),
      status: requestData.status || "Pending"
    };
    
    console.log(`[CREATE] Creating collaboration request: ${JSON.stringify(enhancedRequest)}`);
    
    // Try to create on the backend first
    try {
      const response = await fetch(`${BASE_URL}/collaboration-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enhancedRequest),
      });
      
      if (response.ok) {
        const createdRequest = await response.json();
        console.log(`[CREATE] Successfully created request on backend: ${createdRequest.requestId}`);
        
        // Also store in local storage to ensure consistency
        try {
          const stored = await AsyncStorage.getItem("collaborationRequests");
          const allRequests = stored ? JSON.parse(stored) : [];
          
          // Check if this request already exists (by ID)
          const existingIndex = allRequests.findIndex(req => req.requestId === createdRequest.requestId);
          
          let updatedRequests;
          if (existingIndex >= 0) {
            // Update existing request
            updatedRequests = [...allRequests];
            updatedRequests[existingIndex] = createdRequest;
            console.log(`[CREATE] Updated existing request in local storage: ${createdRequest.requestId}`);
          } else {
            // Add new request
            updatedRequests = [...allRequests, createdRequest];
            console.log(`[CREATE] Added new request to local storage: ${createdRequest.requestId}`);
          }
          
          await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));
        } catch (storageError) {
          console.error("[CREATE] Error updating local storage:", storageError);
        }
        
        return createdRequest;
      } else {
        console.log(`[CREATE] Backend request failed with status: ${response.status}`);
        throw new Error(`Failed to create collaboration request: ${response.status}`);
      }
    } catch (apiError) {
      console.error("[CREATE] Error creating collaboration request on backend:", apiError);
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const allRequests = stored ? JSON.parse(stored) : [];
      
      // Check if this request already exists (by ID)
      const existingIndex = allRequests.findIndex(req => req.requestId === enhancedRequest.requestId);
      
      let updatedRequests;
      if (existingIndex >= 0) {
        // Update existing request
        updatedRequests = [...allRequests];
        updatedRequests[existingIndex] = enhancedRequest;
        console.log(`[CREATE] Updated existing request in local storage: ${enhancedRequest.requestId}`);
      } else {
        // Add new request
        updatedRequests = [...allRequests, enhancedRequest];
        console.log(`[CREATE] Added new request to local storage: ${enhancedRequest.requestId}`);
      }
      
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));
      
      return enhancedRequest;
    }
  } catch (error) {
    console.error("Error in createCollaborationRequest:", error);
    throw error;
  }
};

export const syncCollaborationRequests = async () => {
  try {
    console.log("Syncing collaboration requests with backend...");
    
    // Try to fetch from backend first
    let backendRequests = [];
    try {
      const response = await fetch(`${BASE_URL}/collaboration-requests`);
      if (response.ok) {
        backendRequests = await response.json();
        console.log(`[SYNC] Fetched ${backendRequests.length} requests from backend`);
        
        // Validate the structure of received requests
        backendRequests = backendRequests.filter(req => {
          if (!req || !req.requestId || !req.sellerId || !req.influencerId) {
            console.log(`[SYNC] Skipping invalid backend request: ${JSON.stringify(req)}`);
            return false;
          }
          return true;
        });
      } else {
        console.log(`[SYNC] Backend fetch failed with status: ${response.status}`);
      }
    } catch (error) {
      console.log(`[SYNC] Backend unavailable: ${error.message}`);
    }
    
    // Get local requests
    const stored = await AsyncStorage.getItem("collaborationRequests");
    const localRequests = stored ? JSON.parse(stored) : [];
    console.log(`[SYNC] Found ${localRequests.length} requests in local storage`);
    
    // If backend is available and has data, merge with local storage
    if (backendRequests.length > 0) {
      // Create a map of backend requests by ID for quick lookups
      const backendRequestMap = new Map();
      
      // Add each valid backend request to the map
      backendRequests.forEach(request => {
        if (request && request.requestId) {
          backendRequestMap.set(request.requestId, request);
          console.log(`[SYNC] Added backend request to map: ${request.requestId} for seller ${request.sellerId}`);
        }
      });
      
      // Find local requests that aren't on the backend
      const localOnlyRequests = localRequests.filter(
        request => request && request.requestId && !backendRequestMap.has(request.requestId)
      );
      
      console.log(`[SYNC] Found ${localOnlyRequests.length} requests in local storage that need to be pushed to backend`);
      
      // Try to push local-only requests to backend
      for (const request of localOnlyRequests) {
        try {
          const response = await fetch(`${BASE_URL}/collaboration-requests`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
          });
          
          if (response.ok) {
            console.log(`[SYNC] Successfully pushed request ${request.requestId} to backend`);
            // Add this request to our backend map
            const createdRequest = await response.json();
            backendRequestMap.set(createdRequest.requestId, createdRequest);
          } else {
            console.log(`[SYNC] Failed to push request ${request.requestId} to backend: ${response.status}`);
          }
        } catch (error) {
          console.log(`[SYNC] Error pushing request ${request.requestId} to backend:`, error);
        }
      }
      
      // Merge backend requests with any remaining local-only requests
      const mergedRequests = Array.from(backendRequestMap.values());
      
      // Log detailed information about merged requests
      console.log(`[SYNC] Merged ${mergedRequests.length} requests. Details:`);
      mergedRequests.forEach(req => {
        console.log(`[SYNC] - Request ID: ${req.requestId}, Seller: ${req.sellerId}, Influencer: ${req.influencerId}, Status: ${req.status}`);
      });
      
      // Update local storage with merged requests
      await AsyncStorage.setItem(
        "collaborationRequests",
        JSON.stringify(mergedRequests)
      );
      console.log(`[SYNC] Updated local storage with ${mergedRequests.length} merged requests`);
      
      return mergedRequests;
    }
    
    return localRequests;
  } catch (error) {
    console.error("[SYNC] Error syncing collaboration requests:", error);
    return [];
  }
};

// Function to clear local storage collaboration requests
export const clearLocalCollaborationRequests = async () => {
  try {
    await AsyncStorage.removeItem("collaborationRequests");
    console.log("Local collaboration requests cleared");
    return true;
  } catch (error) {
    console.error("Error clearing local collaboration requests:", error);
    return false;
  }
};

// Initialize some sample collaboration requests for development/testing
export const initializeSampleCollaborationRequests = async () => {
  try {
    // Clear existing requests first
    await clearLocalCollaborationRequests();
    
    // Sample data
    const sampleRequests = [
      {
        requestId: "1001",
        influencerId: "3",
        influencerName: "Mike Influencer",
        sellerId: "2",
        sellerName: "Sarah Smith",
        product: "Smartphone",
        status: "Pending",
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        requestId: "1002",
        influencerId: "7",
        influencerName: "Pranav Geek",
        sellerId: "2",
        sellerName: "Sarah Smith",
        product: "Keyboard",
        status: "Accepted",
        timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      },
      {
        requestId: "1003",
        influencerId: "8",
        influencerName: "Derrick Afful",
        sellerId: "2",
        sellerName: "Sarah Smith",
        product: "Wireless Headphones",
        status: "Declined",
        timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      }
    ];
    
    // Save to local storage
    await AsyncStorage.setItem(
      "collaborationRequests",
      JSON.stringify(sampleRequests)
    );
    
    // Try to send to backend
    try {
      for (const request of sampleRequests) {
        await fetch(`${BASE_URL}/collaboration-requests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });
      }
      console.log("Sample requests pushed to backend");
    } catch (error) {
      console.log("Failed to push sample requests to backend", error);
    }
    
    console.log("Sample collaboration requests initialized");
    return sampleRequests;
  } catch (error) {
    console.error("Error initializing sample requests:", error);
    return [];
  }
};

// Helper functions for local storage
export const getLocalCampaignRequests = async () => {
  try {
    const stored = await AsyncStorage.getItem("campaignRequests");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error fetching local campaign requests", error);
    return [];
  }
};

export const saveLocalCampaignRequests = async (requests) => {
  try {
    await AsyncStorage.setItem("campaignRequests", JSON.stringify(requests));
    return true;
  } catch (error) {
    console.error("Error saving local campaign requests", error);
    return false;
  }
};