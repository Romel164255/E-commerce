import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";
import addressRoutes from "./routes/address.js";
import searchRoutes from "./routes/search.js";
import paymentRoutes from "./routes/payment.js";

import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* Resolve __dirname in ES Modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Global Middlewares */
app.use(cors());
app.use(express.json());

/* Static Files */
app.use("/uploads", express.static("uploads"));

/* API Routes */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/addresses", addressRoutes);
app.use("/search", searchRoutes);
app.use("/api/payment", paymentRoutes);   // ✅ Added

/* Error Handler */
app.use(errorHandler);

/* Start Server */
app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database Connected");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
  }

  console.log(`🚀 Server running on http://localhost:${PORT}`);
});