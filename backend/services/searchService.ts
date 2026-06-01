import { pool } from "../db.js";
import type { ProductRow } from "../types.js";

/* Save search history */

export const saveSearchHistory = async (
  userId: number,
  query: string,
): Promise<void> => {
  await pool.query(
    `
    INSERT INTO search_history (user_id, query)
    VALUES ($1, $2)
    `,
    [userId, query],
  );
};

/* Basic Recommendation Algorithm */

export const getRecommendations = async (
  userId: number,
): Promise<ProductRow[]> => {
  const result = await pool.query<ProductRow>(
    `
    SELECT p.*
    FROM products p
    JOIN search_history s ON p.category = s.query
    WHERE s.user_id = $1
    ORDER BY p.created_at DESC
    LIMIT 10
    `,
    [userId],
  );

  return result.rows;
};
