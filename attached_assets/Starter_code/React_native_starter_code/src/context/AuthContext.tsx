import React, { createContext, useContext, useMemo, useState } from 'react';

type Role = 'guest' | 'agent' | 'underwriter' | 'admin';
type User = { id: string | null; name: string; role: Role };

const AuthContext = createContext<{
  user: User; isAuthenticated: boolean; login: (role: Role)=>void; logout: ()=>void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({ id: 'u1', name: 'Demo User', role: 'agent' });
  const [isAuthenticated, setAuthenticated] = useState(true);
  const login = (role: Role) => { setUser({ id: 'u1', name: 'Demo User', role }); setAuthenticated(true); };
  const logout = () => { setAuthenticated(false); setUser({ id: null, name: 'Guest', role: 'guest' }); };
  const value = useMemo(() => ({ user, isAuthenticated, login, logout }), [user, isAuthenticated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


