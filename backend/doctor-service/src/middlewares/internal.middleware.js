import AppError from "../utils/AppError.js";

const verifyInternalService = (req, res, next) => {
  const internalSecret = req.headers["x-internal-service-secret"];

  if (!internalSecret || internalSecret !== process.env.INTERNAL_SERVICE_SECRET) {
    return next(new AppError("Unauthorized internal service access", 401, "UNAUTHORIZED"));
  }

  return next();
};

export default verifyInternalService;
