import express, { type Request, type Response } from "express";
import { pool } from "../db.js";
import type { QueryResultRow } from "pg";

const router = express.Router();

/* Helper to safely extract query results */
function getValue(
  result: PromiseSettledResult<{ rows: QueryResultRow[] }>,
  key = "count",
): number {
  if (result.status !== "fulfilled") return 0;

  const value = result.value.rows[0][key] as string | number;
  return typeof value === "string" ? Number(value) : value;
}

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const results = await Promise.allSettled([
      pool.query("SELECT COUNT(*)::int AS count FROM products"),
      pool.query("SELECT COUNT(*)::int AS count FROM users"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders"),
      pool.query("SELECT COALESCE(SUM(total),0)::int AS revenue FROM orders"),
    ]);

    const stats = {
      products: getValue(results[0]),
      users: getValue(results[1]),
      orders: getValue(results[2]),
      revenue: getValue(results[3], "revenue"),
    };

    res.json(stats);
  } catch (err) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
