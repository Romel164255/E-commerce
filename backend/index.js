import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";

import configurePassport from "./config/passport.js";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";
import addressRoutes from "./routes/address.js";
import searchRoutes from "./routes/search.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";

import { errorHandler } from "./middleware/errorHandler.js";
import {
  authLimiter,
  paymentLimiter,
  generalLimiter,
} from "./middleware/rateLimiter.js";

/* ===============================
   LOAD ENV VARIABLES FIRST
=============================== */
dotenv.config();

/* ===============================
   CREATE APP
=============================== */
const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   CONFIGURE PASSPORT
=============================== */
configurePassport();

/* ===============================
   CORS CONFIG
=============================== */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ===============================
   GLOBAL MIDDLEWARES
=============================== */
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ===============================
   RATE LIMITING
   Applied before routes so all
   requests are throttled
=============================== */

// General limiter on all routes
app.use(generalLimiter);

// Strict limiter on auth routes
app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);

// Payment limiter
app.use("/api/payment", paymentLimiter);

/* ===============================
   ROUTES
=============================== */
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/addresses", addressRoutes);
app.use("/search", searchRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/admin", adminRoutes);

/* ===============================
   ERROR HANDLER
=============================== */
app.use(errorHandler);

/* ===============================
   START SERVER
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
