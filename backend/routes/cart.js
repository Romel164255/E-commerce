import express from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import {
  addToCart,
  getCartItems,
  removeCartItem
} from "../services/cartService.js";

const router = express.Router();

/* ===============================
   ADD TO CART
=============================== */

router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const { productId, quantity } = req.body;

    const cartItem = await addToCart(
      req.user.userId,
      productId,
      quantity
    );

    res.status(201).json(cartItem);
  })
);


/* ===============================
   GET CART
=============================== */

router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const cartItems = await getCartItems(req.user.userId);

    res.json(cartItems);
  })
);


/* ===============================
   REMOVE ITEM
=============================== */

router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const result = await removeCartItem(
      req.user.userId,
      req.params.id
    );

    res.json(result);
  })
);

export default router;
