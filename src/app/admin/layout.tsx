'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingScreen } from '@/components/loading-screen';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Skip redirect logic for login page
    if (isLoginPage) {
      return;
    }

    if (!isLoading && !hasRedirected.current) {
      if (!isAuthenticated) {
        hasRedirected.current = true;
        router.replace('/admin/login');
      } else if (!isAdmin) {
        hasRedirected.current = true;
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router, isLoginPage]);

  // For login page, render children without admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <LoadingScreen message="Memuat..." fullScreen={true} />
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

