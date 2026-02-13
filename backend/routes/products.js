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

router.get(
  "/",
  asyncHandler(async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
  SELECT 
    id,
    title,
    description,
    price,
    stock,
    image_url,
    category,
    gender
  FROM products
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    res.json({
      page,
      limit,
      data: result.rows
    });
  })
);

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