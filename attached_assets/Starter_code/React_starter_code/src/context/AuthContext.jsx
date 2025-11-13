import React, { createContext, useContext, useMemo, useState } from 'react';

// Minimal role-based Auth context for demo
// Roles: guest, agent, underwriter, admin
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const defaultRole = import.meta.env.VITE_DEFAULT_ROLE || 'agent';
  const [user, setUser] = useState({ id: 'u1', name: 'Demo User', role: defaultRole });
  const [isAuthenticated, setAuthenticated] = useState(true);

  const login = (role = 'agent') => {
    setUser({ id: 'u1', name: 'Demo User', role });
    setAuthenticated(true);
  };
  const logout = () => {
    setAuthenticated(false);
    setUser({ id: null, name: 'Guest', role: 'guest' });
  };

  const value = useMemo(() => ({ user, isAuthenticated, login, logout }), [user, isAuthenticated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


