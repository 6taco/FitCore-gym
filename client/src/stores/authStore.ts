import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/api/auth';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser, refreshToken?: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hasPermission: (code: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, user, refreshToken) => set({ token, user, ...(refreshToken ? { refreshToken } : {}) }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      hasPermission: (code) => {
        const user = get().user;
        if (!user) return false;
        if (user.roleCode === 'admin') return true;
        const codes = Array.isArray(code) ? code : [code];
        return codes.every((c) => user.permissions.includes(c));
      },
    }),
    { name: 'jianshenfang-auth' },
  ),
);
