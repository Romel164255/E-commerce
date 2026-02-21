import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
  ssl: {
    rejectUnauthorized: false,
  },
}); 

/* export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ecommerce",
  password: "987654321",
  port: 5432,
}); */