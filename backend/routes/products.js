import express from "express";
import asyncHandler from "express-async-handler";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";

const router = express.Router();

/* =====================================================
   VALIDATION SCHEMA
===================================================== */

const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  stock: z.number().int().nonnegative()
});

/* =====================================================
   GET PRODUCTS (WITH PAGINATION)
===================================================== */
router.get("/", asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  const offset = (page - 1) * limit;

  const sort = req.query.sort || "new";
  const category = req.query.category;
  const gender = req.query.gender;

  let query = `
    SELECT id, title, price, image_url, category, gender
    FROM products
  `;

  let conditions = [];
  let values = [];
  let index = 1;

  if (category) {
    conditions.push(`category = $${index++}`);
    values.push(category);
  }

  if (gender) {
    conditions.push(`gender = $${index++}`);
    values.push(gender);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  if (sort === "price_asc") {
    query += " ORDER BY price ASC";
  } else if (sort === "price_desc") {
    query += " ORDER BY price DESC";
  } else {
    query += " ORDER BY created_at DESC";
  }

  query += ` LIMIT $${index++} OFFSET $${index++}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  res.json({
    page,
    data: result.rows
  });
}));

/* =====================================================
   CREATE PRODUCT (ADMIN ONLY)
===================================================== */

router.post(
  "/",
  authenticateToken,
  validate(createProductSchema),
  asyncHandler(async (req, res) => {

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { name, description, price, stock } = req.body;

    const result = await pool.query(
      `
      INSERT INTO products (name, description, price, stock)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [name, description, price, stock]
    );

    res.status(201).json(result.rows[0]);
  })
);

export default router;