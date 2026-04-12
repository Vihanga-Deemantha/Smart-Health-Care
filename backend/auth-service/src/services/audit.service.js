import AuthLog from "../models/AuthLog.js";

export const createAuthLog = async ({
  userId = null,
  email = null,
  action,
  ipAddress = null,
  userAgent = null,
  metadata = {}
}) => {
  await AuthLog.create({
    userId,
    email,
    action,
    ipAddress,
    userAgent,
    metadata
  });
};
