const getErrorCode = (statusCode) => {
  if (statusCode === 400) return "BAD_REQUEST";
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 429) return "RATE_LIMITED";
  return "INTERNAL_SERVER_ERROR";
};

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || getErrorCode(statusCode),
    details: err.details || undefined,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorMiddleware;
