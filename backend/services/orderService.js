import { pool } from "../db.js";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ===============================
   STATE MACHINE
=============================== */

const validTransitions = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: []
};

/* ===============================
   CREATE ORDER (CHECKOUT)
=============================== */

export const createOrder = async (userId, addressId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validate address
    const addressCheck = await client.query(
      "SELECT id FROM addresses WHERE id = $1 AND user_id = $2",
      [addressId, userId]
    );

    if (!addressCheck.rows.length) {
      throw new Error("Invalid address");
    }

    // Get cart items
    const cartResult = await client.query(
      `
      SELECT c.product_id, c.quantity, p.price
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId]
    );

    if (!cartResult.rows.length) {
      throw new Error("Cart is empty");
    }

    // Calculate total
    const total = cartResult.rows.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    // Insert order
    const orderInsert = await client.query(
      `
      INSERT INTO orders (user_id, total, status, address_id)
      VALUES ($1, $2, 'PENDING', $3)
      RETURNING id
      `,
      [userId, total, addressId]
    );

    const orderId = orderInsert.rows[0].id;

    // Insert order items
    for (const item of cartResult.rows) {
      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        `,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");

    return {
      message: "Order created. Awaiting payment.",
      orderId
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

export const payOrder = async (userId, orderId) => {

  const orderCheck = await pool.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
    [orderId, userId]
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
    receipt: `order_${orderId}`
  });

  // Save razorpay_order_id
  await pool.query(
    `
    UPDATE orders
    SET razorpay_order_id = $1
    WHERE id = $2
    `,
    [razorpayOrder.id, orderId]
  );

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    key: process.env.RAZORPAY_KEY_ID
  };
};


/* ===============================
   GET USER ORDERS
=============================== */

export const getUserOrders = async (userId) => {

  const result = await pool.query(
    `
    SELECT id, total, status, payment_status, created_at
    FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};