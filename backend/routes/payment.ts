import express, { type Request, type Response } from "express";
import crypto from "crypto";
import { pool } from "../db.js";

const router = express.Router();

interface VerifyPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

router.post("/verify", async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body as VerifyPaymentBody;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query<{
      id: number;
      payment_status: string | null;
    }>(
      `
      SELECT id, payment_status
      FROM orders
      WHERE razorpay_order_id = $1
      FOR UPDATE
      `,
      [razorpay_order_id],
    );

    if (!orderResult.rows.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orderResult.rows[0];

    if (order.payment_status === "PAID") {
      await client.query("COMMIT");
      res.json({ success: true, alreadyPaid: true });
      return;
    }

    const insufficientStock = await client.query<{ product_id: number }>(
      `
      SELECT oi.product_id
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
        AND p.stock < oi.quantity
      LIMIT 1
      `,
      [order.id],
    );

    if (insufficientStock.rows.length > 0) {
      throw new Error("Insufficient stock");
    }

    // Update order payment status
    await client.query(
      `
      UPDATE orders
      SET status = 'PAID',
          payment_status = 'PAID',
          razorpay_payment_id = $1,
          razorpay_signature = $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [razorpay_payment_id, razorpay_signature, order.id],
    );

    // Deduct stock exactly once after payment verification.
    await client.query(
      `
      UPDATE products p
      SET stock = p.stock - oi.quantity
      FROM order_items oi
      WHERE oi.product_id = p.id
        AND oi.order_id = $1
      `,
      [order.id],
    );

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
