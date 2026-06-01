import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";

import { authenticateToken } from "../middleware/auth.js";

import {
  saveSearchHistory,
  getRecommendations,
} from "../services/searchService.js";

const router = express.Router();

/* ===================================================
   SAVE SEARCH HISTORY
=================================================== */

router.post(
  "/history",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    await saveSearchHistory(
      req.user!.userId!,
      (req.body as { query: string }).query,
    );

    res.json({
      message: "Search saved",
    });
  }),
);

/* ===================================================
   GET RECOMMENDATIONS
=================================================== */

router.get(
  "/recommendations",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await getRecommendations(req.user!.userId!);

    res.json(result);
  }),
);

export default router;
