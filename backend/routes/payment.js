import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/verify", authenticateToken, async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Update order
    await client.query(
      `
      UPDATE orders
      SET status = 'PAID',
          payment_status = 'PAID',
          razorpay_payment_id = $1,
          razorpay_signature = $2,
          updated_at = NOW()
      WHERE razorpay_order_id = $3
      `,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Deduct stock safely
    await client.query(`
      UPDATE products p
      SET stock = p.stock - oi.quantity
      FROM order_items oi
      WHERE oi.product_id = p.id
      AND oi.order_id = (
        SELECT id FROM orders WHERE razorpay_order_id = '${razorpay_order_id}'
      )
    `);

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Payment update failed" });
  } finally {
    client.release();
  }
});

export default router;