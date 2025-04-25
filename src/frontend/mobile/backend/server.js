const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require("path");
const db = require("./db/database");
const fs = require("fs");
const nodeMailer = require("nodemailer");

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
  const rawData = fs.readFileSync(
    path.join(__dirname, "db", "data.json"),
    "utf-8"
  );
  return JSON.parse(rawData);
};

const saveData = (data) => {
  fs.writeFileSync(
    path.join(__dirname, "db", "data.json"),
    JSON.stringify(data, null, 2)
  );
};

// // Configure nodemailer
// const transporter = nodeMailer.createTransport({
//   service: "gmail", // or another service
//   auth: {
//     user: process.env.EMAIL_USER || "your-email@gmail.com",
//     pass: process.env.EMAIL_PASS || "your-app-password",
//   },
// });

// // Function to send OTP email
// async function sendOTPEmail(email, otp) {
//   console.log("Attempting to send email to:", email);

//   try {
//     // Log transporter configuration (omit password)
//     console.log("Email configuration:", {
//       service: "gmail",
//       user: process.env.EMAIL_USER || "your-email@gmail.com",
//     });
//     const mailOptions = {
//       from: process.env.EMAIL_USER || "your-app@example.com",
//       to: email,
//       subject: "Your Password Reset Code",
//       text: `Your OTP for password reset is: ${otp}. This code will expire in 5 minutes.`,
//       html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//         <h2 style="color: #4267B2;">Password Reset Request</h2>
//         <p>You've requested to reset your password. Use the following code to continue:</p>
//         <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
//           ${otp}
//         </div>
//         <p>This code will expire in 5 minutes.</p>
//         <p>If you didn't request this password reset, please ignore this email.</p>
//       </div>
//     `,
//     };

//     console.log("Sending email with options:", {
//       to: mailOptions.to,
//       subject: mailOptions.subject,
//     });

//     const info = await transporter.sendMail(mailOptions);
//     console.log(`📧 Email sent to ${email}: ${info.messageId}`);
//     return true;
//   } catch (error) {
//     console.error("Email sending error:", error);
//     return false;
//   }
// }

// Generate OTP and store in user object
app.post("/api/auth/request-reset", async (req, res) => {
  const { email } = req.body;
  const data = loadData();
  const user = data.users.find((u) => u.email === email);

  if (!user) return res.status(404).json({ error: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.reset_otp = otp;
  user.otp_expires_at = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  saveData(data);

  // Log the OTP clearly in the terminal
  console.log("\n====================================");
  console.log(`📨 PASSWORD RESET OTP FOR ${email}:`);
  console.log(`📱 ${otp}`);
  console.log("====================================\n");

  // Return success with OTP for development
  res.json({ 
    message: "OTP generated successfully. Check console for the code.",
    dev_otp: otp // Include OTP in response for development
  });
});

// Verify OTP
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const data = loadData();
  const user = data.users.find((u) => u.email === email);

  if (!user || user.reset_otp !== otp)
    return res.status(400).json({ error: "Invalid OTP" });

  if (Date.now() > user.otp_expires_at)
    return res.status(400).json({ error: "OTP expired" });

  user.otp_verified = true;
  saveData(data);
  res.json({ message: "OTP verified" });
});

// Reset Password
app.post("/api/auth/reset-password", (req, res) => {
  const { email, new_password } = req.body;
  const data = loadData();
  const user = data.users.find((u) => u.email === email);

  if (!user || !user.otp_verified)
    return res.status(403).json({ error: "OTP not verified" });

  user.password = new_password;
  delete user.reset_otp;
  delete user.otp_verified;
  delete user.otp_expires_at;

  saveData(data);
  res.json({ message: "Password reset successful" });
});

