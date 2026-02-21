import express from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import {
  createOrder,
  payOrder,
  getUserOrders
} from "../services/orderService.js";

const router = express.Router();

/* ===============================
   CHECKOUT
=============================== */

router.post(
  "/checkout",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const result = await createOrder(
      req.user.userId,
      req.body.addressId
    );

    res.status(201).json(result);
  })
);


/* ===============================
   PAY
=============================== */

router.post(
  "/:id/pay",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const result = await payOrder(
      req.user.userId,
      req.params.id
    );

    res.json(result);
  })
);


/* ===============================
   GET ORDERS
=============================== */

router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const orders = await getUserOrders(req.user.userId);

    res.json({ data: orders });
  })
);

export default router;
