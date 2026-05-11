import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import jwt from "jsonwebtoken";
import { registerUser, loginUser } from "../services/authService.js";
import type { UserRow } from "../types.js";

const router = express.Router();

/* =============================
   REGISTER
============================= */
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const result = await registerUser(email, password);

    res.status(201).json(result);
  })
);

/* =============================
   LOGIN
============================= */
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const result = await loginUser(email, password);

    res.json(result);
  })
);

/* =============================
   GOOGLE LOGIN
============================= */

// Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req: Request, res: Response) => {
    const user = req.user as UserRow;

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/oauth?token=${token}&role=${user.role}`
    );
  }
);

export default router;
