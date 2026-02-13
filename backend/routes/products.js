import express from "express";
import asyncHandler from "express-async-handler";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";

const router = express.Router();

/* ===============================
   VALIDATION SCHEMA
=============================== */

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  stock: z.number().int().nonnegative()
});

/* ===============================
   GET PRODUCTS (FILTER + SORT + PAGINATION)
=============================== */

router.get("/", asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 14;
  const offset = (page - 1) * limit;

  const sort = req.query.sort || "new";
  const category = req.query.category;
  const gender = req.query.gender;

  let whereClauses = [];
  let values = [];
  let index = 1;

  if (category) {
    whereClauses.push(`category = $${index++}`);
    values.push(category);
  }

  if (gender) {
    whereClauses.push(`gender = $${index++}`);
    values.push(gender);
  }

  const whereSQL = whereClauses.length
    ? "WHERE " + whereClauses.join(" AND ")
    : "";

  /* ---------- TOTAL COUNT ---------- */
  const countQuery = `SELECT COUNT(*) FROM products ${whereSQL}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  /* ---------- MAIN QUERY ---------- */
  let query = `
    SELECT id, title, price, image_url, category, gender
    FROM products
    ${whereSQL}
  `;

  if (sort === "price_asc") {
    query += " ORDER BY price ASC, id DESC";
  } else if (sort === "price_desc") {
    query += " ORDER BY price DESC, id DESC";
  } else {
    query += " ORDER BY created_at DESC, id DESC";
  }

  query += ` LIMIT $${index++} OFFSET $${index++}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  res.json({
    page,
    total,
    totalPages,
    limit,
    data: result.rows
  });
}));

/* ===============================
   CREATE PRODUCT (ADMIN)
=============================== */

router.post(
  "/",
  authenticateToken,
  validate(createProductSchema),
  asyncHandler(async (req, res) => {

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { title, description, price, stock } = req.body;

    const result = await pool.query(
      `
      INSERT INTO products (title, description, price, stock)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [title, description, price, stock]
    );

    res.status(201).json(result.rows[0]);
  })
);

export default router;