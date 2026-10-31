// Holds the logged-in user. The session itself is an httpOnly cookie managed by the server.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authApi.me().then((r) => setUser(r.data)).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);

  const clear = useCallback(() => { setUser(null); qc.clear(); }, [qc]);
  const logout = useCallback(async () => { try { await authApi.logout(); } finally { clear(); } }, [clear]);

  useEffect(() => {
    window.addEventListener('brightloop:unauthorized', clear);
    return () => window.removeEventListener('brightloop:unauthorized', clear);
  }, [clear]);

  const value = useMemo(() => ({
    user, ready,
    isStaff: user?.role === 'ADMIN' || user?.role === 'INTERNAL',
    isAdmin: user?.role === 'ADMIN',
    async login(email, password) { const r = await authApi.login({ email, password }); setUser(r.data.user); return r.data.user; },
    async signup(body) { const r = await authApi.signup(body); setUser(r.data.user); return r.data.user; },
    logout,
    setUser,
  }), [user, ready, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const homeFor = (user) => (user?.role === 'CUSTOMER' ? '/portal' : '/dashboard');
