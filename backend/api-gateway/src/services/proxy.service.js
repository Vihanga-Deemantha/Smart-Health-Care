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

const buildRequestInit = (req) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return {};
  }

  const contentType = req.headers["content-type"] || "";
  const isJsonPayload = /^application\/(.+\+)?json\b/i.test(contentType);

  // express.json() consumes JSON request streams, so rebuild the body string.
  if (isJsonPayload && req.body !== undefined) {
    return {
      body: JSON.stringify(req.body)
    };
  }

  // Forward multipart/form-data and other non-JSON payloads as raw streams.
  return {
    body: req,
    duplex: "half"
  };
};

export const createServiceProxy = (target) => {
  return async (req, res, next) => {
    try {
      const upstreamPath = `${req.baseUrl}${req.url}`;
      const requestInit = buildRequestInit(req);

      const response = await fetch(`${target}${upstreamPath}`, {
        method: req.method,
        headers: copyForwardHeaders(req),
        ...requestInit
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
