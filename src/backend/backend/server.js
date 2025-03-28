const express = require("express");
const dotenv = require("dotenv");
const db = require("./db/database");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());


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
    const notifications = await db.getNotifications(parseInt(req.params.user_id));
    if (notifications.length === 0) {
      return res.status(404).json({ message: "No notifications found for this user" });
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
