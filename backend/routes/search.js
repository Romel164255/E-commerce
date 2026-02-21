import express from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import {
  saveSearchHistory,
  getRecommendations
} from "../services/searchService.js";

const router = express.Router();

router.post(
  "/history",
  authenticateToken,
  asyncHandler(async (req, res) => {

    await saveSearchHistory(req.user.userId, req.body.query);

    res.json({ message: "Search saved" });
  })
);

router.get(
  "/recommendations",
  authenticateToken,
  asyncHandler(async (req, res) => {

    const result = await getRecommendations(req.user.userId);

    res.json(result);
  })
);

export default router;
