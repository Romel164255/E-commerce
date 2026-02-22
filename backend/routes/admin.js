import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeAdmin } from "../middleware/admin.js";

const router = express.Router();

/* ===============================
   USERS
================================ */

router.get("/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, role, created_at FROM users"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ===============================
   PRODUCTS
================================ */

router.get("/products", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.patch(
  "/products/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { stock } = req.body;

    try {
      await pool.query(
        "UPDATE products SET stock = $1 WHERE id = $2",
        [stock, req.params.id]
      );

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Update failed" });
    }
  }
);

/* ===============================
   ORDERS
================================ */

router.get("/orders", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* ===============================
   STATS (Dashboard)
================================ */

router.get("/stats", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const revenue = await pool.query(
      "SELECT SUM(total) FROM orders WHERE status='PAID'"
    );

    const totalOrders = await pool.query(
      "SELECT COUNT(*) FROM orders"
    );

    const totalUsers = await pool.query(
      "SELECT COUNT(*) FROM users"
    );

    res.json({
      revenue: revenue.rows[0].sum || 0,
      orders: totalOrders.rows[0].count,
      users: totalUsers.rows[0].count
    });

  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;