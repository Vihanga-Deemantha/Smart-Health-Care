import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { AuthContext } from "./AuthContext.js";
import { getMe, logoutUser, refreshToken } from "../services/authApi.js";
import {
  clearAccessToken,
  clearSessionHint,
  getAccessToken,
  hasSessionHint,
  setAccessToken,
  setSessionHint
} from "../utils/token.js";
import { AUTH_EXPIRED_EVENT } from "../utils/authEvents.js";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(getAccessToken());
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const hasHydratedRef = useRef(false);

  const setAuth = useCallback((nextUser, nextAccessToken) => {
    setUser(nextUser ?? null);
    setAccessTokenState(nextAccessToken ?? null);

    if (nextAccessToken) {
      setAccessToken(nextAccessToken);
      setSessionHint();
      localStorage.setItem("accessToken", nextAccessToken);
      const nextUserId = nextUser?.id || nextUser?._id || "";
      const nextFullName = nextUser?.fullName || nextUser?.name || "";

      if (nextUserId) {
        localStorage.setItem("userId", nextUserId);
      }

      if (nextFullName) {
        localStorage.setItem("fullName", nextFullName);
      }
    } else {
      clearAccessToken();
      clearSessionHint();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("fullName");
      localStorage.removeItem("doctorId");
    }
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Clear local state even if the server logout fails.
    } finally {
      setAuth(null, null);
    }
  }, [setAuth]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await refreshToken();
      const nextUser = response.data?.data?.user ?? null;
      const nextAccessToken = response.data?.data?.accessToken ?? null;

      if (!nextAccessToken) {
        setAuth(null, null);
        return null;
      }

      setAuth(nextUser, nextAccessToken);
      return nextUser;
    } catch {
      setAuth(null, null);
      return null;
    }
  }, [setAuth]);

  const hydrateSession = useCallback(async () => {
    setLoading(true);

    try {
      if (getAccessToken()) {
        const response = await getMe();
        setUser(response.data?.data?.user ?? null);
        setAccessTokenState(getAccessToken());
        setSessionHint();
      } else if (hasSessionHint()) {
        await refreshSession();
      } else {
        setAuth(null, null);
      }
    } catch {
      await refreshSession();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [refreshSession, setAuth]);

  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }

    hasHydratedRef.current = true;
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setAccessTokenState(null);
      clearAccessToken();
      clearSessionHint();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("fullName");
      localStorage.removeItem("doctorId");
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      initialized,
      isAuthenticated: Boolean(user && accessToken),
      setAuth,
      clearAuth,
      refreshSession
    }),
    [user, accessToken, loading, initialized, setAuth, clearAuth, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
