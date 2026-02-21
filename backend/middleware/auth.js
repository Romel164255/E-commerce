import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ Check if header exists and starts with "Bearer "
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Malformed or missing authorization header",
    });
  }

  // 2️⃣ Extract token
  const token = authHeader.split(" ")[1];

  try {
    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Attach decoded payload to request
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};