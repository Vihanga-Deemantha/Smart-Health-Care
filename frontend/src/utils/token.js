const ACCESS_TOKEN_KEY = "healthcare_access_token";
const SESSION_HINT_KEY = "healthcare_session_hint";

export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const hasSessionHint = () => sessionStorage.getItem(SESSION_HINT_KEY) === "true";

export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

export const clearAccessToken = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const setSessionHint = () => {
  sessionStorage.setItem(SESSION_HINT_KEY, "true");
};

export const clearSessionHint = () => {
  sessionStorage.removeItem(SESSION_HINT_KEY);
};
