const express = require("express");
const dotenv = require("dotenv");
const db = require("./db/database");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Root Route
app.get("/", async(req, res) => {
  res.send("Node.js API for User, Ecommerce, Reviews, Messaging, Admin & Notifications.");
  // const users = await db.getUsers();
  // res.json(users);
});


// Get All Users
app.get("/api/users", async (req, res) => {
  const users = await db.getUsers();
  res.json(users);
});

// Get Single User by ID
app.get("/api/users/:id", async (req, res) => {
  const user = await db.getUserById(parseInt(req.params.id));
  user ? res.json(user) : res.status(404).json({ error: "User not found" });
});

// Create New User
app.post("/api/users", async (req, res) => {
  const user = req.body;
  const newUser = await db.createUser(user);
  res.status(201).json(newUser);
});

// Update User
app.put("/api/users/:id", async (req, res) => {
  const updatedUser = await db.updateUser(parseInt(req.params.id), req.body);
  updatedUser ? res.json(updatedUser) : res.status(404).json({ error: "User not found" });
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  const deleted = await db.deleteUser(parseInt(req.params.id));
  deleted ? res.json({ message: "User deleted successfully" }) : res.status(404).json({ error: "User not found" });
});

// Get User Dashboard (Seller / Influencer)
app.get("/api/users/:id/dashboard", async (req, res) => {
  try {
    const dashboard = await db.getUserDashboard(parseInt(req.params.id));
    res.json(dashboard);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});


// Get All Products
app.get("/api/products", async (req, res) => {
  const products = await db.getProducts();
  res.json(products);
});

// Get Single Product by ID
app.get("/api/products/:id", async (req, res) => {
  const product = await db.getProductById(parseInt(req.params.id));
  product ? res.json(product) : res.status(404).json({ error: "Product not found" });
});

// Create New Product
app.post("/api/products", async (req, res) => {
  const product = req.body;
  const newProduct = await db.createProduct(product);
  res.status(201).json(newProduct);
});

// Update Product
app.put("/api/products/:id", async (req, res) => {
  const updatedProduct = await db.updateProduct(parseInt(req.params.id), req.body);
  updatedProduct ? res.json(updatedProduct) : res.status(404).json({ error: "Product not found" });
});

// Delete Product
app.delete("/api/products/:id", async (req, res) => {
  const deleted = await db.deleteProduct(parseInt(req.params.id));
  deleted ? res.json({ message: "Product deleted successfully" }) : res.status(404).json({ error: "Product not found" });
});


// Get All Reviews
app.get("/api/reviews", async (req, res) => {
  const reviews = await db.getReviews();
  res.json(reviews);
});

// Get Single Review by ID
app.get("/api/reviews/:id", async (req, res) => {
  const review = await db.getReviewById(parseInt(req.params.id));
  review ? res.json(review) : res.status(404).json({ error: "Review not found" });
});

// Create New Review
app.post("/api/reviews", async (req, res) => {
  const review = req.body;
  const newReview = await db.createReview(review);
  res.status(201).json(newReview);
});

// Update Review
app.put("/api/reviews/:id", async (req, res) => {
  const updatedReview = await db.updateReview(parseInt(req.params.id), req.body);
  updatedReview ? res.json(updatedReview) : res.status(404).json({ error: "Review not found" });
});

// Delete Review
app.delete("/api/reviews/:id", async (req, res) => {
  const deleted = await db.deleteReview(parseInt(req.params.id));
  deleted ? res.json({ message: "Review deleted successfully" }) : res.status(404).json({ error: "Review not found" });
});



// Get All Messages
app.get("/api/messages", async (req, res) => {
  const messages = await db.getMessages();
  res.json(messages);
});

// Get Single Message by ID
app.get("/api/messages/:id", async (req, res) => {
  const message = await db.getMessageById(parseInt(req.params.id));
  message ? res.json(message) : res.status(404).json({ error: "Message not found" });
});

// Create New Message
app.post("/api/messages", async (req, res) => {
  const message = req.body;
  const newMessage = await db.createMessage(message);
  res.status(201).json(newMessage);
});

// Delete Message
app.delete("/api/messages/:id", async (req, res) => {
  const deleted = await db.deleteMessage(parseInt(req.params.id));
  deleted ? res.json({ message: "Message deleted successfully" }) : res.status(404).json({ error: "Message not found" });
});

// Get Notifications for a User
const getNotifications = async (user_id) => {
    if (USE_CLOUD_DB) {
      return await runQuery('SELECT * FROM notifications WHERE user_id = $1', [user_id]);
    }
    try {
      const data = loadData();
      return data.notifications.filter((n) => n.user_id === parseInt(user_id));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; // Return an empty array on error
    }
  };
  
  // Create New Notification
  const createNotification = async (notification) => {
    if (USE_CLOUD_DB) {
      const query = `
        INSERT INTO notifications (user_id, message, date_timestamp)
        VALUES ($1, $2, $3) RETURNING *`;
      const params = [notification.user_id, notification.message, notification.date_timestamp];
      const result = await runQuery(query, params);
      return result[0];
    }
    try {
      const data = loadData();
      notification.notification_id = data.notifications.length + 1;
      data.notifications.push(notification);
      saveData(data);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  };
  
  // Delete Notification
  const deleteNotification = async (id) => {
    if (USE_CLOUD_DB) {
      const result = await runQuery('DELETE FROM notifications WHERE notification_id = $1 RETURNING *', [id]);
      return result.length > 0;
    }
    try {
      const data = loadData();
      const index = data.notifications.findIndex((n) => n.notification_id === id);
      if (index === -1) return false;
      data.notifications.splice(index, 1);
      saveData(data);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };
  
  // Get All Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching all notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  // Get Notifications for a User
  app.get("/api/notifications/:user_id", async (req, res) => {
    try {
      const notifications = await getNotifications(parseInt(req.params.user_id));
      if (notifications.length === 0) {
        return res.status(404).json({ message: "No notifications found for this user" });
      }
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  // Create New Notification
  app.post("/api/notifications", async (req, res) => {
    const { user_id, message, date_timestamp } = req.body;
  
    // Validate input
    if (!user_id || !message || !date_timestamp) {
      return res.status(400).json({ error: "Missing required fields: user_id, message, date_timestamp" });
    }
  
    try {
      const newNotification = await createNotification(req.body);
      res.status(201).json(newNotification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });
  
  // Delete Notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const deleted = await deleteNotification(parseInt(req.params.id));
      if (deleted) {
        res.json({ message: "Notification deleted successfully" });
      } else {
        res.status(404).json({ error: "Notification not found" });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });



// Get All Admin Actions
app.get("/api/admin", async (req, res) => {
  const adminData = await db.getAdminData();
  res.json(adminData);
});

// Get Single Admin Action by ID
app.get("/api/admin/:id", async (req, res) => {
  const adminAction = await db.getAdminById(parseInt(req.params.id));
  adminAction ? res.json(adminAction) : res.status(404).json({ error: "Admin action not found" });
});

// Create New Admin Action
app.post("/api/admin", async (req, res) => {
  const adminAction = req.body;
  const newAdminAction = await db.createAdminAction(adminAction);
  res.status(201).json(newAdminAction);
});

// Delete Admin Action
app.delete("/api/admin/:id", async (req, res) => {
  const deleted = await db.deleteAdminAction(parseInt(req.params.id));
  deleted ? res.json({ message: "Admin action deleted successfully" }) : res.status(404).json({ error: "Admin action not found" });
});


app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
