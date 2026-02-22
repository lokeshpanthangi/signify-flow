import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { config } from '@/config';
import { registerAuthErrorHandler, unregisterAuthErrorHandler } from '@/lib/authEvents';

const API_URL = config.API_URL;

// ─── Storage Keys ────────────────────────────────────────────────────────────
const STORAGE_USER = 'signify_user';
const STORAGE_TOKEN = 'signify_token';
const STORAGE_REFRESH = 'signify_refresh_token';

// ─── Types ───────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  /** Call from any API helper when a 401 is received */
  handleAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearSession() {
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_REFRESH);
}

/**
 * Decode a JWT payload to read `exp`.
 * Returns seconds-since-epoch or null if the token is malformed.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    const token = localStorage.getItem(STORAGE_TOKEN);

    setUser(null);
    clearSession();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    // Fire-and-forget backend logout
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, []);

  // This is the callback API clients can invoke on 401
  const handleAuthError = useCallback(() => {
    logout();
  }, [logout]);

  // Expose globally so API service files can call `onAuthError()` without React
  useEffect(() => {
    registerAuthErrorHandler(handleAuthError);
    return () => {
      unregisterAuthErrorHandler();
    };
  }, [handleAuthError]);

  // ── Schedule Refresh ───────────────────────────────────────────────────
  const scheduleRefresh = useCallback((accessToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const exp = getTokenExpiry(accessToken);
    if (!exp) return;

    // Refresh 60 seconds before expiry (minimum 5 s from now)
    const msUntilRefresh = Math.max((exp * 1000 - Date.now()) - 60_000, 5_000);

    refreshTimerRef.current = setTimeout(async () => {
      const refreshToken = localStorage.getItem(STORAGE_REFRESH);
      if (!refreshToken) {
        handleAuthError();
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
          // Refresh failed — token probably revoked / expired → logout
          handleAuthError();
          return;
        }

        const data = await res.json();
        localStorage.setItem(STORAGE_TOKEN, data.access_token);
        localStorage.setItem(STORAGE_REFRESH, data.refresh_token);

        const refreshedUser: User = { id: data.id, name: data.name, email: data.email };
        setUser(refreshedUser);
        localStorage.setItem(STORAGE_USER, JSON.stringify(refreshedUser));

        // Schedule the next refresh for the NEW token
        scheduleRefresh(data.access_token);
      } catch {
        // Network error — retry in 30 s
        refreshTimerRef.current = setTimeout(() => scheduleRefresh(accessToken), 30_000);
      }
    }, msUntilRefresh);
  }, [handleAuthError]);

  // ── Mount: validate stored session ─────────────────────────────────────
  useEffect(() => {
    async function validateSession() {
      const storedUser = localStorage.getItem(STORAGE_USER);
      const token = localStorage.getItem(STORAGE_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_REFRESH);

      if (!storedUser || !token) {
        clearSession();
        setLoading(false);
        return;
      }

      // Quick client-side expiry check
      const exp = getTokenExpiry(token);
      const isExpired = exp ? exp * 1000 < Date.now() : false;

      if (isExpired && refreshToken) {
        // Try to refresh silently
        try {
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (res.ok) {
            const data = await res.json();
            const freshUser: User = { id: data.id, name: data.name, email: data.email };
            setUser(freshUser);
            localStorage.setItem(STORAGE_USER, JSON.stringify(freshUser));
            localStorage.setItem(STORAGE_TOKEN, data.access_token);
            localStorage.setItem(STORAGE_REFRESH, data.refresh_token);
            scheduleRefresh(data.access_token);
            setLoading(false);
            return;
          }
        } catch {
          // fall through to clear
        }

        clearSession();
        setLoading(false);
        return;
      }

      if (isExpired) {
        // No refresh token and expired → gone
        clearSession();
        setLoading(false);
        return;
      }

      // Token looks valid — verify with backend
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const verifiedUser: User = { id: data.id, name: data.name, email: data.email };
          setUser(verifiedUser);
          localStorage.setItem(STORAGE_USER, JSON.stringify(verifiedUser));
          scheduleRefresh(token);
        } else {
          // Token rejected by server — try refresh
          if (refreshToken) {
            try {
              const rRes = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
              });
              if (rRes.ok) {
                const rData = await rRes.json();
                const u: User = { id: rData.id, name: rData.name, email: rData.email };
                setUser(u);
                localStorage.setItem(STORAGE_USER, JSON.stringify(u));
                localStorage.setItem(STORAGE_TOKEN, rData.access_token);
                localStorage.setItem(STORAGE_REFRESH, rData.refresh_token);
                scheduleRefresh(rData.access_token);
                setLoading(false);
                return;
              }
            } catch {
              // fall through
            }
          }
          clearSession();
        }
      } catch {
        // Network error — trust local storage for now
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id && parsed?.email) {
            setUser(parsed);
            scheduleRefresh(token);
          } else {
            clearSession();
          }
        } catch {
          clearSession();
        }
      }

      setLoading(false);
    }

    validateSession();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running.');
    }

    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned an invalid response. Check if the backend API is running on the correct port.');
    }

    if (!res.ok) {
      throw new Error((data.detail as string) || 'Login failed');
    }

    const loggedInUser: User = { id: data.id as string, name: data.name as string, email: data.email as string };
    setUser(loggedInUser);
    localStorage.setItem(STORAGE_USER, JSON.stringify(loggedInUser));
    localStorage.setItem(STORAGE_TOKEN, data.access_token);
    if (data.refresh_token) {
      localStorage.setItem(STORAGE_REFRESH, data.refresh_token);
    }
    scheduleRefresh(data.access_token);
  };

  // ── Signup ─────────────────────────────────────────────────────────────
  const signup = async (name: string, email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running.');
    }

    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned an invalid response. Check if the backend API is running on the correct port.');
    }

    if (!res.ok) {
      throw new Error((data.detail as string) || 'Signup failed');
    }

    // If Supabase returns tokens (email confirm disabled), log them in
    if (data.access_token) {
      const newUser: User = { id: data.id, name: data.name, email: data.email };
      setUser(newUser);
      localStorage.setItem(STORAGE_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_TOKEN, data.access_token);
      if (data.refresh_token) {
        localStorage.setItem(STORAGE_REFRESH, data.refresh_token);
      }
      scheduleRefresh(data.access_token);
    }
  };

  // ── Update User ────────────────────────────────────────────────────────
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, signup, logout, updateUser, handleAuthError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
