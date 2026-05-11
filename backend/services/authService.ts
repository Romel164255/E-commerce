import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import type { AuthResult, UserRow } from "../types.js";

export const registerUser = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, role`,
      [email, hashed]
    );

    console.log("INSERT SUCCESS:", result.rows);

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return { token, role: user.role };
  } catch (err) {
    const error = err as Error;
    console.error("REGISTER ERROR:", error.message);
    throw err;
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const result = await pool.query<UserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password_hash!);

  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  return { token, role: user.role };
};
