'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AdminPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) {
      return;
    }

    // Perform redirect based on auth state
    if (isAdmin) {
      router.replace('/admin/dashboard');
    } else if (isAuthenticated) {
      router.replace('/');
    } else {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  // Show loading state while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">Memuat...</div>
    </div>
  );
}
