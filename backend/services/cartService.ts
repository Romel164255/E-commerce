import { pool } from "../db.js";
import type { CartItemRow, CartItemWithProduct } from "../types.js";

/* ===============================
   ADD TO CART
=============================== */

export const addToCart = async (
  userId: number,
  productId: number,
  quantity: number
): Promise<CartItemRow> => {
  // 1️⃣ Check product exists + stock and current quantity in cart
  const productCheck = await pool.query<{
    stock: number;
    existing_quantity: number;
  }>(
    `
    SELECT 
      p.stock,
      COALESCE(c.quantity, 0)::int AS existing_quantity
    FROM products p
    LEFT JOIN cart_items c
      ON c.product_id = p.id
     AND c.user_id = $2
    WHERE p.id = $1
    `,
    [productId, userId]
  );

  if (productCheck.rows.length === 0) {
    throw new Error("Product not found");
  }

  const stock = productCheck.rows[0].stock;
  const existingQuantity = productCheck.rows[0].existing_quantity;

  if (quantity === 0) {
    throw new Error("Invalid quantity");
  }

  const nextQuantity = existingQuantity + quantity;

  if (nextQuantity <= 0) {
    throw new Error("Invalid quantity");
  }

  if (nextQuantity > stock) {
    throw new Error("Not enough stock available");
  }

  // 2️⃣ Insert or update cart quantity
  const result =
    existingQuantity === 0
      ? await pool.query<CartItemRow>(
          `
          INSERT INTO cart_items (user_id, product_id, quantity)
          VALUES ($1, $2, $3)
          RETURNING *
          `,
          [userId, productId, quantity]
        )
      : await pool.query<CartItemRow>(
          `
          UPDATE cart_items
          SET quantity = quantity + $1
          WHERE user_id = $2 AND product_id = $3
          RETURNING *
          `,
          [quantity, userId, productId]
        );

  return result.rows[0];
};

/* ===============================
   GET CART ITEMS
=============================== */

export const getCartItems = async (
  userId: number
): Promise<CartItemWithProduct[]> => {
  const result = await pool.query<CartItemWithProduct & { price: string }>(
    `
    SELECT 
      c.id,
      c.product_id,
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

  return result.rows.map((item) => ({
    ...item,
    price: Number(item.price),
  }));
};

/* ===============================
   REMOVE FROM CART
=============================== */

export const removeCartItem = async (
  userId: number,
  cartItemId: string
): Promise<{ message: string }> => {
  await pool.query(
    `
    DELETE FROM cart_items
    WHERE id = $1 AND user_id = $2
    `,
    [cartItemId, userId]
  );

  return { message: "Item removed" };
};
