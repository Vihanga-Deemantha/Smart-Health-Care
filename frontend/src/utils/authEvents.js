export const AUTH_EXPIRED_EVENT = "healthcare-auth-expired";

export const emitAuthExpired = () => {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
};
