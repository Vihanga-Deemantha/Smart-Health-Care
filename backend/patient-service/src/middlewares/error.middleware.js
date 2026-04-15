const getErrorCode = (statusCode) => {
  if (statusCode === 400) return "BAD_REQUEST";
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";
  if (statusCode === 413) return "PAYLOAD_TOO_LARGE";
  if (statusCode === 429) return "RATE_LIMITED";
  return "INTERNAL_SERVER_ERROR";
};

const errorMiddleware = (err, req, res, next) => {
  const multerLimitError = err?.name === "MulterError" && err?.code === "LIMIT_FILE_SIZE";
  const statusCode = err.statusCode || (multerLimitError ? 413 : 500);
  const message =
    err.message ||
    (multerLimitError
      ? "Uploaded file exceeds the allowed size"
      : "Internal server error");

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || getErrorCode(statusCode),
    details: err.details || undefined,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorMiddleware;
