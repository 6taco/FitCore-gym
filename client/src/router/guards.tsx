import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export function RequirePermission({
  code,
  children,
}: {
  code: string | string[];
  children: ReactNode;
}) {
  const ok = useAuthStore((s) => s.hasPermission(code));
  if (!ok) return <Navigate to="/403" replace />;
  return <>{children}</>;
}
