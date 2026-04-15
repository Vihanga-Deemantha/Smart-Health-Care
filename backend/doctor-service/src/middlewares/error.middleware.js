const errorMiddleware = (err, req, res, next) => {
  const multerLimitError = err?.name === "MulterError" && err?.code === "LIMIT_FILE_SIZE";
  const statusCode = err.statusCode || (multerLimitError ? 413 : 500);
  const message =
    err.message || (multerLimitError ? "Uploaded file is too large" : "Internal server error");
  const code =
    err.code ||
    (statusCode === 400
      ? "BAD_REQUEST"
      : statusCode === 401
        ? "UNAUTHORIZED"
        : statusCode === 403
          ? "FORBIDDEN"
          : statusCode === 404
            ? "NOT_FOUND"
            : statusCode === 409
              ? "CONFLICT"
              : statusCode === 429
                ? "RATE_LIMITED"
                : "INTERNAL_SERVER_ERROR");

  res.status(statusCode).json({
    success: false,
    message,
    code,
    details: err.details || undefined,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorMiddleware;
