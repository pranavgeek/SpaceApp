const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const path = require("path");
const db = require("./db/database");
const fs = require("fs");

dotenv.config();
const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.options("*", cors()); // Allow all CORS preflights

// Helper: Load and Save data
const loadData = () => {
  const rawData = fs.readFileSync(path.join(__dirname, "db", "data.json"), "utf-8");
  return JSON.parse(rawData);
};

const saveData = (data) => {
  fs.writeFileSync(path.join(__dirname, "db", "data.json"), JSON.stringify(data, null, 2));
};

// GET: Orders for a Buyer
app.get("/api/users/:userId/orders", (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = loadData();

  const user = data.users.find((u) => u.user_id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const enrichedOrders = (user.orders || []).map((order) => {
    const product = data.products.find((p) => p.product_id === order.product_id);
    return {
      ...order,
      product_name: product ? product.product_name : "Unknown Product",
      total_cost: product ? product.cost : "N/A",
    };
  });

  res.json(enrichedOrders);
});

// POST: Add new order to Buyer
app.post('/api/users/:buyerId/orders/create', async (req, res) => {
  try {
    const orderData = req.body;
    const buyerId = req.params.buyerId;

    console.log("🧾 buyerId param:", buyerId);
    console.log("🧾 Request body:", orderData);

    const fullOrder = {
      ...orderData,
      buyer_id: parseInt(buyerId), // Force to number
    };

    const result = await db.createOrder(fullOrder);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Server responded with:", error.message);
    res.status(400).json({ error: "Failed to create order", details: error.message });
  }
});

// GET: Get seller's received orders
app.get('/api/users/:sellerId/received-orders', async (req, res) => {
  try {
    const sellerId = parseInt(req.params.sellerId);
    const data = loadData();

    console.log("🧾 buyerId param:", sellerId);

    const seller = data.users.find(u => parseInt(u.user_id) === sellerId);

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const receivedOrders = seller.received_orders || [];
    res.status(200).json(receivedOrders);
  } catch (error) {
    console.error("❌ Error fetching received orders:", error.message);
    res.status(500).json({ error: "Failed to fetch received orders" });
  }
});

app.post('/api/orders/:orderId/submit-tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { tracking_link } = req.body;

    const data = loadData();
    const order = data.orders.find((o) => o.order_id === orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.pending_tracking_link = tracking_link;
    order.tracking_approval_status = "pending"; // 'pending' | 'approved' | 'rejected'

    saveData(data);
    res.status(200).json({ message: "Tracking link submitted for review." });
  } catch (err) {
    console.error("❌ Error submitting tracking:", err);
    res.status(500).json({ error: "Server error submitting tracking." });
  }
});

//Admin Endpoint to Approve/Reject
app.post('/api/orders/:orderId/approve-tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = loadData();
    const order = data.orders.find((o) => o.order_id === orderId);

    if (!order || !order.pending_tracking_link) {
      return res.status(404).json({ error: "No pending tracking found for this order" });
    }

    // Approve the tracking
    order.tracking_number = order.pending_tracking_link;
    order.tracking_approval_status = "approved";
    delete order.pending_tracking_link;

    // Send message to buyer
    const seller = data.users.find((u) => u.user_id === order.seller_id);
    const buyer = data.users.find((u) => u.user_id === order.buyer_id);

    const messageObj = {
      sender_id: seller.user_id,
      receiver_id: buyer.user_id,
      timestamp: new Date().toISOString(),
      content: `📦 Your order has shipped! Track it here: ${order.tracking_number}`,
    };

    data.messages.push(messageObj);

    saveData(data);
    res.status(200).json({ message: "Tracking approved and buyer notified." });
  } catch (err) {
    console.error("❌ Error approving tracking:", err);
    res.status(500).json({ error: "Server error approving tracking." });
  }
});


app.get('/api/admin/pending-trackings', (req, res) => {
  try {
    const data = loadData();
    const pending = data.orders.filter((o) => o.pending_tracking_link);
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch pending trackings." });
  }
});

// ------------------------------------------------------------------------------

