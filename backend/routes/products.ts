import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import multer from "multer";
import { z } from "zod";

import { authenticateToken } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";

import {
  createProduct,
  getProducts,
} from "../services/productService.js";

const router = express.Router();

/* ===================================================
   MULTER CONFIG
=================================================== */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* ===================================================
   VALIDATION
=================================================== */

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
});

/* ===================================================
   SAFE SORT
=================================================== */

const allowedSort = [
  "new",
  "price_asc",
  "price_desc",
] as const;

type AllowedSort = (typeof allowedSort)[number];

function safeSort(
  sort: string | undefined
): AllowedSort {
  return (allowedSort as readonly string[]).includes(sort ?? "")
    ? (sort as AllowedSort)
    : "new";
}

/* ===================================================
   IMAGE UPLOAD
=================================================== */

async function uploadImage(
  file: Express.Multer.File | undefined
): Promise<string | null> {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "products",
        },
        (error, result) => {
          if (error) {
            console.error("CLOUDINARY_UPLOAD_ERROR:", error);

            return reject(error);
          }

          resolve(result?.secure_url ?? null);
        }
      )
      .end(file.buffer);
  });
}

/* ===================================================
   GET PRODUCTS
=================================================== */

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(
      1,
      Math.min(
        1000,
        parseInt(req.query.page as string) || 1
      )
    );

    const result = await getProducts({
      page,
      sort: safeSort(req.query.sort as string | undefined),
      category: req.query.category as string | undefined,
      gender: req.query.gender as string | undefined,
    });

    res.json(result);
  })
);

/* ===================================================
   CREATE PRODUCT
=================================================== */

router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN") {
      res.status(403).json({
        error: "Admin only",
      });

      return;
    }

    const parsed = createProductSchema.parse(req.body);

    const imageUrl = await uploadImage(req.file);

    try {
      const product = await createProduct({
        ...parsed,
        image_url: imageUrl,
      });

      res.status(201).json(product);
    } catch (err) {
      console.error("CREATE_PRODUCT_ERROR:", err);

      res.status(500).json({
        error: "Product creation failed",
      });
    }
  })
);

export default router;