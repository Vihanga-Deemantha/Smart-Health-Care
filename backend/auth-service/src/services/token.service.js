import bcrypt from "bcryptjs";
import RefreshToken from "../models/RefreshToken.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";

const getRefreshExpiryDate = () => {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

export const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const tokenHash = await bcrypt.hash(refreshToken, 10);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: getRefreshExpiryDate()
  });

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (incomingRefreshToken) => {
  let decoded;

  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw new AppError("Session expired. Please sign in again.", 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new AppError("User not found", 404);

  const tokenDocs = await RefreshToken.find({
    userId: user._id,
    revoked: false,
    expiresAt: { $gt: new Date() }
  });

  let matchedTokenDoc = null;

  for (const tokenDoc of tokenDocs) {
    const isMatch = await bcrypt.compare(
      incomingRefreshToken,
      tokenDoc.tokenHash
    );
    if (isMatch) {
      matchedTokenDoc = tokenDoc;
      break;
    }
  }

  if (!matchedTokenDoc) {
    throw new AppError("Session expired. Please sign in again.", 401);
  }

  matchedTokenDoc.revoked = true;
  await matchedTokenDoc.save();

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newTokenHash = await bcrypt.hash(newRefreshToken, 10);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: newTokenHash,
    expiresAt: getRefreshExpiryDate()
  });

  return { user, accessToken, refreshToken: newRefreshToken };
};

export const revokeRefreshToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) return;

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    return;
  }

  const tokenDocs = await RefreshToken.find({
    userId: decoded.userId,
    revoked: false
  });

  for (const tokenDoc of tokenDocs) {
    const isMatch = await bcrypt.compare(
      incomingRefreshToken,
      tokenDoc.tokenHash
    );
    if (isMatch) {
      tokenDoc.revoked = true;
      await tokenDoc.save();
      break;
    }
  }
};

export const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { $set: { revoked: true } }
  );
};
