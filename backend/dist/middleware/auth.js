import jwt from "jsonwebtoken";
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "Authorization token missing or malformed",
            });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not configured");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        const error = err;
        res.status(403).json({
            success: false,
            error: error.name === "TokenExpiredError"
                ? "Token expired"
                : "Invalid token",
        });
    }
};
//# sourceMappingURL=auth.js.map