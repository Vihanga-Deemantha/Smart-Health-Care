const ACCESS_TOKEN_KEY = "healthcare_access_token";
const SESSION_HINT_KEY = "healthcare_session_hint";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const hasSessionHint = () => localStorage.getItem(SESSION_HINT_KEY) === "true";

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const setSessionHint = () => {
  localStorage.setItem(SESSION_HINT_KEY, "true");
};

export const clearSessionHint = () => {
  localStorage.removeItem(SESSION_HINT_KEY);
};
