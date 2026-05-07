import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'guidopia_admin_auth';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const initial = useMemo(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeParse(raw) : null;
    return {
      token: parsed?.token || '',
      user: parsed?.user || null,
    };
  }, []);

  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);

  const setAuth = useCallback((next) => {
    setToken(next?.token || '');
    setUser(next?.user || null);
    if (next?.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => setAuth(null), [setAuth]);

  const value = useMemo(() => ({ token, user, setAuth, logout }), [token, user, setAuth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

