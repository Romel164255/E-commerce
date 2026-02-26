import express from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import { z } from "zod";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import {
  getProducts,
  createProduct
} from "../services/productService.js";

const router = express.Router();

/* ===================================================
   ORIGINAL MULTER CONFIG
------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
});
=================================================== */

/* ===================================================
   NASA VERSION: Bounded Memory Usage
   - Limit file size
   - Explicit memory control
=================================================== */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB hard limit
  },
});

/* ===================================================
   ORIGINAL VALIDATION SCHEMA
------------------------------------------------------
const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
});
=================================================== */

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
});

/* ===================================================
   HELPER: Safe Sort Validation
   (Never trust query parameters)
=================================================== */

const allowedSort = ["new", "price_asc", "price_desc"];

function safeSort(sort) {
  return allowedSort.includes(sort) ? sort : "new";
}

/* ===================================================
   HELPER: Safe Image Upload
   - Extracted for clarity
   - Smaller route function
   - Single responsibility
=================================================== */

async function uploadImage(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) {
          console.error("CLOUDINARY_UPLOAD_ERROR:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    ).end(file.buffer);
  });
}

/* ===================================================
   GET PRODUCTS
=================================================== */

router.get(
  "/",
  asyncHandler(async (req, res) => {

    /* ORIGINAL:
    const page = parseInt(req.query.page) || 1;
    */

    // NASA: Bound page input
    const page = Math.max(
      1,
      Math.min(1000, parseInt(req.query.page) || 1)
    );

    const result = await getProducts({
      page,
      sort: safeSort(req.query.sort),
      category: req.query.category,
      gender: req.query.gender,
    });

    res.json(result);
  })
);

/* ===================================================
   CREATE PRODUCT (ADMIN)
=================================================== */

router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  asyncHandler(async (req, res) => {

    /* ORIGINAL:
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }
    */

    // NASA: Guard impossible state
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    // Validate body safely
    const parsed = createProductSchema.parse(req.body);

    // Extract upload logic
    const imageUrl = await uploadImage(req.file);

    try {
      const product = await createProduct({
        ...parsed,
        image_url: imageUrl,
      });

      res.status(201).json(product);
    } catch (err) {
      console.error("CREATE_PRODUCT_ERROR:", err);
      res.status(500).json({ error: "Product creation failed" });
    }
  })
);

export default router;