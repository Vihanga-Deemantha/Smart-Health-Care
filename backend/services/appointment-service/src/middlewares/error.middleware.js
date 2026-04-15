import logger from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error("Unhandled error", {
    requestId: req.id,
    message: err.message,
    stack: err.stack,
    code: err.code
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    code: err.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED"),
    details: err.details || null,
    requestId: req.id,
    error: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};

export default errorMiddleware;
