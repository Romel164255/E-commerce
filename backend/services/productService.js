import { pool } from "../db.js";

/* ===================================
   GET PRODUCTS (FILTER + SORT + PAGINATION)
=================================== */

export const getProducts = async ({
  page = 1,
  limit = 14,
  sort = "new",
  category,
  gender
}) => {

  const offset = (page - 1) * limit;

  let whereClauses = [];
  let values = [];
  let index = 1;

  if (category) {
    whereClauses.push(`category = $${index++}`);
    values.push(category);
  }

  if (gender) {
    whereClauses.push(`gender = $${index++}`);
    values.push(gender);
  }

  const whereSQL = whereClauses.length
    ? "WHERE " + whereClauses.join(" AND ")
    : "";

  /* ---------- TOTAL COUNT ---------- */
  const countQuery = `SELECT COUNT(*) FROM products ${whereSQL}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  /* ---------- MAIN QUERY ---------- */
  let query = `
    SELECT id, title, price, image_url, category, gender
    FROM products
    ${whereSQL}
  `;

  if (sort === "price_asc") {
    query += " ORDER BY price ASC, id DESC";
  } else if (sort === "price_desc") {
    query += " ORDER BY price DESC, id DESC";
  } else {
    query += " ORDER BY created_at DESC, id DESC";
  }

  query += ` LIMIT $${index++} OFFSET $${index++}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  return {
    page,
    total,
    totalPages,
    limit,
    data: result.rows
  };
};


/* ===================================
   CREATE PRODUCT
=================================== */

export const createProduct = async ({
  title,
  description,
  price,
  stock
}) => {

  const result = await pool.query(
    `
    INSERT INTO products (title, description, price, stock)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, price, stock]
  );

  return result.rows[0];
};
