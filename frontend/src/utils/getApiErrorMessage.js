export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  const message = error?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (error?.code === "ERR_NETWORK") {
    return "Unable to reach the platform right now. Please try again shortly.";
  }

  if (error?.code === "ECONNABORTED") {
    return "The request took too long. Please try again.";
  }

  return fallback;
};
