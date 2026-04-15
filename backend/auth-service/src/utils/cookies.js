const isSecureCookieEnabled = () =>
  process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isSecureCookieEnabled(),
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isSecureCookieEnabled(),
    sameSite: "strict"
  });
};
