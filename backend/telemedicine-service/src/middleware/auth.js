import jwt from "jsonwebtoken";

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return sendError(res, 401, "Access token is missing");
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    return sendError(res, 500, "JWT_ACCESS_SECRET is not configured");
  }

  try {
    req.user = jwt.verify(token, secret);
    return next();
  } catch {
    return sendError(res, 401, "Invalid or expired token");
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 403, "Forbidden");
  }

  return next();
};
