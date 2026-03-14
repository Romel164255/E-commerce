import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {

    const products = await pool.query(
      "SELECT COUNT(*) FROM products"
    );

    const users = await pool.query(
      "SELECT COUNT(*) FROM users"
    );

    const orders = await pool.query(
      "SELECT COUNT(*) FROM orders"
    );

    const revenue = await pool.query(
      "SELECT COALESCE(SUM(total_price),0) FROM orders"
    );

    res.json({
      products: products.rows[0].count,
      users: users.rows[0].count,
      orders: orders.rows[0].count,
      revenue: revenue.rows[0].coalesce
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;