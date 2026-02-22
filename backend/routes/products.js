import express from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

import {
  getProducts,
  createProduct
} from "../services/productService.js";

const router = express.Router();

/* ===============================
   MULTER CONFIG (Memory Storage)
=============================== */

const upload = multer({
  storage: multer.memoryStorage(),
});

/* ===============================
   VALIDATION SCHEMA
=============================== */

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
});

/* ===============================
   GET PRODUCTS
=============================== */

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;

    const result = await getProducts({
      page,
      sort: req.query.sort,
      category: req.query.category,
      gender: req.query.gender,
    });

    res.json(result);
  })
);

/* ===============================
   CREATE PRODUCT (ADMIN)
=============================== */

router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  asyncHandler(async (req, res) => {

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    // Validate body
    const parsed = createProductSchema.parse(req.body);

    let imageUrl = null;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    const product = await createProduct({
      ...parsed,
      image_url: imageUrl,
    });

    res.status(201).json(product);
  })
);

export default router;