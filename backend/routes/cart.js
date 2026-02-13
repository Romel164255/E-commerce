import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
      `,
      [req.user.userId, productId, quantity]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
  `
  SELECT 
    c.id,
    p.title,
    p.price,
    p.image_url,
    c.quantity
  FROM cart_items c
  JOIN products p ON c.product_id = p.id
  WHERE c.user_id = $1
  `,
  [req.user.userId]
);

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const cartItemId = req.params.id;

  try {
    await pool.query(
      `
      DELETE FROM cart_items
      WHERE id = $1 AND user_id = $2
      `,
      [cartItemId, req.user.userId]
    );

    res.json({ message: "Item removed" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

export default router;
