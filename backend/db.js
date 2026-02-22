import pkg from "pg";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});