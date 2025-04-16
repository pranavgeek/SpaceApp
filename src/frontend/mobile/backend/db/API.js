import AsyncStorage from "@react-native-async-storage/async-storage";
import userData from "./data.json";
import { Platform } from "react-native";

// Dynamically choose the BASE_URL based on platform
const BASE_URL = Platform.OS === "web" 
  ? "http://localhost:5001/api"
  : "http://10.0.0.25:5001/api";

console.log(`Using API base URL: ${BASE_URL}`);

//LOGIN
export const apiLogin = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {  // Simulate network delay
      const user = userData.users.find(u => u.email === email && u.password === password);
      if (user) {
        resolve(user);  // Return the found user
      } else {
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
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
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
export const fetchReviews = async (productId) => {
  try {
    // If product ID is provided, fetch reviews for that specific product
    const url = productId 
      ? `${BASE_URL}/reviews?product_id=${productId}` 
      : `${BASE_URL}/reviews`;
      
    console.log(`Fetching reviews from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch reviews: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    // Double-check filtering on client side if productId was specified
    if (productId && Array.isArray(data)) {
      // Make sure we only return reviews that match this exact product ID
      const filteredData = data.filter(review => 
        Number(review.product_id) === Number(productId)
      );
      
      console.log(`Filtered ${data.length} reviews to ${filteredData.length} for product ${productId}`);
      return filteredData;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const createReview = async (reviewData) => {
  try {
    console.log('Creating review with data:', reviewData);
    
    const response = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create review: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error creating review:', error);
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

export const updateAdminStatus = async (adminId, status) => {
  const response = await fetch(`${BASE_URL}/admin/${adminId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update admin status");
  return response.json();
};