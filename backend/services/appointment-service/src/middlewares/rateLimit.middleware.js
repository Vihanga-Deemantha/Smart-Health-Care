import AppError from "../utils/AppError.js";

const windowMs = 15 * 60 * 1000;
const max = 200;
const buckets = new Map();

setInterval(() => {
  buckets.clear();
}, windowMs).unref();

export const globalRateLimiter = (req, res, next) => {
  const key = req.ip;
  const current = buckets.get(key) || 0;

  if (current >= max) {
    return next(new AppError("Too many requests", 429, "RATE_LIMIT_EXCEEDED"));
  }

  buckets.set(key, current + 1);
  return next();
};
