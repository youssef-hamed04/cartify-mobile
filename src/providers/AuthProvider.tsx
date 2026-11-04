import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, authApi, type UpdateProfileInput, type User } from '@/api';
import { session } from '@/lib/session';

type Status = 'loading' | 'guest' | 'authenticated';

interface AuthContextValue {
  status: Status;
  user: User | null;
  onboarded: boolean;
  completeOnboarding: () => Promise<void>;
  signIn: (email: string, code: string) => Promise<{ isNew: boolean; user: User }>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      await session.load();
      setOnboarded(await session.hasOnboarded());
      if (!session.getToken()) return setStatus('guest');
      try {
        const { user: me } = await authApi.me();
        setUser(me);
        setStatus('authenticated');
      } catch (err) {
        // Expired/invalid token: drop it. Offline: keep it and let screens retry.
        if (err instanceof ApiError && err.isUnauthorized) await session.setToken(null);
        setStatus(session.getToken() ? 'authenticated' : 'guest');
      }
    })();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await session.setOnboarded();
    setOnboarded(true);
  }, []);

  const signIn = useCallback(async (email: string, code: string) => {
    const res = await authApi.verifyCode(email, code);
    await session.setToken(res.token);
    await session.setSessionId(null); // guest cart/wishlist/orders were merged server-side
    setUser(res.user);
    setStatus('authenticated');
    await queryClient.invalidateQueries();
    return { isNew: res.isNew, user: res.user };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await authApi.logout().catch(() => {});
    await session.setToken(null);
    await session.setSessionId(null);
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  const updateProfile = useCallback(async (data: UpdateProfileInput) => {
    const res = await authApi.updateMe(data);
    setUser(res.user);
    return res.user;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!session.getToken()) return;
    const { user: me } = await authApi.me();
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ status, user, onboarded, completeOnboarding, signIn, signOut, updateProfile, refreshUser }),
    [status, user, onboarded, completeOnboarding, signIn, signOut, updateProfile, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
