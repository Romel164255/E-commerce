import express from "express";
import asyncHandler from "express-async-handler";
import {
  registerUser,
  loginUser
} from "../services/authService.js";

const router = express.Router();

router.post("/register", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const result = await registerUser(email, password);

  res.status(201).json(result);
}));

router.post("/login", asyncHandler(async (req, res) => {

  const { email, password } = req.body;

  const result = await loginUser(email, password);

  res.json(result);
}));

export default router;
