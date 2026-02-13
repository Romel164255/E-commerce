import express from "express";
import asyncHandler from "express-async-handler";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

/* =====================================================
   ORDER STATE MACHINE
===================================================== */

const validTransitions = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: []
};

const allowedStatuses = Object.keys(validTransitions);

/* =====================================================
   CHECKOUT (Transaction Required → Keep try/catch)
===================================================== */

router.post("/checkout", authenticateToken, async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartResult = await client.query(
      `
      SELECT c.product_id, c.quantity, p.price, p.stock
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [req.user.userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }

    let total = 0;

    for (const item of cartResult.rows) {
      if (item.quantity > item.stock) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Insufficient stock for product ${item.product_id}`
        });
      }

      total += item.quantity * item.price;
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders (user_id, total)
      VALUES ($1, $2)
      RETURNING id
      `,
      [req.user.userId, total]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of cartResult.rows) {
      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        `,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2
        `,
        [item.quantity, item.product_id]
      );
    }

    await client.query(
      "DELETE FROM cart_items WHERE user_id = $1",
      [req.user.userId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully",
      orderId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    next(err); // let global error handler handle it
  } finally {
    client.release();
  }
});

/* =====================================================
   GET ORDER HISTORY (Async Handler Clean)
===================================================== */

router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT id, total, status, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [req.user.userId, limit, offset]
    );

    res.json({
      page,
      limit,
      data: result.rows
    });
  })
);

/* =====================================================
   GET SINGLE ORDER
===================================================== */

router.get(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const orderId = req.params.id;

    const order = await pool.query(
      `
      SELECT id, total, status, created_at
      FROM orders
      WHERE id = $1 AND user_id = $2
      `,
      [orderId, req.user.userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await pool.query(
      `
      SELECT product_id, quantity, price
      FROM order_items
      WHERE order_id = $1
      `,
      [orderId]
    );

    res.json({
      order: order.rows[0],
      items: items.rows
    });
  })
);

/* =====================================================
   ADMIN — UPDATE STATUS
===================================================== */

router.patch(
  "/:id/status",
  authenticateToken,
  asyncHandler(async (req, res) => {

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { status } = req.body;
    const orderId = req.params.id;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const current = await pool.query(
      "SELECT status FROM orders WHERE id = $1",
      [orderId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentStatus = current.rows[0].status;

    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        error: `Cannot move from ${currentStatus} to ${status}`
      });
    }

    const updated = await pool.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, orderId]
    );

    res.json(updated.rows[0]);
  })
);

export default router;