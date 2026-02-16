import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = 'http://localhost:8000';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if there's a saved session
  useEffect(() => {
    const stored = localStorage.getItem('signify_user');
    const token = localStorage.getItem('signify_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('signify_user');
        localStorage.removeItem('signify_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    const loggedInUser: User = { id: data.id, name: data.name, email: data.email };
    setUser(loggedInUser);
    localStorage.setItem('signify_user', JSON.stringify(loggedInUser));
    localStorage.setItem('signify_token', data.access_token);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || 'Signup failed');
    }

    // If Supabase returns a token (email confirm disabled), log them in
    if (data.access_token) {
      const newUser: User = { id: data.id, name: data.name, email: data.email };
      setUser(newUser);
      localStorage.setItem('signify_user', JSON.stringify(newUser));
      localStorage.setItem('signify_token', data.access_token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('signify_user');
    localStorage.removeItem('signify_token');
    // Fire and forget backend logout
    fetch(`${API_URL}/auth/logout`, { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
