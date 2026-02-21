import { pool } from "../db.js";

/* ===============================
   ADD TO CART
=============================== */

export const addToCart = async (userId, productId, quantity) => {

  // 1️⃣ Check product exists + stock
  const productCheck = await pool.query(
    "SELECT stock FROM products WHERE id = $1",
    [productId]
  );

  if (productCheck.rows.length === 0) {
    throw new Error("Product not found");
  }

  const stock = productCheck.rows[0].stock;

  if (quantity <= 0) {
    throw new Error("Invalid quantity");
  }

  if (quantity > stock) {
    throw new Error("Not enough stock available");
  }

  // 2️⃣ Insert / update cart
  const result = await pool.query(
    `
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, product_id)
    DO UPDATE 
      SET quantity = cart_items.quantity + EXCLUDED.quantity
    RETURNING *
    `,
    [userId, productId, quantity]
  );

  return result.rows[0];
};


/* ===============================
   GET CART ITEMS
=============================== */

export const getCartItems = async (userId) => {

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
    [userId]
  );

  return result.rows.map(item => ({
    ...item,
    price: Number(item.price)
  }));
};


/* ===============================
   REMOVE FROM CART
=============================== */

export const removeCartItem = async (userId, cartItemId) => {

  await pool.query(
    `
    DELETE FROM cart_items
    WHERE id = $1 AND user_id = $2
    `,
    [cartItemId, userId]
  );

  return { message: "Item removed" };
};