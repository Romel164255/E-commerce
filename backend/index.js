import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// DB health check
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("DB OK");
  } catch (err) {
    console.error("DB ERROR:", err.message);
  }
});

app.get("/health", async (req, res) => {
  res.json({ ok: true });
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);

app.listen(5000, () => {
  console.log("Server running on 5000");
});
