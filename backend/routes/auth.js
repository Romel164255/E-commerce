import express from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import jwt from "jsonwebtoken";
import { registerUser, loginUser } from "../services/authService.js";

const router = express.Router();

/* =============================
   REGISTER
============================= */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await registerUser(email, password);

    res.status(201).json(result);
  })
);

/* =============================
   LOGIN
============================= */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

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
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/oauth?token=${token}&role=${req.user.role}`
    );
  }
);

export default router;