import { pool } from "../db.js";
import Razorpay from "razorpay";
import type { OrderRow, CreateOrderResult, PayOrderResult } from "../types.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/* ===============================
   STATE MACHINE
=============================== */

const validTransitions: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

// Export for potential reuse
export { validTransitions };

/* ===============================
   CREATE ORDER (CHECKOUT)
=============================== */

export const createOrder = async (
  userId: number,
  addressId: number,
): Promise<CreateOrderResult> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validate address
    const addressCheck = await client.query<{ id: number }>(
      "SELECT id FROM addresses WHERE id = $1 AND user_id = $2",
      [addressId, userId],
    );

    if (!addressCheck.rows.length) {
      throw new Error("Invalid address");
    }

    // Get cart items
    const cartResult = await client.query<{
      product_id: number;
      quantity: number;
      price: number;
    }>(
      `
      SELECT c.product_id, c.quantity, p.price
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId],
    );

    if (!cartResult.rows.length) {
      throw new Error("Cart is empty");
    }

    // Calculate total
    const total = cartResult.rows.reduce(
      (sum, item) => sum + item.quantity * Number(item.price),
      0,
    );

    // Insert order
    const orderInsert = await client.query<{ id: number }>(
      `
      INSERT INTO orders (user_id, total, status, address_id)
      VALUES ($1, $2, 'PENDING', $3)
      RETURNING id
      `,
      [userId, total, addressId],
    );

    const orderId = orderInsert.rows[0].id;

    // Insert all order items in one query for better checkout performance.
    const productIds = cartResult.rows.map((item) => item.product_id);
    const quantities = cartResult.rows.map((item) => item.quantity);
    const prices = cartResult.rows.map((item) => Number(item.price));

    await client.query(
      `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      SELECT
        $1,
        item.product_id,
        item.quantity,
        item.price
      FROM UNNEST($2::int[], $3::int[], $4::numeric[]) AS item(
        product_id,
        quantity,
        price
      )
      `,
      [orderId, productIds, quantities, prices],
    );

    // Clear the cart once order has been successfully created.
    await client.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1
      `,
      [userId],
    );

    await client.query("COMMIT");

    return {
      message: "Order created. Awaiting payment.",
      orderId,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ===============================
   PAY ORDER (CREATE RAZORPAY ORDER)
=============================== */

export const payOrder = async (
  userId: number,
  orderId: string,
): Promise<PayOrderResult> => {
  const orderCheck = await pool.query<OrderRow>(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
    [orderId, userId],
  );

  if (!orderCheck.rows.length) {
    throw new Error("Order not found");
  }

  const order = orderCheck.rows[0];

  if (order.status !== "PENDING") {
    throw new Error("Order already processed");
  }

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Number(order.total) * 100,
    currency: "INR",
    receipt: `order_${orderId}`,
  });

  // Save razorpay_order_id
  await pool.query(
    `
    UPDATE orders
    SET razorpay_order_id = $1
    WHERE id = $2
    `,
    [razorpayOrder.id, orderId],
  );

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount as number,
    key: process.env.RAZORPAY_KEY_ID,
  };
};

/* ===============================
   GET USER ORDERS
=============================== */

export const getUserOrders = async (userId: number): Promise<OrderRow[]> => {
  const result = await pool.query<OrderRow>(
    `
    SELECT id, total, status, payment_status, created_at
    FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows;
};
