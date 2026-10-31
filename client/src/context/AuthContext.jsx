// (shared). Holds the logged-in user; restores the session on reload.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/endpoints.js';
import { TOKEN_KEY } from '../api/client.js';

const AuthContext = createContext(null);
const store = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!store.get()) return setReady(true);
    authApi.me().then((r) => setUser(r.data)).catch(() => store.set(null)).finally(() => setReady(true));
  }, []);

  const logout = useCallback(() => { store.set(null); setUser(null); qc.clear(); }, [qc]);

  useEffect(() => {
    window.addEventListener('brightloop:unauthorized', logout);
    return () => window.removeEventListener('brightloop:unauthorized', logout);
  }, [logout]);

  const value = useMemo(() => ({
    user, ready,
    isStaff: user?.role === 'ADMIN' || user?.role === 'INTERNAL',
    isAdmin: user?.role === 'ADMIN',
    async login(email, password) { const r = await authApi.login({ email, password }); store.set(r.data.token); setUser(r.data.user); return r.data.user; },
    async signup(body) { const r = await authApi.signup(body); store.set(r.data.token); setUser(r.data.user); return r.data.user; },
    logout,
    setUser,
  }), [user, ready, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const homeFor = (user) => (user?.role === 'CUSTOMER' ? '/portal' : '/dashboard');
