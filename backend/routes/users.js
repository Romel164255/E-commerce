import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, role, created_at FROM users"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
