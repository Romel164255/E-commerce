import { pool } from "../db.js";

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

    // 1️⃣ Validate address
    const addressCheck = await client.query(
      "SELECT * FROM addresses WHERE id = $1 AND user_id = $2",
      [addressId, userId]
    );

    if (addressCheck.rows.length === 0) {
      throw new Error("Invalid address");
    }

    // 2️⃣ Get cart items
    const cartResult = await client.query(
      `
      SELECT c.product_id, c.quantity, p.price
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      throw new Error("Cart is empty");
    }

    // 3️⃣ Calculate total
    let total = 0;
    for (const item of cartResult.rows) {
      total += item.quantity * item.price;
    }

    // 4️⃣ Insert order
    const orderResult = await client.query(
      `
      INSERT INTO orders (user_id, total, status, address_id)
      VALUES ($1, $2, 'PENDING', $3)
      RETURNING id
      `,
      [userId, total, addressId]
    );

    const orderId = orderResult.rows[0].id;

    // 5️⃣ Insert order items
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
   PAY ORDER
=============================== */

export const payOrder = async (userId, orderId) => {

  const orderCheck = await pool.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
    [orderId, userId]
  );

  if (orderCheck.rows.length === 0) {
    throw new Error("Order not found");
  }

  if (orderCheck.rows[0].status !== "PENDING") {
    throw new Error("Order already processed");
  }

  // Simulated payment success
  const paymentSuccess = true;

  if (!paymentSuccess) {
    throw new Error("Payment failed");
  }

  await pool.query(
    "UPDATE orders SET status = 'PAID' WHERE id = $1",
    [orderId]
  );

  await pool.query(
    "DELETE FROM cart_items WHERE user_id = $1",
    [userId]
  );

  return { message: "Payment successful" };
};


/* ===============================
   GET USER ORDERS
=============================== */

export const getUserOrders = async (userId) => {

  const result = await pool.query(
    `
    SELECT id, total, status, created_at
    FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};
