import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Protected({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, profile, loading, isAdmin } = useAuth();
  if (loading) return <div className="loading-screen">جاري تحميل النظام...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile && !isAdmin) return <div className="loading-screen">هذا الحساب غير مفعل داخل النظام.</div>;
  if (roles && !isAdmin && profile && !roles.includes(profile.role)) {
    return <Navigate to="/doctor" replace />;
  }
  return <>{children}</>;
}
