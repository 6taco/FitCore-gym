import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface CanProps {
  code: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}

/** 按钮级权限：无权限时渲染 fallback（默认 null） */
export default function Can({ code, fallback = null, children }: CanProps) {
  const ok = useAuthStore((s) => s.hasPermission(code));
  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}
