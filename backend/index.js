import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("DB OK");
  } catch (err) {
    console.error("DB ERROR:", err.message);
  }
})();


app.get("/health", async (req, res) => {
  const r = await pool.query("SELECT 1");
  res.json({ ok: true });
});

console.log("DB URL exists?", !!process.env.DATABASE_URL);


app.listen(5000, () => {
  console.log("Server running on 5000");
});
