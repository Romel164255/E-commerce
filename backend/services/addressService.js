import { pool } from "../db.js";
import axios from "axios";

/* ===============================
   ADD ADDRESS (Geocode + Store)
=============================== */

export const addAddress = async (userId, data) => {
  const { full_name, phone, address_line } = data;

  if (!address_line) {
    throw new Error("Address required");
  }

  const geoRes = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        address: address_line,
        key: process.env.GOOGLE_SERVER_API_KEY
      }
    }
  );

  if (!geoRes.data.results.length) {
    throw new Error("Invalid address");
  }

  const result = geoRes.data.results[0];

  const formatted_address = result.formatted_address;
  const lat = result.geometry.location.lat;
  const lng = result.geometry.location.lng;

  let city = "";
  let state = "";
  let pincode = "";

  result.address_components.forEach(comp => {
    if (comp.types.includes("locality"))
      city = comp.long_name;

    if (comp.types.includes("administrative_area_level_1"))
      state = comp.long_name;

    if (comp.types.includes("postal_code"))
      pincode = comp.long_name;
  });

  const dbResult = await pool.query(
    `
    INSERT INTO addresses
    (user_id, full_name, phone, address_line, city, state, pincode, lat, lng)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      userId,
      full_name,
      phone,
      formatted_address,
      city,
      state,
      pincode,
      lat,
      lng
    ]
  );

  return dbResult.rows[0];
};

/* ===============================
   GET USER ADDRESSES
=============================== */

export const getUserAddresses = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC",
    [userId]
  );

  return result.rows;
};