import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  login as loginRequest,
  logout as logoutRequest,
  restoreSession,
  setAccessToken,
  setSessionHandlers,
} from '../services/api';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const session = await restoreSession();

      if (!active) {
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    };

    void restore();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return setSessionHandlers({
      onRefreshed: (nextUser) => setUser(nextUser),
      onExpired: () => {
        setAccessToken(null);
        setUser(null);
      },
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await loginRequest(email, password);

      setAccessToken(session.accessToken);
      setUser(session.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutRequest();

    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
