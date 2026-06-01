import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";

import { authenticateToken } from "../middleware/auth.js";

import {
  createOrder,
  payOrder,
  getUserOrders,
} from "../services/orderService.js";

const router = express.Router();

/* ===================================================
   CHECKOUT
=================================================== */

router.post(
  "/checkout",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await createOrder(
      req.user!.userId!,
      (req.body as { addressId: number }).addressId,
    );

    res.status(201).json(result);
  }),
);

/* ===================================================
   PAY ORDER
=================================================== */

router.post(
  "/:id/pay",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await payOrder(req.user!.userId!, String(req.params.id));

    res.json(result);
  }),
);

/* ===================================================
   GET USER ORDERS
=================================================== */

router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await getUserOrders(req.user!.userId!);

    res.json({
      data: orders,
    });
  }),
);

export default router;
