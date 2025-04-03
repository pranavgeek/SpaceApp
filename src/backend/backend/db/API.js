const BASE_URL = "http://192.168.1.x:5000/api";
import userData from "./data.json"

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
  const response = await fetch(`${BASE_URL}/messages`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
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
