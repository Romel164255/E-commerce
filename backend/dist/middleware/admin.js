export const authorizeAdmin = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        res.status(403).json({
            success: false,
            error: "Admin access only",
        });
        return;
    }
    next();
};
//# sourceMappingURL=admin.js.map