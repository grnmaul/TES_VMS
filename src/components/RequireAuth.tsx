'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: Array<'admin' | 'user'>;
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (roles && user && !roles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, roles, router, user, isLoading]);

  if (isLoading || !isAuthenticated) {
    return null;
  }
  if (roles && user && !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
