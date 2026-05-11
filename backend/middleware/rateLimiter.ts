import rateLimit from "express-rate-limit";

/* ===============================
   AUTH LIMITER
   Protects login & register from
   brute-force attacks
=============================== */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: "Too many attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ===============================
   PAYMENT LIMITER
   Throttles payment verification
   to prevent abuse
=============================== */
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: {
    success: false,
    error: "Too many payment requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ===============================
   GENERAL LIMITER
   Catch-all for all other routes
=============================== */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
