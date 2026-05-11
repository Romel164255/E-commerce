import express, { type Request, type Response } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeAdmin } from "../middleware/admin.js";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

/* =====================================================
   USERS
===================================================== */

// Get users with pagination
router.get(
  "/users",
  authenticateToken,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;

    const limit = 20;
    const offset = (page - 1) * limit;

    try {
      const users = await pool.query(
        `
        SELECT 
          id,
          email,
          role,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      );

      const total = await pool.query<{ count: string }>(
        "SELECT COUNT(*) FROM users"
      );

      const totalCount = parseInt(total.rows[0].count);

      res.json({
        data: users.rows,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      });
    } catch (err) {
      console.error("FETCH_USERS_ERROR:", err);

      res.status(500).json({
        error: "Failed to fetch users",
      });
    }
  }
);

// Update user role
router.patch(
  "/users/:id/role",
  authenticateToken,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { role } = req.body as { role: string };

    try {
      await pool.query(
        `
        UPDATE users
        SET role = $1
        WHERE id = $2
        `,
        [role, req.params.id]
      );

      res.json({
        success: true,
      });
    } catch (err) {
      console.error("UPDATE_ROLE_ERROR:", err);

      res.status(500).json({
        error: "Failed to update role",
      });
    }
  }
);

/* =====================================================
   PRODUCTS
===================================================== */

// Get products
router.get(
  "/products",
  authenticateToken,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;

    const limit = 20;
    const offset = (page - 1) * limit;

    const lowStock = req.query.lowStock === "true";

    try {
      const query = lowStock
        ? `
          SELECT *
          FROM products
          WHERE stock < 5
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
        `
        : `
          SELECT *
          FROM products
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
        `;

      const products = await pool.query(query, [limit, offset]);

      const total = await pool.query<{ count: string }>(
        lowStock
          ? "SELECT COUNT(*) FROM products WHERE stock < 5"
          : "SELECT COUNT(*) FROM products"
      );

      const totalCount = parseInt(total.rows[0].count);

      res.json({
        data: products.rows,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      });
    } catch (err) {
      console.error("FETCH_PRODUCTS_ERROR:", err);

      res.status(500).json({
        error: "Failed to fetch products",
      });
    }
  }
);

// Update stock
router.patch(
  "/products/:id",
  authenticateToken,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { stock } = req.body as {
      stock: number;
    };

    try {
      await pool.query(
        `
        UPDATE products
        SET stock = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [stock, req.params.id]
      );

      res.json({
        success: true,
      });
    } catch (err) {
      console.error("UPDATE_STOCK_ERROR:", err);

      res.status(500).json({
        error: "Update failed",
      });
    }
  }
);

// CSV bulk upload
router.post(
  "/products/upload",
  authenticateToken,
  authorizeAdmin,
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        error: "CSV file required",
      });

      return;
    }

    const results: Record<string, string>[] = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data: Record<string, string>) => {
        results.push(data);
      })
      .on("end", async () => {
        try {
          for (const row of results) {
            await pool.query(
              `
              INSERT INTO products
              (
                product_code,
                title,
                price,
                stock,
                created_at
              )
              VALUES ($1, $2, $3, $4, NOW())
              ON CONFLICT (product_code)
              DO UPDATE SET stock = EXCLUDED.stock
              `,
              [
                row.product_code,
                row.title,
                row.price,
                row.stock,
              ]
            );
          }

          res.json({
            success: true,
            inserted: results.length,
          });
        } catch (err) {
          console.error("CSV_UPLOAD_ERROR:", err);

          res.status(500).json({
            error: "CSV upload failed",
          });
        }
      });
  }
);

/* =====================================================
   ORDERS
===================================================== */

router.get(
  "/orders",
  authenticateToken,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;

    const month = req.query.month as string | undefined;

    const filters: string[] = [];
    const values: string[] = [];

    let index = 1;

    if (status) {
      filters.push(`o.status = $${index++}`);
      values.push(status);
    }

    if (month) {
      filters.push(`TO_CHAR(o.created_at, 'YYYY-MM') = $${index++}`);
      values.push(month);
    }

    const whereClause =
      filters.length > 0
        ? `WHERE ${filters.join(" AND ")}`
        : "";

    try {
      const result = await pool.query(
        `
        SELECT
          o.id AS order_id,
          o.total,
          o.status,
          o.payment_status,
          o.razorpay_payment_id,
          o.created_at,
          o.updated_at,
          u.email,
          a.full_name,
          a.phone,
          a.address_line,
          a.city,
          a.state,
          a.pincode,
          json_agg(
            json_build_object(
              'product', p.title,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) AS items
        FROM orders o
        JOIN users u
          ON o.user_id = u.id
        JOIN addresses a
          ON o.address_id = a.id
        JOIN order_items oi
          ON o.id = oi.order_id
        JOIN products p
          ON oi.product_id = p.id
        ${whereClause}
        GROUP BY
          o.id,
          u.email,
          a.full_name,
          a.phone,
          a.address_line,
          a.city,
          a.state,
          a.pincode
        ORDER BY o.created_at DESC
        `,
        values
      );

      res.json(result.rows);
    } catch (err) {
      console.error("FETCH_ORDERS_ERROR:", err);

      res.status(500).json({
        error: "Failed to fetch orders",
      });
    }
  }
);

/* =====================================================
   DASHBOARD STATS
===================================================== */

// Overview
router.get(
  "/stats",
  authenticateToken,
  authorizeAdmin,
  async (_req: Request, res: Response) => {
    try {
      const revenue = await pool.query<{ coalesce: string }>(
        `
        SELECT COALESCE(SUM(total),0)
        FROM orders
        WHERE status='PAID'
        `
      );

      const totalOrders = await pool.query<{ count: string }>(
        "SELECT COUNT(*) FROM orders"
      );

      const totalUsers = await pool.query<{ count: string }>(
        "SELECT COUNT(*) FROM users"
      );

      res.json({
        revenue: parseFloat(revenue.rows[0].coalesce),
        orders: parseInt(totalOrders.rows[0].count),
        users: parseInt(totalUsers.rows[0].count),
      });
    } catch (err) {
      console.error("FETCH_STATS_ERROR:", err);

      res.status(500).json({
        error: "Failed to fetch stats",
      });
    }
  }
);

// Weekly stats
router.get(
  "/stats/weekly",
  authenticateToken,
  authorizeAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          DATE_TRUNC('week', created_at) AS week,
          SUM(total) AS revenue,
          COUNT(*) AS orders
        FROM orders
        WHERE status = 'PAID'
        GROUP BY week
        ORDER BY week DESC
        LIMIT 12
      `);

      res.json(result.rows);
    } catch (err) {
      console.error("WEEKLY_STATS_ERROR:", err);

      res.status(500).json({
        error: "Failed to fetch weekly stats",
      });
    }
  }
);

// Monthly stats
router.get(
  "/stats/monthly",
  authenticateToken,
  authorizeAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          DATE_TRUNC('month', created_at) AS month,
          SUM(total) AS revenue,
          COUNT(*) AS orders
        FROM orders
        WHERE status = 'PAID'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `);

      res.json(result.rows);
    } catch (err) {
      console.error("MONTHLY_STATS_ERROR:", err);

      res.status(500).json({
        error: "Failed to fetch monthly stats",
      });
    }
  }
);

export default router;