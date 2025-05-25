const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();
const data = require("./data.json");

const USE_CLOUD_DB = true;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

const loadData = () => {
  const data = fs.readFileSync(path.join(__dirname, "data.json"), "utf8");
  return JSON.parse(data);
};

const saveData = (data) => {
  fs.writeFileSync(
    path.join(__dirname, "data.json"),
    JSON.stringify(data, null, 2)
  );
};

const runQuery = async (query, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

const db = {
  getProducts: async () => {
    return data.products;
  },

  getProductById: async (id) => {
    return data.products.find(
      (product) => product.product_id === parseInt(id, 10)
    );
  },

  //Get All Users
  getUsers: async () => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM users");
    }
    return loadData().users;
  },

  // Create New User
  createUser: async (user) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO users (name, about_us, address, city, country, social_media_x, social_media_linkedin, social_media_website, profile_image, email, gender, age, password, account_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
      const params = [
        user.name,
        user.about_us,
        user.address,
        user.city,
        user.country,
        user.social_media_x,
        user.social_media_linkedin,
        user.social_media_website,
        user.profile_image,
        user.email,
        user.gender,
        user.age,
        user.password,
        user.account_type,
        user.products_purchased,
        user.following_count,
        user.campaigns,
        user.followers_count,
        user.earnings,
      ];
      const result = await runQuery(query, params);
      return result[0];
    }
    const data = loadData();
    user.user_id = data.users.length + 1;
    data.users.push(user);
    saveData(data);
    return user;
  },

  updateUser: async (id, newData) => {
    const data = loadData();
    const userIndex = data.users.findIndex((u) => u.user_id === id);

    if (userIndex === -1) return null;

    const updatedUser = {
      ...data.users[userIndex],
      ...newData,
      user_id: id,
    };

    data.users[userIndex] = updatedUser;
    saveData(data);

    return updatedUser;
  },

  deleteUser: async (id) => {
    try {
      // Fetch the current data
      const data = loadData();
      
      // Find the user index
      const userIndex = data.users.findIndex(u => u.user_id === id);
      
      if (userIndex === -1) {
        return false; // User not found
      }
      
      // Remove the user
      data.users.splice(userIndex, 1);
      
      // Save the updated data
      saveData(data);
      
      return true; // Deletion successful
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }, 

  // Get User Dashboard (Products for Seller / Campaigns for Influencer)
  getUserDashboard: async (user_id) => {
    const data = loadData();
    const user = data.users.find((u) => u.user_id === parseInt(user_id));

    if (!user) {
      throw new Error("User not found");
    }

    if (user.account_type === "Seller") {
      return data.products.filter((p) => p.user_seller === user.user_id);
    }

    if (user.account_type === "Influencer") {
      const reviewedProductIds = data.reviews
        .filter((r) => r.user_id === user.user_id)
        .map((r) => r.product_id);

      return data.products
        .filter((p) => reviewedProductIds.includes(p.product_id))
        .map((product) => ({
          product,
          seller: data.users.find((u) => u.user_id === product.user_seller),
        }));
    }

    return [];
  },

  // Get All Products
  getProducts: async () => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM products");
    }
    return loadData().products;
  },

  createProduct: async (product) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO products (product_name, category, product_image, cost, currency, summary, description, user_seller, verified, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
      const params = [
        product.product_name,
        product.category,
        product.product_image,
        product.cost,
        product.currency,
        product.summary,
        product.description,
        product.user_seller,
        product.verified || false,
        product.created_at || new Date().toISOString(),
      ];
      const result = await runQuery(query, params);
      return result[0];
    }

    const data = loadData();

    // Find the highest existing product ID
    const maxId = data.products.reduce(
      (max, p) => (p.product_id > max ? p.product_id : max),
      0
    );

    // Set new product ID to be one higher than the current maximum
    product.product_id = maxId + 1;
    product.verified = false;
    product.created_at = new Date().toISOString();
    data.products.push(product);
    saveData(data);
    return product;
  },

  updateProduct: async (productId, updatedFields) => {
    if (USE_CLOUD_DB) {
      const setClause = Object.keys(updatedFields)
        .map((key, idx) => `${key} = $${idx + 1}`)
        .join(", ");
      const values = Object.values(updatedFields);
      values.push(productId); // Add productId for WHERE clause

      const query = `UPDATE products SET ${setClause} WHERE product_id = $${values.length} RETURNING *`;
      const result = await runQuery(query, values);
      return result[0];
    }

    // Local JSON fallback
    const data = loadData();
    const productIndex = data.products.findIndex(
      (p) => p.product_id === productId
    );

    if (productIndex === -1) return null;

    data.products[productIndex] = {
      ...data.products[productIndex],
      ...updatedFields,
    };

    saveData(data);
    return data.products[productIndex];
  },

  // Get products by seller ID
  getProductsBySellerId: async (sellerId) => {
    try {
      const products = data.products.filter(
        (product) => product.user_seller === sellerId
      );
      return products;
    } catch (error) {
      console.error("Error getting products by seller ID:", error);
      return [];
    }
  },

  // Get verified products count by seller ID
  getVerifiedProductsCountBySellerId: async (sellerId) => {
    try {
      const verifiedProducts = data.products.filter(
        (product) =>
          product.user_seller === sellerId && product.verified === true
      );
      return verifiedProducts.length;
    } catch (error) {
      console.error("Error getting verified products count:", error);
      return 0;
    }
  },

  // Get reviews by product ID
  getReviewsByProductId: async (productId) => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM reviews WHERE product_id = $1", [
        productId,
      ]);
    }

    const data = loadData();
    const numericProductId = parseInt(productId, 10);

    console.log(
      `Looking for reviews with exact product_id match: ${numericProductId}`
    );

    // Filter reviews that exactly match the product ID
    const matchingReviews = data.reviews.filter((review) => {
      const reviewProductId = parseInt(review.product_id, 10);
      // Check for exact match only (strict equality)
      return reviewProductId === numericProductId;
    });

    console.log(
      `Found ${matchingReviews.length} reviews for product ID ${numericProductId}`
    );
    return matchingReviews;
  },

  // Get a single review by ID
  getReviewById: async (reviewId) => {
    if (USE_CLOUD_DB) {
      const result = await runQuery(
        "SELECT * FROM reviews WHERE review_id = $1",
        [reviewId]
      );
      return result.length > 0 ? result[0] : null;
    }

    const data = loadData();
    return data.reviews.find(
      (review) => review.review_id === parseInt(reviewId, 10)
    );
  },

  // Update the existing createReview function to include date_timestamp
  createReview: async (review) => {
    if (USE_CLOUD_DB) {
      const query = `
      INSERT INTO reviews (product_id, user_id, number_stars, review, date_timestamp)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
      const params = [
        review.product_id,
        review.user_id,
        review.number_stars,
        review.review,
        review.date_timestamp || new Date().toISOString(),
      ];
      const result = await runQuery(query, params);
      return result[0];
    }

    const data = loadData();
    review.review_id = data.reviews.length + 1;

    // Make sure date_timestamp is set
    if (!review.date_timestamp) {
      review.date_timestamp = new Date().toISOString();
    }

    data.reviews.push(review);
    saveData(data);

    // Also update the product's reviews array if it exists
    const productIndex = data.products.findIndex(
      (p) => p.product_id === parseInt(review.product_id, 10)
    );
    if (productIndex !== -1) {
      // Initialize reviews array if it doesn't exist
      if (!data.products[productIndex].reviews) {
        data.products[productIndex].reviews = [];
      }

      // Add the review to the product
      data.products[productIndex].reviews.push(review);
      saveData(data);
    }

    return review;
  },

  // Update review
  updateReview: async (reviewId, updates) => {
    if (USE_CLOUD_DB) {
      const fields = Object.keys(updates)
        .map((key, i) => `${key} = $${i + 1}`)
        .join(", ");
      const values = Object.values(updates);

      const query = `UPDATE reviews SET ${fields} WHERE review_id = $${values.length + 1} RETURNING *`;
      const params = [...values, reviewId];

      const result = await runQuery(query, params);
      return result.length > 0 ? result[0] : null;
    }

    const data = loadData();
    const reviewIndex = data.reviews.findIndex(
      (r) => r.review_id === parseInt(reviewId, 10)
    );

    if (reviewIndex === -1) return null;

    // Update the review
    data.reviews[reviewIndex] = { ...data.reviews[reviewIndex], ...updates };

    // Also update the review in the product if it exists
    const productId = data.reviews[reviewIndex].product_id;
    const productIndex = data.products.findIndex(
      (p) => p.product_id === productId
    );

    if (productIndex !== -1 && data.products[productIndex].reviews) {
      const productReviewIndex = data.products[productIndex].reviews.findIndex(
        (r) => r.review_id === parseInt(reviewId, 10)
      );

      if (productReviewIndex !== -1) {
        data.products[productIndex].reviews[productReviewIndex] = {
          ...data.products[productIndex].reviews[productReviewIndex],
          ...updates,
        };
      }
    }

    saveData(data);
    return data.reviews[reviewIndex];
  },

  // Delete review
  deleteReview: async (reviewId) => {
    if (USE_CLOUD_DB) {
      const result = await runQuery(
        "DELETE FROM reviews WHERE review_id = $1 RETURNING *",
        [reviewId]
      );
      return result.length > 0;
    }

    const data = loadData();
    const reviewIndex = data.reviews.findIndex(
      (r) => r.review_id === parseInt(reviewId, 10)
    );

    if (reviewIndex === -1) return false;

    // Get product ID before removing the review
    const productId = data.reviews[reviewIndex].product_id;

    // Remove the review from the global reviews array
    data.reviews.splice(reviewIndex, 1);

    // Also remove the review from the product if it exists
    const productIndex = data.products.findIndex(
      (p) => p.product_id === productId
    );

    if (productIndex !== -1 && data.products[productIndex].reviews) {
      const productReviewIndex = data.products[productIndex].reviews.findIndex(
        (r) => r.review_id === parseInt(reviewId, 10)
      );

      if (productReviewIndex !== -1) {
        data.products[productIndex].reviews.splice(productReviewIndex, 1);
      }
    }

    saveData(data);
    return true;
  },
  // Get All Messages
  getMessages: async () => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM messages");
    }
    return loadData().messages;
  },

  // Create New Message
  createMessage: async (message) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO messages (user_from, user_to, type_message, message_content, add_file, date_timestamp_sent)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const params = [
        message.user_from,
        message.user_to,
        message.type_message,
        message.message_content,
        message.add_file,
        message.date_timestamp_sent,
      ];
      const result = await runQuery(query, params);
      return result[0];
    }
    const data = loadData();
   
    message.message_id = data.messages.length + 1;
    data.messages.push(message);
    saveData(data);
    return message;
  },

  // Get messages between two users
  getMessagesBetweenUsers: async (user1Id, user2Id) => {
    if (USE_CLOUD_DB) {
      return await runQuery(
        "SELECT * FROM messages WHERE (user_from = $1 AND user_to = $2) OR (user_from = $2 AND user_to = $1) ORDER BY date_timestamp_sent ASC",
        [user1Id, user2Id]
      );
    }

    const data = loadData();
    return data.messages
      .filter(
        (message) =>
          (String(message.user_from) === String(user1Id) &&
            String(message.user_to) === String(user2Id)) ||
          (String(message.user_from) === String(user2Id) &&
            String(message.user_to) === String(user1Id))
      )
      .sort(
        (a, b) =>
          new Date(a.date_timestamp_sent) - new Date(b.date_timestamp_sent)
      );
  },

  // Get all conversations for a user (list of unique users they've messaged with)
  getUserConversations: async (userId) => {
    if (USE_CLOUD_DB) {
      return await runQuery(
        `SELECT DISTINCT 
        CASE 
          WHEN user_from = $1 THEN user_to 
          ELSE user_from 
        END as other_user_id
      FROM messages
      WHERE user_from = $1 OR user_to = $1`,
        [userId]
      );
    }

    const data = loadData();
    const conversations = new Set();

    data.messages.forEach((message) => {
      if (String(message.user_from) === String(userId)) {
        conversations.add(String(message.user_to));
      } else if (String(message.user_to) === String(userId)) {
        conversations.add(String(message.user_from));
      }
    });

    return Array.from(conversations);
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    if (USE_CLOUD_DB) {
      const result = await runQuery(
        "UPDATE messages SET is_read = true WHERE message_id = $1 RETURNING *",
        [messageId]
      );
      return result[0];
    }

    const data = loadData();
    const messageIndex = data.messages.findIndex(
      (msg) => msg.message_id === parseInt(messageId)
    );

    if (messageIndex === -1) return null;

    data.messages[messageIndex].is_read = true;
    saveData(data);

    return data.messages[messageIndex];
  },

  // Get unread messages count for a user
  getUnreadMessagesCount: async (userId) => {
    if (USE_CLOUD_DB) {
      const result = await runQuery(
        "SELECT COUNT(*) as count FROM messages WHERE user_to = $1 AND is_read = false",
        [userId]
      );
      return parseInt(result[0].count);
    }

    const data = loadData();
    return data.messages.filter(
      (msg) => String(msg.user_to) === String(userId) && msg.is_read === false
    ).length;
  },

  deleteMessage: async (messageId) => {
    if (USE_CLOUD_DB) {
      const query = `DELETE FROM messages WHERE message_id = $1 RETURNING *`;
      const result = await runQuery(query, [messageId]);
      return result.length > 0;
    }
  
    // JSON fallback
    const data = loadData();
    const index = data.messages.findIndex(
      (msg) => String(msg.message_id) === String(messageId)
    );
  
    if (index !== -1) {
      data.messages.splice(index, 1);
      saveData(data);
      return true;
    }
  
    return false;
  },
  
  // Get Notifications by User ID
  getNotifications: async (user_id) => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM notifications WHERE user_id = $1", [
        user_id,
      ]);
    }
    const data = loadData();
    return data.notifications.filter((n) => n.user_id === parseInt(user_id));
  },

  // Create New Notification
  createNotification: async (notification) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO notifications (user_id, message, date_timestamp)
        VALUES ($1, $2, $3) RETURNING *`;
      const params = [
        notification.user_id,
        notification.message,
        notification.date_timestamp,
      ];
      const result = await runQuery(query, params);
      return result[0];
    }
    const data = loadData();
    notification.notification_id = data.notifications.length + 1;
    data.notifications.push(notification);
    saveData(data);
    return notification;
  },

  // Get All Admin Actions
  getAdminData: async () => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM admin_data");
    }
    return loadData().admin_data;
  },

  updateAdminStatus: async (adminId, status) => {
    try {
      const data = loadData();
      const adminIndex = data.admin_data.findIndex(a => a.admin_id === adminId);
      
      if (adminIndex === -1) return null;
      
      data.admin_data[adminIndex].status = status;
      data.admin_data[adminIndex].updated_at = new Date().toISOString();
      
      saveData(data);
      return data.admin_data[adminIndex];
    } catch (error) {
      console.error("Error updating admin status:", error);
      throw error;
    }
  },

  getUsersByRole: async (role) => {
    try {
      const data = loadData();
      return data.users.filter(u => u.role === role || u.account_type?.toLowerCase() === role.toLowerCase());
    } catch (error) {
      console.error(`Error getting ${role} users:`, error);
      throw error;
    }
  },  

  updateUserRole: async (userId, role, tier = null) => {
    try {
      const data = loadData();
      const userIndex = data.users.findIndex(u => u.user_id === userId);
      
      if (userIndex === -1) return null;
      
      const currentUser = data.users[userIndex];
      
      // Only allow buyers to become influencers
      if (role.toLowerCase() === "influencer" && 
          currentUser.role?.toLowerCase() !== "buyer" && 
          currentUser.account_type?.toLowerCase() !== "buyer") {
        throw new Error(`Only buyer accounts can become influencers. This user is a ${currentUser.role || currentUser.account_type}.`);
      }
      
      // Update the role in both fields for compatibility
      data.users[userIndex].role = role.toLowerCase();
      data.users[userIndex].account_type = role.charAt(0).toUpperCase() + role.slice(1);
      
      // Add tier if provided (for influencers)
      if (tier) {
        data.users[userIndex].tier = tier;
      }
      
      saveData(data);
      return data.users[userIndex];
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  getAdminById: async (adminId) => {
    try {
      const data = loadData();
      return data.admin_data.find(a => a.admin_id === adminId);
    } catch (error) {
      console.error("Error getting admin action:", error);
      throw error;
    }
  },
  
  getUserById: async (userId) => {
    try {
      const data = loadData();
      return data.users.find(u => u.user_id === userId);
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  // Create New Admin Action
  createAdminAction: async (adminAction) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO admin_data (action, user_id, status, date_timestamp)
        VALUES ($1, $2, $3, $4) RETURNING *`;
      const params = [
        adminAction.action,
        adminAction.user_id,
        adminAction.status,
        adminAction.date_timestamp,
      ];
      const result = await runQuery(query, params);
      return result[0];
    }
    const data = loadData();
    adminAction.admin_id = data.admin_data.length + 1;
    data.admin_data.push(adminAction);
    saveData(data);
    return adminAction;
  },

  // Get Orders by Buyer ID
  getOrdersByBuyer: async (buyerId) => {
    const data = loadData();
    const buyer = data.users.find((user) => user.user_id === parseInt(buyerId));
    return buyer?.orders || [];
  },

  //--------------------------------------------------------------

  // Create Order
  createOrder: async (order) => {
    const data = loadData();
    console.log(
      "👀 All User IDs:",
      data.users.map((u) => ({ id: u.user_id, type: typeof u.user_id }))
    );

    console.log(
      "Order includes buyer ID",
      order.buyer_id,
      "and seller ID",
      order.seller_id
    );

    const buyer = data.users.find(
      (u) => String(u.user_id) === String(order.buyer_id)
    );
    const seller = data.users.find(
      (u) => String(u.user_id) === String(order.seller_id)
    );

    if (!buyer || !seller) {
      return res.status(400).json({
        error: "Failed to create order",
        details: "❌ Buyer or Seller not found.",
      });
    }

    // Generate unique order_id
    const timestamp = Date.now();
    const orderId = `ORD-${timestamp}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const orderObject = {
      order_id: orderId,
      product_id: order.product_id || null,
      product_name: order.product_name || "Unnamed Product",
      quantity: order.quantity || 1,
      order_date: now,
      status: order.status || "completed",
      tracking_number: order.tracking_number || "",
      amount: order.amount || 0,
      buyer_id: order.buyer_id, // Use directly from order, as it's already parsed and used for finding buyer
      seller_id: order.seller_id, // Use directly from order, as it's already parsed and used for finding seller

      // ✅ Add contact + shipping info
      buyer_first_name: order.buyer_first_name || "",
      buyer_last_name: order.buyer_last_name || "",
      buyer_email: order.buyer_email || "",
      buyer_phone: order.buyer_phone || "",
      shipping_address: order.shipping_address || "",
      shipping_city: order.shipping_city || "",
      shipping_province: order.shipping_province || "",
      shipping_country: order.shipping_country || "",
      shipping_postal_code: order.shipping_postal_code || "",
    };

    // Add to buyer's order history
    buyer.orders = buyer.orders || [];
    buyer.orders.push(orderObject);

    // Add to seller's received_orders
    seller.received_orders = seller.received_orders || [];
    seller.received_orders.push(orderObject);

    // Add to global order list
    data.orders = data.orders || [];
    data.orders.push(orderObject);

    saveData(data);
    console.log("✅ Order successfully created:", orderObject.order_id);

    return orderObject;
  },

  // Cancel an order
  cancelOrder: async (orderId) => {
    try {
      const data = loadData();

      // 1. Remove from global orders array
      const orderIndex = data.orders.findIndex(
        (order) => order.order_id === orderId
      );

      if (orderIndex === -1) {
        console.log(`Order with ID ${orderId} not found`);
        return false;
      }

      // Store the order details before removing it
      const cancelledOrder = data.orders[orderIndex];

      // Remove from global orders array
      data.orders.splice(orderIndex, 1);

      // 2. Remove from buyer's orders array
      const buyer = data.users.find(
        (user) => String(user.user_id) === String(cancelledOrder.buyer_id)
      );
      if (buyer && buyer.orders) {
        const buyerOrderIndex = buyer.orders.findIndex(
          (order) => order.order_id === orderId
        );
        if (buyerOrderIndex !== -1) {
          buyer.orders.splice(buyerOrderIndex, 1);
        }
      }

      // 3. Remove from seller's received_orders array
      const seller = data.users.find(
        (user) => String(user.user_id) === String(cancelledOrder.seller_id)
      );
      if (seller && seller.received_orders) {
        const sellerOrderIndex = seller.received_orders.findIndex(
          (order) => order.order_id === orderId
        );
        if (sellerOrderIndex !== -1) {
          seller.received_orders.splice(sellerOrderIndex, 1);
        }
      }

      // Save the updated data
      saveData(data);
      console.log(`✅ Order ${orderId} successfully cancelled`);

      return true;
    } catch (error) {
      console.error(`Error cancelling order: ${error.message}`);
      return false;
    }
  },

  // Get all campaign requests
getCampaignRequests: async () => {
  try {
    const data = loadData();
    return data.campaign_requests || [];
  } catch (error) {
    console.error("Error getting campaign requests:", error);
    return [];
  }
},

// Get campaign requests for a specific influencer
getInfluencerCampaignRequests: async (influencerId) => {
  try {
    const data = loadData();
    return (data.campaign_requests || []).filter(
      req => String(req.influencerId) === String(influencerId)
    );
  } catch (error) {
    console.error("Error getting influencer campaign requests:", error);
    return [];
  }
},

// Get campaign requests for a specific seller
getSellerCampaignRequests: async (sellerId) => {
  try {
    const data = loadData();
    return (data.campaign_requests || []).filter(
      req => String(req.sellerId) === String(sellerId)
    );
  } catch (error) {
    console.error("Error getting seller campaign requests:", error);
    return [];
  }
},

// Create a new campaign request
createCampaignRequest: async (campaignRequest) => {
  try {
    const data = loadData();
    
    // Initialize campaign_requests array if it doesn't exist
    if (!data.campaign_requests) {
      data.campaign_requests = [];
    }
    
    // Generate a unique request ID
    campaignRequest.requestId = campaignRequest.requestId || Date.now().toString();
    
    // Set initial status to "Pending" if not provided
    campaignRequest.status = campaignRequest.status || "Pending";
    
    // Add timestamp if not provided
    campaignRequest.timestamp = campaignRequest.timestamp || new Date().toISOString();
    
    // Add the new request
    data.campaign_requests.push(campaignRequest);
    
    // Save the updated data
    saveData(data);
    
    // Return the created request
    return campaignRequest;
  } catch (error) {
    console.error("Error creating campaign request:", error);
    throw error;
  }
},

// Get a campaign request by ID
getCampaignRequestById: async (requestId) => {
  try {
    const data = loadData();
    return (data.campaign_requests || []).find(
      req => req.requestId === requestId
    );
  } catch (error) {
    console.error("Error getting campaign request by ID:", error);
    return null;
  }
},

// Update a campaign request
updateCampaignRequest: async (requestId, updates) => {
  try {
    const data = loadData();
    
    // Check if the campaign_requests array exists
    if (!data.campaign_requests) {
      throw new Error("No campaign requests found");
    }
    
    // Find the index of the request to update
    const requestIndex = data.campaign_requests.findIndex(
      req => req.requestId === requestId
    );
    
    if (requestIndex === -1) {
      throw new Error("Campaign request not found");
    }
    
    // Update the request
    data.campaign_requests[requestIndex] = {
      ...data.campaign_requests[requestIndex],
      ...updates,
      // If updating status, add status update timestamp
      ...(updates.status ? { statusUpdatedAt: new Date().toISOString() } : {})
    };
    
    // Save the updated data
    saveData(data);
    
    // Return the updated request
    return data.campaign_requests[requestIndex];
  } catch (error) {
    console.error("Error updating campaign request:", error);
    throw error;
  }
},

// Update campaign request status
updateCampaignRequestStatus: async (requestId, status) => {
  try {
    return await db.updateCampaignRequest(requestId, { status });
  } catch (error) {
    console.error("Error updating campaign request status:", error);
    throw error;
  }
},

// Delete a campaign request
 deleteCampaignRequest:  async (requestId) => {
  try {
    const data = loadData();
    
    // Check if the campaign_requests array exists
    if (!data.campaign_requests) {
      return false;
    }
    
    // Find the index of the request to delete
    const requestIndex = data.campaign_requests.findIndex(
      req => req.requestId === requestId
    );
    
    if (requestIndex === -1) {
      return false;
    }
    
    // Remove the request
    data.campaign_requests.splice(requestIndex, 1);
    
    // Save the updated data
    saveData(data);
    
    return true;
  } catch (error) {
    console.error("Error deleting campaign request:", error);
    return false;
  }
}
};

module.exports = db;
