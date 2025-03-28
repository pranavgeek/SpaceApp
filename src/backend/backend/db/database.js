const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const USE_CLOUD_DB = false; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const loadData = () => {
  const data = fs.readFileSync(path.join(__dirname, "data.json"), "utf8");
  return JSON.parse(data);
};

const saveData = (data) => {
  fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data, null, 2));
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
        INSERT INTO users (name, about_us, address, city, country, social_media_x, social_media_linkedin, social_media_website, profile_image, email, password, account_type)
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
        user.password,
        user.account_type,
        user.products_purchased,
        user.following_count,
        user.campaigns,
        user.followers_count,
        user.earnings
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

  // Create New Product
  createProduct: async (product) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO products (product_name, category, product_image, cost, currency, summary, description, user_seller)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
      const params = [
        product.product_name,
        product.category,
        product.product_image,
        product.cost,
        product.currency,
        product.summary,
        product.description,
        product.user_seller,
        product.campaigns

      ];
      const result = await runQuery(query, params);
      return result[0];
    }
    const data = loadData();
    product.product_id = data.products.length + 1;
    data.products.push(product);
    saveData(data);
    return product;
  },



  //  Get All Reviews
  getReviews: async () => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM reviews");
    }
    return loadData().reviews;
  },

  // Create New Review
  createReview: async (review) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO reviews (product_id, user_id, number_stars, review)
        VALUES ($1, $2, $3, $4) RETURNING *`;
      const params = [review.product_id, review.user_id, review.number_stars, review.review];
      const result = await runQuery(query, params);
      return result[0];
    }
    const data = loadData();
    review.review_id = data.reviews.length + 1;
    data.reviews.push(review);
    saveData(data);
    return review;
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



  // Get Notifications by User ID
  getNotifications: async (user_id) => {
    if (USE_CLOUD_DB) {
      return await runQuery("SELECT * FROM notifications WHERE user_id = $1", [user_id]);
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
      const params = [notification.user_id, notification.message, notification.date_timestamp];
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

  // Create New Admin Action
  createAdminAction: async (adminAction) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO admin_data (action, user_id, status, date_timestamp)
        VALUES ($1, $2, $3, $4) RETURNING *`;
      const params = [adminAction.action, adminAction.user_id, adminAction.status, adminAction.date_timestamp];
      const result = await runQuery(query, params);
      return result[0];
    }
    const data = loadData();
    adminAction.admin_id = data.admin_data.length + 1;
    data.admin_data.push(adminAction);
    saveData(data);
    return adminAction;
  },
};

module.exports = db;
