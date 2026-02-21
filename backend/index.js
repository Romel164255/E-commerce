import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

/* ===============================
   CORS CONFIG (LOCAL + PROD)
=============================== */

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* ===============================
   GLOBAL MIDDLEWARES
=============================== */

app.use(express.json());

/* ===============================
   ROUTES
=============================== */

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/addresses", addressRoutes);
app.use("/search", searchRoutes);
app.use("/api/payment", paymentRoutes);

/* ===============================
   ERROR HANDLER (ALWAYS LAST)
=============================== */

app.use(errorHandler);

/* ===============================
   SERVER START
=============================== */

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database Connected");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
  }

  console.log(`🚀 Server running on port ${PORT}`);
});