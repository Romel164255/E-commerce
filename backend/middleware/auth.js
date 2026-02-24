export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log("Auth header:", authHeader);
  console.log("JWT_SECRET:", process.env.JWT_SECRET);

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Malformed or missing authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};