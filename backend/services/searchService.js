 import { pool } from "../db.js";

/* Save search history */

export const saveSearchHistory = async (userId, query) => {

  await pool.query(
    `
    INSERT INTO search_history (user_id, query)
    VALUES ($1, $2)
    `,
    [userId, query]
  );
};


/* Basic Recommendation Algorithm */

export const getRecommendations = async (userId) => {

  const result = await pool.query(
    `
    SELECT p.*
    FROM products p
    JOIN search_history s ON p.category = s.query
    WHERE s.user_id = $1
    ORDER BY p.created_at DESC
    LIMIT 10
    `,
    [userId]
  );

  return result.rows;
};
