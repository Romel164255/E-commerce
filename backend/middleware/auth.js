import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authorization token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, role }
    next();

  } catch (err) {
    return res.status(403).json({
      success: false,
      error: err.name === "TokenExpiredError"
        ? "Token expired"
        : "Invalid token",
    });
  }
};