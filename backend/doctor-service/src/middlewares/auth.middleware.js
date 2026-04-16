import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

const getJwtSecret = () => process.env.JWT_ACCESS_SECRET;

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next(new AppError("Access token is missing", 401, "UNAUTHORIZED"));
  }

  const secret = getJwtSecret();
  if (!secret) {
    return next(new AppError("JWT secret is not configured", 500, "JWT_ACCESS_SECRET_MISSING"));
  }

  try {
    req.user = jwt.verify(token, secret);
    return next();
  } catch {
    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
};

export default protect;
