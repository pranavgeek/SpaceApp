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

// REVIEWS
export const fetchReviews = async () => {
  const response = await fetch(`${BASE_URL}/reviews`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
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