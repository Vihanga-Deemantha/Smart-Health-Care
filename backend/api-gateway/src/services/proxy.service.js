import AppError from "../utils/AppError.js";

const copyForwardHeaders = (req) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (
      value === undefined ||
      key === "host" ||
      key === "content-length" ||
      key === "connection"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else {
      headers.set(key, value);
    }
  }

  if (req.user) {
    headers.set("x-user-id", req.user.userId);
    headers.set("x-user-role", req.user.role);
    headers.set("x-user-email", req.user.email);
  }

  return headers;
};

const buildRequestBody = (req) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  if (req.body && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }

  return undefined;
};

export const createServiceProxy = (target) => {
  return async (req, res, next) => {
    try {
      const upstreamPath = `${req.baseUrl}${req.url}`;
      const response = await fetch(`${target}${upstreamPath}`, {
        method: req.method,
        headers: copyForwardHeaders(req),
        body: buildRequestBody(req)
      });

      const setCookies = response.headers.getSetCookie?.() || [];
      if (setCookies.length) {
        res.setHeader("set-cookie", setCookies);
      }

      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("content-type", contentType);
      }

      const bodyText = await response.text();
      res.status(response.status).send(bodyText);
    } catch (error) {
      const statusCode = error.name === "TimeoutError" ? 504 : 503;
      next(
        new AppError(
          statusCode === 504
            ? "Upstream service request timed out"
            : "Upstream service is unavailable",
          statusCode
        )
      );
    }
  };
};
