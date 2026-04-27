import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api, setAuthToken } from "@/src/api";
import { STRINGS } from "@/src/constant";
import { AuthContext, AuthState, authStorage } from "@/src/hooks/auth";
import { registerForPushNotifications } from "@/src/hooks/notifications";

const initialState: AuthState = {
  token: null,
  userId: null,
  loading: true,
  loggingIn: false,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let cancelled = false;
    authStorage.load().then(({ token, userId }) => {
      if (cancelled) return;
      setAuthToken(token);
      setState((s) => ({ ...s, token, userId, loading: false }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState((s) => ({ ...s, loggingIn: true, error: null }));
    try {
      const response = await api.login(username, password);
      const { access_token: token, user } = response;
      setAuthToken(token);
      await authStorage.save(token, user.id);
      await registerForPushNotifications();
      setState((s) => ({
        ...s,
        token,
        userId: user.id,
        loggingIn: false,
        error: null,
      }));
      return true;
    } catch (e) {
      const message =
        e instanceof ApiError && e.status === 401
          ? STRINGS.login.invalidCredentials
          : e instanceof Error
            ? e.message
            : STRINGS.login.genericFailure;
      setState((s) => ({ ...s, loggingIn: false, error: message }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authStorage.clear();
    setAuthToken(null);
    setState({ ...initialState, loading: false });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: !!state.token,
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
