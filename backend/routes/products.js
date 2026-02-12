import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, description, price, stock FROM products ORDER BY created_at DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/", authenticateToken, async (req, res) => {

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }

  const { name, description, price, stock } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, price, stock]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to create product" });
  }
});

export default router;
