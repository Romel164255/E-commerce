import express from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import {
  addAddress,
  getUserAddresses
} from "../services/addressService.js";

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await addAddress(req.user.userId, req.body);
    res.status(201).json(result);
  })
);

router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const result = await getUserAddresses(req.user.userId);

    res.json(result);
  })
);

export default router;