//Payment Gateway
app.get("/api/payment", async (req, res) => {
  const txnTotal = parseFloat(req.query.total || "99.99").toFixed(2);
  console.log("💰 Amount to charge:", txnTotal);

  const preloadPayload = {
    store_id: "monca11434",
    api_token: "leYuEX1G18u8DrrxIhkj",
    checkout_id: "chktDAL6N11434",
    txn_total: txnTotal,
    currency_code: "CAD",
    environment: "qa",
    action: "preload",
  };

  try {
    const response = await fetch("https://gatewayt.moneris.com/chktv2/request/request.php", {
      method: "POST",
      body: JSON.stringify(preloadPayload),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    console.log("📦 Moneris Preload Response:", data);

    if (data?.response?.ticket) {
      res.json({ ticket: data.response.ticket });
    } else {
      console.error("❌ Invalid preload response", data);
      res.status(400).json({ error: "Invalid Moneris credentials or configuration." });
    }
  } catch (err) {
    console.error("Payment preload error:", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});



app.get("/", async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json({
      message:
        "Node.js API for User, Ecommerce, Reviews, Messaging, Admin & Notifications.",
      users: users,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get Single User by ID
app.get("/api/users/:id", async (req, res) => {
  const user = await db.getUserById(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// Create New User
app.post("/api/users", async (req, res) => {
  try {
    const user = req.body;
    const newUser = await db.createUser(user);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update User
app.put("/api/users/:id", async (req, res) => {
  const updatedUser = await db.updateUser(parseInt(req.params.id), req.body);
  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(updatedUser);
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  const deleted = await db.deleteUser(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ message: "User deleted successfully" });
});

app.get("/api/products", async (req, res) => {
  const products = await db.getProducts();
  res.json(products);
});

// Get Single Product by ID
app.get("/api/products/:id", async (req, res) => {
  const product = await db.getProductById(parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// Create New Product
app.post("/api/products", async (req, res) => {
  try {
    const product = req.body;
    const newProduct = await db.createProduct(product);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update Product
app.put("/api/products/:id", async (req, res) => {
  const updatedProduct = await db.updateProduct(
    parseInt(req.params.id),
    req.body
  );
  if (!updatedProduct) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(updatedProduct);
});

// Delete Product
app.delete("/api/products/:id", async (req, res) => {
  const deleted = await db.deleteProduct(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ message: "Product deleted successfully" });
});

// Get All Reviews
app.get("/api/reviews", async (req, res) => {
  const reviews = await db.getReviews();
  res.json(reviews);
});

// Get Single Review by ID
app.get("/api/reviews/:id", async (req, res) => {
  const review = await db.getReviewById(parseInt(req.params.id));
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }
  res.json(review);
});

// Create New Review
app.post("/api/reviews", async (req, res) => {
  try {
    const review = req.body;
    const newReview = await db.createReview(review);
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update Review
app.put("/api/reviews/:id", async (req, res) => {
  const updatedReview = await db.updateReview(
    parseInt(req.params.id),
    req.body
  );
  if (!updatedReview) {
    return res.status(404).json({ error: "Review not found" });
  }
  res.json(updatedReview);
});

// Delete Review
app.delete("/api/reviews/:id", async (req, res) => {
  const deleted = await db.deleteReview(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Review not found" });
  }
  res.json({ message: "Review deleted successfully" });
});

// Get All Messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await db.getMessages();
    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get Single Message by ID
app.get("/api/messages/:id", async (req, res) => {
  const message = await db.getMessageById(parseInt(req.params.id));
  message
    ? res.json(message)
    : res.status(404).json({ error: "Message not found" });
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
  deleted
    ? res.json({ message: "Message deleted successfully" })
    : res.status(404).json({ error: "Message not found" });
});

app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await db.getNotifications();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.get("/api/notifications/:user_id", async (req, res) => {
  try {
    const notifications = await db.getNotifications(
      parseInt(req.params.user_id)
    );
    if (notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this user" });
    }
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    const newNotification = await db.createNotification(req.body);
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

app.delete("/api/notifications/:id", async (req, res) => {
  const deleted = await db.deleteNotification(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Notification not found" });
  }
  res.json({ message: "Notification deleted successfully" });
});

app.get("/api/admin", async (req, res) => {
  const adminData = await db.getAdminData();
  res.json(adminData);
});

app.get("/api/admin/:id", async (req, res) => {
  const adminAction = await db.getAdminById(parseInt(req.params.id));
  if (!adminAction) {
    return res.status(404).json({ error: "Admin action not found" });
  }
  res.json(adminAction);
});

app.post("/api/admin", async (req, res) => {
  try {
    const adminAction = req.body;
    const newAdminAction = await db.createAdminAction(adminAction);
    res.status(201).json(newAdminAction);
  } catch (error) {
    res.status(500).json({ error: "Failed to create admin action" });
  }
});

app.delete("/api/admin/:id", async (req, res) => {
  const deleted = await db.deleteAdminAction(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Admin action not found" });
  }
  res.json({ message: "Admin action deleted successfully" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