// GET: Orders for a Buyer
app.get("/api/users/:userId/orders", (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = loadData();

  const user = data.users.find((u) => u.user_id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const enrichedOrders = (user.orders || []).map((order) => {
    const product = data.products.find(
      (p) => p.product_id === order.product_id
    );
    return {
      ...order,
      product_name: product ? product.product_name : "Unknown Product",
      total_cost: product ? product.cost : "N/A",
    };
  });

  res.json(enrichedOrders);
});

// GET: Orders for a Buyer
app.get("/api/users/:userId/orders", (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = loadData();

  const user = data.users.find((u) => u.user_id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const enrichedOrders = (user.orders || []).map((order) => {
    const product = data.products.find(
      (p) => p.product_id === order.product_id
    );
    return {
      ...order,
      product_name: product ? product.product_name : "Unknown Product",
      total_cost: product ? product.cost : "N/A",
    };
  });

  res.json(enrichedOrders);
});

// POST: Add new order to Buyer
app.post("/api/users/:buyerId/orders/create", async (req, res) => {
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
    res
      .status(400)
      .json({ error: "Failed to create order", details: error.message });
  }
});

// GET: Get seller's received orders
app.get("/api/users/:sellerId/received-orders", async (req, res) => {
  try {
    const sellerId = parseInt(req.params.sellerId);
    const data = loadData();

    console.log("🧾 buyerId param:", sellerId);

    const seller = data.users.find((u) => parseInt(u.user_id) === sellerId);

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

app.post("/api/orders/:orderId/submit-tracking", async (req, res) => {
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
app.post("/api/orders/:orderId/approve-tracking", async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = loadData();
    const order = data.orders.find((o) => o.order_id === orderId);

    if (!order || !order.pending_tracking_link) {
      return res
        .status(404)
        .json({ error: "No pending tracking found for this order" });
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

app.get("/api/admin/pending-trackings", (req, res) => {
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
    const response = await fetch(
      "https://gatewayt.moneris.com/chktv2/request/request.php",
      {
        method: "POST",
        body: JSON.stringify(preloadPayload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();
    console.log("📦 Moneris Preload Response:", data);

    if (data?.response?.ticket) {
      res.json({ ticket: data.response.ticket });
    } else {
      console.error("❌ Invalid preload response", data);
      res
        .status(400)
        .json({ error: "Invalid Moneris credentials or configuration." });
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

// Get products by seller ID
app.get("/api/seller/:id/products", async (req, res) => {
  try {
    const products = await db.getProductsBySellerId(parseInt(req.params.id));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch seller products" });
  }
});

// Get verified products count by seller ID
app.get("/api/seller/:id/verified-products-count", async (req, res) => {
  try {
    const count = await db.getVerifiedProductsCountBySellerId(parseInt(req.params.id));
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch verified products count" });
  }
});

app.put("/api/verify-product/:id", (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const productName = req.body.productName; // Optional parameter to help with duplicates
    
    console.log(`🔍 Attempting to verify product: ID ${productId}, Name: ${productName || 'Not specified'}`);
    
    const data = loadData();
    let productUpdated = false;
    
    // If productName is provided, use it to find the exact product
    if (productName) {
      // Find the product by ID AND name
      for (let i = 0; i < data.products.length; i++) {
        if (data.products[i].product_id === productId && 
            data.products[i].product_name === productName) {
          data.products[i].verified = true;
          productUpdated = true;
          console.log(`✅ Product "${productName}" (ID: ${productId}) verified successfully`);
          break;
        }
      }
    } else {
      // Just use the ID (legacy behavior)
      for (let i = 0; i < data.products.length; i++) {
        if (data.products[i].product_id === productId) {
          data.products[i].verified = true;
          productUpdated = true;
          console.log(`✅ Product ID ${productId} verified successfully`);
          break;
        }
      }
    }
    
    if (!productUpdated) {
      console.log(`❌ Product not found for verification: ID ${productId}, Name: ${productName || 'Not specified'}`);
      return res.status(404).json({
        success: false,
        message: "Product not found for verification"
      });
    }
    
    // Save the updated data
    saveData(data);
    
    res.json({
      success: true,
      message: "Product verified successfully"
    });
  } catch (error) {
    console.error("❌ Error verifying product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify product",
      error: error.message
    });
  }
});

// Get All Reviews (with optional product_id filter)
app.get("/api/reviews", async (req, res) => {
  try {
    // If product_id is provided in query params, get reviews for that product
    if (req.query.product_id) {
      const productId = parseInt(req.query.product_id, 10);
      const reviews = await db.getReviewsByProductId(productId);
      return res.json(reviews);
    }
    
    // Otherwise, get all reviews
    const reviews = await db.getReviews();
    return res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get Single Review by ID
app.get("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const review = await db.getReviewById(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Create New Review
app.post("/api/reviews", async (req, res) => {
  try {
    const reviewData = req.body;
    
    // Validate required fields
    if (!reviewData.product_id || !reviewData.user_id || reviewData.number_stars === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: product_id, user_id, and number_stars are required"
      });
    }
    
    // Add timestamp if not provided
    if (!reviewData.date_timestamp) {
      reviewData.date_timestamp = new Date().toISOString();
    }
    
    const newReview = await db.createReview(reviewData);
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update Review
app.put("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const updatedReview = await db.updateReview(reviewId, req.body);
    
    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete Review
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const deleted = await db.deleteReview(reviewId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
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

// Get messages between two users
app.get("/api/messages/between/:user1Id/:user2Id", async (req, res) => {
  try {
    const user1Id = req.params.user1Id;
    const user2Id = req.params.user2Id;
    
    const messages = await db.getMessagesBetweenUsers(user1Id, user2Id);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages between users:", error);
    res.status(500).json({ error: "Failed to fetch messages between users" });
  }
});

// Get all conversations for a user
app.get("/api/messages/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = loadData();
    
    // Get the list of user IDs this user has conversations with
    const conversationUserIds = await db.getUserConversations(userId);
    
    // For each conversation, get the most recent message and user info
    const conversations = [];
    
    for (const otherUserId of conversationUserIds) {
      // Get user info
      const otherUser = data.users.find(u => String(u.user_id) === String(otherUserId));
      
      if (otherUser) {
        // Get the most recent message between these users
        const messages = await db.getMessagesBetweenUsers(userId, otherUserId);
        const lastMessage = messages.length > 0 
          ? messages[messages.length - 1] 
          : null;
        
        // Count unread messages from this user
        const unreadCount = messages.filter(
          msg => String(msg.user_to) === String(userId) && msg.is_read === false
        ).length;
        
        conversations.push({
          user: {
            user_id: otherUser.user_id,
            name: otherUser.name,
            profile_image: otherUser.profile_image,
            account_type: otherUser.account_type
          },
          last_message: lastMessage ? {
            content: lastMessage.message_content,
            timestamp: lastMessage.date_timestamp_sent,
            is_from_me: String(lastMessage.user_from) === String(userId)
          } : null,
          unread_count: unreadCount
        });
      }
    }
    
    // Sort by most recent message
    conversations.sort((a, b) => {
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp);
    });
    
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    res.status(500).json({ error: "Failed to fetch user conversations" });
  }
});

// Mark message as read
app.put("/api/messages/:messageId/read", async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const updatedMessage = await db.markMessageAsRead(messageId);
    
    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    res.json(updatedMessage);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

// Mark all messages from a specific user as read
app.put("/api/messages/mark-all-read/:fromUserId/:toUserId", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;
    const data = loadData();
    let updatedCount = 0;
    
    // Find all unread messages from fromUserId to toUserId
    for (let i = 0; i < data.messages.length; i++) {
      const message = data.messages[i];
      
      if (
        String(message.user_from) === String(fromUserId) && 
        String(message.user_to) === String(toUserId) && 
        message.is_read === false
      ) {
        data.messages[i].is_read = true;
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      saveData(data);
    }
    
    res.json({ 
      success: true, 
      message: `Marked ${updatedCount} messages as read`
    });
  } catch (error) {
    console.error("Error marking all messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// Get unread messages count for a user
app.get("/api/messages/unread-count/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await db.getUnreadMessagesCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    res.status(500).json({ error: "Failed to get unread messages count" });
  }
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
