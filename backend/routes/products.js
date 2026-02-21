import express from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import {
  getProducts,
  createProduct
} from "../services/productService.js";

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
   GET PRODUCTS
=============================== */

router.get("/", asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1;

  const result = await getProducts({
    page,
    sort: req.query.sort,
    category: req.query.category,
    gender: req.query.gender
  });

  res.json(result);
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

    const product = await createProduct(req.body);

    res.status(201).json(product);
  })
);

export default router;
