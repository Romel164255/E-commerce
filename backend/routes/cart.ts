import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";

import { authenticateToken } from "../middleware/auth.js";

import {
  addToCart,
  getCartItems,
  removeCartItem,
} from "../services/cartService.js";

const router = express.Router();

/* ===================================================
   ADD TO CART
=================================================== */

router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body as {
      productId: number;
      quantity: number;
    };

    const cartItem = await addToCart(req.user!.userId!, productId, quantity);

    res.status(201).json(cartItem);
  }),
);

/* ===================================================
   GET CART ITEMS
=================================================== */

router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const cartItems = await getCartItems(req.user!.userId!);

    res.json(cartItems);
  }),
);

/* ===================================================
   REMOVE CART ITEM
=================================================== */

router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await removeCartItem(
      req.user!.userId!,
      String(req.params.id),
    );

    res.json(result);
  }),
);

export default router;
