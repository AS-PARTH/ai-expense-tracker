'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearToken, getToken, setToken } from './api-client';
import type { AuthSuccess, PublicUser } from '@/types';

interface AuthCtx {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

// Lightweight JWT payload decoder (no signature check - we only trust it for UI display)
function decodeJwtPayload(token: string): { userId?: string; email?: string; exp?: number } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function makeOptimisticUser(token: string): PublicUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.userId || !payload?.email) return null;
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return {
    _id: payload.userId,
    email: payload.email,
    name: payload.email.split('@')[0],
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start as null to match SSR; hydrate from JWT in effect to avoid mismatch
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Synchronous client-side hydration: decode JWT for instant user, then validate in background
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const optimistic = makeOptimisticUser(token);
    if (optimistic) setUser(optimistic);

    apiFetch<{ user: PublicUser }>('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => {
        clearToken();
        setUser(null);
      });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const data = await apiFetch<AuthSuccess>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        setUser(data.user);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setLoading(true);
      try {
        const data = await apiFetch<AuthSuccess>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        });
        setToken(data.token);
        setUser(data.user);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
